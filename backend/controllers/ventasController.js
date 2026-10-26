const db = require('../config/db');
const fs = require('fs');

const obtenerVentas = (req, res) => {
  const { rol_id, equipo_id, id } = req.usuario;
  let filtroEquipo = '';
  let params = [];

  if ((rol_id === 2 || rol_id === 3) && equipo_id) {
    filtroEquipo = 'WHERE p.personal_equipo_id = ?';
    params = [equipo_id];
  } else if (rol_id === 4) {
    filtroEquipo = 'WHERE v.venta_asesor_id = ?';
    params = [id];
  }
  const sql = `
    SELECT v.*,
      CONCAT(t.titular_nombres, ' ', t.titular_apellidos) AS titular,
      t.titular_dni,
      CONCAT(p.personal_nombres, ' ', p.personal_apellidos) AS asesor,
      e.equipo_nombre AS equipo,
      c.campana_nombre AS campana,
      ta.tarifa_nombre AS tarifa,
      (SELECT COUNT(*) FROM comentarios_venta cv WHERE cv.comentario_venta_id = v.venta_id) AS total_comentarios,
      (SELECT COUNT(*) FROM comentarios_venta cv WHERE cv.comentario_venta_id = v.venta_id AND cv.comentario_leido = 0) AS comentarios_no_leidos
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
  let filtroEquipo = (rol_id === 2 || rol_id === 3) && equipo_id ? `AND p.personal_equipo_id = ${equipo_id}` : '';

  const sqlEstados = `SELECT v.venta_estado, COUNT(*) as total FROM ventas v JOIN personal p ON v.venta_asesor_id = p.personal_id WHERE 1=1 ${filtroEquipo} GROUP BY v.venta_estado`;
  const sqlCampanas = `SELECT c.campana_nombre, COUNT(*) as total FROM ventas v JOIN personal p ON v.venta_asesor_id = p.personal_id JOIN campanas c ON v.venta_campana_id = c.campana_id WHERE 1=1 ${filtroEquipo} GROUP BY c.campana_nombre`;
  const sqlEquipos = `SELECT COALESCE(e.equipo_nombre, 'Sin equipo') as equipo_nombre, COUNT(*) as total FROM ventas v JOIN personal p ON v.venta_asesor_id = p.personal_id LEFT JOIN equipos e ON p.personal_equipo_id = e.equipo_id WHERE 1=1 ${filtroEquipo} GROUP BY e.equipo_nombre`;
  const sqlAsesores = `SELECT CONCAT(p.personal_nombres, ' ', p.personal_apellidos) AS asesor, COUNT(*) as total, SUM(CASE WHEN v.venta_estado = 'ACTIVADO' THEN 1 ELSE 0 END) as activadas FROM ventas v JOIN personal p ON v.venta_asesor_id = p.personal_id WHERE 1=1 ${filtroEquipo} GROUP BY p.personal_id ORDER BY total DESC LIMIT 10`;
  const sqlBacks = `SELECT CONCAT(p.personal_nombres, ' ', p.personal_apellidos) AS back_nombre, COUNT(*) as total_gestionadas, SUM(CASE WHEN v.venta_estado = 'ACTIVADO' THEN 1 ELSE 0 END) as activadas, SUM(CASE WHEN v.venta_estado IN ('CANCELADO','BAJA','VERI KO') THEN 1 ELSE 0 END) as rechazadas, SUM(CASE WHEN v.venta_estado = 'PDT FIRMA' THEN 1 ELSE 0 END) as pendientes FROM ventas v JOIN personal p ON v.venta_back_id = p.personal_id WHERE v.venta_back_id IS NOT NULL GROUP BY p.personal_id ORDER BY total_gestionadas DESC`;

  Promise.all([
    new Promise((r, j) => db.query(sqlEstados, (e, res) => e ? j(e) : r(res))),
    new Promise((r, j) => db.query(sqlCampanas, (e, res) => e ? j(e) : r(res))),
    new Promise((r, j) => db.query(sqlEquipos, (e, res) => e ? j(e) : r(res))),
    new Promise((r, j) => db.query(sqlAsesores, (e, res) => e ? j(e) : r(res))),
    new Promise((r, j) => db.query(sqlBacks, (e, res) => e ? j(e) : r(res))),
  ]).then(([estados, campanas, equipos, asesores, backs]) => {
    res.json({ estados, campanas, equipos, asesores, backs });
  }).catch(() => res.status(500).json({ mensaje: 'Error al obtener estadísticas' }));
};

const TIPOS_DOCUMENTO = ['GRABACION', 'DNI', 'CONTRATO', 'FACTURA', 'OTRO'];

const crearVenta = (req, res) => {
  const { venta_titular_id, venta_campana_id, venta_tarifa_id, venta_fecha, venta_metodo_confirmacion, venta_codigo_sms, venta_estado, venta_observacion } = req.body;
  const venta_asesor_id = req.usuario.id;
  const nz = (v) => (v === '' || v === undefined ? null : v);
  const archivos = req.files || [];

  // Tipos de documento enviados por el frontend, en el mismo orden que los archivos
  let tipos = [];
  try { tipos = JSON.parse(req.body.documento_tipos || '[]'); } catch { tipos = []; }

  const borrarArchivosDeDisco = () => archivos.forEach(f => fs.unlink(f.path, () => {}));

  db.query('INSERT INTO ventas (venta_titular_id, venta_campana_id, venta_tarifa_id, venta_asesor_id, venta_fecha, venta_metodo_confirmacion, venta_codigo_sms, venta_estado, venta_observacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [venta_titular_id, venta_campana_id, nz(venta_tarifa_id), venta_asesor_id, venta_fecha, venta_metodo_confirmacion, nz(venta_codigo_sms), venta_estado, venta_observacion],
    (err, result) => {
      if (err) {
        borrarArchivosDeDisco();
        return res.status(500).json({ mensaje: 'Error al crear venta' });
      }
      const ventaId = result.insertId;
      if (archivos.length === 0) return res.json({ mensaje: 'Venta creada', id: ventaId });

      // Un solo INSERT para todos los documentos: o se guardan todos o ninguno
      const filas = archivos.map((f, i) => [
        ventaId, venta_titular_id, venta_asesor_id,
        TIPOS_DOCUMENTO.includes(tipos[i]) ? tipos[i] : 'OTRO',
        f.originalname, f.path
      ]);
      db.query('INSERT INTO documentos (documento_venta_id, documento_titular_id, documento_subido_por, documento_tipo, documento_nombre, documento_ruta) VALUES ?',
        [filas],
        (err2) => {
          if (err2) {
            // Si los archivos no se pudieron registrar, la venta tampoco queda guardada
            borrarArchivosDeDisco();
            db.query('DELETE FROM ventas WHERE venta_id = ?', [ventaId], () => {
              res.status(500).json({ mensaje: 'No se pudieron guardar los archivos, la venta no fue registrada' });
            });
            return;
          }
          res.json({ mensaje: 'Venta creada', id: ventaId, archivos: archivos.length });
        });
    });
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

const obtenerComentarios = (req, res) => {
  const { id } = req.params;
  const { rol_id, id: usuarioId } = req.usuario;
  const sql = `
    SELECT c.comentario_id, c.comentario_texto, c.comentario_creado_en,
      CONCAT(p.personal_nombres, ' ', p.personal_apellidos) AS autor
    FROM comentarios_venta c
    JOIN personal p ON c.comentario_personal_id = p.personal_id
    WHERE c.comentario_venta_id = ?
    ORDER BY c.comentario_creado_en DESC, c.comentario_id DESC
  `;
  const consultar = () => {
    db.query(sql, [id], (err, results) => {
      if (err) return res.status(500).json({ mensaje: 'Error al obtener comentarios' });
      res.json(results);
    });
  };

  // El asesor solo puede ver los comentarios de sus propias ventas
  if (rol_id === 4) {
    db.query('SELECT venta_id FROM ventas WHERE venta_id = ? AND venta_asesor_id = ?', [id, usuarioId], (err, rows) => {
      if (err) return res.status(500).json({ mensaje: 'Error al obtener comentarios' });
      if (rows.length === 0) return res.status(403).json({ mensaje: 'No tienes acceso a esta venta' });
      consultar();
    });
    return;
  }
  consultar();
};

const marcarComentariosLeidos = (req, res) => {
  // Solo el asesor dueño de la venta marca sus comentarios como leídos
  if (req.usuario.rol_id !== 4) return res.json({ mensaje: 'Sin cambios' });
  const { id } = req.params;
  db.query(
    `UPDATE comentarios_venta cv
     JOIN ventas v ON cv.comentario_venta_id = v.venta_id
     SET cv.comentario_leido = 1
     WHERE cv.comentario_venta_id = ? AND v.venta_asesor_id = ?`,
    [id, req.usuario.id],
    (err) => {
      if (err) return res.status(500).json({ mensaje: 'Error al marcar comentarios' });
      res.json({ mensaje: 'Comentarios marcados como leídos' });
    });
};

const crearComentario = (req, res) => {
  // Solo Jefe de Plataforma (1) y Back (3) pueden comentar; el asesor solo lee
  if (![1, 3].includes(req.usuario.rol_id)) return res.status(403).json({ mensaje: 'No tienes permiso para comentar' });
  const { id } = req.params;
  const texto = (req.body.comentario_texto || '').trim();
  if (!texto) return res.status(400).json({ mensaje: 'El comentario no puede estar vacío' });
  db.query('INSERT INTO comentarios_venta (comentario_venta_id, comentario_personal_id, comentario_texto) VALUES (?, ?, ?)',
    [id, req.usuario.id, texto.slice(0, 1000)],
    (err, result) => {
      if (err) return res.status(500).json({ mensaje: 'Error al guardar comentario' });
      res.json({ mensaje: 'Comentario agregado', id: result.insertId });
    });
};

module.exports = { obtenerVentas, obtenerEstadisticas, crearVenta, editarVenta, eliminarVenta, obtenerComentarios, crearComentario, marcarComentariosLeidos };