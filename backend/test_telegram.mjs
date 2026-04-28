
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const tokens = {
  admin: process.env.TELEGRAM_BOT_TOKEN_ADMIN,
  retiros: process.env.TELEGRAM_BOT_TOKEN_RETIROS,
  secretaria: process.env.TELEGRAM_BOT_TOKEN_SECRETARIA
};

const chats = {
  admin: process.env.TELEGRAM_CHAT_ADMIN,
  retiros: process.env.TELEGRAM_CHAT_RETIROS,
  secretaria: process.env.TELEGRAM_CHAT_SECRETARIA
};

async function testBot(name, token, chatId) {
  if (!token || token === 'tu_token_aqui') {
    console.log(`❌ ${name} bot token not configured.`);
    return;
  }
  if (!chatId) {
    console.log(`❌ ${name} chat ID not configured.`);
    return;
  }

  console.log(`Testing ${name} bot...`);
  const bot = new TelegramBot(token, { polling: false });
  try {
    await bot.sendMessage(chatId, `🤖 Test message from ${name} bot - Verification at ${new Date().toISOString()}`);
    console.log(`✅ ${name} bot: Message sent successfully to ${chatId}`);
  } catch (err) {
    console.error(`❌ ${name} bot error:`, err.message);
  }
}

async function run() {
  await testBot('Admin', tokens.admin, chats.admin);
  await testBot('Retiros', tokens.retiros, chats.retiros);
  await testBot('Secretaria', tokens.secretaria, chats.secretaria);
}

run();
