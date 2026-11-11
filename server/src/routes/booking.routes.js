const router = require('express').Router();
const validate = require('../middleware/validate');
const validId = require('../middleware/validId');
const S = require('../validators/domain.validators');
const c = require('../controllers/booking.controller');
const tracking = require('../controllers/jobTracking.controller');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

router.param('id', validId);

router.route('/').get(c.list).post(validate(S.createBookingSchema), c.create);
router.get('/:id', c.getOne);
router.patch('/:id/cancel', validate(S.cancelSchema), c.cancel);

// Taxi-style status, technician card and start code
router.get('/:id/tracking', tracking.tracking);

// Older live-location endpoint (the new tracker does not use it)
router.get(
  '/:id/location',
  asyncHandler(async (req, res) => {
    const booking = await Booking.findOne({
      _id: req.params.id,
      customer: req.user._id,
    }).select('liveLocation status');

    if (!booking) throw new ApiError(404, 'Booking not found');
    res.json({ success: true, data: { liveLocation: booking.liveLocation } });
  })
);

module.exports = router;