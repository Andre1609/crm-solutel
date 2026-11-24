const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const BASE_VENTAS = `
  SELECT v.*,
    CONCAT(t.titular_nombres, ' ', t.titular_apellidos) AS titular,
    t.titular_dni,
    CONCAT(p.personal_nombres, ' ', p.personal_apellidos) AS asesor,
    e.equipo_nombre AS equipo,
    c.campana_nombre AS campana,
    ta.tarifa_nombre AS tarifa,
    (SELECT COUNT(*) FROM comentarios_venta cv WHERE cv.comentario_venta_id = v.venta_id) AS total_comentarios,
    (SELECT COUNT(*) FROM comentarios_venta cv WHERE cv.comentario_venta_id = v.venta_id AND cv.comentario_leido = 0) AS comentarios_no_leidos,
    (SELECT COUNT(*) FROM documentos d WHERE d.documento_venta_id = v.venta_id) AS total_archivos,
    DATE_FORMAT(v.venta_fecha, '%Y-%m-%d') AS fecha_venta,
    DATE_FORMAT(v.venta_fecha_activacion, '%Y-%m-%d') AS fecha_activacion,
    DATE_FORMAT(v.venta_fecha_baja, '%Y-%m-%d') AS fecha_baja
  FROM ventas v
  JOIN titulares t ON v.venta_titular_id = t.titular_id
  JOIN personal p ON v.venta_asesor_id = p.personal_id
  LEFT JOIN equipos e ON p.personal_equipo_id = e.equipo_id
  LEFT JOIN campanas c ON v.venta_campana_id = c.campana_id
  LEFT JOIN tarifas ta ON v.venta_tarifa_id = ta.tarifa_id
`;

const obtenerVentas = (req, res) => {
  const { rol_id, equipo_id, id } = req.usuario;
  const condiciones = [];
  const params = [];

  if ((rol_id === 2 || rol_id === 3) && equipo_id) {
    condiciones.push('p.personal_equipo_id = ?');
    params.push(equipo_id);
  } else if (rol_id === 4) {
    condiciones.push('v.venta_asesor_id = ?');
    params.push(id);
  }
  // Solo el asesor ve sus cargas pendientes o canceladas; el resto ve únicamente las ya cargadas
  if (rol_id !== 4) condiciones.push("v.venta_revision = 'CARGADA'");

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  db.query(`${BASE_VENTAS} ${where} ORDER BY v.venta_creado_en DESC`, params, (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error al obtener ventas' });
    res.json(results);
  });
};

// Cargas pendientes de revisión (solo Back, de su equipo)
const obtenerCargas = (req, res) => {
  const { rol_id, equipo_id } = req.usuario;
  if (rol_id !== 3) return res.status(403).json({ mensaje: 'No tienes acceso a las cargas' });
  const condiciones = ["v.venta_revision = 'PENDIENTE'"];
  const params = [];
  if (equipo_id) { condiciones.push('p.personal_equipo_id = ?'); params.push(equipo_id); }
  db.query(`${BASE_VENTAS} WHERE ${condiciones.join(' AND ')} ORDER BY v.venta_creado_en ASC`, params, (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error al obtener cargas' });
    res.json(results);
  });
};

const obtenerDocumentosVenta = (req, res) => {
  const { rol_id, equipo_id } = req.usuario;
  if (rol_id !== 3) return res.status(403).json({ mensaje: 'No tienes acceso a estos archivos' });
  const params = [req.params.id];
  let filtro = '';
  if (equipo_id) { filtro = 'AND p.personal_equipo_id = ?'; params.push(equipo_id); }
  db.query(
    `SELECT d.documento_id, d.documento_tipo, d.documento_nombre, d.documento_ruta, d.documento_subido_en
     FROM documentos d
     JOIN ventas v ON d.documento_venta_id = v.venta_id
     JOIN personal p ON v.venta_asesor_id = p.personal_id
     WHERE d.documento_venta_id = ? ${filtro}
     ORDER BY d.documento_subido_en`,
    params,
    (err, results) => {
      if (err) return res.status(500).json({ mensaje: 'Error al obtener archivos' });
      res.json(results);
    });
};

