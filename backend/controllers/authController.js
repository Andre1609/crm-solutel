const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const login = (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM personal WHERE (personal_email = ? OR personal_nombres = ?) AND personal_activo = 1', [email, email], async (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error en el servidor' });
    if (results.length === 0) return res.status(401).json({ mensaje: 'Usuario no encontrado' });
    const usuario = results[0];
    const passwordValida = await bcrypt.compare(password, usuario.personal_password);
    if (!passwordValida) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    const token = jwt.sign({ id: usuario.personal_id, nombre: usuario.personal_nombres, rol_id: usuario.personal_rol_id }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, usuario: { id: usuario.personal_id, nombre: usuario.personal_nombres, rol_id: usuario.personal_rol_id } });
  });
};
module.exports = { login };
