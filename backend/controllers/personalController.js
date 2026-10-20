const db = require('../config/db');
const bcrypt = require('bcryptjs');

const obtenerPersonal = (req, res) => {
  db.query('SELECT p.*, r.rol_nombre, e.equipo_nombre FROM personal p JOIN roles r ON p.personal_rol_id = r.rol_id LEFT JOIN equipos e ON p.personal_equipo_id = e.equipo_id', (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error' });
    res.json(results);
  });
};

const crearPersonal = async (req, res) => {
  const { personal_nombres, personal_apellidos, personal_email, password, personal_rol_id, personal_equipo_id } = req.body;
  const personal_password = await bcrypt.hash(password, 10);
  db.query('INSERT INTO personal (personal_nombres, personal_apellidos, personal_email, personal_password, personal_rol_id, personal_equipo_id) VALUES (?, ?, ?, ?, ?, ?)',
    [personal_nombres, personal_apellidos, personal_email, personal_password, personal_rol_id, personal_equipo_id || null],
    (err, result) => { if (err) return res.status(500).json({ mensaje: 'Error al crear personal' }); res.json({ mensaje: 'Personal creado', id: result.insertId }); });
};

const editarPersonal = (req, res) => {
  const { id } = req.params;
  const { personal_nombres, personal_apellidos, personal_email, personal_rol_id, personal_equipo_id } = req.body;
  db.query('UPDATE personal SET personal_nombres = ?, personal_apellidos = ?, personal_email = ?, personal_rol_id = ?, personal_equipo_id = ? WHERE personal_id = ?',
    [personal_nombres, personal_apellidos, personal_email, personal_rol_id, personal_equipo_id || null, id],
    (err) => { if (err) return res.status(500).json({ mensaje: 'Error al editar' }); res.json({ mensaje: 'Personal actualizado' }); });
};

const eliminarPersonal = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM personal WHERE personal_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ mensaje: 'Error al eliminar' });
    res.json({ mensaje: 'Personal eliminado' });
  });
};

module.exports = { obtenerPersonal, crearPersonal, editarPersonal, eliminarPersonal };
