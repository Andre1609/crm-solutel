const express = require('express');
const router = express.Router();
const { obtenerClientes, buscarPorDni, crearCliente } = require('../controllers/clientesController');
const { verificarToken } = require('../middleware/auth');
router.get('/', verificarToken, obtenerClientes);
router.get('/dni/:dni', verificarToken, buscarPorDni);
router.post('/', verificarToken, crearCliente);
module.exports = router;
