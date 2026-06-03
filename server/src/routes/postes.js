import { Router } from 'express'
import { prisma } from '../prisma.js'
import { authenticate, requireModo, optionalAuth } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = Router()

// ── Postes ──────────────────────────────────────────────────────────

// GET /api/postes/me
router.get('/postes/me', authenticate, async (req, res) => {
  try {
    const postes = await prisma.poste.findMany({
      where:   { auteurId: req.user.id, statut: { not: 'supprime' } },
      orderBy: { datePublication: 'desc' },
      include: { sujet: { select: { id: true, titre: true } } }
    })
    res.json(postes.map(p => ({ ...p, sujetTitre: p.sujet?.titre })))
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

// GET /api/postes/moderation — pending posts for moderator's sujets
router.get('/postes/moderation', authenticate, requireModo, async (req, res) => {
  try {
    let where = { statut: 'en_attente' }

    // Moderators only see posts in their assigned sujets
    if (req.user.role === 'moderateur') {
      const mesSujets = await prisma.sujet.findMany({
        where: { moderateurId: req.user.id },
        select: { id: true }
      })
      const sujetIds = mesSujets.map(s => s.id)
      where.sujetId = { in: sujetIds }
    }
    // Admins see all pending posts (no sujet filter)

    const postes = await prisma.poste.findMany({
      where,
      orderBy: { datePublication: 'desc' },
      include: {
        auteur: { select: { nom: true } },
        sujet:  { select: { titre: true } }
      }
    })
    res.json(postes.map(p => ({ ...p, auteurNom: p.auteur.nom, sujetTitre: p.sujet?.titre })))
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

// GET /api/commentaires/moderation
router.get('/commentaires/moderation', authenticate, requireModo, async (req, res) => {
  try {
    const interactions = await prisma.interaction.findMany({
      where: { type: 'commentaire' },
      include: { commentaire: true, auteur: { select: { nom: true } } },
      orderBy: { date: 'desc' },
      take: 50
    })
    res.json(interactions.filter(i => i.commentaire).map(i => ({
      id:       i.commentaire.id,
      contenu:  i.commentaire.contenu,
      date:     i.date,
      auteurNom: i.auteur.nom,
      posteId:  i.posteId,
    })))
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

// GET /api/postes/:id
router.get('/postes/:id', optionalAuth, async (req, res) => {
  try {
    const id = +req.params.id
    if (isNaN(id)) return res.status(400).json({ message: 'ID invalide' })
    const poste = await prisma.poste.findUnique({
      where: { id },
      include: {
        auteur: { select: { id: true, nom: true, avatar: true } },
        sujet:  { select: { id: true, titre: true, moderateurId: true } },
        _count: { select: { likes: true, interactions: true } },
        likes:  true  // fetch all reactions to compute counts
      }
    })
    if (!poste) return res.status(404).json({ message: 'Post introuvable' })

    // Build reaction counts map { '👍': 3, '❤️': 1 }
    const reactionCounts = {}
    for (const l of poste.likes) reactionCounts[l.reaction] = (reactionCounts[l.reaction] || 0) + 1
    const userReaction = req.user ? (poste.likes.find(l => l.auteurId === req.user.id)?.reaction || null) : null

    res.json({
      ...poste,
      auteurNom:          poste.auteur.nom,
      auteurId:           poste.auteur.id,
      auteurAvatar:       poste.auteur.avatar || null,
      sujetTitre:         poste.sujet?.titre,
      sujetModerateur:    poste.sujet?.moderateurId,
      likesCount:         poste._count?.likes ?? 0,
      nombreCommentaires: poste._count?.interactions ?? 0,
      reactionCounts,
      userReaction,
      likes:  undefined,
      _count: undefined,
    })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

// PATCH /api/postes/:id/valider
router.patch('/postes/:id/valider', authenticate, requireModo, async (req, res) => {
  try {
    const poste = await prisma.poste.findUnique({
      where: { id: +req.params.id },
      include: { sujet: { select: { moderateurId: true } } }
    })
    if (!poste) return res.status(404).json({ message: 'Post introuvable' })

    // Moderators can only validate posts in their own sujets
    if (req.user.role === 'moderateur' && poste.sujet?.moderateurId !== req.user.id)
      return res.status(403).json({ message: 'Non autorisé pour ce sujet' })

    const updated = await prisma.poste.update({ where: { id: +req.params.id }, data: { statut: 'valide' } })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

// DELETE /api/postes/:id — soft-delete post and hard-delete all its interactions/comments
router.delete('/postes/:id', authenticate, async (req, res) => {
  try {
    const poste = await prisma.poste.findUnique({
      where: { id: +req.params.id },
      include: { sujet: { select: { moderateurId: true } } }
    })
    if (!poste) return res.status(404).json({ message: 'Post introuvable' })

    const isAuthor    = req.user.id === poste.auteurId
    const isAdmin     = req.user.role === 'admin'
    const isSujetModo = req.user.role === 'moderateur' && poste.sujet?.moderateurId === req.user.id

    if (!isAuthor && !isAdmin && !isSujetModo)
      return res.status(403).json({ message: 'Non autorisé' })

    // Delete all interactions (comments + reactions) under this post
    await prisma.interaction.deleteMany({ where: { posteId: +req.params.id } })

    // Soft-delete the post itself
    await prisma.poste.update({ where: { id: +req.params.id }, data: { statut: 'supprime' } })
    res.json({ message: 'Post supprimé' })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

// ── Commentaires sous un Poste ──────────────────────────────────────

// GET /api/postes/:id/commentaires — returns top-level comments with their replies nested
router.get('/postes/:id/commentaires', optionalAuth, async (req, res) => {
  try {
    const interactions = await prisma.interaction.findMany({
      where: { posteId: +req.params.id, type: 'commentaire' },
      include: {
        commentaire: {
          include: {
            _count:  { select: { likes: true } },
            likes:   true,  // all reactions for count map
            replies: {
              include: {
                interaction: { include: { auteur: { select: { id: true, nom: true, avatar: true } } } },
                _count:      { select: { likes: true } },
                likes:       true,
              }
            }
          }
        },
        auteur: { select: { id: true, nom: true, avatar: true } }
      },
      orderBy: { date: 'asc' }
    })

    const formatComment = (i, c) => {
      const reactionCounts = {}
      for (const l of (c.likes || [])) reactionCounts[l.reaction] = (reactionCounts[l.reaction] || 0) + 1
      const userReaction = req.user ? (c.likes?.find(l => l.auteurId === req.user.id)?.reaction || null) : null
      return {
        id:             c.id,
        contenu:        c.contenu,
        typeMedia:      c.typeMedia,
        mediaUrl:       c.mediaUrl,
        date:           i.date,
        posteId:        i.posteId,
        auteurId:       i.auteur.id,
        auteurNom:      i.auteur.nom,
        auteurAvatar:   i.auteur.avatar || null,
        parentId:       c.parentId,
        likesCount:     c._count?.likes ?? 0,
        reactionCounts,
        userReaction,
        replies:        (c.replies || []).map(r => formatComment(r.interaction, r)),
      }
    }

    res.json(
      interactions
        .filter(i => i.commentaire && !i.commentaire.parentId) // only top-level
        .map(i => formatComment(i, i.commentaire))
    )
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

// POST /api/postes/:id/commentaires — add comment or reply (parentId optional)
router.post('/postes/:id/commentaires', authenticate, upload.single('media'), async (req, res) => {
  try {
    const { contenu, typeMedia, parentId } = req.body
    const posteId = +req.params.id

    const poste = await prisma.poste.findUnique({
      where:   { id: posteId },
      include: { auteur: { select: { id: true } } }
    })
    if (!poste || poste.statut === 'supprime')
      return res.status(404).json({ message: 'Post introuvable' })

    let mediaUrl = req.file?.path || null;
    if (mediaUrl) {
      mediaUrl = '/' + mediaUrl.replace(/\\/g, '/');
    }

    const interaction = await prisma.interaction.create({
      data: {
        type:     'commentaire',
        auteurId: req.user.id,
        posteId,
        commentaire: {
          create: {
            contenu:   contenu || '',
            typeMedia: typeMedia || 'texte',
            mediaUrl:  mediaUrl,
            parentId:  parentId ? +parentId : null,
          }
        }
      },
      include: { commentaire: true }
    })

    // Notify post author if someone else commented (not a reply)
    if (!parentId && poste.auteur.id !== req.user.id) {
      await prisma.notification.create({
        data: {
          destinataireId: poste.auteur.id,
          type:    'comment',
          message: `💬 Quelqu'un a commenté votre post.`,
          posteId,
        }
      })
    }

    // Notify parent comment author if this is a reply
    if (parentId) {
      const parentComment = await prisma.commentaire.findUnique({
        where:   { id: +parentId },
        include: { interaction: { select: { auteurId: true } } }
      })
      if (parentComment && parentComment.interaction.auteurId !== req.user.id) {
        await prisma.notification.create({
          data: {
            destinataireId: parentComment.interaction.auteurId,
            type:    'reply',
            message: `↩️ Quelqu'un a répondu à votre commentaire.`,
            posteId,
          }
        })
      }
    }

    res.status(201).json({
      id:        interaction.commentaire.id,
      contenu:   interaction.commentaire.contenu,
      typeMedia: interaction.commentaire.typeMedia,
      mediaUrl:  interaction.commentaire.mediaUrl,
      date:      interaction.date,
      posteId,
      auteurId:   req.user.id,
      auteurNom:  req.user.nom,
      auteurAvatar: req.user.avatar || null,
      parentId:  parentId ? +parentId : null,
      likesCount: 0,
      userLiked:  false,
      replies:    [],
    })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

// DELETE /api/commentaires/:id — also deletes all replies
router.delete('/commentaires/:id', authenticate, async (req, res) => {
  try {
    const commentaire = await prisma.commentaire.findUnique({
      where: { id: +req.params.id },
      include: {
        replies: { include: { interaction: true } },
        interaction: {
          include: {
            poste: { include: { sujet: { select: { moderateurId: true } } } }
          }
        }
      }
    })
    if (!commentaire) return res.status(404).json({ message: 'Commentaire introuvable' })

    const isAuthor    = req.user.id === commentaire.interaction.auteurId
    const isAdmin     = req.user.role === 'admin'
    const isSujetModo = req.user.role === 'moderateur' &&
      commentaire.interaction.poste?.sujet?.moderateurId === req.user.id

    if (!isAuthor && !isAdmin && !isSujetModo)
      return res.status(403).json({ message: 'Non autorisé' })

    // Delete all replies first (cascade via interaction)
    if (commentaire.replies?.length > 0) {
      await prisma.interaction.deleteMany({
        where: { id: { in: commentaire.replies.map(r => r.interactionId) } }
      })
    }

    // Delete the comment itself
    await prisma.interaction.delete({ where: { id: commentaire.interactionId } })
    res.json({ message: 'Commentaire supprimé' })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

export default router