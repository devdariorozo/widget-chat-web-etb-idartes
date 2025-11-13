// ! ================================================================================================================================================
// !                                                      MODELOS PARA MENSAJE
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/models/widget/mensaje.model.js

// ! REQUIRES
const pool = require('../../config/database.js');
const path = require('path');
require('dotenv').config({ path: './../../.env' });

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
    try {
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
        const [rows] = await pool.query(query, [idChat, remitente, tipoMensaje, segundos]);
        // Comparar normalizado
        return rows.some(row => normalizarContenido(row.msg_contenido) === contenidoNormalizado);
    } catch (error) {
        console.log('❌ Error en v1/models/widget/mensaje.model.js → existeMensajeReciente ', error);
        return false;
    }
};

// * CREAR
const crear = async (idChat, remitente, estadoMensaje, tipoMensaje, contenido, enlaces, lectura, descripcion, estadoRegistro, responsable) => {
    try {
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
        const [result] = await pool.query(query, [idChat, remitente, estadoMensaje, tipoMensaje, contenido, enlaces, lectura, descripcion, estadoRegistro, responsable]);
        
        return result;
    } catch (error) {
        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/mensaje.model.js → crear ', error);
        return false;
    }
};

// * CREAR MENSAJE DESDE SOUL CHAT  
const crearSoulChat = async (idChat, remitente, estado, tipo, contenido, enlaces, lectura, descripcion, registro, responsable) => {
    try {
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
        const [result] = await pool.query(query, [idChat, remitente, estado, tipo, contenido, enlaces, lectura, descripcion, registro, responsable]);
        return result;
    } catch (error) {

        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/mensaje.model.js → crearSoulChat ', error);
        return false;
    }
};

// * LISTAR NO LEÍDOS
const listarNoLeido = async (idChatWeb, lectura) => {
    try {
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
        const [rows] = await pool.query(query, [idChatWeb, lectura]);
        return rows;
    } catch (error) {

        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/mensaje.model.js → listarNoLeido ', error);
        return false;
    }
};

// * LEER
const leer = async (idMensaje, lectura) => {
    try {
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
        return await pool.query(query, [lectura, idMensaje]);
    } catch (error) {

        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/mensaje.model.js → leer ', error);
        return false;
    }
};

// * LISTAR CONVERSACIÓN COMPLETA
const listarConversacion = async (idChatWeb) => {
    try {
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
        const [rows] = await pool.query(query, [idChatWeb]);
        return rows;
    } catch (error) {
        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/mensaje.model.js → listarConversacion ', error);
        return false;
    }
};

// * FILTRAR ULTIMO MENSAJE
const filtrarUltimoMensaje = async (idChatWeb) => {
    try {
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

        const [rows] = await pool.query(query, [idChatWeb]);
        return rows[0];
    } catch (error) {
        console.log('❌ Error en v1/models/widget/mensaje.model.js → filtrar ', error);
        return false;
    }
};



// * FILTRAR ULTIMO MENSAJE ENVIADO
const filtrarUltimoMensajeEnviado = async (idChatWeb, estadoMensaje, tipoMensaje) => {
    try {
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

        const [rows] = await pool.query(query, [idChatWeb, estadoMensaje, tipoMensaje]);
        return rows[0];
    } catch (error) {
        console.log('❌ Error en v1/models/widget/mensaje.model.js → filtrarUltimoMensajeEnviado ', error);
        return false;
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