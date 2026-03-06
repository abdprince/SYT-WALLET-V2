bot.start(async (ctx) => {
  const startPayload = ctx.payload;
  
  console.log('📝 Start command received');
  console.log('👤 User ID:', ctx.from.id);
  console.log('🔗 Payload:', startPayload);
  console.log('🌐 API_URL:', API_URL);
  
  if (startPayload) {
    try {
      console.log('📤 Sending referral request...');
      
      const response = await axios.post(`${API_URL}/api/referrals/register`, {
        new_user_id: ctx.from.id,
        referral_code: startPayload
      });
      
      console.log('✅ Referral success:', response.data);
      
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
