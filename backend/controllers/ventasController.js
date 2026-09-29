const db = require('../config/db');
const obtenerVentas = (req, res) => {
  const sql = `SELECT v.*, CONCAT(t.titular_nombres, ' ', t.titular_apellidos) AS titular, t.titular_dni,
    CONCAT(p.personal_nombres, ' ', p.personal_apellidos) AS asesor, c.campana_nombre AS campana, ta.tarifa_nombre AS tarifa
    FROM ventas v
    JOIN titulares t ON v.venta_titular_id = t.titular_id
    JOIN personal p ON v.venta_asesor_id = p.personal_id
    LEFT JOIN campanas c ON v.venta_campana_id = c.campana_id
    LEFT JOIN tarifas ta ON v.venta_tarifa_id = ta.tarifa_id
    ORDER BY v.venta_creado_en DESC`;
  db.query(sql, (err, results) => { if (err) return res.status(500).json({ mensaje: 'Error al obtener ventas' }); res.json(results); });
};
const crearVenta = (req, res) => {
  const { venta_titular_id, venta_campana_id, venta_tarifa_id, venta_fecha, venta_metodo_confirmacion, venta_codigo_sms, venta_estado, venta_observacion } = req.body;
  const venta_asesor_id = req.usuario.id;
  db.query('INSERT INTO ventas (venta_titular_id, venta_campana_id, venta_tarifa_id, venta_asesor_id, venta_fecha, venta_metodo_confirmacion, venta_codigo_sms, venta_estado, venta_observacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [venta_titular_id, venta_campana_id, venta_tarifa_id, venta_asesor_id, venta_fecha, venta_metodo_confirmacion, venta_codigo_sms, venta_estado, venta_observacion],
    (err, result) => { if (err) return res.status(500).json({ mensaje: 'Error al crear venta' }); res.json({ mensaje: 'Venta creada', id: result.insertId }); });
};
const actualizarEstado = (req, res) => {
  const { id } = req.params;
  const { venta_estado } = req.body;
  db.query('UPDATE ventas SET venta_estado = ? WHERE venta_id = ?', [venta_estado, id], (err) => { if (err) return res.status(500).json({ mensaje: 'Error al actualizar' }); res.json({ mensaje: 'Estado actualizado' }); });
};
module.exports = { obtenerVentas, crearVenta, actualizarEstado };
