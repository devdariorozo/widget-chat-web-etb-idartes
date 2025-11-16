// ! ================================================================================================================================================
// !                                                      MODELOS PARA CHAT
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/models/widget/chat.model.js

// ! REQUIRES
const pool = require('../../config/database.js');
const path = require('path');
require('dotenv').config({ path: './../../.env' });
const logger = require('../../logger');

// ! MODELOS
// * CREAR
const crear = async (tipoGestion, remitente, estadoChat, estadoGestion, arbol, controlApi, controlPeticiones, resultadoApi, descripcion, estadoRegistro, responsable) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = `
            INSERT INTO
                tbl_chat
            SET
                cht_tipo = ?,
                cht_remitente = ?,
                cht_estado = ?,
                cht_gestion = ?,
                cht_arbol = ?,
                cht_control_api = ?,
                cht_control_peticiones = ?,
                cht_resultado_api = ?,
                cht_descripcion = ?,
                cht_registro = ?,
                cht_responsable = ?;
        `;

        // todo: Ejecutar la sentencia y retornar respuesta
        return await connMySQL.query(query, [tipoGestion, remitente, estadoChat, estadoGestion, arbol, controlApi, controlPeticiones, resultadoApi, descripcion, estadoRegistro, responsable]);
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'chat.crear',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { tipoGestion, remitente, estadoChat, estadoGestion, arbol }
        }, 'Error en v1/models/widget/chat.model.js → crear');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * DUPLICADO
const verificarDuplicado = async (remitente, estadoGestion, estadoRegistro) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = `
            SELECT
                cht_id AS ID_CHAT,
                cht_remitente AS REMITENTE
            FROM
                tbl_chat
            WHERE
                cht_remitente = ? 
            AND 
                cht_gestion = ?
            AND 
                cht_registro = ?;
        `;

        // todo: Ejecutar la sentencia  
        const [rows] = await connMySQL.query(query, [remitente, estadoGestion, estadoRegistro]);

        // todo: Retornar respuesta
        return rows;
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'chat.verificarDuplicado',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { remitente, estadoGestion, estadoRegistro }
        }, 'Error en v1/models/widget/chat.model.js → verificarDuplicado');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * FILTRAR
const filtrar = async (idChatWeb) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = `
            SELECT
                cht_id AS ID_CHAT,
                cht_fecha AS FECHA_REGISTRO,
                cht_tipo AS TIPO,
                cht_remitente AS REMITENTE,
                cht_estado AS ESTADO,
                cht_gestion AS GESTION,
                cht_arbol AS ARBOL,
                cht_control_api AS CONTROL_API,
                cht_control_peticiones AS CONTROL_PETICIONES,
                cht_resultado_api AS RESULTADO_API,
                '-' AS NOMBRES,
                '-' AS APELLIDOS,
                '-' AS NUMERO_CEDULA,
                '-' AS PAIS_RESIDENCIA,
                '-' AS CIUDAD_RESIDENCIA,
                '-' AS INDICATIVO_PAIS,
                '-' AS NUMERO_CELULAR,
                '-' AS CORREO_ELECTRONICO,
                '-' AS AUTORIZACION_DATOS_PERSONALES,
                '-' AS ADJUNTOS,
                '-' AS RUTA_ADJUNTOS,
                cht_descripcion AS DESCRIPCION,
                cht_registro AS REGISTRO,
                cht_actualizacion AS FECHA_ACTUALIZACION,
                cht_responsable AS RESPONSABLE
            FROM
                tbl_chat
            WHERE
                cht_remitente = ?;
        `;

        // todo: Ejecutar la sentencia  
        const [rows] = await connMySQL.query(query, [idChatWeb]);

        // todo: Retornar respuesta
        return rows;
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'chat.filtrar',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { idChatWeb }
        }, 'Error en v1/models/widget/chat.model.js → filtrar');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * FORMULARIO INICIAL
