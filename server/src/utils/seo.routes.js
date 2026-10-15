const router = require('express').Router();
const c = require('../controllers/seo.controller');

router.get('/sitemap.xml', c.sitemap);
router.get('/robots.txt', c.robots);

module.exports = router;