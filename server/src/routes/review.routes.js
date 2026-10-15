const router = require('express').Router();
const validate = require('../middleware/validate');
const S = require('../validators/domain.validators');
const c = require('../controllers/review.controller');

router.post('/', validate(S.reviewSchema), c.create);
router.get('/mine', c.mine);

module.exports = router;