const db = require('../config/db');
const obtenerTitulares = (req, res) => {
  db.query('SELECT * FROM titulares ORDER BY titular_creado_en DESC', (err, results) => { if (err) return res.status(500).json({ mensaje: 'Error' }); res.json(results); });
};
// Documento sin espacios, guiones ni puntos y en mayúsculas
const normalizarDocumento = (valor) => String(valor || '').toUpperCase().replace(/[\s.\-]/g, '');
const SQL_DOCUMENTO = "UPPER(REPLACE(REPLACE(REPLACE(titular_dni, ' ', ''), '-', ''), '.', ''))";
const TIPOS_DOCUMENTO = ['NIF', 'NIE', 'PASAPORTE'];

const buscarPorDni = (req, res) => {
  db.query(`SELECT * FROM titulares WHERE ${SQL_DOCUMENTO} = ?`, [normalizarDocumento(req.params.dni)], (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error' });
    if (results.length === 0) return res.status(404).json({ mensaje: 'No encontrado' });
    res.json(results[0]);
  });
};
const buscarPorId = (req, res) => {
  db.query('SELECT * FROM titulares WHERE titular_id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error' });
    if (results.length === 0) return res.status(404).json({ mensaje: 'No encontrado' });
    res.json(results[0]);
  });
};
const crearTitular = (req, res) => {
  const { titular_nombres, titular_apellidos, titular_nacionalidad, titular_fecha_nacimiento, titular_edad, titular_telefono_fijo, titular_telefono_movil, titular_correo, titular_banco, titular_iban } = req.body;
  const titular_dni = normalizarDocumento(req.body.titular_dni);
  const tipo = TIPOS_DOCUMENTO.includes(req.body.titular_tipo_documento) ? req.body.titular_tipo_documento : null;
  if (!titular_dni) return res.status(400).json({ mensaje: 'El número de identidad es obligatorio' });

  db.query(`SELECT titular_id FROM titulares WHERE ${SQL_DOCUMENTO} = ?`, [titular_dni], (err, rows) => {
    if (err) return res.status(500).json({ mensaje: 'Error al crear titular' });
    if (rows.length > 0) return res.status(409).json({ mensaje: 'Ya existe un titular con ese número de identidad' });
    db.query('INSERT INTO titulares (titular_tipo_documento, titular_dni, titular_nombres, titular_apellidos, titular_nacionalidad, titular_fecha_nacimiento, titular_edad, titular_telefono_fijo, titular_telefono_movil, titular_correo, titular_banco, titular_iban) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tipo, titular_dni, titular_nombres, titular_apellidos, titular_nacionalidad, titular_fecha_nacimiento || null, titular_edad || null, titular_telefono_fijo, titular_telefono_movil, titular_correo, titular_banco, titular_iban],
      (err2, result) => {
        if (err2) return res.status(500).json({ mensaje: 'Error al crear titular' });
        res.json({ mensaje: 'Titular creado', id: result.insertId });
      });
  });
};
// Actualiza los datos de un titular existente (el número de identidad no se cambia aquí)
const editarTitular = (req, res) => {
  if (![1, 4].includes(req.usuario.rol_id)) return res.status(403).json({ mensaje: 'No tienes permiso para editar titulares' });
  const { titular_nombres, titular_apellidos, titular_nacionalidad, titular_fecha_nacimiento, titular_edad, titular_telefono_fijo, titular_telefono_movil, titular_correo, titular_banco, titular_iban } = req.body;
  const tipo = TIPOS_DOCUMENTO.includes(req.body.titular_tipo_documento) ? req.body.titular_tipo_documento : null;
  db.query('UPDATE titulares SET titular_tipo_documento = ?, titular_nombres = ?, titular_apellidos = ?, titular_nacionalidad = ?, titular_fecha_nacimiento = ?, titular_edad = ?, titular_telefono_fijo = ?, titular_telefono_movil = ?, titular_correo = ?, titular_banco = ?, titular_iban = ? WHERE titular_id = ?',
    [tipo, titular_nombres, titular_apellidos, titular_nacionalidad, titular_fecha_nacimiento || null, titular_edad || null, titular_telefono_fijo, titular_telefono_movil, titular_correo, titular_banco, titular_iban, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ mensaje: 'Error al actualizar el titular' });
      if (result.affectedRows === 0) return res.status(404).json({ mensaje: 'Titular no encontrado' });
      res.json({ mensaje: 'Titular actualizado' });
    });
};

module.exports = { obtenerTitulares, buscarPorDni, buscarPorId, crearTitular, editarTitular };
