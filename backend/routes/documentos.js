const express = require('express');
const router = express.Router();
const { upload, obtenerDocumentos, subirDocumento } = require('../controllers/documentosController');
const { verificarToken } = require('../middleware/auth');
router.get('/', verificarToken, obtenerDocumentos);
router.post('/', verificarToken, upload.single('archivo'), subirDocumento);
module.exports = router;
