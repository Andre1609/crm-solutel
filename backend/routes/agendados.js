const express = require('express');
const router = express.Router();
const { obtenerAgendados, crearAgendado } = require('../controllers/agendadosController');
const { verificarToken } = require('../middleware/auth');
router.get('/', verificarToken, obtenerAgendados);
router.post('/', verificarToken, crearAgendado);
module.exports = router;
