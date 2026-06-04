const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Hanya admin yang diizinkan melihat log audit sistem
router.get('/', verifyToken, requireAdmin, getAuditLogs);

module.exports = router;
