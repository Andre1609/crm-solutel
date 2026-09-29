const jwt = require('jsonwebtoken');
require('dotenv').config();
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ mensaje: 'Token requerido' });
  try { const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET); req.usuario = decoded; next(); }
  catch (err) { return res.status(401).json({ mensaje: 'Token inválido' }); }
};
module.exports = { verificarToken };
