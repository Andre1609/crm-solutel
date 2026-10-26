const express = require('express');
const router = express.Router();
const { obtenerVentas, obtenerEstadisticas, crearVenta, editarVenta, eliminarVenta, obtenerComentarios, crearComentario, marcarComentariosLeidos } = require('../controllers/ventasController');
const { verificarToken } = require('../middleware/auth');
const { uploadVenta } = require('../controllers/documentosController');

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
router.post('/', verificarToken, subirArchivos, crearVenta);
router.put('/:id', verificarToken, editarVenta);
router.delete('/:id', verificarToken, eliminarVenta);
router.get('/:id/comentarios', verificarToken, obtenerComentarios);
router.post('/:id/comentarios', verificarToken, crearComentario);
router.put('/:id/comentarios/leido', verificarToken, marcarComentariosLeidos);

module.exports = router;
