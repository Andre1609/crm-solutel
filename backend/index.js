const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/agendados', require('./routes/agendados'));
app.use('/api/usuarios', require('./routes/usuarios'));

app.get('/', (req, res) => {
  res.json({ mensaje: 'CRM Solutel API corriendo correctamente' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
