const db = require('../config/db');
const multer = require('multer');
const storage = multer.diskStorage({ destination: (req, file, cb) => cb(null, 'uploads/'), filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname) });
const upload = multer({ storage });
const obtenerDocumentos = (req, res) => {
  db.query('SELECT * FROM documentos ORDER BY documento_subido_en DESC', (err, results) => { if (err) return res.status(500).json({ mensaje: 'Error' }); res.json(results); });
};
const subirDocumento = (req, res) => {
  const { documento_tipo, documento_venta_id, documento_titular_id } = req.body;
  const documento_subido_por = req.usuario.id;
  db.query('INSERT INTO documentos (documento_venta_id, documento_titular_id, documento_subido_por, documento_tipo, documento_nombre, documento_ruta) VALUES (?, ?, ?, ?, ?, ?)',
    [documento_venta_id, documento_titular_id, documento_subido_por, documento_tipo, req.file.originalname, req.file.path],
    (err, result) => { if (err) return res.status(500).json({ mensaje: 'Error al guardar' }); res.json({ mensaje: 'Documento subido', id: result.insertId }); });
};
module.exports = { upload, obtenerDocumentos, subirDocumento };
