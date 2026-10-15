const router = require('express').Router();
const validate = require('../middleware/validate');
const validId = require('../middleware/validId');
const { strictLimiter } = require('../middleware/security');
const S = require('../validators/domain.validators');
const c = require('../controllers/me.controller');

router.param('addressId', validId);
router.route('/').get(c.get).put(validate(S.profileSchema), c.update);
router.put('/password', strictLimiter, validate(S.changePasswordSchema), c.changePassword);
router.post('/addresses', validate(S.addressSchema), c.addAddress);
router.route('/addresses/:addressId').put(validate(S.addressUpdateSchema), c.updateAddress).delete(c.removeAddress);

module.exports = router;