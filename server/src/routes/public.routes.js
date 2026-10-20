const router = require('express').Router();
const validate = require('../middleware/validate');
const validId = require('../middleware/validId');
const { contactLimiter } = require('../middleware/security');
const S = require('../validators/domain.validators');
const c = require('../controllers/catalog.controller');
const reviews = require('../controllers/review.controller');
const contact = require('../controllers/contact.controller');
const blogController = require('../controllers/blog.controller');
const couponController = require('../controllers/coupon.controller');
const c = require('../controllers/catalog.controller');

router.param('id', validId);

router.get('/categories', c.categories);
router.get('/categories/:slug', c.getCategoryBySlug);
router.get('/services', c.services);
router.get('/services/:id', c.service);
router.get('/services/:id/slots', c.slots);
router.get('/services/:id/reviews', reviews.forService);
router.get('/settings/public', c.publicSettings);
router.post('/contact', contactLimiter, validate(S.contactSchema), contact.create);
router.get('/blogs', blogController.listPublishedBlogs);
router.get('/blogs/:slug', blogController.getBlogBySlug);
router.get('/services/:id/related', c.relatedServices);

router.post('/coupons/validate', couponController.validateCoupon);

module.exports = router;