const formularioInicial = async (idChatWeb, pasoArbol, nombres, apellidos, numeroCedula, paisResidencia, ciudadResidencia, indicativoPais, numeroCelular, correoElectronico, autorizacionDatosPersonales, descripcion) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = `
            UPDATE
                tbl_chat
            SET
                cht_arbol = ?,
                cht_nombres = ?,
                cht_apellidos = ?,
                cht_numero_cedula = ?,
                cht_pais_residencia = ?,
                cht_ciudad_residencia = ?,
                cht_indicativo_pais = ?,
                cht_numero_celular = ?,
                cht_correo_electronico = ?,
                cht_autorizacion_datos_personales = ?,
                cht_descripcion = ?
            WHERE
                cht_remitente = ?;
        `;

        // todo: Ejecutar la sentencia y retornar respuesta
        const result = await connMySQL.query(query, [pasoArbol, nombres, apellidos, numeroCedula, paisResidencia, ciudadResidencia, indicativoPais, numeroCelular, correoElectronico, autorizacionDatosPersonales, descripcion, idChatWeb]);

        // todo: Obtener el id del chat
        const queryIdChat = `
            SELECT
                cht_id AS ID_CHAT
            FROM
                tbl_chat
            WHERE
                cht_remitente = ?;
        `;
        const [rows] = await connMySQL.query(queryIdChat, [idChatWeb]);
        return rows;
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'chat.formularioInicial',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { idChatWeb, pasoArbol }
        }, 'Error en v1/models/widget/chat.model.js → formularioInicial');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * FILTRAR ENLACES
const filtrarEnlaces = async (idChat) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = 'SELECT cht_ruta_adjuntos AS RUTA_ADJUNTOS FROM tbl_chat WHERE cht_id = ?';
        const [rows] = await connMySQL.query(query, [idChat]);
        return rows[0];
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'chat.filtrarEnlaces',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { idChat }
        }, 'Error en v1/models/widget/chat.model.js → filtrarEnlaces');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * ERROR
const error = async (descripcion, idChat) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = `
            UPDATE
                tbl_chat
            SET
                cht_descripcion = ?
            WHERE
                cht_id = ?;
        `;

        // todo: Ejecutar la sentencia y retornar respuesta
        const result = await connMySQL.query(query, [descripcion, idChat]);
        // todo: Si se modifico el registro
        if (result[0].affectedRows > 0) {
            // todo: Retornar el id del registro
            const query = `
                SELECT
                    cht_id AS ID_CHAT
                FROM
                    tbl_chat
                WHERE
                    cht_id = ?;
            `;
            const [rows] = await connMySQL.query(query, [idChat]);
            return rows;
        }
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'chat.error',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { descripcion, idChat }
        }, 'Error en v1/models/widget/chat.model.js → error');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * OPCIONES CONTROL API
