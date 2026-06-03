import { Router } from 'express'
import { prisma } from '../prisma.js'
import { authenticate, requireAdmin, requireModo, optionalAuth } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = Router()

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatSujet = (s, userId) => ({
  ...s,
  nombrePostes: s._count?.postes ?? 0,
  likesCount:   s._count?.likes  ?? 0,
  userLiked:    userId ? (s.likes?.length > 0) : false,
  likes:        undefined,
  _count:       undefined,
})

const sujetInclude = (userId) => ({
  _count: { select: { postes: true, likes: true } },
  auteur: { select: { id: true, nom: true, avatar: true } },
  moderateur: { select: { id: true, nom: true, avatar: true } },
  ...(userId ? { likes: { where: { auteurId: userId } } } : {}),
})

// GET /api/sujets — public list (valide only by default)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { statut } = req.query
    const where = statut ? { statut } : { statut: 'valide' }

    const sujets = await prisma.sujet.findMany({
      where,
      orderBy: { dateCreation: 'asc' },
      include: sujetInclude(req.user?.id),
    })
    res.json(sujets.map(s => formatSujet(s, req.user?.id)))
  } catch (error) {
    console.error('Error fetching sujets:', error);
    res.status(500).json({ message: 'Erreur interne', error: error.message })
  }
})

// GET /api/sujets/mes-sujets — sujets where current user is moderateur
router.get('/mes-sujets', authenticate, async (req, res) => {
  try {
    const sujets = await prisma.sujet.findMany({
      where: { moderateurId: req.user.id, statut: { not: 'supprime' } },
      orderBy: { dateCreation: 'asc' },
      include: sujetInclude(req.user.id),
    })
    res.json(sujets.map(s => formatSujet(s, req.user.id)))
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

// GET /api/sujets/:id — single sujet detail
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const id = +req.params.id
    if (isNaN(id)) return res.status(400).json({ message: 'ID invalide' })
    const sujet = await prisma.sujet.findUnique({
      where: { id },
      include: sujetInclude(req.user?.id),
    })
    if (!sujet) return res.status(404).json({ message: 'Sujet introuvable' })
    res.json(formatSujet(sujet, req.user?.id))
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

// POST /api/sujets — propose a new sujet (en_attente unless admin)
router.post('/', authenticate, async (req, res) => {
  try {
    const { titre, description } = req.body
    if (!titre) return res.status(400).json({ message: 'Titre requis' })

    const forum = await prisma.forum.upsert({
      where:  { nom: 'Forum Principal' },
      update: {},
      create: { nom: 'Forum Principal' }
    })

    const isAdmin = req.user.role === 'admin'
    const statut  = isAdmin ? 'valide' : 'en_attente'
    // If admin creates topic directly, assign themselves as moderateur
    const moderateurId = isAdmin ? req.user.id : null

    const sujet = await prisma.sujet.create({
      data: { titre, description, statut, auteurId: req.user.id, forumId: forum.id, moderateurId },
      include: sujetInclude(req.user.id),
    })
    res.status(201).json(formatSujet(sujet, req.user.id))
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'Ce sujet existe déjà' })
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

// PATCH /api/sujets/:id/valider — admin validates sujet, promotes author to moderateur
router.patch('/:id/valider', authenticate, requireAdmin, async (req, res) => {
  try {
    const id    = +req.params.id
    const sujet = await prisma.sujet.findUnique({ where: { id } })
    if (!sujet) return res.status(404).json({ message: 'Sujet introuvable' })

    // Promote author to moderateur if they are a regular user
    const author = await prisma.utilisateur.findUnique({ where: { id: sujet.auteurId } })
    if (author && author.role === 'utilisateur') {
      await prisma.utilisateur.update({ where: { id: sujet.auteurId }, data: { role: 'moderateur' } })
    }

    const updated = await prisma.sujet.update({
      where: { id },
      data:  { statut: 'valide', moderateurId: sujet.auteurId },
      include: sujetInclude(null),
    })
    res.json({ sujet: formatSujet(updated, null), message: 'Sujet validé et auteur promu modérateur' })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

// DELETE /api/sujets/:id — soft-delete (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.sujet.update({ where: { id: +req.params.id }, data: { statut: 'supprime' } })
    res.json({ message: 'Sujet supprimé' })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

// ── Postes sous un Sujet ────────────────────────────────────────────────────────

// GET /api/sujets/:id/postes
router.get('/:id/postes', optionalAuth, async (req, res) => {
  try {
    const sujetId = +req.params.id
    if (isNaN(sujetId)) return res.status(400).json({ message: 'ID invalide' })

    // Moderator/admin can see all; others only see validated posts
    const isModOrAdmin = req.user && ['admin', 'moderateur'].includes(req.user.role)
    const where = isModOrAdmin
      ? { sujetId, statut: { not: 'supprime' } }
      : { sujetId, statut: 'valide' }

    const postes = await prisma.poste.findMany({
      where,
      orderBy: { datePublication: 'desc' },
      include: {
        auteur: { select: { id: true, nom: true, avatar: true } },
        _count: { select: { interactions: true, likes: true } },
        likes:  req.user ? { where: { auteurId: req.user.id } } : false,
      }
    })
    res.json(postes.map(p => ({
      ...p,
      auteurNom:          p.auteur.nom,
      auteurId:           p.auteur.id,
      nombreCommentaires: p._count.interactions,
      likesCount:         p._count.likes,
      userLiked:          req.user ? (p.likes?.length > 0) : false,
      likes:              undefined,
      _count:             undefined,
    })))
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

// POST /api/sujets/:id/postes — create post (en_attente by default)
router.post('/:id/postes', authenticate, upload.single('media'), async (req, res) => {
  try {
    const sujetId = +req.params.id
    const { titre, contenu, typeMedia } = req.body
    if (!titre) return res.status(400).json({ message: 'Titre requis' })

    const sujet = await prisma.sujet.findUnique({ where: { id: sujetId } })
    if (!sujet || sujet.statut !== 'valide')
      return res.status(400).json({ message: 'Sujet invalide ou non validé' })

    // Moderator of this sujet and admin get posts validated immediately
    const isPrivileged = req.user.role === 'admin' ||
      (req.user.role === 'moderateur' && sujet.moderateurId === req.user.id)
    const statut = isPrivileged ? 'valide' : 'en_attente'

    let mediaUrl = req.file?.path || null;
    if (mediaUrl) {
      // Normalize path to use forward slashes and ensure it starts with /
      mediaUrl = '/' + mediaUrl.replace(/\\/g, '/');
    }

    const poste = await prisma.poste.create({
      data: { 
        titre, 
        contenu: contenu || '', 
        statut, 
        sujetId, 
        auteurId: req.user.id,
        typeMedia: typeMedia || 'texte',
        mediaUrl
      },
    })
    res.status(201).json(poste)
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

export default router