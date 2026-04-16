import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';

// Inicialización de múltiples bots
export const botAdmin = process.env.TELEGRAM_BOT_TOKEN_ADMIN 
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN_ADMIN, { polling: true }) 
  : null;

export const botRetiros = process.env.TELEGRAM_BOT_TOKEN_RETIROS 
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN_RETIROS, { polling: true }) 
  : null;

export const botSecretaria = process.env.TELEGRAM_BOT_TOKEN_SECRETARIA 
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN_SECRETARIA, { polling: true }) 
  : null;

console.log("Sistema Multi-Bot iniciado (Admin, Retiros, Secretaria)");

// Funciones de utilidad mejoradas para multi-bot
export const sendToAdmin = async (message) => {
  if (!botAdmin) return false;
  try {
    await botAdmin.sendMessage(process.env.TELEGRAM_CHAT_ADMIN, message, { parse_mode: 'HTML' });
    console.log("✅ Admin: Mensaje enviado");
    return true;
  } catch (e) {
    console.error("❌ Admin Error:", e.message);
    return false;
  }
};

export const sendToRetiros = async (message) => {
  if (!botRetiros) return false;
  try {
    await botRetiros.sendMessage(process.env.TELEGRAM_CHAT_RETIROS, message, { parse_mode: 'HTML' });
    console.log("✅ Retiros: Mensaje enviado");
    return true;
  } catch (e) {
    console.error("❌ Retiros Error:", e.message);
    return false;
  }
};

export const sendToSecretaria = async (message) => {
  if (!botSecretaria) return false;
  try {
    await botSecretaria.sendMessage(process.env.TELEGRAM_CHAT_SECRETARIA, message, { parse_mode: 'HTML' });
    console.log("✅ Secretaria: Mensaje enviado");
    return true;
  } catch (e) {
    console.error("❌ Secretaria Error:", e.message);
    return false;
  }
};

export const formatRetiroMessage = (data) => {
  const { telefono, nivel, monto, hora } = data;
  return `📌 <b>NUEVO RETIRO</b>\n\n👤 Usuario: ${telefono}\n🏅 Nivel: ${nivel}\n💵 Monto: ${monto} Bs\n🕒 Hora: ${hora}`;
};

export const formatRecargaMessage = (data) => {
  const { telefono, nivel, monto } = data;
  return `📌 <b>NUEVA RECARGA</b>\n\n👤 Usuario: ${telefono}\n🏅 Nivel: ${nivel}\n💵 Monto: ${monto} Bs`;
};

// Exportar objeto por defecto para compatibilidad
export default {
  botAdmin,
  botRetiros,
  botSecretaria,
  sendToAdmin,
  sendToRetiros,
  sendToSecretaria,
  formatRetiroMessage,
  formatRecargaMessage
};
