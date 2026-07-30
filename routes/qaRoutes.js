const express = require('express');
const router = express.Router();
const qaController = require('../controllers/qaController');

router.post('/generate', qaController.generateTestCases);
router.patch('/test-status', qaController.updateTestStatus);
router.post('/bugs', qaController.logBug);

module.exports = router;