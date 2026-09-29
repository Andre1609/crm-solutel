const express = require('express');
const router = express.Router();
const { obtenerCampanas, obtenerTarifas, obtenerRoles, obtenerEquipos } = require('../controllers/catalogoController');
const { verificarToken } = require('../middleware/auth');
router.get('/campanas', verificarToken, obtenerCampanas);
router.get('/tarifas', verificarToken, obtenerTarifas);
router.get('/roles', verificarToken, obtenerRoles);
router.get('/equipos', verificarToken, obtenerEquipos);
module.exports = router;
