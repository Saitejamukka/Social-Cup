import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

function serializeCafe(cafe: any) {
  const allRatings = cafe.drinks.flatMap((d: any) => d.reviews.map((r: any) => r.stars));
  const avgRating = allRatings.length
    ? allRatings.reduce((a: number, b: number) => a + b, 0) / allRatings.length
    : null;

  return {
    id: cafe.id,
    name: cafe.name,
    neighborhood: cafe.neighborhood,
    address: cafe.address,
    hours: cafe.hours,
    open: cafe.isOpen,
    price: cafe.priceTier,
    isFeatured: cafe.isFeatured,
    tags: cafe.vibeTags,
    image: cafe.image,
    gallery: cafe.gallery,
    rating: avgRating,
    ratingCount: allRatings.length,
    lowestCreditPrice: cafe.drinks.filter((d: any) => d.isEnabled).reduce(
      (min: number | null, d: any) => (min === null || d.creditsCost < min ? d.creditsCost : min),
      null
    ),
    drinks: cafe.drinks
      .filter((d: any) => d.isEnabled)
      .map((d: any) => {
        const ratings = d.reviews.map((r: any) => r.stars);
        return {
          id: d.id,
          name: d.name,
          description: d.description,
          creditsCost: d.creditsCost,
          retailPrice: d.retailPrice,
          isSignature: d.isSignature,
          category: d.category,
          image: d.image,
          rating: ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : null,
          ratingCount: ratings.length,
        };
      }),
  };
}

const cafeInclude = {
  drinks: { include: { reviews: { select: { stars: true } } } },
};

// GET /api/cafes?neighborhood=Uptown&search=roast
router.get('/', async (req: Request, res: Response) => {
  const { neighborhood, search } = req.query;

  let cafes = await prisma.cafe.findMany({
    where: {
      ...(neighborhood && neighborhood !== 'All'
        ? { neighborhood: { equals: String(neighborhood) } }
        : {}),
    },
    include: cafeInclude,
    // Featured cafes first, matching the PRD's curated-discovery ordering rule.
    orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
  });

  // Name/tag search stays in application code — the partner network is small
  // (dozens of cafes), so this doesn't need Postgres full-text search.
  if (search) {
    const q = String(search).toLowerCase();
    cafes = cafes.filter(
      (c) => c.name.toLowerCase().includes(q) || c.vibeTags.some((t) => t.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, count: cafes.length, cafes: cafes.map(serializeCafe) });
});

// GET /api/cafes/:id
router.get('/:id', async (req: Request, res: Response) => {
  const cafe = await prisma.cafe.findUnique({ where: { id: req.params.id }, include: cafeInclude });
  if (!cafe) {
    return res.status(404).json({ success: false, error: 'Cafe not found' });
  }
  res.json({ success: true, cafe: serializeCafe(cafe) });
});

export { router as cafeRoutes, serializeCafe, cafeInclude };
