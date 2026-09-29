const express = require('express');
const router = express.Router();
const { obtenerPersonal, crearPersonal } = require('../controllers/personalController');
const { verificarToken } = require('../middleware/auth');
router.get('/', verificarToken, obtenerPersonal);
router.post('/', verificarToken, crearPersonal);
module.exports = router;