const opcionesControlApi = async () => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = `SELECT DISTINCT cht_control_api AS OPCION_CONTROL_API FROM tbl_chat`;
        const [rows] = await connMySQL.query(query);
        return rows;
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'chat.opcionesControlApi',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/models/widget/chat.model.js → opcionesControlApi');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * MONITOR
const monitor = async (fechaInicial, fechaFinal, opcionControlApi, numeroLimite, numeroDesplazamiento) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        let query = `
            SELECT
                cht_id AS ID_CHAT,
                cht_fecha AS FECHA_REGISTRO,
                cht_tipo AS TIPO,
                cht_remitente AS REMITENTE,
                cht_estado AS ESTADO,
                cht_gestion AS GESTION,
                cht_arbol AS ARBOL,
                cht_control_api AS CONTROL_API,
                cht_control_peticiones AS CONTROL_PETICIONES,
                cht_resultado_api AS RESULTADO_API,
                cht_nombres AS NOMBRES,
                cht_apellidos AS APELLIDOS,
                cht_numero_cedula AS NUMERO_CEDULA,
                cht_pais_residencia AS PAIS_RESIDENCIA,
                cht_ciudad_residencia AS CIUDAD_RESIDENCIA,
                cht_indicativo_pais AS INDICATIVO_PAIS,
                cht_numero_celular AS NUMERO_CELULAR,
                cht_correo_electronico AS CORREO_ELECTRONICO,
                cht_autorizacion_datos_personales AS AUTORIZACION_DATOS_PERSONALES,
                cht_adjuntos AS ADJUNTOS,
                cht_ruta_adjuntos AS RUTA_ADJUNTOS,
                cht_descripcion AS DESCRIPCION,
                cht_registro AS REGISTRO,
                cht_actualizacion AS FECHA_ACTUALIZACION,
                cht_responsable AS RESPONSABLE
            FROM
                tbl_chat
            WHERE
                1=1
        `;

        // todo: Arreglo para los parámetros de la sentencia
        let params = [];
        
        // todo: Agregar filtro de fechas
        if (fechaInicial !== "-" && fechaFinal !== "-" && !isNaN(new Date(fechaInicial)) && !isNaN(new Date(fechaFinal))) {
            query += ` AND cht_fecha BETWEEN ? AND ?`;
            params.push(fechaInicial, fechaFinal);
        }

        // todo: Agregar filtro de control api
        if (opcionControlApi !== "*") {
            query += ` AND cht_control_api = ?`;
            params.push(opcionControlApi);
        }

        // todo: Agregar limitación y paginación
        query += ` ORDER BY cht_id DESC LIMIT ? OFFSET ?`;
        params.push(Number(numeroLimite), Number(numeroDesplazamiento));

        // todo: Ejecutar la sentencia con los parámetros proporcionados
        const [rows] = await connMySQL.query(query, params);
        
        // todo: Sentencia para contar el total de registros
        let countQuery = `
            SELECT COUNT(*) AS totalCount
            FROM tbl_chat
            WHERE 1=1
        `;

        // todo: Arreglo para los parámetros de la sentencia
        let countParams = [];

        // todo: Agregar filtros a la sentencia de conteo
        if (fechaInicial !== "-" && fechaFinal !== "-" && !isNaN(new Date(fechaInicial)) && !isNaN(new Date(fechaFinal))) {
            countQuery += ` AND cht_fecha BETWEEN ? AND ?`;
            countParams.push(fechaInicial, fechaFinal);
        }

        // todo: Agregar filtro de control api
        if (opcionControlApi !== "*") {
            countQuery += ` AND cht_control_api = ?`;
            countParams.push(opcionControlApi);
        }

        // todo: Ejecutar la sentencia de conteo
        const [countRows] = await connMySQL.query(countQuery, countParams);
        const totalCount = countRows[0].totalCount;

        // todo: Retornar respuesta
        return {
            totalCount,
            filteredCount: totalCount,
            data: rows
        };
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'chat.monitor',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { fechaInicial, fechaFinal, opcionControlApi, numeroLimite, numeroDesplazamiento }
        }, 'Error en v1/models/widget/chat.model.js → monitor');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * LISTAR ARCHIVOS ADJUNTOS
const listarArchivosAdjuntos = async (idChat) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        const query = `
            SELECT SQL_NO_CACHE
                cht_adjuntos AS ADJUNTOS,
                cht_ruta_adjuntos AS RUTAS
            FROM
                tbl_chat
            WHERE
                cht_id = ?;
        `;
        const [rows] = await connMySQL.query(query, [idChat]);
        return rows[0];
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'chat.listarArchivosAdjuntos',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { idChat }
        }, 'Error en v1/models/widget/chat.model.js → listarArchivosAdjuntos');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * ACTUALIZAR
