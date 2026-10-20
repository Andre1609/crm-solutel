const express = require('express');
const router = express.Router();
const { obtenerPersonal, crearPersonal, editarPersonal, eliminarPersonal } = require('../controllers/personalController');
const { verificarToken } = require('../middleware/auth');

router.get('/', verificarToken, obtenerPersonal);
router.post('/', verificarToken, crearPersonal);
router.put('/:id', verificarToken, editarPersonal);
router.delete('/:id', verificarToken, eliminarPersonal);

module.exports = router;
