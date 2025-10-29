// ! ================================================================================================================================================
// !                                                          CONFIGURACIÓN DE LA BASE DE DATOS
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres (24 de Enero de 2025)
// @lastModified Ramón Dario Rozo Torres (24 de Enero de 2025)
// @version 1.0.0
// v1/config/database.js

// ! REQUIRES
const mysql2 = require('mysql2/promise');

// ! CONEXIÓN A LA BASE DE DATOS
let pool;
try {
    // todo: Creación del pool de conexiones
    pool = mysql2.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT),
        connectionLimit: parseInt(process.env.DB_POOL_SIZE)
    });

    // todo: Verificación de la conexión
    pool.on('error', (error) => {
        console.log('❌ Error en v1/config/database.js → pool ===> ', error);
    });

} catch (error) {
    console.log('❌ Error en v1/config/database.js → mysql2 ===> ', error);
}

// ! EXPORTACIONES
module.exports = pool;