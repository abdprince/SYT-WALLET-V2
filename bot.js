require('dotenv').config();
const { Telegraf } = require('telegraf');

console.log('🔄 Starting bot...');
console.log('Token exists:', !!process.env.BOT_TOKEN);

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  console.log('✅ /start received from:', ctx.from.id);
  ctx.reply('👋 مرحباً! البوت يعمل!');
});

bot.launch()
  .then(() => console.log('🤖 Bot started successfully'))
  .catch(err => console.error('❌ Error:', err.message));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