const actualizar = async (idChat, pasoArbol, chatData) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Intentar primero con todas las columnas según migración
        let query = `
            UPDATE
                tbl_chat
            SET
                cht_arbol = ?,
                cht_control_api = ?,
                cht_control_peticiones = ?,
                cht_resultado_api = ?,
                cht_nombres = ?,
                cht_apellidos = ?,
                cht_numero_cedula = ?,
                cht_pais_residencia = ?,
                cht_ciudad_residencia = ?,
                cht_indicativo_pais = ?,
                cht_numero_celular = ?,
                cht_correo_electronico = ?,
                cht_autorizacion_datos_personales = ?,
                cht_adjuntos = ?,
                cht_ruta_adjuntos = ?,
                cht_descripcion = ?,
                cht_registro = ?,
                cht_responsable = ?
            WHERE
                cht_id = ?;
        `;

        let params = [
            pasoArbol,
            chatData.controlApi || '-',
            chatData.controlPeticiones || 0,
            typeof chatData.resultadoApi === 'string' ? chatData.resultadoApi : JSON.stringify(chatData.resultadoApi || {}),
            chatData.nombres || '-',
            chatData.apellidos || '-',
            chatData.numeroCedula || '-',
            chatData.paisResidencia || '-',
            chatData.ciudadResidencia || '-',
            chatData.indicativoPais || '-',
            chatData.numeroCelular || '-',
            chatData.correoElectronico || '-',
            chatData.autorizacionDatosPersonales || 'No',
            chatData.adjuntos || 'No',
            chatData.rutaAdjuntos || '-',
            chatData.descripcion || '-',
            chatData.estadoRegistro || 'Activo',
            chatData.responsable || 'Widget Chat Web ETB - IDARTES',
            idChat
        ];

        // todo: Ejecutar la sentencia
        try {
            const [rows] = await connMySQL.query(query, params);
            return rows[0];
        } catch (updateError) {
            // Si falla por columnas inexistentes, intentar solo con columnas básicas
            if (updateError.message && updateError.message.includes('Unknown column')) {
                logger.warn({
                    contexto: 'model',
                    recurso: 'chat.actualizar',
                    codigoRespuesta: 500,
                    errorMensaje: updateError.message,
                    parametros: { idChat, pasoArbol },
                    accion: 'Intentando actualización con columnas básicas'
                }, 'Columnas de formulario no existen, actualizando solo columnas básicas');

                // Query solo con columnas básicas que siempre existen
                query = `
                    UPDATE
                        tbl_chat
                    SET
                        cht_arbol = ?,
                        cht_control_api = ?,
                        cht_control_peticiones = ?,
                        cht_resultado_api = ?,
                        cht_descripcion = ?,
                        cht_registro = ?,
                        cht_responsable = ?
                    WHERE
                        cht_id = ?;
                `;

                params = [
                    pasoArbol,
                    chatData.controlApi || '-',
                    chatData.controlPeticiones || 0,
                    typeof chatData.resultadoApi === 'string' ? chatData.resultadoApi : JSON.stringify(chatData.resultadoApi || {}),
                    chatData.descripcion || '-',
                    chatData.estadoRegistro || 'Activo',
                    chatData.responsable || 'Widget Chat Web ETB - IDARTES',
                    idChat
                ];

                const [rows] = await connMySQL.query(query, params);
                return rows[0];
            } else {
                // Si es otro tipo de error, lanzarlo
                throw updateError;
            }
        }
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'chat.actualizar',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { idChat, pasoArbol }
        }, 'Error en v1/models/widget/chat.model.js → actualizar');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * CERRAR
const cerrar = async (remitente, estadoChat, estadoGestion, arbol, controlApi, descripcion, estadoRegistro, responsable) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = `
            UPDATE
                tbl_chat
            SET
                cht_estado = ?,
                cht_gestion = ?,
                cht_arbol = ?,
                cht_control_api = ?,
                cht_descripcion = ?,
                cht_registro = ?,
                cht_responsable = ?
            WHERE
                cht_remitente = ?;
        `;

        // todo: Ejecutar la sentencia y retornar respuesta
        const result = await connMySQL.query(query, [estadoChat, estadoGestion, arbol, controlApi, descripcion, estadoRegistro, responsable, remitente]);
        // todo: Si se modifico el registro
        if (result[0].affectedRows > 0) {
            // todo: Retornar el id del registro
            const query = `
                SELECT
                    cht_id AS ID_CHAT,
                    cht_gestion AS GESTION
                FROM
                    tbl_chat
                WHERE
                    cht_remitente = ?;
            `;
            const [rows] = await connMySQL.query(query, [remitente]);
            return rows;
        }
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'chat.cerrar',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { remitente, estadoChat, estadoGestion, arbol }
        }, 'Error en v1/models/widget/chat.model.js → cerrar');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * CERRAR CHAT AI
