const express = require('express');
const router = express.Router();
const { obtenerClientes, buscarPorDni, crearCliente } = require('../controllers/clientesController');
const { verificarToken } = require('../middleware/auth');
router.get('/', verificarToken, obtenerClientes);
router.get('/dni/:dni', verificarToken, buscarPorDni);
router.post('/', verificarToken, crearCliente);
router.get('/id/:id', verificarToken, (req, res) => {
  const db = require('../config/db');
  db.query('SELECT * FROM clientes WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error al buscar cliente' });
    if (results.length === 0) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.json(results[0]);
  });
});
module.exports = router;
