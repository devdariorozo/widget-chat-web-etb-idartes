// ! ================================================================================================================================================
// !                                                          CONFIGURACIÓN DE LA BASE DE DATOS
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/config/database.js

// ! REQUIRES
const mysql2 = require('mysql2/promise');
const logger = require('../logger');
const { getOrigen, getDestino, getContextoRecurso } = require('../logger/context');

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
        logger.error({
            contexto: 'database',
            recurso: 'pool',
            codigoRespuesta: 500,
            errorMensaje: error.message
        }, 'Error en pool de conexiones MySQL');
    });
    
    // Log informativo de configuración del pool
    logger.info({
        contexto: 'database',
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        poolSize: parseInt(process.env.DB_POOL_SIZE)
    }, 'Pool de conexiones MySQL configurado');

} catch (error) {
    logger.error({
        contexto: 'database',
        recurso: 'mysql2',
        codigoRespuesta: 500,
        errorMensaje: error.message
    }, 'Error inicializando MySQL');
}

// ! EXPORTACIONES
module.exports = pool;