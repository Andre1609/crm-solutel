const express = require('express');
const router = express.Router();
const { obtenerAgenda, crearAgenda } = require('../controllers/agendaController');
const { verificarToken } = require('../middleware/auth');
router.get('/', verificarToken, obtenerAgenda);
router.post('/', verificarToken, crearAgenda);
module.exports = router;
