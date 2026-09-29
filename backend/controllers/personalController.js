const db = require('../config/db');
const bcrypt = require('bcryptjs');
const obtenerPersonal = (req, res) => {
  db.query('SELECT p.*, r.rol_nombre, e.equipo_nombre FROM personal p JOIN roles r ON p.personal_rol_id = r.rol_id LEFT JOIN equipos e ON p.personal_equipo_id = e.equipo_id', (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error' }); res.json(results);
  });
};
const crearPersonal = async (req, res) => {
  const { personal_nombres, personal_apellidos, personal_email, password, personal_rol_id, personal_equipo_id } = req.body;
  const personal_password = await bcrypt.hash(password, 10);
  db.query('INSERT INTO personal (personal_nombres, personal_apellidos, personal_email, personal_password, personal_rol_id, personal_equipo_id) VALUES (?, ?, ?, ?, ?, ?)',
    [personal_nombres, personal_apellidos, personal_email, personal_password, personal_rol_id, personal_equipo_id],
    (err, result) => { if (err) return res.status(500).json({ mensaje: 'Error al crear personal' }); res.json({ mensaje: 'Personal creado', id: result.insertId }); });
};
module.exports = { obtenerPersonal, crearPersonal };
