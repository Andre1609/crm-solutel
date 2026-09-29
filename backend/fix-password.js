const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

// Configura esto igual que tu archivo db.js
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Tu usuario de XAMPP
  password: '', // Tu contraseña de XAMPP (por defecto vacía)
  database: 'crm_solutel' // El nombre de tu base de datos
});

db.connect(async (err) => {
  if (err) throw err;
  console.log('Conectado a la BD.');

  const nuevaPassword = '123456';
  const emailUsuario = 'andreflores0125@gmail.com';

  // Encriptamos la contraseña usando tu propia librería instalada
  const passwordEncriptada = await bcrypt.hash(nuevaPassword, 10);
  console.log('Nuevo hash generado:', passwordEncriptada);

  // Actualizamos el usuario
  db.query(
    'UPDATE personal SET personal_password = ? WHERE personal_email = ?',
    [passwordEncriptada, emailUsuario],
    (err, result) => {
      if (err) throw err;
      console.log('Contraseña actualizada con éxito. Filas afectadas:', result.affectedRows);
      db.end(); // Cerramos la conexión
    }
  );
});