const router = require('express').Router();
const validate = require('../middleware/validate');
const validId = require('../middleware/validId');
const S = require('../validators/domain.validators');
const cat = require('../controllers/admin.catalog.controller');
const ops = require('../controllers/admin.ops.controller');
const fin = require('../controllers/admin.finance.controller');
const blogController = require('../controllers/blog.controller');

router.param('id', validId);
router.get('/ping', (req, res) => res.json({ success: true, data: { role: req.user.role }, message: 'admin ok' }));
router.get('/stats', require('../controllers/admin.stats.controller').stats);
router.get('/audit', require('../controllers/admin.audit.controller').list);
router.get('/messages', require('../controllers/contact.controller').list);

router.route('/categories').get(cat.listCategories).post(validate(S.categorySchema), cat.createCategory);
router.route('/categories/:id').put(validate(S.categorySchema.partial()), cat.updateCategory).delete(cat.deleteCategory);

router.route('/services').get(cat.listServices).post(validate(S.serviceSchema), cat.createService);
router.route('/services/:id').put(validate(S.serviceSchema.partial()), cat.updateService).delete(cat.deleteService);

router.get('/bookings', ops.listBookings);
router.get('/bookings/:id', ops.getBooking);
router.patch('/bookings/:id/approve', ops.approve);
router.patch('/bookings/:id/assign', validate(S.assignSchema), ops.assign);
router.patch('/bookings/:id/cancel', validate(S.adminCancelSchema), ops.cancel);

router.route('/technicians').get(ops.listTechnicians).post(validate(S.technicianSchema), ops.createTechnician);
router.patch('/technicians/:id', validate(S.technicianUpdateSchema), ops.updateTechnician);

router.get('/customers', ops.listCustomers);
router.patch('/customers/:id/status', validate(S.statusToggleSchema), ops.setCustomerStatus);

router.get('/payments', fin.listPayments);
router.post('/payments/:id/refund', fin.refund);
router.get('/reviews', fin.listReviews);
router.patch('/reviews/:id', validate(S.reviewVisibilitySchema), fin.setReviewHidden);

router.route('/settings').get(ops.getSettings).put(validate(S.settingsSchema), ops.putSettings);
router.post('/blogs', validate(S.blogSchema), blogController.createBlog);
router.put('/blogs/:id', validate(S.blogSchema), blogController.updateBlog);
router.delete('/blogs/:id', blogController.deleteBlog);
router.get('/blogs', blogController.adminListBlogs);

module.exports = router;