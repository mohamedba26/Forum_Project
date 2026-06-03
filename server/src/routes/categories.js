import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/categories – list distinct sujet categories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.sujet.findMany({
      where: {},
      select: { categorie: true },
      distinct: ['categorie']
    });
    const distinct = categories.map(c => c.categorie).filter(Boolean);
    res.json(distinct);
  } catch (e) {
    console.error('Error fetching categories', e);
    res.status(500).json({ message: 'Erreur interne', details: e.message });
  }
});

export default router;
