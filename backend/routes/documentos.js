const express = require('express');
const router = express.Router();
const { obtenerDocumentos, eliminarDocumento } = require('../controllers/documentosController');
const { verificarToken } = require('../middleware/auth');

// Solo el Jefe de Plataforma consulta y elimina documentos desde esta ruta.
// Los archivos de los clientes los sube el Back desde /api/ventas/:id/documentos.
const soloJefe = (req, res, next) => {
  if (req.usuario.rol_id !== 1) return res.status(403).json({ mensaje: 'No tienes permiso para esta acción' });
  next();
};

router.get('/', verificarToken, soloJefe, obtenerDocumentos);
router.delete('/:id', verificarToken, soloJefe, eliminarDocumento);

module.exports = router;
