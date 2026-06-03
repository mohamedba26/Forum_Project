import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

const safeUser = (u) => ({
  id: u.id, nom: u.nom, email: u.email, role: u.role, estBloque: u.estBloque, avatar: u.avatar || null
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { nom, email, motDePasse } = req.body
  if (!nom || !email || !motDePasse)
    return res.status(400).json({ message: 'Champs requis manquants' })

  const exists = await prisma.utilisateur.findUnique({ where: { email } })
  if (exists) return res.status(409).json({ message: 'Email déjà utilisé' })

  const hash = await bcrypt.hash(motDePasse, 12)
  const user = await prisma.utilisateur.create({
    data: { nom, email, motDePasse: hash }
  })
  res.status(201).json({ user: safeUser(user), token: makeToken(user.id) })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, motDePasse } = req.body
  const user = await prisma.utilisateur.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ message: 'Identifiants incorrects' })
  if (user.estBloque) return res.status(403).json({ message: 'Compte bloqué' })

  const valid = await bcrypt.compare(motDePasse, user.motDePasse)
  if (!valid) return res.status(401).json({ message: 'Identifiants incorrects' })

  res.json({ user: safeUser(user), token: makeToken(user.id) })
})

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json(req.user)
})

// PATCH /api/auth/profile — update name, avatar, password
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { nom, avatar, motDePasseActuel, nouveauMotDePasse } = req.body
    const data = {}

    if (nom?.trim()) data.nom = nom.trim()
    if (avatar)      data.avatar = avatar

    // Password change — requires current password
    if (nouveauMotDePasse) {
      if (!motDePasseActuel)
        return res.status(400).json({ message: 'Mot de passe actuel requis' })
      const current = await prisma.utilisateur.findUnique({ where: { id: req.user.id } })
      const valid = await bcrypt.compare(motDePasseActuel, current.motDePasse)
      if (!valid) return res.status(401).json({ message: 'Mot de passe actuel incorrect' })
      data.motDePasse = await bcrypt.hash(nouveauMotDePasse, 12)
    }

    if (Object.keys(data).length === 0)
      return res.status(400).json({ message: 'Aucune modification fournie' })

    const updated = await prisma.utilisateur.update({ where: { id: req.user.id }, data })
    res.json(safeUser(updated))
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne', details: error.message })
  }
})

export default router