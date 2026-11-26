const express = require('express');
const router = express.Router();
const { purchaseGiftCard, checkGiftCardBalance } = require('../controllers/giftCardController');
// Note: Update the path to your actual auth middleware
const { protect } = require('../middleware/authMiddleware'); 

router.post('/purchase', protect, purchaseGiftCard);
router.get('/:code', checkGiftCardBalance);

module.exports = router;