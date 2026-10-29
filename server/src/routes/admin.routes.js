const router = require('express').Router();
const validate = require('../middleware/validate');
const validId = require('../middleware/validId');
const checkPermission = require('../middleware/checkPermission'); // 👈 Import kiya
const S = require('../validators/domain.validators');
const cat = require('../controllers/admin.catalog.controller');
const ops = require('../controllers/admin.ops.controller');
const fin = require('../controllers/admin.finance.controller');
const blogController = require('../controllers/blog.controller');
const couponController = require('../controllers/coupon.controller');
const applicationController = require('../controllers/application.controller');

router.param('id', validId);

// Ye routes sabke liye open hain (Super Admin + Sub Admin)
router.get('/ping', (req, res) => res.json({ success: true, data: { role: req.user.role }, message: 'admin ok' }));
router.get('/stats', require('../controllers/admin.stats.controller').stats);

// 👇 AB HAR ROUTE PE PERMISSION LAGAYI HAI 👇
router.get('/audit', checkPermission('audit'), require('../controllers/admin.audit.controller').list);
router.get('/messages', checkPermission('messages'), require('../controllers/contact.controller').list);

router.route('/categories')
  .get(checkPermission('categories'), cat.listCategories)
  .post(checkPermission('categories'), validate(S.categorySchema), cat.createCategory);
router.route('/categories/:id')
  .put(checkPermission('categories'), validate(S.categorySchema.partial()), cat.updateCategory)
  .delete(checkPermission('categories'), cat.deleteCategory);

router.route('/services')
  .get(checkPermission('services'), cat.listServices)
  .post(checkPermission('services'), validate(S.serviceSchema), cat.createService);
router.route('/services/:id')
  .put(checkPermission('services'), validate(S.serviceSchema.partial()), cat.updateService)
  .delete(checkPermission('services'), cat.deleteService);

router.get('/bookings', checkPermission('bookings'), ops.listBookings);
router.get('/bookings/:id', checkPermission('bookings'), ops.getBooking);
router.patch('/bookings/:id/approve', checkPermission('bookings'), ops.approve);
router.patch('/bookings/:id/assign', checkPermission('bookings'), validate(S.assignSchema), ops.assign);
router.patch('/bookings/:id/cancel', checkPermission('bookings'), validate(S.adminCancelSchema), ops.cancel);

router.route('/technicians')
  .get(checkPermission('technicians'), ops.listTechnicians)
  .post(checkPermission('technicians'), validate(S.technicianSchema), ops.createTechnician);
router.patch('/technicians/:id', checkPermission('technicians'), validate(S.technicianUpdateSchema), ops.updateTechnician);

router.get('/customers', checkPermission('customers'), ops.listCustomers);
router.patch('/customers/:id/status', checkPermission('customers'), validate(S.statusToggleSchema), ops.setCustomerStatus);

// 👇 NAYA ROUTE: Super Admin kisi ki bhi permissions change kar sakta hai
router.patch('/users/:id/access', ops.updateUserAccess);

router.get('/payments', checkPermission('payments'), fin.listPayments);
router.post('/payments/:id/refund', checkPermission('payments'), fin.refund);
router.get('/reviews', checkPermission('reviews'), fin.listReviews);
router.patch('/reviews/:id', checkPermission('reviews'), validate(S.reviewVisibilitySchema), fin.setReviewHidden);

router.route('/settings')
  .get(checkPermission('settings'), ops.getSettings)
  .put(checkPermission('settings'), validate(S.settingsSchema), ops.putSettings);

router.post('/blogs', checkPermission('blogs'), validate(S.blogSchema), blogController.createBlog);
router.put('/blogs/:id', checkPermission('blogs'), validate(S.blogSchema), blogController.updateBlog);
router.delete('/blogs/:id', checkPermission('blogs'), blogController.deleteBlog);
router.get('/blogs', checkPermission('blogs'), blogController.adminListBlogs);

router.post('/coupons', checkPermission('coupons'), couponController.createCoupon);
router.get('/coupons', checkPermission('coupons'), couponController.listCoupons);
router.delete('/coupons/:id', checkPermission('coupons'), couponController.deleteCoupon);

router.get('/applications', checkPermission('applications'), applicationController.listApplications);
router.post('/applications/:id/approve', checkPermission('applications'), applicationController.approveApplication);

module.exports = router;