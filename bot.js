require('dotenv').config();

const { Telegraf } = require('telegraf');
const axios = require('axios');
const http = require('http');

const bot = new Telegraf(process.env.BOT_TOKEN);

const API_URL = process.env.API_URL || 'https://syt-wallet-v2.onrender.com';
const MINI_APP_URL = process.env.MINI_APP_URL;

// Port وهمي للـ Render
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running');
}).listen(PORT, () => console.log(`Port ${PORT} open`));

// ✅ /start - تسجيل إحالة + فتح Mini App
bot.start(async (ctx) => {
  const startPayload = ctx.payload;
  const telegramId = ctx.from.id;
  
  console.log('📝 Start command');
  console.log('👤 Telegram ID:', telegramId);
  console.log('🔗 Payload:', startPayload);
  
  if (startPayload) {
    try {
      console.log('🔍 Fetching wallet...');
      
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      let { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();
      
      let walletId;
      
      if (walletError || !wallet) {
        console.log('⚠️ Creating new wallet...');
        
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            telegram_id: telegramId,
            balance: 0,
            total_earned: 0
          })
          .select()
          .single();
        
        if (createError) throw createError;
        
        walletId = newWallet.id;
        console.log('✅ Created wallet:', walletId);
        
        await supabase.from('daily_rewards').insert({
          wallet_id: walletId
        });
        
      } else {
        walletId = wallet.id;
        console.log('✅ Found wallet:', walletId);
      }
      
      console.log('📤 Registering referral...');
      
      const response = await axios.post(`${API_URL}/api/referrals/register`, {
        new_user_id: walletId,
        referral_code: startPayload
      });
      
      console.log('✅ Referral success:', response.data);
      
    } catch (error) {
      console.log('❌ Referral error:', error.message);
      console.log('Error details:', error.response?.data);
    }
  } else {
    console.log('⚠️ No payload - direct start');
  }
  
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

bot.help((ctx) => {
  ctx.reply('/start - فتح المحفظة');
});

// ✅ تشغيل بالـ Polling (بدون Webhook)
bot.launch()
  .then(() => console.log('🤖 Bot started successfully'))
  .catch(err => console.error('❌ Bot error:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
