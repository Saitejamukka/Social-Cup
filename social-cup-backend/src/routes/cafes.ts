import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

const EARTH_RADIUS_MILES = 3958.8;

// Haversine great-circle distance — accurate enough for sorting cafes a few
// miles apart and needs no external geocoding service.
function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function serializeCafe(cafe: any, fromCoords?: { lat: number; lng: number }) {
  const allRatings = cafe.drinks.flatMap((d: any) => d.reviews.map((r: any) => r.stars));
  const avgRating = allRatings.length
    ? allRatings.reduce((a: number, b: number) => a + b, 0) / allRatings.length
    : null;

  const distance =
    fromCoords && cafe.latitude !== null && cafe.longitude !== null
      ? distanceMiles(fromCoords.lat, fromCoords.lng, cafe.latitude, cafe.longitude)
      : null;

  return {
    id: cafe.id,
    name: cafe.name,
    neighborhood: cafe.neighborhood,
    address: cafe.address,
    latitude: cafe.latitude,
    longitude: cafe.longitude,
    distanceMiles: distance !== null ? Number(distance.toFixed(1)) : null,
    hours: cafe.hours,
    open: cafe.isOpen,
    price: cafe.priceTier,
    isFeatured: cafe.isFeatured,
    perkLine: cafe.perkLine,
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

// GET /api/cafes?neighborhood=Uptown&search=roast&lat=32.78&lng=-96.80
router.get('/', async (req: Request, res: Response) => {
  const { neighborhood, search, lat, lng } = req.query;

  let cafes = await prisma.cafe.findMany({
    where: {
      ...(neighborhood && neighborhood !== 'All'
        ? { neighborhood: { equals: String(neighborhood) } }
        : {}),
    },
    include: cafeInclude,
    // Featured cafes first, matching the PRD's curated-discovery ordering rule.
    // Overridden below by distance when the client supplies its coordinates.
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

  const userLat = lat !== undefined ? Number(lat) : NaN;
  const userLng = lng !== undefined ? Number(lng) : NaN;
  const fromCoords = Number.isFinite(userLat) && Number.isFinite(userLng) ? { lat: userLat, lng: userLng } : undefined;

  let serialized = cafes.map((c) => serializeCafe(c, fromCoords));

  // PRD 3.1: "the full cafe list underneath, ordered with the nearest first."
  // Cafes with no coordinates yet sort to the end rather than dropping out.
  if (fromCoords) {
    serialized = serialized.sort((a, b) => {
      if (a.distanceMiles === null) return 1;
      if (b.distanceMiles === null) return -1;
      return a.distanceMiles - b.distanceMiles;
    });
  }

  res.json({ success: true, count: serialized.length, cafes: serialized });
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
