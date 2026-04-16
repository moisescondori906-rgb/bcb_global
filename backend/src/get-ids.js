import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';

const bots = [
  { name: 'ADMIN', token: process.env.TELEGRAM_BOT_TOKEN_ADMIN },
  { name: 'RETIROS', token: process.env.TELEGRAM_BOT_TOKEN_RETIROS },
  { name: 'SECRETARIA', token: process.env.TELEGRAM_BOT_TOKEN_SECRETARIA }
];

async function getChatIds() {
  console.log("--- BUSCANDO IDS DE CHAT (SISTEMA MULTI-BOT) ---");
  console.log("Por favor, asegúrate de haber enviado un mensaje /test en cada grupo respectivo.");

  for (const b of bots) {
    if (!b.token) {
      console.log(`\n⚠️ Bot ${b.name}: Token no configurado en .env`);
      continue;
    }

    console.log(`\n🔍 Revisando bot ${b.name}...`);
    const bot = new TelegramBot(b.token);

    try {
      const updates = await bot.getUpdates({ timeout: 1 });
      if (updates.length === 0) {
        console.log(`   No se encontraron mensajes recientes para ${b.name}.`);
        continue;
      }

      const chats = {};
      updates.forEach(u => {
        if (u.message && u.message.chat) {
          chats[u.message.chat.title || 'Privado'] = u.message.chat.id;
        }
      });

      console.log(`   Chats encontrados para ${b.name}:`);
      console.table(chats);
    } catch (error) {
      console.error(`   ❌ Error en ${b.name}:`, error.message);
    }
  }
}

getChatIds();