// El Back sube archivos a la venta de un cliente de su equipo
const subirDocumentosVenta = (req, res) => {
  const archivos = req.files || [];
  const borrarArchivosDeDisco = () => archivos.forEach(f => fs.unlink(f.path, () => {}));
  if (archivos.length === 0) return res.status(400).json({ mensaje: 'Selecciona al menos un archivo' });

  const { equipo_id, id: backId } = req.usuario;
  const ventaId = req.params.id;
  const params = [ventaId];
  let filtro = '';
  if (equipo_id) { filtro = 'AND p.personal_equipo_id = ?'; params.push(equipo_id); }
  let tipos = [];
  try { tipos = JSON.parse(req.body.documento_tipos || '[]'); } catch { tipos = []; }

  db.query(
    `SELECT v.venta_titular_id FROM ventas v JOIN personal p ON v.venta_asesor_id = p.personal_id
     WHERE v.venta_id = ? ${filtro}`,
    params,
    (err, rows) => {
      if (err) { borrarArchivosDeDisco(); return res.status(500).json({ mensaje: 'Error al buscar la venta' }); }
      if (rows.length === 0) { borrarArchivosDeDisco(); return res.status(404).json({ mensaje: 'Venta no encontrada' }); }
      const filas = archivos.map((f, i) => [
        ventaId, rows[0].venta_titular_id, backId,
        TIPOS_DOCUMENTO.includes(tipos[i]) ? tipos[i] : 'OTRO',
        Buffer.from(f.originalname, 'latin1').toString('utf8'), f.path
      ]);
      db.query('INSERT INTO documentos (documento_venta_id, documento_titular_id, documento_subido_por, documento_tipo, documento_nombre, documento_ruta) VALUES ?',
        [filas],
        (err2) => {
          if (err2) { borrarArchivosDeDisco(); return res.status(500).json({ mensaje: 'No se pudieron guardar los archivos' }); }
          res.json({ mensaje: 'Archivos subidos', archivos: archivos.length });
        });
    });
};

// Descarga un archivo subido por el asesor (solo Back, de su equipo)
const descargarDocumento = (req, res) => {
  const { rol_id, equipo_id } = req.usuario;
  if (rol_id !== 3) return res.status(403).json({ mensaje: 'No tienes acceso a este archivo' });
  const params = [req.params.docId, req.params.id];
  let filtro = '';
  if (equipo_id) { filtro = 'AND p.personal_equipo_id = ?'; params.push(equipo_id); }
  db.query(
    `SELECT d.documento_nombre, d.documento_ruta
     FROM documentos d
     JOIN ventas v ON d.documento_venta_id = v.venta_id
     JOIN personal p ON v.venta_asesor_id = p.personal_id
     WHERE d.documento_id = ? AND d.documento_venta_id = ? ${filtro}`,
    params,
    (err, rows) => {
      if (err) return res.status(500).json({ mensaje: 'Error al buscar el archivo' });
      if (rows.length === 0) return res.status(404).json({ mensaje: 'Archivo no encontrado' });
      const ruta = rows[0].documento_ruta.replace(/\\/g, '/');
      const candidatos = [path.join(__dirname, '..', ruta), path.resolve(process.cwd(), ruta)];
      const fisico = candidatos.find(f => fs.existsSync(f));
      if (!fisico) return res.status(404).json({ mensaje: 'El archivo no se encuentra en el servidor' });
      res.download(fisico, rows[0].documento_nombre, (e) => {
        if (e && !res.headersSent) res.status(500).json({ mensaje: 'No se pudo descargar el archivo' });
      });
    });
};

