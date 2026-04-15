import { Router } from 'express';
import bot from '../services/telegramBot.js';

const router = Router();

/**
 * Endpoint de prueba para Telegram
 * GET /api/telegram/test
 */
router.get('/test', async (req, res) => {
  try {
    console.log("Iniciando test de Telegram...");

    // Envío directo solicitado al ID específico con await
    await bot.sendMessage(-1003904814691, "🚀 FUNCIONA DIRECTO");

    res.json({ ok: true });
  } catch (err) {
    console.error("ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
