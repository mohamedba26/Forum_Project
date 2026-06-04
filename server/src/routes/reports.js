import { Router } from 'express'
import { prisma } from '../prisma.js'
import { authenticate, requireAdmin, requireModo } from '../middleware/auth.js'

const router = Router()

// ── Helpers ──────────────────────────────────────────────────────────────────
async function notify({ destinataireId, type, message, reportId = null, posteId = null }) {
  return prisma.notification.create({
    data: { destinataireId, type, message, reportId, posteId }
  })
}

// POST /api/reports/utilisateur — report a user → notify admin after 3 reports
router.post('/utilisateur', authenticate, async (req, res) => {
  try {
    const { id: utilisateurSignaleId, raison, detail } = req.body
    if (!utilisateurSignaleId || !raison)
      return res.status(400).json({ message: 'Champs requis manquants' })

    const cible = await prisma.utilisateur.findUnique({ where: { id: +utilisateurSignaleId } })
    if (!cible) return res.status(404).json({ message: 'Utilisateur introuvable' })

    // Prevent duplicate report from same reporter
    const already = await prisma.report.findFirst({
      where: { reporteurId: req.user.id, utilisateurSignaleId: +utilisateurSignaleId, statut: 'en_attente' }
    })
    if (already) return res.status(409).json({ message: 'Vous avez déjà signalé cet utilisateur' })

    const report = await prisma.report.create({
      data: { raison, detail, reporteurId: req.user.id, utilisateurSignaleId: +utilisateurSignaleId }
    })

    // Count distinct reporters (unique users who reported this person)
    const uniqueReporters = await prisma.report.groupBy({
      by: ['reporteurId'],
      where: { utilisateurSignaleId: +utilisateurSignaleId }
    })
    const uniqueCount = uniqueReporters.length

    console.log(`[REPORT] User "${cible.nom}" (id=${utilisateurSignaleId}) has ${uniqueCount} unique reporter(s). Threshold=3.`)

    // At 3 unique reporters → block user and notify all admins
    if (uniqueCount >= 3) {
      console.log(`[REPORT] Threshold reached! Blocking user "${cible.nom}" and notifying admins...`)

      await prisma.utilisateur.update({
        where: { id: +utilisateurSignaleId },
        data: { estBloque: true }
      })

      const admins = await prisma.utilisateur.findMany({ where: { role: 'admin' }, select: { id: true } })
      console.log(`[REPORT] Sending notification to ${admins.length} admin(s)...`)

      await Promise.all(admins.map(a =>
        notify({
          destinataireId: a.id,
          type:    'user_flagged',
          message: `⚠️ L'utilisateur "${cible.nom}" a reçu ${uniqueCount} signalements de différents utilisateurs et a été automatiquement bloqué. Vérifiez les rapports.`,
          reportId: report.id,
        })
      ))

      console.log(`[REPORT] Done. User blocked and admins notified.`)
    }

    res.status(201).json({ ...report, uniqueReporterCount: uniqueCount })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

// POST /api/reports/poste — report a post → notify sujet moderateur
router.post('/poste', authenticate, async (req, res) => {
  try {
    const { id: posteId, raison, detail } = req.body
    if (!posteId || !raison)
      return res.status(400).json({ message: 'Champs requis manquants' })

    const poste = await prisma.poste.findUnique({
      where: { id: +posteId },
      include: { sujet: { select: { titre: true, moderateurId: true } } }
    })
    if (!poste) return res.status(404).json({ message: 'Post introuvable' })

    const report = await prisma.report.create({
      data: { raison, detail, reporteurId: req.user.id, posteId: +posteId }
    })

    if (poste.sujet?.moderateurId) {
      await notify({
        destinataireId: poste.sujet.moderateurId,
        type:    'report_post',
        message: `🚩 Un post dans "${poste.sujet.titre}" a été signalé : ${raison}.`,
        reportId: report.id,
        posteId:  +posteId,
      })
    }

    res.status(201).json(report)
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

// POST /api/reports/commentaire — report a comment → notify sujet moderateur
router.post('/commentaire', authenticate, async (req, res) => {
  try {
    const { id: rawId, raison, detail } = req.body
    if (!rawId || !raison)
      return res.status(400).json({ message: 'Champs requis manquants' })

    // Try finding by commentaire.id first, then by interactionId as fallback
    let commentaire = await prisma.commentaire.findUnique({
      where: { id: +rawId },
      include: {
        interaction: {
          include: { poste: { include: { sujet: { select: { titre: true, moderateurId: true } } } } }
        }
      }
    })

    if (!commentaire) {
      // Fallback: maybe the frontend sent the interaction id
      commentaire = await prisma.commentaire.findUnique({
        where: { interactionId: +rawId },
        include: {
          interaction: {
            include: { poste: { include: { sujet: { select: { titre: true, moderateurId: true } } } } }
          }
        }
      })
    }

    if (!commentaire) return res.status(404).json({ message: 'Commentaire introuvable' })

    const report = await prisma.report.create({
      data: { raison, detail, reporteurId: req.user.id, commentaireId: commentaire.id }
    })

    const sujet   = commentaire.interaction?.poste?.sujet
    const posteId = commentaire.interaction?.poste?.id
    if (sujet?.moderateurId) {
      await notify({
        destinataireId: sujet.moderateurId,
        type:    'report_comment',
        message: `🚩 Un commentaire dans "${sujet.titre}" a été signalé : ${raison}.`,
        reportId: report.id,
        posteId,
      })
    }

    res.status(201).json(report)
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

// ── GET reports ──────────────────────────────────────────────────────────────

// GET /api/reports/admin — user reports only (for admin)
router.get('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    // Group user reports: one entry per reported user with count
    const reported = await prisma.report.groupBy({
      by: ['utilisateurSignaleId'],
      where: { utilisateurSignaleId: { not: null }, statut: 'en_attente' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    })

    const result = await Promise.all(reported.map(async r => {
      const user = await prisma.utilisateur.findUnique({
        where: { id: r.utilisateurSignaleId },
        select: { id: true, nom: true, email: true, estBloque: true, role: true, avatar: true }
      })
      const reports = await prisma.report.findMany({
        where: { utilisateurSignaleId: r.utilisateurSignaleId, statut: 'en_attente' },
        include: { reporteur: { select: { nom: true } } },
        orderBy: { date: 'desc' }
      })
      return { utilisateur: user, count: r._count.id, reports }
    }))

    res.json(result.filter(r => r.utilisateur))
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

// GET /api/reports/moderateur — post+comment reports for moderator's sujets
router.get('/moderateur', authenticate, requireModo, async (req, res) => {
  try {
    // Find this moderator's sujets
    const mesSujets = await prisma.sujet.findMany({
      where: { moderateurId: req.user.id },
      select: { id: true }
    })
    const sujetIds = mesSujets.map(s => s.id)

    if (sujetIds.length === 0) return res.json([])

    // Get all posts in those sujets
    const postsInSujets = await prisma.poste.findMany({
      where: { sujetId: { in: sujetIds } },
      select: { id: true, titre: true, contenu: true, sujet: { select: { titre: true } } }
    })
    const postIds = postsInSujets.map(p => p.id)
    const postMap = Object.fromEntries(postsInSujets.map(p => [p.id, p]))

    // Post reports
    const posteReports = postIds.length > 0
      ? await prisma.report.findMany({
          where: { posteId: { in: postIds }, statut: 'en_attente' },
          include: { reporteur: { select: { nom: true } } },
          orderBy: { date: 'desc' }
        })
      : []

    // All pending comment reports (filter by sujet in JS)
    const allCommentReports = await prisma.report.findMany({
      where: { commentaireId: { not: null }, statut: 'en_attente' },
      include: {
        reporteur:   { select: { nom: true } },
        commentaire: {
          include: {
            interaction: {
              include: {
                poste: { select: { id: true, sujetId: true, sujet: { select: { titre: true, moderateurId: true } } } }
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    const commentReports = allCommentReports.filter(
      r => r.commentaire?.interaction?.poste?.sujet?.moderateurId === req.user.id
    )

    const result = [
      ...posteReports.map(r => ({
        id:           r.id,
        type:         'poste',
        raison:       r.raison,
        detail:       r.detail,
        date:         r.date,
        statut:       r.statut,
        reporteurNom: r.reporteur?.nom,
        posteId:      r.posteId,
        posteTitre:   postMap[r.posteId]?.titre,
        sujetTitre:   postMap[r.posteId]?.sujet?.titre,
        contenu:      postMap[r.posteId]?.contenu,
      })),
      ...commentReports.map(r => ({
        id:            r.id,
        type:          'commentaire',
        raison:        r.raison,
        detail:        r.detail,
        date:          r.date,
        statut:        r.statut,
        reporteurNom:  r.reporteur?.nom,
        commentaireId: r.commentaireId,
        posteId:       r.commentaire?.interaction?.posteId,
        sujetTitre:    r.commentaire?.interaction?.poste?.sujet?.titre,
        contenu:       r.commentaire?.contenu,
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date))

    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

// ── Actions on reports ────────────────────────────────────────────────────────

// PATCH /api/reports/:id/traiter — moderator: delete reported content
router.patch('/:id/traiter', authenticate, requireModo, async (req, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: +req.params.id },
      include: { poste: true }
    })
    if (!report) return res.status(404).json({ message: 'Signalement introuvable' })

    if (report.posteId) {
      await prisma.interaction.deleteMany({ where: { posteId: report.posteId } })
      await prisma.poste.update({ where: { id: report.posteId }, data: { statut: 'supprime' } })
    }

    if (report.commentaireId) {
      // Fetch the commentaire with its replies
      const commentaire = await prisma.commentaire.findUnique({
        where: { id: report.commentaireId },
        include: {
          replies: { include: { interaction: true } },
          interaction: true
        }
      })
      if (commentaire) {
        // Delete replies first
        if (commentaire.replies?.length > 0) {
          await prisma.interaction.deleteMany({
            where: { id: { in: commentaire.replies.map(r => r.interactionId) } }
          })
        }
        await prisma.interaction.delete({ where: { id: commentaire.interactionId } })
      }
    }

    // Mark all pending reports on same content as treated
    await prisma.report.updateMany({
      where: {
        OR: [
          report.posteId       ? { posteId: report.posteId }             : undefined,
          report.commentaireId ? { commentaireId: report.commentaireId } : undefined,
        ].filter(Boolean),
        statut: 'en_attente'
      },
      data: { statut: 'valide' }
    })

    res.json({ message: 'Contenu supprimé et signalement traité' })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

// PATCH /api/reports/admin/:id/bloquer — admin: block user and close all their reports
router.patch('/admin/:id/bloquer', authenticate, requireAdmin, async (req, res) => {
  try {
    const utilisateurId = +req.params.id
    await prisma.utilisateur.update({ where: { id: utilisateurId }, data: { estBloque: true } })
    await prisma.report.updateMany({
      where: { utilisateurSignaleId: utilisateurId, statut: 'en_attente' },
      data:  { statut: 'valide' }
    })
    res.json({ message: 'Utilisateur bloqué' })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

// PATCH /api/reports/admin/:id/ignorer — admin: dismiss all reports on a user
router.patch('/admin/:id/ignorer', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.report.updateMany({
      where: { utilisateurSignaleId: +req.params.id, statut: 'en_attente' },
      data:  { statut: 'supprime' }
    })
    res.json({ message: 'Signalements ignorés' })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

// PATCH /api/reports/:id/ignorer — moderator: dismiss a report without deleting
router.patch('/:id/ignorer', authenticate, requireModo, async (req, res) => {
  try {
    await prisma.report.update({ where: { id: +req.params.id }, data: { statut: 'supprime' } })
    res.json({ message: 'Signalement ignoré' })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

// ── Notifications ─────────────────────────────────────────────────────────────

router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { destinataireId: req.user.id },
      orderBy: { date: 'desc' },
      take: 50,
    })
    res.json(notifications)
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

router.patch('/notifications/:id/lu', authenticate, async (req, res) => {
  try {
    const notif = await prisma.notification.update({
      where: { id: +req.params.id, destinataireId: req.user.id },
      data: { lu: true }
    })
    res.json(notif)
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

router.patch('/notifications/mark-all-read', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { destinataireId: req.user.id, lu: false },
      data:  { lu: true }
    })
    res.json({ message: 'OK' })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

export default router