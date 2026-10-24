const express = require('express');
const router = express.Router();
const { obtenerAgenda, crearAgenda } = require('../controllers/agendaController');
const { verificarToken } = require('../middleware/auth');
router.get('/', verificarToken, obtenerAgenda);
router.post('/', verificarToken, crearAgenda);
router.delete('/:id', verificarToken, (req, res) => {
  const db = require('../config/db');
  db.query('DELETE FROM agenda WHERE agenda_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ mensaje: 'Error al eliminar' });
    res.json({ mensaje: 'Eliminado correctamente' });
  });
});
module.exports = router;
