const db = require('../config/db');
const obtenerCampanas = (req, res) => { db.query('SELECT * FROM campanas WHERE campana_activa = 1', (err, r) => { if (err) return res.status(500).json({ mensaje: 'Error' }); res.json(r); }); };
const obtenerTarifas = (req, res) => { db.query('SELECT * FROM tarifas WHERE tarifa_activa = 1', (err, r) => { if (err) return res.status(500).json({ mensaje: 'Error' }); res.json(r); }); };
const obtenerRoles = (req, res) => { db.query('SELECT * FROM roles', (err, r) => { if (err) return res.status(500).json({ mensaje: 'Error' }); res.json(r); }); };
const obtenerEquipos = (req, res) => { db.query('SELECT * FROM equipos', (err, r) => { if (err) return res.status(500).json({ mensaje: 'Error' }); res.json(r); }); };

// ---- Administración de campañas (solo Jefe de Plataforma) ----
const esJefe = (req, res) => {
  if (req.usuario.rol_id === 1) return true;
  res.status(403).json({ mensaje: 'Solo el Jefe de Plataforma administra campañas y tarifas' });
  return false;
};

const obtenerCampanasAdmin = (req, res) => {
  if (!esJefe(req, res)) return;
  db.query(
    `SELECT c.*, (SELECT COUNT(*) FROM ventas v WHERE v.venta_campana_id = c.campana_id) AS total_ventas
     FROM campanas c ORDER BY c.campana_activa DESC, c.campana_nombre`,
    (err, r) => {
      if (err) return res.status(500).json({ mensaje: 'Error al obtener campañas' });
      res.json(r);
    });
};

const datosCatalogo = (req, res, prefijo, etiqueta) => {
  const nombre = (req.body[`${prefijo}_nombre`] || '').trim();
  const descripcion = (req.body[`${prefijo}_descripcion`] || '').trim() || null;
  if (!nombre) { res.status(400).json({ mensaje: `El nombre de la ${etiqueta} es obligatorio` }); return null; }
  if (nombre.length > 100) { res.status(400).json({ mensaje: 'El nombre no puede pasar de 100 caracteres' }); return null; }
  return { nombre, descripcion };
};
const datosCampana = (req, res) => datosCatalogo(req, res, 'campana', 'campaña');
const datosTarifa = (req, res) => datosCatalogo(req, res, 'tarifa', 'tarifa');

const crearCampana = (req, res) => {
  if (!esJefe(req, res)) return;
  const datos = datosCampana(req, res);
  if (!datos) return;
  db.query('SELECT campana_id FROM campanas WHERE LOWER(campana_nombre) = LOWER(?)', [datos.nombre], (err, rows) => {
    if (err) return res.status(500).json({ mensaje: 'Error al crear la campaña' });
    if (rows.length > 0) return res.status(409).json({ mensaje: 'Ya existe una campaña con ese nombre' });
    db.query('INSERT INTO campanas (campana_nombre, campana_descripcion) VALUES (?, ?)', [datos.nombre, datos.descripcion], (err2, result) => {
      if (err2) return res.status(500).json({ mensaje: 'Error al crear la campaña' });
      res.json({ mensaje: 'Campaña creada', id: result.insertId });
    });
  });
};

const editarCampana = (req, res) => {
  if (!esJefe(req, res)) return;
  const datos = datosCampana(req, res);
  if (!datos) return;
  const id = req.params.id;
  const activa = req.body.campana_activa ? 1 : 0;
  db.query('SELECT campana_id FROM campanas WHERE LOWER(campana_nombre) = LOWER(?) AND campana_id <> ?', [datos.nombre, id], (err, rows) => {
    if (err) return res.status(500).json({ mensaje: 'Error al editar la campaña' });
    if (rows.length > 0) return res.status(409).json({ mensaje: 'Ya existe otra campaña con ese nombre' });
    db.query('UPDATE campanas SET campana_nombre = ?, campana_descripcion = ?, campana_activa = ? WHERE campana_id = ?',
      [datos.nombre, datos.descripcion, activa, id],
      (err2, result) => {
        if (err2) return res.status(500).json({ mensaje: 'Error al editar la campaña' });
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Campaña no encontrada' });
        res.json({ mensaje: 'Campaña actualizada' });
      });
  });
};

// ---- Administración de tarifas (solo Jefe de Plataforma) ----
const obtenerTarifasAdmin = (req, res) => {
  if (!esJefe(req, res)) return;
  db.query(
    `SELECT t.*, (SELECT COUNT(*) FROM ventas v WHERE v.venta_tarifa_id = t.tarifa_id) AS total_ventas
     FROM tarifas t ORDER BY t.tarifa_activa DESC, t.tarifa_nombre`,
    (err, r) => {
      if (err) return res.status(500).json({ mensaje: 'Error al obtener tarifas' });
      res.json(r);
    });
};

const crearTarifa = (req, res) => {
  if (!esJefe(req, res)) return;
  const datos = datosTarifa(req, res);
  if (!datos) return;
  db.query('SELECT tarifa_id FROM tarifas WHERE LOWER(tarifa_nombre) = LOWER(?)', [datos.nombre], (err, rows) => {
    if (err) return res.status(500).json({ mensaje: 'Error al crear la tarifa' });
    if (rows.length > 0) return res.status(409).json({ mensaje: 'Ya existe una tarifa con ese nombre' });
    db.query('INSERT INTO tarifas (tarifa_nombre, tarifa_descripcion) VALUES (?, ?)', [datos.nombre, datos.descripcion], (err2, result) => {
      if (err2) return res.status(500).json({ mensaje: 'Error al crear la tarifa' });
      res.json({ mensaje: 'Tarifa creada', id: result.insertId });
    });
  });
};

const editarTarifa = (req, res) => {
  if (!esJefe(req, res)) return;
  const datos = datosTarifa(req, res);
  if (!datos) return;
  const id = req.params.id;
  const activa = req.body.tarifa_activa ? 1 : 0;
  db.query('SELECT tarifa_id FROM tarifas WHERE LOWER(tarifa_nombre) = LOWER(?) AND tarifa_id <> ?', [datos.nombre, id], (err, rows) => {
    if (err) return res.status(500).json({ mensaje: 'Error al editar la tarifa' });
    if (rows.length > 0) return res.status(409).json({ mensaje: 'Ya existe otra tarifa con ese nombre' });
    db.query('UPDATE tarifas SET tarifa_nombre = ?, tarifa_descripcion = ?, tarifa_activa = ? WHERE tarifa_id = ?',
      [datos.nombre, datos.descripcion, activa, id],
      (err2, result) => {
        if (err2) return res.status(500).json({ mensaje: 'Error al editar la tarifa' });
        if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Tarifa no encontrada' });
        res.json({ mensaje: 'Tarifa actualizada' });
      });
  });
};

module.exports = { obtenerCampanas, obtenerTarifas, obtenerRoles, obtenerEquipos, obtenerCampanasAdmin, crearCampana, editarCampana, obtenerTarifasAdmin, crearTarifa, editarTarifa };
