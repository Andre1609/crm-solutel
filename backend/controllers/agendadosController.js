const db = require('../config/db');

const obtenerAgendados = (req, res) => {
  const sql = `
    SELECT a.*, CONCAT(c.nombres, ' ', c.apellidos) AS cliente, u.nombre AS usuario
    FROM agendados a
    JOIN clientes c ON a.cliente_id = c.id
    JOIN usuarios u ON a.usuario_id = u.id
    ORDER BY a.fecha_agendado ASC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error al obtener agendados' });
    res.json(results);
  });
};

const crearAgendado = (req, res) => {
  const { cliente_id, venta_id, fecha_agendado, motivo, observaciones } = req.body;
  const usuario_id = req.usuario.id;
  db.query(
    'INSERT INTO agendados (cliente_id, venta_id, usuario_id, fecha_agendado, motivo, observaciones) VALUES (?, ?, ?, ?, ?, ?)',
    [cliente_id, venta_id, usuario_id, fecha_agendado, motivo, observaciones],
    (err, result) => {
      if (err) return res.status(500).json({ mensaje: 'Error al agendar' });
      res.json({ mensaje: 'Agendado correctamente', id: result.insertId });
    }
  );
};

module.exports = { obtenerAgendados, crearAgendado };
