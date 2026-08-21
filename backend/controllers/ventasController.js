const db = require('../config/db');

const obtenerVentas = (req, res) => {
  const sql = `
    SELECT v.*, CONCAT(c.nombres, ' ', c.apellidos) AS cliente,
      c.dni, u.nombre AS usuario, p.nombre AS plan
    FROM ventas v
    JOIN clientes c ON v.cliente_id = c.id
    JOIN usuarios u ON v.usuario_id = u.id
    LEFT JOIN planes p ON v.plan_id = p.id
    ORDER BY v.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error al obtener ventas' });
    res.json(results);
  });
};

const crearVenta = (req, res) => {
  const { cliente_id, plan_id, fecha_venta, metodo_confirmacion, grabacion, codigo_seguridad, estado_venta, observacion_backoffice } = req.body;
  const usuario_id = req.usuario.id;
  const sql = `INSERT INTO ventas (cliente_id, plan_id, usuario_id, fecha_venta, metodo_confirmacion, grabacion, codigo_seguridad, estado_venta, observacion_backoffice)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [cliente_id, plan_id, usuario_id, fecha_venta, metodo_confirmacion, grabacion, codigo_seguridad, estado_venta, observacion_backoffice], (err, result) => {
    if (err) return res.status(500).json({ mensaje: 'Error al crear venta' });
    res.json({ mensaje: 'Venta creada correctamente', id: result.insertId });
  });
};

const actualizarEstado = (req, res) => {
  const { id } = req.params;
  const { estado_venta } = req.body;
  db.query('UPDATE ventas SET estado_venta = ? WHERE id = ?', [estado_venta, id], (err) => {
    if (err) return res.status(500).json({ mensaje: 'Error al actualizar' });
    res.json({ mensaje: 'Estado actualizado correctamente' });
  });
};

module.exports = { obtenerVentas, crearVenta, actualizarEstado };
