const db = require('../config/db');
const bcrypt = require('bcryptjs');

const obtenerUsuarios = (req, res) => {
  db.query('SELECT id, nombre, email, rol, activo, created_at FROM usuarios', (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error al obtener usuarios' });
    res.json(results);
  });
};

const crearUsuario = async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  const hash = await bcrypt.hash(password, 10);
  db.query(
    'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
    [nombre, email, hash, rol],
    (err, result) => {
      if (err) return res.status(500).json({ mensaje: 'Error al crear usuario' });
      res.json({ mensaje: 'Usuario creado', id: result.insertId });
    }
  );
};

module.exports = { obtenerUsuarios, crearUsuario };
