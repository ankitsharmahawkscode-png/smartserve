const express = require('express');
const router = express.Router();
const { submitCorporateLead } = require('../controllers/corporateController');

router.post('/lead', submitCorporateLead);

module.exports = router;