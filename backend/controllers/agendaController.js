const db = require('../config/db');

const obtenerAgenda = (req, res) => {
  const { rol_id, equipo_id, id } = req.usuario;

  let filtro = '';
  let params = [];

  if (rol_id === 4) {
    filtro = 'WHERE a.agenda_responsable_id = ?';
    params = [id];
  } else if (rol_id === 2 && equipo_id) {
  
    filtro = 'WHERE p.personal_equipo_id = ?';
    params = [equipo_id];
  }

  const sql = `
    SELECT a.*,
      CONCAT(t.titular_nombres, ' ', t.titular_apellidos) AS titular,
      CONCAT(p.personal_nombres, ' ', p.personal_apellidos) AS responsable,
      e.equipo_nombre AS equipo
    FROM agenda a
    JOIN titulares t ON a.agenda_titular_id = t.titular_id
    JOIN personal p ON a.agenda_responsable_id = p.personal_id
    LEFT JOIN equipos e ON p.personal_equipo_id = e.equipo_id
    ${filtro}
    ORDER BY a.agenda_fecha ASC
  `;
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error al obtener agenda' });
    res.json(results);
  });
};

const crearAgenda = (req, res) => {
  const { agenda_titular_id, agenda_venta_id, agenda_fecha, agenda_motivo, agenda_observacion } = req.body;
  const agenda_responsable_id = req.usuario.id;
  db.query(
    'INSERT INTO agenda (agenda_titular_id, agenda_venta_id, agenda_responsable_id, agenda_fecha, agenda_motivo, agenda_observacion) VALUES (?, ?, ?, ?, ?, ?)',
    [agenda_titular_id, agenda_venta_id || null, agenda_responsable_id, agenda_fecha, agenda_motivo, agenda_observacion],
    (err, result) => {
      if (err) return res.status(500).json({ mensaje: 'Error al agendar' });
      res.json({ mensaje: 'Agendado correctamente', id: result.insertId });
    }
  );
};

module.exports = { obtenerAgenda, crearAgenda };
