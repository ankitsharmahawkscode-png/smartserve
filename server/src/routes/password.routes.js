const router = require('express').Router();
const validate = require('../middleware/validate');
const S = require('../validators/domain.validators');
const ctrl = require('../controllers/password.controller');

router.post('/change-password', validate(S.changePasswordSchema), ctrl.changePassword);

module.exports = router;