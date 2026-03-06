require('dotenv').config();

const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);

const API_URL = process.env.API_URL || 'https://syt-wallet-v2.vercel.app';

// أمر /start
bot.start(async (ctx) => {
  const startPayload = ctx.payload; // كود الإحالة
  
  if (startPayload) {
    // تسجيل إحالة
    try {
      await axios.post(`${API_URL}/api/referrals/register`, {
        new_user_id: ctx.from.id,
        referral_code: startPayload
      });
    } catch (error) {
      console.log('Referral error:', error.message);
    }
  }
  
  // فتح Mini App
  await ctx.reply(
    '👋 مرحباً بك في SYT Wallet!\n\n' +
    'اضغط الزر أدناه لفتح محفظتك:',
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '💼 فتح المحفظة', web_app: { url: process.env.MINI_APP_URL } }
        ]]
      }
    }
  );
});

// أمر /help
bot.help((ctx) => {
  ctx.reply(
    '📚 الأوامر المتاحة:\n\n' +
    '/start - فتح المحفظة\n' +
    '/help - المساعدة'
  );
});

// تشغيل البوت
bot.launch()
  .then(() => console.log('🤖 Bot started'))
  .catch(err => console.error('Bot error:', err));

// إيقاف نظيف
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
