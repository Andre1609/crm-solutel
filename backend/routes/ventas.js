const express = require('express');
const router = express.Router();
const { obtenerVentas, obtenerEstadisticas, crearVenta, editarVenta, eliminarVenta, obtenerComentarios, crearComentario, marcarComentariosLeidos, obtenerCargas, obtenerDocumentosVenta, subirDocumentosVenta, descargarDocumento, revisarCarga } = require('../controllers/ventasController');
const { verificarToken } = require('../middleware/auth');
const { uploadVenta } = require('../controllers/documentosController');

// Solo los asesores cargan ventas; se valida antes de recibir archivos para no dejar nada guardado
const soloAsesor = (req, res, next) => {
  if (req.usuario.rol_id !== 4) return res.status(403).json({ mensaje: 'Solo los asesores pueden cargar ventas' });
  next();
};

// Solo el Back sube archivos a los clientes
const soloBack = (req, res, next) => {
  if (req.usuario.rol_id !== 3) return res.status(403).json({ mensaje: 'Solo el Back puede subir archivos de los clientes' });
  next();
};

// Recibe los archivos junto con los datos de la venta (multipart). Si algo falla aquí, no se crea la venta.
const subirArchivos = (req, res, next) => {
  uploadVenta.array('archivos', 10)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ mensaje: 'Un archivo supera los 10 MB' });
      return res.status(500).json({ mensaje: `No se pudieron subir los archivos (${err.code || err.message})` });
    }
    next();
  });
};

router.get('/', verificarToken, obtenerVentas);
router.get('/estadisticas', verificarToken, obtenerEstadisticas);
router.get('/cargas', verificarToken, obtenerCargas);
router.post('/', verificarToken, soloAsesor, subirArchivos, crearVenta);
router.put('/:id', verificarToken, editarVenta);
router.delete('/:id', verificarToken, eliminarVenta);
router.get('/:id/documentos', verificarToken, obtenerDocumentosVenta);
router.post('/:id/documentos', verificarToken, soloBack, subirArchivos, subirDocumentosVenta);
router.get('/:id/documentos/:docId/descargar', verificarToken, descargarDocumento);
router.put('/:id/revision', verificarToken, revisarCarga);
router.get('/:id/comentarios', verificarToken, obtenerComentarios);
router.post('/:id/comentarios', verificarToken, crearComentario);
router.put('/:id/comentarios/leido', verificarToken, marcarComentariosLeidos);

module.exports = router;
