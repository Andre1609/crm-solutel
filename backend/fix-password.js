const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: '', 
  database: 'crm_solutel' 
});

db.connect(async (err) => {
  if (err) throw err;
  console.log('Conectado a la BD.');

  const nuevaPassword = '123456';
  const emailUsuario = 'andreflores0125@gmail.com';

  const passwordEncriptada = await bcrypt.hash(nuevaPassword, 10);
  console.log('Nuevo hash generado:', passwordEncriptada);

  db.query(
    'UPDATE personal SET personal_password = ? WHERE personal_email = ?',
    [passwordEncriptada, emailUsuario],
    (err, result) => {
      if (err) throw err;
      console.log('Contraseña actualizada con éxito. Filas afectadas:', result.affectedRows);
      db.end(); 
    }
  );
});