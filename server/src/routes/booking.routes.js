const router = require('express').Router();
const validate = require('../middleware/validate');
const validId = require('../middleware/validId');
const S = require('../validators/domain.validators');
const c = require('../controllers/booking.controller');

router.param('id', validId);
router.route('/').get(c.list).post(validate(S.createBookingSchema), c.create);
router.get('/:id', c.getOne);
router.patch('/:id/cancel', validate(S.cancelSchema), c.cancel);
router.get('/:id/location', async (req, res, next) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    customer: req.user._id,
  }).select('liveLocation status');

  if (!booking) return next(new ApiError(404, 'Booking not found'));
  res.json({ success: true, data: { liveLocation: booking.liveLocation } });
});
module.exports = router;