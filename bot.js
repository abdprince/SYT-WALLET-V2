bot.start(async (ctx) => {
  const startPayload = ctx.payload;
  const newUserTelegramId = ctx.from.id;
  
  console.log('📝 Start command received');
  console.log('👤 Telegram ID:', newUserTelegramId);
  console.log('🔗 Payload:', startPayload);
  
  if (startPayload) {
    try {
      // ✅ جلب wallet_id من telegram_id
      console.log('🔍 Fetching wallet for user:', newUserTelegramId);
      
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id')
        .eq('telegram_id', newUserTelegramId)
        .single();
      
      if (walletError || !wallet) {
        console.log('⚠️ Wallet not found, creating...');
        // المستخدم الجديد سينشأ محفظة عند فتح Mini App
        // نأجل تسجيل الإحالة لبعد ذلك
        console.log('⏸️ Referral will be registered after wallet creation');
      } else {
        const walletId = wallet.id;
        console.log('✅ Wallet found:', walletId);
        console.log('📤 Sending referral request...');
        
        const response = await axios.post(`${API_URL}/api/referrals/register`, {
          new_user_id: walletId,  // ✅ UUID وليس Telegram ID
          referral_code: startPayload
        });
        
        console.log('✅ Referral success:', response.data);
      }
      
    } catch (error) {
      console.log('❌ Referral error:', error.message);
      console.log('Error details:', error.response?.data);
    }
  } else {
    console.log('⚠️ No payload - not a referral');
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