// El Back marca la carga como cargada (todo correcto) o la cancela
const revisarCarga = (req, res) => {
  const { rol_id, equipo_id, id: backId } = req.usuario;
  if (rol_id !== 3) return res.status(403).json({ mensaje: 'No tienes permiso para revisar cargas' });
  const { id } = req.params;
  const { accion } = req.body;
  const motivo = (req.body.motivo || '').trim().slice(0, 900);
  if (!['CARGAR', 'CANCELAR'].includes(accion)) return res.status(400).json({ mensaje: 'Acción no válida' });

  const nuevo = accion === 'CARGAR' ? 'CARGADA' : 'CANCELADA';
  const params = [nuevo, backId, id];
  let filtro = '';
  if (equipo_id) { filtro = 'AND a.personal_equipo_id = ?'; params.push(equipo_id); }

  db.query(
    `UPDATE ventas v JOIN personal a ON v.venta_asesor_id = a.personal_id
     SET v.venta_revision = ?, v.venta_back_id = ?, v.venta_revisada_en = NOW()
     WHERE v.venta_id = ? AND v.venta_revision = 'PENDIENTE' ${filtro}`,
    params,
    (err, result) => {
      if (err) return res.status(500).json({ mensaje: 'Error al revisar la carga' });
      if (result.affectedRows === 0) return res.status(409).json({ mensaje: 'Esta carga ya fue revisada o no pertenece a tu equipo' });
      if (nuevo === 'CANCELADA' && motivo) {
        // El motivo le llega al asesor como comentario
        db.query('INSERT INTO comentarios_venta (comentario_venta_id, comentario_personal_id, comentario_texto) VALUES (?, ?, ?)',
          [id, backId, `Carga cancelada: ${motivo}`],
          () => res.json({ mensaje: 'Carga cancelada' }));
        return;
      }
      res.json({ mensaje: nuevo === 'CARGADA' ? 'Venta cargada' : 'Carga cancelada' });
    });
};

