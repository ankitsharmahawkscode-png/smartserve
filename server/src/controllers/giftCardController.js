const GiftCard = require('../models/GiftCard');

exports.purchaseGiftCard = async (req, res) => {
  try {
    const { amount, recipientName, recipientEmail, paymentId } = req.body;
    const senderEmail = req.user.email; // Assuming auth middleware attaches user

    if (!amount || !recipientEmail || !paymentId) {
      return res.status(400).json({ message: 'Missing required fields or payment verification.' });
    }

    const giftCard = await GiftCard.create({
      amount,
      balance: amount,
      recipientName,
      recipientEmail,
      senderEmail,
      paymentId
    });

    res.status(201).json({
      success: true,
      message: 'Gift card generated successfully.',
      data: {
        code: giftCard.code,
        amount: giftCard.amount,
        recipientEmail: giftCard.recipientEmail
      }
    });
  } catch (error) {
    console.error('Gift Card Purchase Error:', error);
    res.status(500).json({ message: 'Server error while generating gift card.' });
  }
};

exports.checkGiftCardBalance = async (req, res) => {
  try {
    const giftCard = await GiftCard.findOne({ code: req.params.code.toUpperCase() });
    
    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found.' });
    }
    if (giftCard.status !== 'Active') {
      return res.status(400).json({ message: `This gift card is ${giftCard.status.toLowerCase()}.` });
    }

    res.status(200).json({
      success: true,
      data: {
        code: giftCard.code,
        balance: giftCard.balance,
        expiresAt: giftCard.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};