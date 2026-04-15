import { Router } from 'express';
import { sendToRetiros, sendToAdmin, sendToSecretaria, bot } from '../services/telegramBot.js';

const router = Router();

/**
 * Endpoint de prueba para Telegram
 * GET /api/telegram/test
 */
router.get('/test', async (req, res) => {
  try {
    console.log("Iniciando test de Telegram...");

    // Envío directo solicitado al ID específico con await
    if (bot) {
      await bot.sendMessage(-1003904814691, "🚀 TEST DIRECTO");
      console.log("Test directo enviado");
    } else {
      console.error("Bot no inicializado");
    }

    // Test a través de las funciones del servicio con await
    await sendToRetiros("🚀 Test RETIROS OK");
    await sendToAdmin("🚀 Test ADMIN OK");
    await sendToSecretaria("🚀 Test SECRETARIA OK");

    res.json({ ok: true });
  } catch (err) {
    console.error("Error en test Telegram:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
