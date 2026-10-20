const db = require('../config/db');

const obtenerVentas = (req, res) => {
  const { rol_id, equipo_id } = req.usuario;
  
 
  let filtroEquipo = '';
  let params = [];
  if (rol_id === 2 && equipo_id) {
    filtroEquipo = 'WHERE p.personal_equipo_id = ?';
    params = [equipo_id];
  }

  const sql = `
    SELECT v.*,
      CONCAT(t.titular_nombres, ' ', t.titular_apellidos) AS titular,
      t.titular_dni,
      CONCAT(p.personal_nombres, ' ', p.personal_apellidos) AS asesor,
      e.equipo_nombre AS equipo,
      c.campana_nombre AS campana,
      ta.tarifa_nombre AS tarifa
    FROM ventas v
    JOIN titulares t ON v.venta_titular_id = t.titular_id
    JOIN personal p ON v.venta_asesor_id = p.personal_id
    LEFT JOIN equipos e ON p.personal_equipo_id = e.equipo_id
    LEFT JOIN campanas c ON v.venta_campana_id = c.campana_id
    LEFT JOIN tarifas ta ON v.venta_tarifa_id = ta.tarifa_id
    ${filtroEquipo}
    ORDER BY v.venta_creado_en DESC
  `;
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error al obtener ventas' });
    res.json(results);
  });
};

const obtenerEstadisticas = (req, res) => {
  const { rol_id, equipo_id } = req.usuario;
  
  let filtroEquipo = rol_id === 2 && equipo_id ? `AND p.personal_equipo_id = ${equipo_id}` : '';

  const sqlEstados = `
    SELECT v.venta_estado, COUNT(*) as total
    FROM ventas v
    JOIN personal p ON v.venta_asesor_id = p.personal_id
    WHERE 1=1 ${filtroEquipo}
    GROUP BY v.venta_estado
  `;

  const sqlCampanas = `
    SELECT c.campana_nombre, COUNT(*) as total
    FROM ventas v
    JOIN personal p ON v.venta_asesor_id = p.personal_id
    JOIN campanas c ON v.venta_campana_id = c.campana_id
    WHERE 1=1 ${filtroEquipo}
    GROUP BY c.campana_nombre
  `;

  const sqlEquipos = `
    SELECT e.equipo_nombre, COUNT(*) as total
    FROM ventas v
    JOIN personal p ON v.venta_asesor_id = p.personal_id
    LEFT JOIN equipos e ON p.personal_equipo_id = e.equipo_id
    WHERE 1=1 ${filtroEquipo}
    GROUP BY e.equipo_nombre
  `;

  const sqlAsesores = `
    SELECT CONCAT(p.personal_nombres, ' ', p.personal_apellidos) AS asesor, 
      COUNT(*) as total,
      SUM(CASE WHEN v.venta_estado = 'ACTIVADO' THEN 1 ELSE 0 END) as activadas
    FROM ventas v
    JOIN personal p ON v.venta_asesor_id = p.personal_id
    WHERE 1=1 ${filtroEquipo}
    GROUP BY p.personal_id
    ORDER BY total DESC
    LIMIT 10
  `;

  Promise.all([
    new Promise((resolve, reject) => db.query(sqlEstados, (err, r) => err ? reject(err) : resolve(r))),
    new Promise((resolve, reject) => db.query(sqlCampanas, (err, r) => err ? reject(err) : resolve(r))),
    new Promise((resolve, reject) => db.query(sqlEquipos, (err, r) => err ? reject(err) : resolve(r))),
    new Promise((resolve, reject) => db.query(sqlAsesores, (err, r) => err ? reject(err) : resolve(r))),
  ]).then(([estados, campanas, equipos, asesores]) => {
    res.json({ estados, campanas, equipos, asesores });
  }).catch(() => res.status(500).json({ mensaje: 'Error al obtener estadísticas' }));
};

const crearVenta = (req, res) => {
  const { venta_titular_id, venta_campana_id, venta_tarifa_id, venta_fecha, venta_metodo_confirmacion, venta_codigo_sms, venta_estado, venta_observacion } = req.body;
  const venta_asesor_id = req.usuario.id;
  db.query('INSERT INTO ventas (venta_titular_id, venta_campana_id, venta_tarifa_id, venta_asesor_id, venta_fecha, venta_metodo_confirmacion, venta_codigo_sms, venta_estado, venta_observacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [venta_titular_id, venta_campana_id, venta_tarifa_id, venta_asesor_id, venta_fecha, venta_metodo_confirmacion, venta_codigo_sms, venta_estado, venta_observacion],
    (err, result) => { if (err) return res.status(500).json({ mensaje: 'Error al crear venta' }); res.json({ mensaje: 'Venta creada', id: result.insertId }); });
};

const editarVenta = (req, res) => {
  const { id } = req.params;
  const { venta_estado, venta_campana_id, venta_tarifa_id, venta_observacion, venta_fecha } = req.body;
  db.query('UPDATE ventas SET venta_estado = ?, venta_campana_id = ?, venta_tarifa_id = ?, venta_observacion = ?, venta_fecha = ? WHERE venta_id = ?',
    [venta_estado, venta_campana_id, venta_tarifa_id, venta_observacion, venta_fecha, id],
    (err) => { if (err) return res.status(500).json({ mensaje: 'Error al editar' }); res.json({ mensaje: 'Venta actualizada' }); });
};

const eliminarVenta = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM ventas WHERE venta_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ mensaje: 'Error al eliminar' });
    res.json({ mensaje: 'Venta eliminada' });
  });
};

module.exports = { obtenerVentas, obtenerEstadisticas, crearVenta, editarVenta, eliminarVenta };