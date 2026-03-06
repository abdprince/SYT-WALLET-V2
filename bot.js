require('dotenv').config();

const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

const bot = new Telegraf(process.env.BOT_TOKEN);

const API_URL = process.env.API_URL || 'https://syt-wallet-backend.onrender.com';
const MINI_APP_URL = process.env.MINI_APP_URL;

// ✅ Port وهمي لـ Render
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running');
}).listen(PORT, () => console.log(`Port ${PORT} open`));

// ✅ أمر /start مع تسجيل الإحالة
bot.start(async (ctx) => {
  const startPayload = ctx.payload;
  const telegramId = ctx.from.id;
  
  console.log('📝 Start command');
  console.log('👤 Telegram ID:', telegramId);
  console.log('🔗 Payload:', startPayload);
  console.log('🌐 API_URL:', API_URL);
  
  // ✅ تسجيل الإحالة إذا كان هناك referral_code
  if (startPayload) {
    try {
      console.log('📤 Sending referral...');
      
      const response = await axios.post(`${API_URL}/api/referrals/register`, {
        new_user_id: telegramId,  // ✅ bigint بعد تغيير قاعدة البيانات
        referral_code: startPayload
      });
      
      console.log('✅ Referral success:', response.data);
      
    } catch (error) {
      console.log('❌ Referral error:', error.message);
      console.log('Error code:', error.response?.status);
      console.log('Error data:', error.response?.data);
    }
  } else {
    console.log('⚠️ No payload - direct start');
  }
  
  // ✅ الرد للمستخدم
  await ctx.reply(
    '👋 مرحباً بك في SYT Wallet!\n\n' +
    '💰 اربح العملات من المكافآت اليومية والمهام\n' +
    '👥 ادعو أصدقاءك واحصل على 50 SYT لكل صديق\n\n' +
    'اضغط الزر أدناه لفتح محفظتك:',
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '💼 فتح المحفظة', web_app: { url: MINI_APP_URL } }
        ]]
      }
    }
  );
});

// ✅ أمر /help
bot.help((ctx) => {
  ctx.reply('📚 /start - فتح المحفظة');
});

// ✅ تشغيل البوت
bot.launch()
  .then(() => console.log('🤖 Bot started successfully'))
  .catch(err => console.error('❌ Bot error:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
