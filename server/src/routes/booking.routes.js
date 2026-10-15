const router = require('express').Router();
const validate = require('../middleware/validate');
const validId = require('../middleware/validId');
const S = require('../validators/domain.validators');
const c = require('../controllers/booking.controller');

router.param('id', validId);
router.route('/').get(c.list).post(validate(S.createBookingSchema), c.create);
router.get('/:id', c.getOne);
router.patch('/:id/cancel', validate(S.cancelSchema), c.cancel);

module.exports = router;