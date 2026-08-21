const db = require('../config/db');

const obtenerClientes = (req, res) => {
  db.query('SELECT * FROM clientes ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error al obtener clientes' });
    res.json(results);
  });
};

const buscarPorDni = (req, res) => {
  const { dni } = req.params;
  db.query('SELECT * FROM clientes WHERE dni = ?', [dni], (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error al buscar cliente' });
    if (results.length === 0) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.json(results[0]);
  });
};

const crearCliente = (req, res) => {
  const { nombres, apellidos, dni, nacionalidad, fecha_nacimiento, edad, telefono_fijo, telefono_movil, correo_electronico, entidad_bancaria, numero_cuenta } = req.body;
  const sql = `INSERT INTO clientes (nombres, apellidos, dni, nacionalidad, fecha_nacimiento, edad, telefono_fijo, telefono_movil, correo_electronico, entidad_bancaria, numero_cuenta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [nombres, apellidos, dni, nacionalidad, fecha_nacimiento, edad, telefono_fijo, telefono_movil, correo_electronico, entidad_bancaria, numero_cuenta], (err, result) => {
    if (err) return res.status(500).json({ mensaje: 'Error al crear cliente' });
    res.json({ mensaje: 'Cliente creado', id: result.insertId });
  });
};

module.exports = { obtenerClientes, buscarPorDni, crearCliente };
