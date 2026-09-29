const express = require('express');
const router = express.Router();
const { obtenerTitulares, buscarPorDni, buscarPorId, crearTitular } = require('../controllers/titularesController');
const { verificarToken } = require('../middleware/auth');
router.get('/', verificarToken, obtenerTitulares);
router.get('/dni/:dni', verificarToken, buscarPorDni);
router.get('/id/:id', verificarToken, buscarPorId);
router.post('/', verificarToken, crearTitular);
module.exports = router;
