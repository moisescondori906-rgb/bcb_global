import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token);

const chats = [
  { name: 'ADMIN', id: '-1003960230607' },
  { name: 'RETIROS', id: '-1003904814691' },
  { name: 'SECRETARIA', id: '-1003900884989' }
];

async function testAll() {
  console.log("--- TEST DE ENVÍO DETALLADO ---");
  
  for (const chat of chats) {
    try {
      console.log(`Intentando enviar a ${chat.name} (${chat.id})...`);
      await bot.sendMessage(chat.id, `Test de conexión para ${chat.name}`);
      console.log(`✅ ${chat.name}: ENVIADO OK`);
    } catch (error) {
      console.error(`❌ ${chat.name}: ERROR -> ${error.message}`);
      if (error.message.includes('chat not found')) {
        console.log(`   [INFO] El bot no está en el grupo o el ID es incorrecto.`);
      } else if (error.message.includes('bot was kicked')) {
        console.log(`   [INFO] El bot fue expulsado del grupo.`);
      }
    }
  }
}

testAll();
