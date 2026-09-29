const db = require('../config/db');
const obtenerTitulares = (req, res) => {
  db.query('SELECT * FROM titulares ORDER BY titular_creado_en DESC', (err, results) => { if (err) return res.status(500).json({ mensaje: 'Error' }); res.json(results); });
};
const buscarPorDni = (req, res) => {
  db.query('SELECT * FROM titulares WHERE titular_dni = ?', [req.params.dni], (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error' });
    if (results.length === 0) return res.status(404).json({ mensaje: 'No encontrado' });
    res.json(results[0]);
  });
};
const buscarPorId = (req, res) => {
  db.query('SELECT * FROM titulares WHERE titular_id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error' });
    if (results.length === 0) return res.status(404).json({ mensaje: 'No encontrado' });
    res.json(results[0]);
  });
};
const crearTitular = (req, res) => {
  const { titular_dni, titular_nombres, titular_apellidos, titular_nacionalidad, titular_fecha_nacimiento, titular_edad, titular_telefono_fijo, titular_telefono_movil, titular_correo, titular_banco, titular_iban } = req.body;
  db.query('INSERT INTO titulares (titular_dni, titular_nombres, titular_apellidos, titular_nacionalidad, titular_fecha_nacimiento, titular_edad, titular_telefono_fijo, titular_telefono_movil, titular_correo, titular_banco, titular_iban) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [titular_dni, titular_nombres, titular_apellidos, titular_nacionalidad, titular_fecha_nacimiento, titular_edad, titular_telefono_fijo, titular_telefono_movil, titular_correo, titular_banco, titular_iban],
    (err, result) => { if (err) return res.status(500).json({ mensaje: 'Error al crear titular' }); res.json({ mensaje: 'Titular creado', id: result.insertId }); });
};
module.exports = { obtenerTitulares, buscarPorDni, buscarPorId, crearTitular };
