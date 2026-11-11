const router = require('express').Router();
const validate = require('../middleware/validate');
const validId = require('../middleware/validId');
const S = require('../validators/domain.validators');
const c = require('../controllers/tech.controller');
const techProfile = require('../controllers/techProfile.controller');
const { technicianProfileSchema, availabilitySchema } = require('../validators/domain.validators');
const tracking = require('../controllers/jobTracking.controller');

router.param('id', validId);

router.get('/ping', (req, res) =>
  res.json({ success: true, data: { role: req.user.role }, message: 'technician ok' })
);

router.get('/earnings', require('../controllers/tech.earnings.controller').earnings);

router.get('/jobs', c.listJobs);
router.get('/jobs/:id', c.getJob);
router.patch('/jobs/:id/respond', validate(S.respondSchema), c.respond);

router.post('/jobs/:id/location/ping', validate(S.pingSchema), tracking.ping);
router.post('/jobs/:id/progress', validate(S.progressSchema), tracking.progress);

router.patch('/jobs/:id/status', tracking.requireStartCode, validate(S.statusSchema), c.updateStatus);
router.put('/availability', validate(S.availabilitySchema), c.setAvailability);
router.get('/profile', techProfile.getProfile);
router.put('/profile', validate(technicianProfileSchema), techProfile.updateProfile);
router.patch('/profile/availability', validate(availabilitySchema), techProfile.setAvailability);
// Live location — uses same /jobs/:id path as other endpoints
router.post('/jobs/:id/location/start', c.startSharing);
router.post('/jobs/:id/location/stop', c.stopSharing);
router.get('/jobs/:id/location', c.getLocation);

module.exports = router;