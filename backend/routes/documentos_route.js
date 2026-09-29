const express = require('express');
const router = express.Router();
const { upload, obtenerDocumentos, subirDocumento, eliminarDocumento } = require('../controllers/documentosController');
const { verificarToken } = require('../middleware/auth');

router.get('/', verificarToken, obtenerDocumentos);
router.post('/', verificarToken, upload.single('archivo'), subirDocumento);
router.delete('/:id', verificarToken, eliminarDocumento);

module.exports = router;
