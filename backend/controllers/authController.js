const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const login = (req, res) => {
  const { email, password } = req.body;
  const sql = `SELECT p.*, r.rol_nombre, e.equipo_id as equipo_id_personal
    FROM personal p
    JOIN roles r ON p.personal_rol_id = r.rol_id
    LEFT JOIN equipos e ON p.personal_equipo_id = e.equipo_id
    WHERE (p.personal_email = ? OR p.personal_nombres = ?) AND p.personal_activo = 1`;
  db.query(sql, [email, email], async (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error en el servidor' });
    if (results.length === 0) return res.status(401).json({ mensaje: 'Usuario no encontrado' });
    const usuario = results[0];
    const passwordValida = await bcrypt.compare(password, usuario.personal_password);
    if (!passwordValida) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    const token = jwt.sign(
      {
        id: usuario.personal_id,
        nombre: usuario.personal_nombres,
        rol_id: usuario.personal_rol_id,
        rol_nombre: usuario.rol_nombre,
        equipo_id: usuario.equipo_id_personal
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      token,
      usuario: {
        id: usuario.personal_id,
        nombre: usuario.personal_nombres,
        rol_id: usuario.personal_rol_id,
        rol_nombre: usuario.rol_nombre,
        equipo_id: usuario.equipo_id_personal
      }
    });
  });
};

module.exports = { login };
