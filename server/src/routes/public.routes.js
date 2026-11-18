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
const applicationCtrl = require('../controllers/application.controller');
const authorCtrl = require('../controllers/author.controller');

router.param('id', validId);

// Catalog
router.get('/categories', c.categories);
router.get('/categories/:slug', c.getCategoryBySlug);
router.get('/services', c.services);
router.get('/services/:id', c.service);
router.get('/services/:id/slots', c.slots);
router.get('/services/:id/reviews', reviews.forService);
router.get('/services/:id/related', c.relatedServices);
router.get('/settings/public', c.publicSettings);

// Contact form
router.post('/contact', contactLimiter, validate(S.contactSchema), contact.create);

// Blog and authors
router.get('/blogs', blogController.listPublishedBlogs);
router.get('/blogs/:slug', blogController.getBlogBySlug);
router.get('/authors/:slug', authorCtrl.getAuthorBySlug);

// Coupons (limited, so a bot cannot guess codes quickly)
router.post('/coupons/validate', contactLimiter, couponController.validateCoupon);

// Technician application form: validated, and only known fields are saved
router.post('/applications', contactLimiter, validate(S.applicationSchema), applicationCtrl.submitApplication);

module.exports = router;