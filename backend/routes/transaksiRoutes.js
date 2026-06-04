const express = require('express');
const router = express.Router();
const { createSetoran, createPenarikan, deleteTransaksi } = require('../controllers/transaksiController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken); // Semua transaksi membutuhkan login token

router.post('/setoran', createSetoran);
router.post('/penarikan', createPenarikan);
router.delete('/:id', requireAdmin, deleteTransaksi); // Hanya admin yang boleh membatalkan/menghapus transaksi

module.exports = router;
