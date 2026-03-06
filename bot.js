require('dotenv').config();

const { Telegraf } = require('telegraf');
const axios = require('axios');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(express.json());

const API_URL = process.env.VERCEL_URL || 'https://your-backend.vercel.app';
const MINI_APP_URL = process.env.MINI_APP_URL;

// ✅ Webhook endpoint
app.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// ✅ أمر /start
bot.start(async (ctx) => {
  const startPayload = ctx.payload;
  const telegramId = ctx.from.id;
  
  console.log('📝 Start:', telegramId, 'Payload:', startPayload);
  
  if (startPayload) {
    try {
      // جلب أو إنشاء محفظة
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      let { data: wallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();
      
      if (!wallet) {
        const { data: newWallet } = await supabase
          .from('wallets')
          .insert({ telegram_id: telegramId, balance: 0, total_earned: 0 })
          .select()
          .single();
        wallet = newWallet;
        
        await supabase.from('daily_rewards').insert({ wallet_id: wallet.id });
      }
      
      // تسجيل الإحالة
      await axios.post(`${API_URL}/api/referrals/register`, {
        new_user_id: wallet.id,
        referral_code: startPayload
      });
      
      console.log('✅ Referral registered');
      
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
  
  await ctx.reply(
    '👋 مرحباً بك في SYT Wallet!',
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '💼 فتح المحفظة', web_app: { url: MINI_APP_URL } }
        ]]
      }
    }
  );
});

// ✅ API routes
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const rewardRoutes = require('./routes/rewards');
const taskRoutes = require('./routes/tasks');
const referralRoutes = require('./routes/referrals');

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/referrals', referralRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// ✅ تشغيل
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server on port ${PORT}`);
  
  // تعيين Webhook
  const webhookUrl = `${API_URL}/webhook`;
  bot.telegram.setWebhook(webhookUrl)
    .then(() => console.log('✅ Webhook set:', webhookUrl))
    .catch(err => console.log('❌ Webhook error:', err.message));
});
