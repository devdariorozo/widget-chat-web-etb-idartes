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

// ! MODELOS
// * CREAR
const crear = async (tipoGestion, remitente, estadoChat, estadoGestion, arbol, controlApi, controlPeticiones, resultadoApi, descripcion, estadoRegistro, responsable) => {
    try {
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
        return await pool.query(query, [tipoGestion, remitente, estadoChat, estadoGestion, arbol, controlApi, controlPeticiones, resultadoApi, descripcion, estadoRegistro, responsable]);
    } catch (error) {

        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/chat.model.js → crearChat ', error);
        return false;
    }
};

// * DUPLICADO
const verificarDuplicado = async (remitente, estadoGestion, estadoRegistro) => {
    try {
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
        const [rows] = await pool.query(query, [remitente, estadoGestion, estadoRegistro]);

        // todo: Retornar respuesta
        return rows;
    } catch (error) {

        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/chat.model.js → verificarDuplicado ', error);
        return false;
    }
};

// * FILTRAR
const filtrar = async (idChatWeb) => {
    try {
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
                cht_nombres_apellidos AS NOMBRES_APELLIDOS, 
                cht_genero AS GENERO,
                cht_correo_electronico AS CORREO_ELECTRONICO,
                cht_telefono AS TELEFONO,
                cht_localidad AS LOCALIDAD,
                cht_en_que_podemos_ayudarle AS EN_QUE_PODEMOS_AYUDARLE,
                cht_rango_edad AS RANGO_EDAD,
                cht_autorizacion_tratamiento_datos AS AUTORIZACION_TRATAMIENTO_DATOS,
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
        const [rows] = await pool.query(query, [idChatWeb]);

        // todo: Retornar respuesta
        return rows;
    } catch (error) {

        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/chat.model.js → filtrar ', error);
        return false;
    }
};

// * FORMULARIO INICIAL
const formularioInicial = async (idChatWeb, pasoArbol, nombresApellidos, genero, correoElectronico, telefono, localidad, enQuePodemosAyudarle, rangoEdad, autorizacionTratamientoDatos, descripcion) => {
    try {
        // todo: Sentencia SQL
        const query = `
            UPDATE
                tbl_chat
            SET
                cht_arbol = ?,
                cht_nombres_apellidos = ?,
                cht_genero = ?,
                cht_correo_electronico = ?,
                cht_telefono = ?,
                cht_localidad = ?,
                cht_en_que_podemos_ayudarle = ?,
                cht_rango_edad = ?,
                cht_autorizacion_tratamiento_datos = ?,
                cht_descripcion = ?
            WHERE
                cht_remitente = ?;
        `;

        // todo: Ejecutar la sentencia y retornar respuesta
            const result = await pool.query(query, [pasoArbol, nombresApellidos, genero, correoElectronico, telefono, localidad, enQuePodemosAyudarle, rangoEdad, autorizacionTratamientoDatos, descripcion, idChatWeb]);

        // todo: Obtener el id del chat
        const queryIdChat = `
            SELECT
                cht_id AS ID_CHAT
            FROM
                tbl_chat
            WHERE
                cht_remitente = ?;
        `;
        const [rows] = await pool.query(queryIdChat, [idChatWeb]);
        return rows;
    } catch (error) {
        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/chat.model.js → formularioInicial ', error);
        return false;
    }
};

// * FILTRAR ENLACES
const filtrarEnlaces = async (idChat) => {
    try {
        // todo: Sentencia SQL
        const query = 'SELECT cht_ruta_adjuntos AS RUTA_ADJUNTOS FROM tbl_chat WHERE cht_id = ?';
        const [rows] = await pool.query(query, [idChat]);
        return rows[0];
    } catch (error) {
        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/chat.model.js → filtrarEnlaces ', error);
        return false;
    }
};

// * ERROR
const error = async (descripcion, idChat) => {
    try {
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
        const result = await pool.query(query, [descripcion, idChat]);
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
            const [rows] = await pool.query(query, [idChat]);
            return rows;
        }
    } catch (error) {
        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/chat.model.js → error ', error);
        return false;
    }
};

// * OPCIONES CONTROL API
const opcionesControlApi = async () => {
    try {
        // todo: Sentencia SQL
        const query = `SELECT DISTINCT cht_control_api AS OPCION_CONTROL_API FROM tbl_chat`;
        const [rows] = await pool.query(query);
        return rows;
    } catch (error) {
        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/chat.model.js → opcionesControlApi ', error);
        return false;
    }
};

// * MONITOR
const monitor = async (fechaInicial, fechaFinal, opcionControlApi, numeroLimite, numeroDesplazamiento) => {
    try {
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
                cht_nombres_apellidos AS NOMBRES_APELLIDOS,
                cht_genero AS GENERO,
                cht_correo_electronico AS CORREO_ELECTRONICO,
                cht_telefono AS TELEFONO,
                cht_localidad AS LOCALIDAD,
                cht_en_que_podemos_ayudarle AS EN_QUE_PODEMOS_AYUDARLE,
                cht_rango_edad AS RANGO_EDAD,
                cht_autorizacion_tratamiento_datos AS AUTORIZACION_TRATAMIENTO_DATOS,
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
        const [rows] = await pool.query(query, params);
        
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
        const [countRows] = await pool.query(countQuery, countParams);
        const totalCount = countRows[0].totalCount;

        // todo: Retornar respuesta
        return {
            totalCount,
            filteredCount: totalCount,
            data: rows
        };
    } catch (error) {

        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/chat.model.js → monitor ', error);
        return false;
    }
};

