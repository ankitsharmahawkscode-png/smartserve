const router = require('express').Router();
const seoController = require('./seo.controller');

router.get('/sitemap.xml', seoController.sitemap);
router.get('/robots.txt', seoController.robots);

module.exports = router;