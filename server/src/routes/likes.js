import { Router } from 'express'
import { prisma } from '../prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const VALID_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡']

// ── Sujet like (no reaction, just toggle) ───────────────────────────────────
router.post('/sujet/:id', authenticate, async (req, res) => {
  const sujetId = +req.params.id
  if (isNaN(sujetId)) return res.status(400).json({ message: 'Invalid ID' })
  try {
    const existing = await prisma.sujetLike.findUnique({
      where: { sujetId_auteurId: { sujetId, auteurId: req.user.id } }
    })
    if (existing) {
      await prisma.sujetLike.delete({ where: { id: existing.id } })
      res.json({ liked: false })
    } else {
      await prisma.sujetLike.create({ data: { sujetId, auteurId: req.user.id } })
      res.json({ liked: true })
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

// ── Poste reaction ─────────────────────────────────────────────────────────
// POST /api/likes/poste/:id  body: { reaction: '❤️' }
// - If no existing reaction → create with emoji
// - If same emoji → remove (toggle off)
// - If different emoji → update to new emoji
router.post('/poste/:id', authenticate, async (req, res) => {
  const posteId  = +req.params.id
  const reaction = VALID_REACTIONS.includes(req.body.reaction) ? req.body.reaction : '👍'
  if (isNaN(posteId)) return res.status(400).json({ message: 'Invalid ID' })

  try {
    const existing = await prisma.posteLike.findUnique({
      where: { posteId_auteurId: { posteId, auteurId: req.user.id } }
    })

    if (existing) {
      if (existing.reaction === reaction) {
        // Same emoji → remove reaction
        await prisma.posteLike.delete({ where: { id: existing.id } })
        return res.json({ reaction: null })
      } else {
        // Different emoji → update
        const updated = await prisma.posteLike.update({
          where: { id: existing.id },
          data:  { reaction }
        })
        return res.json({ reaction: updated.reaction })
      }
    }

    // New reaction
    await prisma.posteLike.create({ data: { posteId, auteurId: req.user.id, reaction } })

    // Notify post author
    const poste = await prisma.poste.findUnique({ where: { id: posteId }, select: { auteurId: true } })
    if (poste && poste.auteurId !== req.user.id) {
      await prisma.notification.create({
        data: { destinataireId: poste.auteurId, type: 'like', message: `${reaction} Quelqu'un a réagi à votre post.`, posteId }
      }).catch(() => {})
    }

    res.json({ reaction })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

// GET /api/likes/poste/:id — get all reactions with counts
router.get('/poste/:id', async (req, res) => {
  const posteId = +req.params.id
  try {
    const likes = await prisma.posteLike.findMany({ where: { posteId } })
    const counts = {}
    for (const l of likes) counts[l.reaction] = (counts[l.reaction] || 0) + 1
    res.json({ total: likes.length, counts })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

// ── Commentaire reaction ────────────────────────────────────────────────────
router.post('/commentaire/:id', authenticate, async (req, res) => {
  const commentaireId = +req.params.id
  const reaction = VALID_REACTIONS.includes(req.body.reaction) ? req.body.reaction : '👍'
  if (isNaN(commentaireId)) return res.status(400).json({ message: 'Invalid ID' })

  try {
    const existing = await prisma.commentaireLike.findUnique({
      where: { commentaireId_auteurId: { commentaireId, auteurId: req.user.id } }
    })

    if (existing) {
      if (existing.reaction === reaction) {
        await prisma.commentaireLike.delete({ where: { id: existing.id } })
        return res.json({ reaction: null })
      } else {
        const updated = await prisma.commentaireLike.update({
          where: { id: existing.id },
          data:  { reaction }
        })
        return res.json({ reaction: updated.reaction })
      }
    }

    await prisma.commentaireLike.create({ data: { commentaireId, auteurId: req.user.id, reaction } })
    res.json({ reaction })
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne' })
  }
})

export default router