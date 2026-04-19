import { Router } from 'express';
import { getLevels } from '../lib/queries.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const levels = await getLevels();
  res.json(levels);
}));

router.get('/ganancias', authenticate, asyncHandler(async (req, res) => {
  const levels = await getLevels();
  res.json(levels);
}));

export default router;
