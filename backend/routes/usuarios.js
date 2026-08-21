const express = require('express');
const router = express.Router();
const { obtenerUsuarios, crearUsuario } = require('../controllers/usuariosController');
const { verificarToken } = require('../middleware/auth');
router.get('/', verificarToken, obtenerUsuarios);
router.post('/', verificarToken, crearUsuario);
module.exports = router;
