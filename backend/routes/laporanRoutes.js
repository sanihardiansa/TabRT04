const express = require('express');
const router = express.Router();
const { getDashboardData, getLaporanTransaksi } = require('../controllers/laporanController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken); // Membutuhkan login token

router.get('/dashboard', getDashboardData);
router.get('/transaksi', getLaporanTransaksi);

module.exports = router;
