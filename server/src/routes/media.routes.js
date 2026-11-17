const router = require('express').Router();
const { getMedia } = require('../controllers/media.controller');

router.get('/:id', getMedia);

module.exports = router;