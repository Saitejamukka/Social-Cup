import { Router, Request, Response } from 'express';
import { DALLAS_CAFES } from '../data/dallasCafes.js';

const router = Router();

// GET /api/cafes?neighborhood=Uptown&search=roast
router.get('/', (req: Request, res: Response) => {
  const { neighborhood, search } = req.query;

  let result = [...DALLAS_CAFES];

  if (neighborhood && neighborhood !== 'All') {
    result = result.filter(
      (c) => c.neighborhood.toLowerCase() === String(neighborhood).toLowerCase()
    );
  }

  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(
      (c) => c.name.toLowerCase().includes(q) || c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, count: result.length, cafes: result });
});

// GET /api/cafes/:id
router.get('/:id', (req: Request, res: Response) => {
  const cafe = DALLAS_CAFES.find((c) => c.id === req.params.id);
  if (!cafe) {
    return res.status(404).json({ success: false, error: 'Cafe not found' });
  }
  res.json({ success: true, cafe });
});

export { router as cafeRoutes };
