import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("TOKEN NO DEFINIDO");
}

const bot = new TelegramBot(token, { polling: true });

console.log("Telegram bot iniciado correctamente");

// Funciones de utilidad para mantener compatibilidad con el resto del sistema
export const sendMessage = async (chatId, message) => {
  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    return true;
  } catch (error) {
    console.error("Error Telegram:", error.message);
    return false;
  }
};

export const sendToAdmin = (message) => sendMessage(process.env.TELEGRAM_CHAT_ADMIN, message);
export const sendToRetiros = (message) => sendMessage(process.env.TELEGRAM_CHAT_RETIROS, message);
export const sendToSecretaria = (message) => sendMessage(process.env.TELEGRAM_CHAT_SECRETARIA, message);

export const formatRetiroMessage = (data) => {
  const { telefono, nivel, monto, hora } = data;
  return `📌 <b>NUEVO RETIRO</b>\n\n👤 Usuario: ${telefono}\n🏅 Nivel: ${nivel}\n💵 Monto: ${monto} Bs\n🕒 Hora: ${hora}`;
};

export const formatRecargaMessage = (data) => {
  const { telefono, nivel, monto } = data;
  return `📌 <b>NUEVA RECARGA</b>\n\n👤 Usuario: ${telefono}\n🏅 Nivel: ${nivel}\n💵 Monto: ${monto} Bs`;
};

export default bot;
