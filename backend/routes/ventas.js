const express = require('express');
const router = express.Router();
const { obtenerVentas, crearVenta, actualizarEstado } = require('../controllers/ventasController');
const { verificarToken } = require('../middleware/auth');
router.get('/', verificarToken, obtenerVentas);
router.post('/', verificarToken, crearVenta);
router.put('/:id/estado', verificarToken, actualizarEstado);
module.exports = router;
