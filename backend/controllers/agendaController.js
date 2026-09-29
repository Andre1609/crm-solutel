const db = require('../config/db');
const obtenerAgenda = (req, res) => {
  db.query(`SELECT a.*, CONCAT(t.titular_nombres, ' ', t.titular_apellidos) AS titular, CONCAT(p.personal_nombres, ' ', p.personal_apellidos) AS responsable
    FROM agenda a JOIN titulares t ON a.agenda_titular_id = t.titular_id JOIN personal p ON a.agenda_responsable_id = p.personal_id ORDER BY a.agenda_fecha ASC`,
    (err, results) => { if (err) return res.status(500).json({ mensaje: 'Error' }); res.json(results); });
};
const crearAgenda = (req, res) => {
  const { agenda_titular_id, agenda_venta_id, agenda_fecha, agenda_motivo, agenda_observacion } = req.body;
  const agenda_responsable_id = req.usuario.id;
  db.query('INSERT INTO agenda (agenda_titular_id, agenda_venta_id, agenda_responsable_id, agenda_fecha, agenda_motivo, agenda_observacion) VALUES (?, ?, ?, ?, ?, ?)',
    [agenda_titular_id, agenda_venta_id, agenda_responsable_id, agenda_fecha, agenda_motivo, agenda_observacion],
    (err, result) => { if (err) return res.status(500).json({ mensaje: 'Error' }); res.json({ mensaje: 'Agendado', id: result.insertId }); });
};
module.exports = { obtenerAgenda, crearAgenda };
