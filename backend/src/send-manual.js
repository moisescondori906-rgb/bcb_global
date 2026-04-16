import 'dotenv/config';
import { sendToRetiros, sendToAdmin, sendToSecretaria } from './services/telegramBot.js';

async function sendManualMessage() {
  const message = "🚀 <b>SISTEMA ACTIVO</b>\n\nIntegración de Telegram verificada y funcionando correctamente en todos los grupos.";
  
  console.log("Enviando mensajes a los grupos...");
  
  try {
    const results = await Promise.all([
      sendToRetiros(message),
      sendToAdmin(message),
      sendToSecretaria(message)
    ]);
    
    console.log("Resultados del envío:", results);
    console.log("✅ Mensajes enviados correctamente.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al enviar mensajes:", error.message);
    process.exit(1);
  }
}

sendManualMessage();
