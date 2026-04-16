import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

async function getChatIds() {
  console.log("--- BUSCANDO IDS DE CHAT ---");
  console.log("Por favor, asegúrate de haber enviado un mensaje en los grupos hace menos de 1 minuto.");
  
  try {
    const updates = await bot.getUpdates();
    if (updates.length === 0) {
      console.log("No se encontraron mensajes recientes. Envía un mensaje en los grupos y vuelve a intentar.");
      return;
    }

    const chats = {};
    updates.forEach(u => {
      if (u.message && u.message.chat) {
        chats[u.message.chat.title || 'Privado'] = u.message.chat.id;
      }
    });

    console.log("Chats encontrados:");
    console.table(chats);
    
  } catch (error) {
    console.error("Error al obtener updates:", error.message);
  }
}

getChatIds();