// * LISTAR ARCHIVOS ADJUNTOS
const listarArchivosAdjuntos = async (idChat) => {
    const query = `
        SELECT SQL_NO_CACHE
            cht_adjuntos AS ADJUNTOS,
            cht_ruta_adjuntos AS RUTAS
        FROM
            tbl_chat
        WHERE
            cht_id = ?;
    `;
    const [rows] = await pool.query(query, [idChat]);
    return rows[0];
};

// * ACTUALIZAR
const actualizar = async (idChat, pasoArbol, chatData) => {
    try {
        // todo: Asegurar que resultadoApi sea una cadena JSON válida
        let resultadoApiString = chatData.resultadoApi;
        if (typeof chatData.resultadoApi === 'object' && chatData.resultadoApi !== null) {
            resultadoApiString = JSON.stringify(chatData.resultadoApi);
        }

        // todo: Sentencia SQL
        const query = `
            UPDATE
                tbl_chat
            SET
                cht_arbol = ?,
                cht_control_api = ?,
                cht_control_peticiones = ?,
                cht_resultado_api = ?,
                cht_nombres_apellidos = ?,
                cht_genero = ?,
                cht_correo_electronico = ?,
                cht_telefono = ?,
                cht_localidad = ?,
                cht_en_que_podemos_ayudarle = ?,
                cht_rango_edad = ?,
                cht_autorizacion_tratamiento_datos = ?,
                cht_descripcion = ?,
                cht_registro = ?,
                cht_responsable = ?
            WHERE
                cht_id = ?;
        `;

        // todo: Parametros de la sentencia
        const params = [
            pasoArbol,
            chatData.controlApi,
            chatData.controlPeticiones,
            resultadoApiString,
            chatData.nombresApellidos,
            chatData.genero,
            chatData.correoElectronico,
            chatData.telefono,
            chatData.localidad,
            chatData.enQuePodemosAyudarle,
            chatData.rangoEdad,
            chatData.autorizacionTratamientoDatos,
            chatData.descripcion,
            chatData.estadoRegistro,
            chatData.responsable,
            idChat
        ];

        // todo: Ejecutar la sentencia
        const [rows] = await pool.query(query, params);
        return rows[0];
    } catch (error) {
        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/chat.model.js → actualizar ', error);
        return false;
    }
};

// * CERRAR
const cerrar = async (remitente, estadoChat, estadoGestion, arbol, controlApi, descripcion, estadoRegistro, responsable) => {
    try {
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
        const result = await pool.query(query, [estadoChat, estadoGestion, arbol, controlApi, descripcion, estadoRegistro, responsable, remitente]);
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
            const [rows] = await pool.query(query, [remitente]);
            return rows;
        }
    } catch (error) {
        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/chat.model.js → cerrar ', error);
        return false;
    }
};

// * CERRAR CHAT AI
const cerrarChatAI = async (remitente, estadoChat, estadoGestion, arbol, controlApi, descripcion, estadoRegistro, responsable) => {
    try {
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
        const result = await pool.query(query, [estadoChat, estadoGestion, arbol, controlApi, descripcion, estadoRegistro, responsable, remitente]);
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
            const [rows] = await pool.query(query, [remitente]);
            return rows;
        }
    } catch (error) {
        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/chat.model.js → cerrarChatAI ', error);
        return false;
    }
};

// * LISTAR CHATS ABIERTOS ANTIGUOS
const listarChatsAbiertosAntiguos = async (tiempoLimiteHoras, fechaActual) => {
    
    try {
        // todo: Sentencia SQL - Obtener chats que superen el tiempo límite configurado
        const query = `
            SELECT
                cht_id AS ID_CHAT,
                cht_remitente AS REMITENTE,
                cht_fecha AS FECHA_REGISTRO,
                cht_arbol AS ARBOL,
                cht_nombres_apellidos AS NOMBRES_APELLIDOS,
                cht_genero AS GENERO,
                cht_correo_electronico AS CORREO_ELECTRONICO,
                cht_telefono AS TELEFONO,
                cht_localidad AS LOCALIDAD,
                cht_en_que_podemos_ayudarle AS EN_QUE_PODEMOS_AYUDARLE,
                cht_rango_edad AS RANGO_EDAD,
                cht_autorizacion_tratamiento_datos AS AUTORIZACION_TRATAMIENTO_DATOS,
                cht_descripcion AS DESCRIPCION,
                cht_registro AS REGISTRO,
                cht_actualizacion AS FECHA_ACTUALIZACION,
                cht_responsable AS RESPONSABLE,
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
        const [rows] = await pool.query(query, [fechaActual, fechaActual, tiempoLimiteHoras]);
        
        // todo: Retornar respuesta
        return rows;
    } catch (error) {
        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/chat.model.js → listarChatsAbiertosAntiguos ', error);
        return false;
    }
};

// * CERRAR CHAT POR ID
const cerrarChatPorId = async (idChat, estadoChat, estadoGestion, arbol, controlApi, descripcion, estadoRegistro, responsable) => {
    try {
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
        const result = await pool.query(query, [estadoChat, estadoGestion, arbol, controlApi, descripcion, estadoRegistro, responsable, idChat]);
        
        // todo: Si se modifico el registro
        if (result[0].affectedRows > 0) {
            return true;
        }
        
        return false;
    } catch (error) {
        // todo: Capturar el error
        console.log('❌ Error en v1/models/widget/chat.model.js → cerrarChatPorId ', error);
        return false;
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