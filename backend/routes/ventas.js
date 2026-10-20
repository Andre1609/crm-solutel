const express = require('express');
const router = express.Router();
const { obtenerVentas, obtenerEstadisticas, crearVenta, editarVenta, eliminarVenta } = require('../controllers/ventasController');
const { verificarToken } = require('../middleware/auth');

router.get('/', verificarToken, obtenerVentas);
router.get('/estadisticas', verificarToken, obtenerEstadisticas);
router.post('/', verificarToken, crearVenta);
router.put('/:id', verificarToken, editarVenta);
router.delete('/:id', verificarToken, eliminarVenta);

module.exports = router;
