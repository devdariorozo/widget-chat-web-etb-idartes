// ! ================================================================================================================================================
// !                                                      MODELOS PARA MENSAJE
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres (24 de Enero de 2025)
// @lastModified Ramón Dario Rozo Torres (24 de Enero de 2025)
// @version 1.0.0
// v1/models/widget/mensaje.model.js

// ! REQUIRES
const pool = require('../../config/database.js');
const path = require('path');
require('dotenv').config({ path: './../../.env' });
const logger = require('../../logger');

// ! MODELOS
// * NORMALIZAR CONTENIDO PARA EVITAR DUPLICADOS
const normalizarContenido = (contenido) => {
    if (!contenido) return '';
    // Eliminar tags HTML, espacios y saltos de línea
    return contenido
        .replace(/<[^>]*>/g, '') // Quitar HTML
        .replace(/\s+/g, ' ')   // Un solo espacio
        .trim()
        .toLowerCase();         // Ignorar mayúsculas/minúsculas
};

// * VERIFICAR MENSAJE RECIENTE (EVITAR DUPLICADOS)
const existeMensajeReciente = async (idChat, remitente, tipoMensaje, contenido, segundos = 10) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        const contenidoNormalizado = normalizarContenido(contenido);
        const query = `
            SELECT msg_id, msg_contenido
            FROM tbl_mensaje
            WHERE msg_fk_id_chat = ?
              AND msg_remitente = ?
              AND msg_tipo = ?
              AND msg_fecha >= (NOW() - INTERVAL ? SECOND)
            ORDER BY msg_id DESC
            LIMIT 5;
        `;
        const [rows] = await connMySQL.query(query, [idChat, remitente, tipoMensaje, segundos]);
        // Comparar normalizado
        return rows.some(row => normalizarContenido(row.msg_contenido) === contenidoNormalizado);
    } catch (error) {
        logger.error({
            contexto: 'model',
            recurso: 'mensaje.existeMensajeReciente',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { idChat, remitente, tipoMensaje, segundos }
        }, 'Error en v1/models/widget/mensaje.model.js → existeMensajeReciente');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * CREAR
const crear = async (idChat, remitente, estadoMensaje, tipoMensaje, contenido, enlaces, lectura, descripcion, estadoRegistro, responsable) => {
    let connMySQL;
    try {
        // // Permitir duplicados solo si el contenido contiene ciertas clases especiales
        // const permitirDuplicado =
        //     (typeof contenido === 'string' &&
        //         (contenido.includes('alertaErrorAPIArbol') || contenido.includes('alertaInactividadArbol')));
        // if (!permitirDuplicado) {
        //     // Verificar si ya existe un mensaje igual en toda la conversación (normalizado)
        //     const mensajes = await listarConversacion(idChat);
        //     const contenidoNormalizado = normalizarContenido(contenido);
        //     if (mensajes && mensajes.some(msg => normalizarContenido(msg.CONTENIDO) === contenidoNormalizado)) {
        //         return false;
        //     }
        // }
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = `
            INSERT INTO
                tbl_mensaje
            SET
                msg_fk_id_chat = ?,
                msg_remitente = ?,
                msg_estado = ?,
                msg_tipo = ?,
                msg_contenido = ?,
                msg_enlaces = ?,
                msg_lectura = ?,
                msg_descripcion = ?,
                msg_registro = ?,
                msg_responsable = ?;
        `;
        // todo: Ejecutar la sentencia y retornar respuesta
        const [result] = await connMySQL.query(query, [idChat, remitente, estadoMensaje, tipoMensaje, contenido, enlaces, lectura, descripcion, estadoRegistro, responsable]);
        
        return result;
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'mensaje.crear',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { idChat, remitente, estadoMensaje, tipoMensaje }
        }, 'Error en v1/models/widget/mensaje.model.js → crear');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * CREAR MENSAJE DESDE SOUL CHAT  
const crearSoulChat = async (idChat, remitente, estado, tipo, contenido, enlaces, lectura, descripcion, registro, responsable) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = `
            INSERT INTO
                tbl_mensaje
            SET
                msg_fk_id_chat = ?,
                msg_remitente = ?,
                msg_estado = ?,
                msg_tipo = ?,
                msg_contenido = ?,
                msg_enlaces = ?,
                msg_lectura = ?,
                msg_descripcion = ?,
                msg_registro = ?,
                msg_responsable = ?;
        `;

        // todo: Ejecutar la sentencia y retornar respuesta
        const [result] = await connMySQL.query(query, [idChat, remitente, estado, tipo, contenido, enlaces, lectura, descripcion, registro, responsable]);
        return result;
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'mensaje.crearSoulChat',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { idChat, remitente, estado, tipo }
        }, 'Error en v1/models/widget/mensaje.model.js → crearSoulChat');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * LISTAR NO LEÍDOS