const cerrarChatAI = async (remitente, estadoChat, estadoGestion, arbol, controlApi, descripcion, estadoRegistro, responsable) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = `
            UPDATE
                tbl_chat
            SET
                cht_estado = ?,
                cht_gestion = ?,
                cht_arbol = ?,
                cht_control_api = ?,
                cht_descripcion = ?,
                cht_registro = ?,
                cht_responsable = ?
            WHERE
                cht_remitente = ?;
        `;

        // todo: Ejecutar la sentencia y retornar respuesta
        const result = await connMySQL.query(query, [estadoChat, estadoGestion, arbol, controlApi, descripcion, estadoRegistro, responsable, remitente]);
        // todo: Si se modifico el registro
        if (result[0].affectedRows > 0) {
            // todo: Retornar el id del registro
            const query = `
                SELECT
                    cht_id AS ID_CHAT
                FROM
                    tbl_chat
                WHERE
                    cht_remitente = ?;
            `;
            const [rows] = await connMySQL.query(query, [remitente]);
            return rows;
        }
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'chat.cerrarChatAI',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { remitente, estadoChat, estadoGestion, arbol }
        }, 'Error en v1/models/widget/chat.model.js → cerrarChatAI');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * LISTAR CHATS ABIERTOS ANTIGUOS
const listarChatsAbiertosAntiguos = async (tiempoLimiteHoras, fechaActual) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL - Obtener chats que superen el tiempo límite configurado
        const query = `
            SELECT
                cht_id AS ID_CHAT,
                cht_remitente AS REMITENTE,
                cht_fecha AS FECHA_REGISTRO,
                cht_arbol AS ARBOL,
                '-' AS NOMBRES,
                '-' AS APELLIDOS,
                TIMESTAMPDIFF(HOUR, cht_fecha, ?) AS HORAS_TRANSCURRIDAS
            FROM
                tbl_chat
            WHERE
                cht_gestion = 'Abierto'
            AND
                cht_registro = 'Activo'
            AND
                TIMESTAMPDIFF(HOUR, cht_fecha, ?) >= ?
            ORDER BY
                cht_fecha ASC;
        `;

        // todo: Ejecutar la sentencia
        const [rows] = await connMySQL.query(query, [fechaActual, fechaActual, tiempoLimiteHoras]);
        
        // todo: Retornar respuesta
        return rows;
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'chat.listarChatsAbiertosAntiguos',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { tiempoLimiteHoras, fechaActual }
        }, 'Error en v1/models/widget/chat.model.js → listarChatsAbiertosAntiguos');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * CERRAR CHAT POR ID
const cerrarChatPorId = async (idChat, estadoChat, estadoGestion, arbol, controlApi, descripcion, estadoRegistro, responsable) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = `
            UPDATE
                tbl_chat
            SET
                cht_estado = ?,
                cht_gestion = ?,
                cht_arbol = ?,
                cht_control_api = ?,
                cht_descripcion = ?,
                cht_registro = ?,
                cht_responsable = ?
            WHERE
                cht_id = ?;
        `;

        // todo: Ejecutar la sentencia y retornar respuesta
        const result = await connMySQL.query(query, [estadoChat, estadoGestion, arbol, controlApi, descripcion, estadoRegistro, responsable, idChat]);
        
        // todo: Si se modifico el registro
        if (result[0].affectedRows > 0) {
            return true;
        }
        
        return false;
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'chat.cerrarChatPorId',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { idChat, estadoChat, estadoGestion, arbol }
        }, 'Error en v1/models/widget/chat.model.js → cerrarChatPorId');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// ! EXPORTACIONES
module.exports = {
    crear,
    verificarDuplicado,
    formularioInicial,
    filtrar,
    filtrarEnlaces,
    error,
    opcionesControlApi,
    monitor,
    listarArchivosAdjuntos,
    actualizar,
    cerrar,
    cerrarChatAI,
    listarChatsAbiertosAntiguos,
    cerrarChatPorId,
};