import { Router } from 'express';
import { getLevels } from '../../services/dbService.js';
import { authenticate } from '../../utils/middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

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