const obtenerEstadisticas = (req, res) => {
  const { rol_id, equipo_id } = req.usuario;
  let filtroEquipo = "AND v.venta_revision = 'CARGADA' " + ((rol_id === 2 || rol_id === 3) && equipo_id ? `AND p.personal_equipo_id = ${equipo_id}` : '');

  const sqlEstados = `SELECT v.venta_estado, COUNT(*) as total FROM ventas v JOIN personal p ON v.venta_asesor_id = p.personal_id WHERE 1=1 ${filtroEquipo} GROUP BY v.venta_estado`;
  const sqlCampanas = `SELECT c.campana_nombre, COUNT(*) as total FROM ventas v JOIN personal p ON v.venta_asesor_id = p.personal_id JOIN campanas c ON v.venta_campana_id = c.campana_id WHERE 1=1 ${filtroEquipo} GROUP BY c.campana_nombre`;
  const sqlEquipos = `SELECT COALESCE(e.equipo_nombre, 'Sin equipo') as equipo_nombre, COUNT(*) as total FROM ventas v JOIN personal p ON v.venta_asesor_id = p.personal_id LEFT JOIN equipos e ON p.personal_equipo_id = e.equipo_id WHERE 1=1 ${filtroEquipo} GROUP BY e.equipo_nombre`;
  const sqlAsesores = `SELECT CONCAT(p.personal_nombres, ' ', p.personal_apellidos) AS asesor, COUNT(*) as total, SUM(CASE WHEN v.venta_estado = 'ACTIVADO' THEN 1 ELSE 0 END) as activadas FROM ventas v JOIN personal p ON v.venta_asesor_id = p.personal_id WHERE 1=1 ${filtroEquipo} GROUP BY p.personal_id ORDER BY total DESC LIMIT 10`;
  const sqlBacks = `SELECT CONCAT(p.personal_nombres, ' ', p.personal_apellidos) AS back_nombre, COUNT(*) as total_gestionadas, SUM(CASE WHEN v.venta_estado = 'ACTIVADO' THEN 1 ELSE 0 END) as activadas, SUM(CASE WHEN v.venta_estado IN ('CANCELADO','BAJA','VERI KO') THEN 1 ELSE 0 END) as rechazadas, SUM(CASE WHEN v.venta_estado = 'PDT FIRMA' THEN 1 ELSE 0 END) as pendientes FROM ventas v JOIN personal p ON v.venta_back_id = p.personal_id WHERE v.venta_back_id IS NOT NULL AND v.venta_revision = 'CARGADA' GROUP BY p.personal_id ORDER BY total_gestionadas DESC`;

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
  // Lo que carga un asesor queda pendiente hasta que el Back lo revise
  const revision = 'PENDIENTE';

  // Tipos de documento enviados por el frontend, en el mismo orden que los archivos
  let tipos = [];
  try { tipos = JSON.parse(req.body.documento_tipos || '[]'); } catch { tipos = []; }

  const borrarArchivosDeDisco = () => archivos.forEach(f => fs.unlink(f.path, () => {}));

  db.query('INSERT INTO ventas (venta_titular_id, venta_campana_id, venta_tarifa_id, venta_asesor_id, venta_fecha, venta_metodo_confirmacion, venta_codigo_sms, venta_estado, venta_observacion, venta_revision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [venta_titular_id, venta_campana_id, nz(venta_tarifa_id), venta_asesor_id, venta_fecha, venta_metodo_confirmacion, nz(venta_codigo_sms), venta_estado, venta_observacion, revision],
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
        Buffer.from(f.originalname, 'latin1').toString('utf8'), f.path
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
  // Solo el Jefe de Plataforma (1) y el Back (3) pueden modificar ventas
  if (![1, 3].includes(req.usuario.rol_id)) return res.status(403).json({ mensaje: 'No tienes permiso para editar ventas' });
  const { id } = req.params;
  const { venta_estado, venta_campana_id, venta_tarifa_id, venta_observacion, venta_fecha } = req.body;

  db.query('SELECT venta_estado FROM ventas WHERE venta_id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ mensaje: 'Error al editar' });
    if (rows.length === 0) return res.status(404).json({ mensaje: 'Venta no encontrada' });
    const anterior = rows[0].venta_estado;

    // El Back (rol 3) solo puede dar de baja una venta ya activada
    if (req.usuario.rol_id === 3 && anterior === 'ACTIVADO' && !['ACTIVADO', 'BAJA'].includes(venta_estado)) {
      return res.status(403).json({ mensaje: 'Una venta activada solo puede darse de baja' });
    }

    // Fechas automáticas: se registra el día en que cambia el estado
    let fechas = '';
    if (venta_estado === 'ACTIVADO' && anterior !== 'ACTIVADO') {
      fechas = ', venta_fecha_activacion = CURDATE(), venta_fecha_baja = NULL';
    } else if (venta_estado === 'BAJA' && anterior !== 'BAJA') {
      fechas = ', venta_fecha_baja = CURDATE()';
    }

    db.query(`UPDATE ventas SET venta_estado = ?, venta_campana_id = ?, venta_tarifa_id = ?, venta_observacion = ?, venta_fecha = ?${fechas} WHERE venta_id = ?`,
      [venta_estado, venta_campana_id, venta_tarifa_id, venta_observacion, venta_fecha, id],
      (err2) => {
        if (err2) return res.status(500).json({ mensaje: 'Error al editar' });
        res.json({ mensaje: 'Venta actualizada' });
      });
  });
};

const eliminarVenta = (req, res) => {
  // Solo el Jefe de Plataforma (1) puede eliminar ventas
  if (req.usuario.rol_id !== 1) return res.status(403).json({ mensaje: 'No tienes permiso para eliminar ventas' });
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

module.exports = { obtenerVentas, obtenerEstadisticas, crearVenta, editarVenta, eliminarVenta, obtenerComentarios, crearComentario, marcarComentariosLeidos, obtenerCargas, obtenerDocumentosVenta, subirDocumentosVenta, descargarDocumento, revisarCarga };