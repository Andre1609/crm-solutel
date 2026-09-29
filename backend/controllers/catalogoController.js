const db = require('../config/db');
const obtenerCampanas = (req, res) => { db.query('SELECT * FROM campanas WHERE campana_activa = 1', (err, r) => { if (err) return res.status(500).json({ mensaje: 'Error' }); res.json(r); }); };
const obtenerTarifas = (req, res) => { db.query('SELECT * FROM tarifas WHERE tarifa_activa = 1', (err, r) => { if (err) return res.status(500).json({ mensaje: 'Error' }); res.json(r); }); };
const obtenerRoles = (req, res) => { db.query('SELECT * FROM roles', (err, r) => { if (err) return res.status(500).json({ mensaje: 'Error' }); res.json(r); }); };
const obtenerEquipos = (req, res) => { db.query('SELECT * FROM equipos', (err, r) => { if (err) return res.status(500).json({ mensaje: 'Error' }); res.json(r); }); };
module.exports = { obtenerCampanas, obtenerTarifas, obtenerRoles, obtenerEquipos };
