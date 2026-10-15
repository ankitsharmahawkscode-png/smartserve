const router = require('express').Router();
const validate = require('../middleware/validate');
const validId = require('../middleware/validId');
const S = require('../validators/domain.validators');
const c = require('../controllers/tech.controller');

router.param('id', validId);
router.get('/ping', (req, res) => res.json({ success: true, data: { role: req.user.role }, message: 'technician ok' }));
router.get('/earnings', require('../controllers/tech.earnings.controller').earnings);
router.get('/jobs', c.listJobs);
router.get('/jobs/:id', c.getJob);
router.patch('/jobs/:id/respond', validate(S.respondSchema), c.respond);
router.patch('/jobs/:id/status', validate(S.statusSchema), c.updateStatus);
router.put('/availability', validate(S.availabilitySchema), c.setAvailability);

module.exports = router;