const express = require('express');
const router = express.Router();
const { obtenerAgenda, crearAgenda } = require('../controllers/agendaController');
const { verificarToken } = require('../middleware/auth');
// Agendados es solo para Jefe de Plataforma (1) y asesores (4)
const jefeOAsesor = (req, res, next) => {
  if (![1, 4].includes(req.usuario.rol_id)) return res.status(403).json({ mensaje: 'No tienes acceso a Agendados' });
  next();
};
router.get('/', verificarToken, jefeOAsesor, obtenerAgenda);
router.post('/', verificarToken, jefeOAsesor, crearAgenda);
router.delete('/:id', verificarToken, jefeOAsesor, (req, res) => {
  const db = require('../config/db');
  db.query('DELETE FROM agenda WHERE agenda_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ mensaje: 'Error al eliminar' });
    res.json({ mensaje: 'Eliminado correctamente' });
  });
});
module.exports = router;
