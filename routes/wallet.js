router.post('/transfer', verifyTelegram, async (req, res) => {
  const { to_address, amount } = req.body;
  const telegramId = req.telegramUser.id;

  if (!to_address || !amount || amount <= 0) {
    return res.status(400).json({ error: 'بيانات غير صالحة' });
  }

  try {
    // جلب محفظة المرسل
    const { data: fromWallet, error: fromError } = await supabase
      .from('wallets')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (fromError || !fromWallet) {
      return res.status(404).json({ error: 'محفظة المرسل غير موجودة' });
    }

    // ✅ التحقق من عدم التحويل لنفس المحفظة
    if (fromWallet.wallet_address === to_address) {
      return res.status(400).json({ error: 'لا يمكن التحويل لنفس المحفظة' });
    }

    if (fromWallet.balance < amount) {
      return res.status(400).json({ error: 'رصيد غير كافٍ' });
    }

    // جلب محفظة المستلم
    const { data: toWallet, error: toError } = await supabase
      .from('wallets')
      .select('*')
      .eq('wallet_address', to_address)
      .single();

    if (toError || !toWallet) {
      return res.status(404).json({ error: 'المستلم غير موجود' });
    }

    // تنفيذ التحويل
    const newFromBalance = fromWallet.balance - amount;
    const newToBalance = toWallet.balance + amount;

    // تحديث المرسل
    await supabase
      .from('wallets')
      .update({ balance: newFromBalance, updated_at: new Date() })
      .eq('id', fromWallet.id);

    // تحديث المستلم
    await supabase
      .from('wallets')
      .update({ balance: newToBalance, updated_at: new Date() })
      .eq('id', toWallet.id);

    // تسجيل العملية
    await supabase.from('transactions').insert({
      from_wallet: fromWallet.id,
      to_wallet: toWallet.id,
      amount: amount,
      type: 'transfer'
    });

    res.json({
      success: true,
      new_balance: newFromBalance,
      message: 'تم التحويل بنجاح'
    });

  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'فشل التحويل' });
  }
});
