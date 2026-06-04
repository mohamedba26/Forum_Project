import { Router } from 'express'
import { prisma } from '../prisma.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()
router.use(requireAdmin)

const safeUser = (u) => ({
  id: u.id, nom: u.nom, email: u.email, role: u.role, estBloque: u.estBloque, createdAt: u.createdAt, avatar: u.avatar
})

// GET /api/admin/utilisateurs
router.get('/utilisateurs', async (req, res) => {
  const { q } = req.query
  const users = await prisma.utilisateur.findMany({
    where: q ? { OR: [
      { nom:   { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ]} : {},
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { sujetsProposes: { where: { statut: 'en_attente' } } } }
    }
  })
  res.json(users.map(u => ({
    ...safeUser(u),
    hasSujetEnAttente: u._count.sujetsProposes > 0
  })))
})

// PATCH /api/admin/utilisateurs/:id/bloquer
router.patch('/utilisateurs/:id/bloquer', async (req, res) => {
  const u = await prisma.utilisateur.update({ where: { id: +req.params.id }, data: { estBloque: true } })
  res.json(safeUser(u))
})

// PATCH /api/admin/utilisateurs/:id/debloquer
router.patch('/utilisateurs/:id/debloquer', async (req, res) => {
  const u = await prisma.utilisateur.update({ where: { id: +req.params.id }, data: { estBloque: false } })
  res.json(safeUser(u))
})

// PATCH /api/admin/utilisateurs/:id/moderateur
router.patch('/utilisateurs/:id/moderateur', async (req, res) => {
  const u = await prisma.utilisateur.update({ where: { id: +req.params.id }, data: { role: 'moderateur' } })
  res.json(safeUser(u))
})

// PATCH /api/admin/utilisateurs/:id/utilisateur
router.patch('/utilisateurs/:id/utilisateur', async (req, res) => {
  const u = await prisma.utilisateur.update({ where: { id: +req.params.id }, data: { role: 'utilisateur' } })
  res.json(safeUser(u))
})

// GET /api/admin/sujets/en-attente
router.get('/sujets/en-attente', async (req, res) => {
  const sujets = await prisma.sujet.findMany({
    where: { statut: 'en_attente' },
    orderBy: { dateCreation: 'desc' },
    include: {
      auteur:     { select: { id: true, nom: true } },
      moderateur: { select: { id: true, nom: true } },
    }
  })
  res.json(sujets)
})

// GET /api/admin/sujets — all sujets (valide + en_attente), not supprime
router.get('/sujets', async (req, res) => {
  try {
    const sujets = await prisma.sujet.findMany({
      where: { statut: { not: 'supprime' } },
      orderBy: { dateCreation: 'desc' },
      include: {
        auteur:     { select: { id: true, nom: true } },
        moderateur: { select: { id: true, nom: true } },
        _count:     { select: { postes: true } },
      }
    })
    res.json(sujets.map(s => ({ ...s, nombrePostes: s._count.postes, _count: undefined })))
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

// DELETE /api/admin/sujets/:id — soft delete sujet
router.delete('/sujets/:id', async (req, res) => {
  try {
    await prisma.sujet.update({ where: { id: +req.params.id }, data: { statut: 'supprime' } })
    res.json({ message: 'Sujet supprimé' })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

// GET /api/admin/utilisateurs/en-attente — users who proposed a pending subject
router.get('/utilisateurs/en-attente', async (req, res) => {
  try {
    const pendingSujets = await prisma.sujet.findMany({
      where: { statut: 'en_attente' },
      select: { auteurId: true },
      distinct: ['auteurId']
    })
    res.json({ count: pendingSujets.length })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

// GET /api/admin/reports
router.get('/reports', async (req, res) => {
  const reports = await prisma.report.findMany({
    orderBy: { date: 'desc' },
    include: { reporteur: { select: { nom: true } }, utilisateurSignale: { select: { nom: true } } }
  })
  res.json(reports)
})

// PATCH /api/admin/reports/:id/traiter — validate report: delete content, optionally block user
router.patch('/reports/:id/traiter', async (req, res) => {
  try {
    const { bloquerUtilisateur = false } = req.body

    const report = await prisma.report.findUnique({
      where: { id: +req.params.id },
      include: {
        utilisateurSignale: true,
        poste:              true,
      }
    })
    if (!report) return res.status(404).json({ message: 'Signalement introuvable' })

    // Delete the reported content
    if (report.posteId) {
      await prisma.poste.update({ where: { id: report.posteId }, data: { statut: 'supprime' } })
    }
    if (report.commentaireId) {
      const comm = await prisma.commentaire.findUnique({
        where: { id: report.commentaireId },
        select: { interactionId: true }
      })
      if (comm) await prisma.interaction.delete({ where: { id: comm.interactionId } })
    }
    if (bloquerUtilisateur && report.utilisateurSignaleId) {
      await prisma.utilisateur.update({
        where: { id: report.utilisateurSignaleId },
        data:  { estBloque: true }
      })
    }

    const updated = await prisma.report.update({
      where: { id: +req.params.id },
      data:  { statut: 'valide' }
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

// DELETE /api/admin/reports/:id — reject/dismiss a report
router.delete('/reports/:id', async (req, res) => {
  try {
    await prisma.report.update({ where: { id: +req.params.id }, data: { statut: 'supprime' } })
    res.json({ message: 'Signalement rejeté' })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

export default router