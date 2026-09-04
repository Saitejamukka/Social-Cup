import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthedRequest } from '../lib/auth.js';

const router = Router();
router.use(requireAuth);

// POST /api/reviews  { cafeId, drinkId, stars, note }
// One rating per member per drink; re-rating edits the existing one.
router.post('/', async (req: AuthedRequest, res: Response) => {
  const { cafeId, drinkId, stars, note } = req.body ?? {};
  const starsNum = Number(stars);

  if (!cafeId || !drinkId || !Number.isInteger(starsNum) || starsNum < 1 || starsNum > 5) {
    return res.status(400).json({ success: false, error: 'cafeId, drinkId, and stars (1-5) are required' });
  }
  if (note && String(note).length > 140) {
    return res.status(400).json({ success: false, error: 'Note must be 140 characters or fewer' });
  }

  const review = await prisma.review.upsert({
    where: { userId_drinkId: { userId: req.userId!, drinkId } },
    create: { userId: req.userId!, cafeId, drinkId, stars: starsNum, note: note || null },
    update: { stars: starsNum, note: note || null },
  });

  res.status(201).json({ success: true, review });
});

// GET /api/reviews/me — the member's drink diary, highest rated first.
router.get('/me', async (req: AuthedRequest, res: Response) => {
  const reviews = await prisma.review.findMany({
    where: { userId: req.userId! },
    include: { cafe: true, drink: true },
    orderBy: [{ stars: 'desc' }, { createdAt: 'desc' }],
  });

  res.json({
    success: true,
    diary: reviews.map((r) => ({
      id: r.id,
      cafeId: r.cafeId,
      cafeName: r.cafe.name,
      drinkId: r.drinkId,
      drinkName: r.drink.name,
      stars: r.stars,
      note: r.note,
      date: r.updatedAt,
    })),
  });
});

export { router as reviewRoutes };
