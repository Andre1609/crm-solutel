const express = require('express');
const router = express.Router();
const { obtenerPersonal, crearPersonal, editarPersonal, eliminarPersonal } = require('../controllers/personalController');
const { verificarToken } = require('../middleware/auth');

// La gestión del personal es solo del Jefe de Plataforma
const soloJefe = (req, res, next) => {
  if (req.usuario.rol_id !== 1) return res.status(403).json({ mensaje: 'Solo el Jefe de Plataforma gestiona el personal' });
  next();
};

router.get('/', verificarToken, soloJefe, obtenerPersonal);
router.post('/', verificarToken, soloJefe, crearPersonal);
router.put('/:id', verificarToken, soloJefe, editarPersonal);
router.delete('/:id', verificarToken, soloJefe, eliminarPersonal);

module.exports = router;
