const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function insertarAsesores() {
  // Conexión a tu base de datos
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crm_solutel'
  });

  console.log('Conectado a la base de datos. Encriptando contraseñas...');

  // Encriptamos la contraseña "123456" de forma real para que puedan entrar
  const passwordEncriptada = await bcrypt.hash('123456', 10);

  // Lista de asesores limpios (rol 4, equipo 1, activo 1)
  const asesores = [
    ['YULISA', 'SANTOS', 'yulisa.santos@solutel.com', passwordEncriptada, 4, 1, 1],
    ['SOLUTEL', '', 'solutel.solutel@solutel.com', passwordEncriptada, 4, 1, 1],
    ['FERNANDO', 'SALCEDO', 'fernando.salcedo@solutel.com', passwordEncriptada, 4, 1, 1],
    ['PALOMA', 'ANTON', 'paloma.anton@solutel.com', passwordEncriptada, 4, 1, 1],
    ['CLAUDIA', 'RETENCION', 'claudia.retencion@solutel.com', passwordEncriptada, 4, 1, 1],
    ['DIANA', 'SALCEDO', 'diana.salcedo@solutel.com', passwordEncriptada, 4, 1, 1],
    ['OLIVER', 'CORMAN', 'oliver.corman@solutel.com', passwordEncriptada, 4, 1, 1],
    ['REBECA', 'RETENCION', 'rebeca.retencion@solutel.com', passwordEncriptada, 4, 1, 1],
    ['ATHENA', 'VEGA', 'athena.vega@solutel.com', passwordEncriptada, 4, 1, 1],
    ['CLAUDIA', 'GUERRA', 'claudia.guerra@solutel.com', passwordEncriptada, 4, 1, 1],
    ['KARLA', 'SOTELO', 'karla.sotelo@solutel.com', passwordEncriptada, 4, 1, 1],
    ['LIZBETH', 'RETENCION', 'lizbeth.retencion@solutel.com', passwordEncriptada, 4, 1, 1]
  ];

  try {
    // Insertamos a todos de golpe (Bulk Insert) usando INSERT IGNORE por si acaso
    const [result] = await db.query(
      'INSERT IGNORE INTO personal (personal_nombres, personal_apellidos, personal_email, personal_password, personal_rol_id, personal_equipo_id, personal_activo) VALUES ?',
      [asesores]
    );
    console.log(`¡Éxito! Se agregaron ${result.affectedRows} asesores al Equipo Nicolas.`);
  } catch (error) {
    console.error('Hubo un error al insertar:', error);
  } finally {
    await db.end(); // Cerramos la conexión
  }
}

insertarAsesores();