const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

const obtenerDocumentos = (req, res) => {
  db.query('SELECT * FROM documentos ORDER BY documento_subido_en DESC', (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error al obtener documentos' });
    res.json(results);
  });
};

const subirDocumento = (req, res) => {
  const { documento_tipo, documento_venta_id, documento_titular_id } = req.body;
  const documento_subido_por = req.usuario.id;
  const documento_nombre = req.file.originalname;
  const documento_ruta = req.file.path;

  db.query(
    'INSERT INTO documentos (documento_venta_id, documento_titular_id, documento_subido_por, documento_tipo, documento_nombre, documento_ruta) VALUES (?, ?, ?, ?, ?, ?)',
    [documento_venta_id || null, documento_titular_id || null, documento_subido_por, documento_tipo, documento_nombre, documento_ruta],
    (err, result) => {
      if (err) return res.status(500).json({ mensaje: 'Error al guardar documento' });
      res.json({ mensaje: 'Documento subido', id: result.insertId });
    }
  );
};

const eliminarDocumento = (req, res) => {
  const { id } = req.params;
  db.query('SELECT documento_ruta FROM documentos WHERE documento_id = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ mensaje: 'Documento no encontrado' });
    const ruta = results[0].documento_ruta;
    fs.unlink(ruta, (fsErr) => {
      if (fsErr) console.warn('Archivo no encontrado en disco, eliminando solo de BD');
      db.query('DELETE FROM documentos WHERE documento_id = ?', [id], (err2) => {
        if (err2) return res.status(500).json({ mensaje: 'Error al eliminar' });
        res.json({ mensaje: 'Documento eliminado correctamente' });
      });
    });
  });
};

module.exports = { upload, obtenerDocumentos, subirDocumento, eliminarDocumento };