const listarNoLeido = async (idChatWeb, lectura) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = `
            SELECT
                msg_id AS ID_MENSAJE,
                msg_fecha AS FECHA,
                msg_fk_id_chat AS ID_CHAT,
                msg_remitente AS REMITE,
                msg_estado AS ESTADO,
                msg_tipo AS TIPO,
                msg_contenido AS CONTENIDO,
                msg_enlaces AS ENLACES,
                msg_lectura AS LECTURA,
                msg_descripcion AS DESCRIPCION,
                msg_registro AS REGISTRO,
                msg_actualizacion AS ACTUALIZACION
            FROM
                tbl_mensaje
            WHERE
                msg_remitente = ?
            AND 
                msg_lectura = ?;
        `;

        // todo: Ejecutar la sentencia y retornar respuesta
        const [rows] = await connMySQL.query(query, [idChatWeb, lectura]);
        return rows;
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'mensaje.listarNoLeido',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { idChatWeb, lectura }
        }, 'Error en v1/models/widget/mensaje.model.js → listarNoLeido');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * LEER
const leer = async (idMensaje, lectura) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = `
            UPDATE
                tbl_mensaje
            SET
                msg_lectura = ?
            WHERE
                msg_id = ?;
        `;

        // todo: Ejecutar la sentencia y retornar respuesta
        return await connMySQL.query(query, [lectura, idMensaje]);
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'mensaje.leer',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { idMensaje, lectura }
        }, 'Error en v1/models/widget/mensaje.model.js → leer');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * LISTAR CONVERSACIÓN COMPLETA
const listarConversacion = async (idChatWeb) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = `
            SELECT
                msg_id AS ID_MENSAJE,
                msg_fecha AS FECHA,
                msg_fk_id_chat AS ID_CHAT,
                msg_remitente AS REMITE,
                msg_estado AS ESTADO,
                msg_tipo AS TIPO,
                msg_contenido AS CONTENIDO,
                msg_enlaces AS ENLACES,
                msg_lectura AS LECTURA,
                msg_descripcion AS DESCRIPCION,
                msg_registro AS REGISTRO,
                msg_actualizacion AS ACTUALIZACION
            FROM
                tbl_mensaje
            WHERE
                msg_fk_id_chat = ?;
        `;

        // todo: Ejecutar la sentencia y retornar respuesta
        const [rows] = await connMySQL.query(query, [idChatWeb]);
        return rows;
    } catch (error) {
        // todo: Capturar el error
        logger.error({
            contexto: 'model',
            recurso: 'mensaje.listarConversacion',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { idChatWeb }
        }, 'Error en v1/models/widget/mensaje.model.js → listarConversacion');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// * FILTRAR ULTIMO MENSAJE
const filtrarUltimoMensaje = async (idChatWeb) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = `
            SELECT
                msg_id AS ID_MENSAJE,
                msg_fecha AS FECHA,
                msg_fk_id_chat AS ID_CHAT,
                msg_remitente AS REMITE,
                msg_estado AS ESTADO,
                msg_tipo AS TIPO,
                msg_contenido AS CONTENIDO,
                msg_enlaces AS ENLACES,
                msg_lectura AS LECTURA,
                msg_descripcion AS DESCRIPCION,
                msg_registro AS REGISTRO,
                msg_actualizacion AS ACTUALIZACION
            FROM
                tbl_mensaje
            WHERE
                msg_remitente = ?
            ORDER BY
                msg_id DESC
            LIMIT 1;
        `;

        const [rows] = await connMySQL.query(query, [idChatWeb]);
        return rows[0];
    } catch (error) {
        logger.error({
            contexto: 'model',
            recurso: 'mensaje.filtrarUltimoMensaje',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { idChatWeb }
        }, 'Error en v1/models/widget/mensaje.model.js → filtrarUltimoMensaje');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};



// * FILTRAR ULTIMO MENSAJE ENVIADO
const filtrarUltimoMensajeEnviado = async (idChatWeb, estadoMensaje, tipoMensaje) => {
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        // todo: Sentencia SQL
        const query = `
            SELECT
                msg_id AS ID_MENSAJE,
                msg_fecha AS FECHA,
                msg_fk_id_chat AS ID_CHAT,
                msg_remitente AS REMITE,
                msg_estado AS ESTADO,
                msg_tipo AS TIPO,
                msg_contenido AS CONTENIDO,
                msg_enlaces AS ENLACES,
                msg_lectura AS LECTURA,
                msg_descripcion AS DESCRIPCION,
                msg_registro AS REGISTRO,
                msg_actualizacion AS ACTUALIZACION
            FROM
                tbl_mensaje
            WHERE
                msg_remitente = ?
            AND
                msg_estado = ?
            AND
                msg_tipo != ?
            ORDER BY
                msg_id DESC
            LIMIT 1;
        `;

        const [rows] = await connMySQL.query(query, [idChatWeb, estadoMensaje, tipoMensaje]);
        return rows[0];
    } catch (error) {
        logger.error({
            contexto: 'model',
            recurso: 'mensaje.filtrarUltimoMensajeEnviado',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            parametros: { idChatWeb, estadoMensaje, tipoMensaje }
        }, 'Error en v1/models/widget/mensaje.model.js → filtrarUltimoMensajeEnviado');
        return false;
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
};

// ! EXPORTACIONES
module.exports = {
    crear,
    crearSoulChat,
    listarNoLeido,
    leer,
    listarConversacion,
    filtrarUltimoMensaje,
    filtrarUltimoMensajeEnviado,
    existeMensajeReciente,
};