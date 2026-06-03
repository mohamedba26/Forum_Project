import jwt from 'jsonwebtoken'
import { prisma } from '../prisma.js'

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Token manquant' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user    = await prisma.utilisateur.findUnique({ where: { id: payload.id } })
    if (!user || user.estBloque) return res.status(401).json({ message: 'Non autorisé' })
    req.user = user
    next()
  } catch {
    res.status(401).json({ message: 'Token invalide' })
  }
}

export const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return next()

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user    = await prisma.utilisateur.findUnique({ where: { id: payload.id } })
    if (user && !user.estBloque) req.user = user
  } catch {}
  next()
}

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin requis' })
  next()
}

export const requireModo = (req, res, next) => {
  if (!['admin', 'moderateur'].includes(req.user?.role))
    return res.status(403).json({ message: 'Modérateur requis' })
  next()
}