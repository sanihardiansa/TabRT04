const express = require('express');
const router = express.Router();
const { getAllAnggota, getAnggotaById, createAnggota, updateAnggota, deleteAnggota } = require('../controllers/anggotaController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken); // Semua route anggota membutuhkan login token

router.get('/', getAllAnggota);
router.get('/:id', getAnggotaById);
router.post('/', createAnggota);
router.put('/:id', updateAnggota);
router.delete('/:id', requireAdmin, deleteAnggota); // Hanya admin yang boleh menghapus anggota

module.exports = router;
