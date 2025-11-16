// ! ================================================================================================================================================
// !                                                      MODELOS PARA ARBOL CHAT BOT
// ! ================================================================================================================================================
// @autor Ramón Dario Rozo Torres
// @últimaModificación Ramón Dario Rozo Torres
// @versión 1.0.0
// v1/models/widget/arbolChatBot.model.js

// ! REQUIRES
const pool = require('../../config/database.js');
const path = require('path');
require('dotenv').config({ path: './../../.env' });
const modelChat = require('./chat.model.js');
const modelMensaje = require('./mensaje.model.js');
const dataEstatica = require('../../seeds/dataEstatica.js');
const serviceSoulChat = require('../../services/serviceSoulChat.service.js');
const logger = require('../../logger');

// ! VARIABLES GLOBALES
let chatData = {
    controlApi: '-',
    controlPeticiones: '-',
    resultadoApi: '-',
    nombres: '-',
    apellidos: '-',
    numeroCedula: '-',
    paisResidencia: '-',
    ciudadResidencia: '-',
    indicativoPais: '-',
    numeroCelular: '-',
    correoElectronico: '-',
    autorizacionDatosPersonales: '-',
    adjuntos: '-',
    rutaAdjuntos: '-',
    descripcion: '-',
    estadoRegistro: '-',
    responsable: '-',
};

// ! MODELOS
// * ARBOL CHAT BOT
const arbolChatBot = async (remitente, contenido) => {
    
    // Variables
    const defaultData = '-';
    const chat = await modelChat.filtrar(remitente);
    if (!chat || chat.length === 0) {
        logger.warn({
            contexto: 'model',
            recurso: 'arbolChatBot.arbolChatBot',
            remitente
        }, 'No se encontró chat asociado al remitente');
        return false;
    }

    const idChat = chat[0].ID_CHAT;
    const estadoGestionChat = chat[0].GESTION;

    // Deserializar los datos después de recuperarlos
    chatData.controlApi = chat[0].CONTROL_API || defaultData;
    chatData.controlPeticiones = parseInt(chat[0].CONTROL_PETICIONES) || 0;
    try {
        chatData.resultadoApi = chat[0].RESULTADO_API && chat[0].RESULTADO_API !== defaultData ? 
            (chat[0].RESULTADO_API === 'Message recived!' ? chat[0].RESULTADO_API : JSON.parse(chat[0].RESULTADO_API)) 
            : defaultData;
    } catch (e) {
        chatData.resultadoApi = chat[0].RESULTADO_API || defaultData;
    }
    chatData.nombres = chat[0].NOMBRES || defaultData;
    chatData.apellidos = chat[0].APELLIDOS || defaultData;
    chatData.numeroCedula = chat[0].NUMERO_CEDULA || defaultData;
    chatData.paisResidencia = chat[0].PAIS_RESIDENCIA || defaultData;
    chatData.ciudadResidencia = chat[0].CIUDAD_RESIDENCIA || defaultData;
    chatData.indicativoPais = chat[0].INDICATIVO_PAIS || defaultData;
    chatData.numeroCelular = chat[0].NUMERO_CELULAR || defaultData;
    chatData.correoElectronico = chat[0].CORREO_ELECTRONICO || defaultData;
    chatData.autorizacionDatosPersonales = chat[0].AUTORIZACION_DATOS_PERSONALES || defaultData;
    chatData.adjuntos = chat[0].ADJUNTOS || defaultData;
    chatData.rutaAdjuntos = chat[0].RUTA_ADJUNTOS || defaultData;
    chatData.descripcion = chat[0].DESCRIPCION || defaultData;
    chatData.estadoRegistro = chat[0].REGISTRO || defaultData;
    chatData.responsable = chat[0].RESPONSABLE || defaultData;

    if (estadoGestionChat === 'Cerrado') {
        return await chatCerrado(idChat, remitente);
    }

    try {
        // ! Siempre se envía el mensaje directamente a AI Soul
        const result = await enviarMensajeSoulChat(idChat, remitente, contenido);
        return result || true;
    } catch (error) {
        const api = 'Widget Chat Web ETB - IDARTES ';
        const procesoApi = 'Arbol Chat Bot';
        logger.error({
            contexto: 'model',
            recurso: 'arbolChatBot.arbolChatBot',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            idChat,
            remitente,
            api,
            procesoApi
        }, 'Error en v1/models/widget/arbolChatBot.model.js → arbolChatBot');
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// ! FUNCIONES AUXILIARES
// todo: Cliente Desiste Arbol
const clienteDesiste = async (idChat, remitente) => {
    try {
        const pasoArbol = dataEstatica.arbol.clienteDesiste;
        chatData.descripcion = 'Cliente desiste de continuar con la atención en el sistema.';

        await modelChat.actualizar(idChat, pasoArbol, chatData);

        await crearMensaje(
            idChat,
            remitente,
            dataEstatica.configuracion.estadoMensaje.enviado,
            dataEstatica.configuracion.tipoMensaje.texto,
            dataEstatica.mensajes.clienteDesiste,
            chatData.descripcion
        );

        await modelChat.cerrar(
            remitente,
            dataEstatica.configuracion.estadoChat.recibido,
            dataEstatica.configuracion.estadoGestion.cerrado,
            dataEstatica.arbol.despedida,
            dataEstatica.configuracion.controlApi.success,
            chatData.descripcion,
            dataEstatica.configuracion.estadoRegistro.activo,
            dataEstatica.configuracion.responsable
        );

        chatData.descripcion = 'Se envía mensaje de despedida.';
        return await crearMensaje(
            idChat,
            remitente,
            dataEstatica.configuracion.estadoMensaje.enviado,
            dataEstatica.configuracion.tipoMensaje.finChat,
            dataEstatica.mensajes.despedida,
            chatData.descripcion
        );
    } catch (error) {
        // todo: Enviar mensaje de error por API
        const api = 'Widget Chat Web ETB - IDARTES ';
        const procesoApi = 'Cliente Desiste';
        logger.error({
            contexto: 'model',
            recurso: 'arbolChatBot.clienteDesiste',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            idChat,
            remitente,
            api,
            procesoApi
        }, 'Error en v1/models/widget/arbolChatBot.model.js → clienteDesiste');
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Solicitar Formulario Inicial Arbol
const solicitarFormularioInicial = async (idChat, remitente) => {
    const solicitarFormularioInicialArbol = dataEstatica.arbol.solicitarFormularioInicial;
    chatData.descripcion = 'Se solicita el formulario inicial.';
    await modelChat.actualizar(idChat, solicitarFormularioInicialArbol, chatData);
    return await crearMensaje(
        idChat,
        remitente,
        dataEstatica.configuracion.estadoMensaje.enviado,
        dataEstatica.configuracion.tipoMensaje.formulario,
        dataEstatica.mensajes.solicitarFormularioInicial,
        chatData.descripcion
    );
};

// todo: Procesar Mensaje AI Soul Arbol
const enviarMensajeSoulChat = async (idChat, remitente, contenido) => {
    
    try {
        const estructuraMensaje = {
            provider: "web",
            canal: 3,
            idChat: idChat,
            remitente: remitente,  // Este es el valor del remitente
            estado: "START",  // Estado del mensaje, por ejemplo, "START" O "ATTENDING" O "END"
            mensaje: contenido,  // El mensaje que envías
            type: "TEXT",  // Tipo de mensaje, por ejemplo, "TEXT" o "MEDIA" o "VOICE"
            // Pasamos los datos del formulario para que la AI Soul los tenga en cuenta
            nombres: chatData.nombres, // nombre del cliente
            apellidos: chatData.apellidos, // apellido del cliente
            numeroCedula: chatData.numeroCedula, // numero de cedula del cliente
            paisResidencia: chatData.paisResidencia, // pais de residencia del cliente
            ciudadResidencia: chatData.ciudadResidencia, // ciudad de residencia del cliente
            indicativoPais: chatData.indicativoPais, // indicativo de pais del cliente
            numeroCelular: chatData.numeroCelular, // numero de celular del cliente
            correoElectronico: chatData.correoElectronico, // correo electronico del cliente
            autorizacionDatosPersonales: chatData.autorizacionDatosPersonales, // autorizacion de datos personales del cliente
            responsable: dataEstatica.configuracion.responsable // responsable del cliente
        };
        
        // Control de intentos
        if (chatData.controlPeticiones <= 5) {
            
            // ? Consumir servicio de AI Soul
            const response = await serviceSoulChat.enviarMensajeSoulChat(estructuraMensaje);
            chatData.resultadoApi = response.data;

            // Si la respuesta tiene status 200 o 202
            if (response.status === 200 || response.status === 202) {
                // Variables
                const pasoArbol = dataEstatica.arbol.pasoDirectoSoulChat;
                chatData.controlApi = dataEstatica.configuracion.controlApi.success;
                chatData.descripcion = 'AI Soul ha recibido el mensaje, se encuentra procesando la respuesta.';

                // Actualizar el chat
                const updateResult = await modelChat.actualizar(idChat, pasoArbol, chatData);
                return updateResult || true; // Asegurar que siempre retorne algo válido
            } else {
                // Variables
                const pasoArbol = dataEstatica.arbol.pasoDirectoSoulChat;
                chatData.controlPeticiones++;
                chatData.descripcion = 'AI Soul esta presentando una novedad o incidencia técnica.';
                
                // Actualizar el chat
                await modelChat.actualizar(idChat, pasoArbol, chatData);

                // todo: Enviar mensaje de error por API
                const api = 'Soul Chat';
                const procesoApi = 'Procesar Mensaje AI';
                const error = response;
                const errorResult = await errorAPI(api, procesoApi, error, idChat, remitente);
                return errorResult || false;
            }

        } else {
            chatData.descripcion = 'Se presenta novedad con el servicio de AI Soul, se procede a cerrar el chat por limite de intentos.';
            // Crear mensaje de novedad o incidencia técnica
            await crearMensaje(
                idChat,
                remitente,
                dataEstatica.configuracion.estadoMensaje.enviado,
                dataEstatica.configuracion.tipoMensaje.texto,
                dataEstatica.mensajes.novedadIncidenciaTecnica,
                chatData.descripcion
            );

            // Solicitar cerrar el chat
            await modelChat.cerrar(
                remitente,
                dataEstatica.configuracion.estadoChat.recibido,
                dataEstatica.configuracion.estadoGestion.cerrado,
                dataEstatica.arbol.despedida,
                dataEstatica.configuracion.controlApi.error,
                chatData.descripcion,
                dataEstatica.configuracion.estadoRegistro.activo,
                dataEstatica.configuracion.responsable
            );
            return false;
        }

    } catch (error) {
        const api = 'Soul Chat';
        const procesoApi = 'Procesar Mensaje AI';
        logger.error({
            contexto: 'model',
            recurso: 'arbolChatBot.enviarMensajeSoulChat',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            idChat,
            remitente,
            api,
            procesoApi,
            controlPeticiones: chatData.controlPeticiones
        }, 'Error en v1/models/widget/arbolChatBot.model.js → enviarMensajeSoulChat');
        const errorResult = await errorAPI(api, procesoApi, error, idChat, remitente);
        return errorResult || false;
    }
};

// // todo: Solicitar Condicion Adjuntos Arbol
// const solicitarCondicionAdjuntos = async (idChat, remitente, contenido) => {
//     const solicitarCondicionAdjuntosArbol = dataEstatica.arbol[17];
//     const descripcion = 'Se solicita adjuntar documentos.';
//     await actualizarChat(idChat, solicitarCondicionAdjuntosArbol, descripcion, chatData);
//     return await crearMensaje(idChat, remitente, dataEstatica.estadoMensaje[1], dataEstatica.tipoMensaje[0], dataEstatica.condicionAdjuntos, descripcion);
// };

// // todo: Procesar Condicion Adjuntos Arbol
// const procesarCondicionAdjuntos = async (idChat, remitente, contenido) => {
//     if (contenido === '1') {
//         chatData.adjuntos = 'Si';
//         return await solicitarConfirmarAdjuntos(idChat, remitente, contenido);
//     } else if (contenido === '2') {
//         chatData.adjuntos = 'No';
//         chatData.rutaAdjuntos = '-';
//         return await solicitarConfirmarEspacioAgendamiento(idChat, remitente);
//     } else {
//         return await manejarNoEntiendoYReintentar(idChat, remitente, 'Condicion Adjuntos');
//     }
// };

// // todo: Solicitar Confirmar Adjuntos Arbol
// const solicitarConfirmarAdjuntos = async (idChat, remitente, contenido) => {
//     const solicitarConfirmarAdjuntosArbol = dataEstatica.arbol[18];
//     const descripcion = 'Se solicita adjuntar documentos.';
//     await actualizarChat(idChat, solicitarConfirmarAdjuntosArbol, descripcion, chatData);
//     return await crearMensaje(idChat, remitente, dataEstatica.estadoMensaje[1], dataEstatica.tipoMensaje[1], dataEstatica.confirmarAdjuntos, descripcion);
// };

// // todo: Enviar los archivos adjuntos
// const procesarArchivosAdjuntos = async (idChat, remitente, contenido) => {
//     const enlacesChat = await modelChat.filtrarEnlaces(idChat);
//     const rutaAdjuntos = enlacesChat.RUTA_ADJUNTOS;
//     const APP_URL = decrypt(process.env.APP_URL);
//     const enlaces = rutaAdjuntos.split('|');
//     // Pasar el valor a la variable global
//     chatData.rutaAdjuntos = rutaAdjuntos;

//     let mensajeEnlaces = '<p id="archivosAdjuntosClienteArbol">✅ <b>Hemos recibido los siguientes archivos adjuntos:</b><br/><br/>';

//     enlaces.forEach(enlace => {
//         const nombreArchivo = enlace.split('/').pop();
//         mensajeEnlaces += `📄 <a href="${APP_URL}${enlace}" target="_blank">${nombreArchivo}</a><br/><br/>`;
//     });

//     mensajeEnlaces += '</p>';

//     const descripcion = 'Enlaces de archivos adjuntos enviados.';
//     await crearMensaje(idChat, remitente, dataEstatica.estadoMensaje[1], dataEstatica.tipoMensaje[2], mensajeEnlaces, descripcion);

//     // Continuar con el siguiente paso en el árbol
//     return await solicitarConfirmarEspacioAgendamiento(idChat, remitente, contenido);
// };

// // todo: Actualizar ruta de adjuntos en chat
// const actualizarRutaAdjuntos = async (idChat, enlaces) => {
//     const query = `
//         UPDATE tbl_chat
//         SET cht_ruta_adjuntos = ?
//         WHERE cht_id = ?;
//     `;
//     return await pool.query(query, [enlaces, idChat]);
// };

// todo: Manejar no entender
const manejarNoEntiendo = async (idChat, remitente, pasoArbol, alertaNoEntiendo) => {
    try {
        chatData.descripcion = 'Se notifica que no se entiende el mensaje.';
        await modelChat.actualizar(idChat, pasoArbol, chatData);
        await crearMensaje(idChat, remitente, dataEstatica.configuracion.estadoMensaje.enviado, dataEstatica.configuracion.tipoMensaje.texto, alertaNoEntiendo, chatData.descripcion);
        return true;
    } catch (error) {
        // todo: Enviar mensaje de error por API
        const api = 'Widget Chat Web MinTic ';
        const procesoApi = 'Funcion manejarNoEntiendo';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → manejarNoEntiendo: ', error);
        await errorAPI(api, procesoApi, error, idChat, remitente);
        return false;
    }
};


// todo: Crear mensaje
const crearMensaje = async (idChat, remitente, estadoMensaje, tipoMensaje, contenido, descripcion) => {
    const enlaces = '-';
    const lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
    const estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
    const responsable = dataEstatica.configuracion.responsable;
    return await modelMensaje.crear(idChat, remitente, estadoMensaje, tipoMensaje, contenido, enlaces, lectura, descripcion, estadoRegistro, responsable);
};

// todo: Función para manejar errores de API
const errorAPI = async (api, procesoApi, error, idChat, remitente) => {
    // Variables
    let estadoMensaje = dataEstatica.configuracion.estadoMensaje.enviado;
    let tipoMensaje = dataEstatica.configuracion.tipoMensaje.errorApi;
    let contenidoAlertaErrorAPI = dataEstatica.mensajes.alertaErrorAPI;
    let descripcion = '';
    let resultadoApi = {};

    // Formatear el error dependiendo de la respuesta
    if (error.response && error.response.data) {
        descripcion = `API ${api} → ${error.response.data.title || procesoApi} - ${error.response.data.message || 'Error desconocido'} - Presenta novedad.`;
        resultadoApi = JSON.stringify({
            status: error.response.status,
            message: error.response.data.message,
            error: error.response.data.error,
            api: error.response.data.api
        });
    } else {
        descripcion = `API ${api} → ${procesoApi} - Presenta novedad.`;
        resultadoApi = JSON.stringify({
            status: error.status || 500,
            message: error.message || error.data || 'Error desconocido',
            error: error.toString()
        });
    }

    // todo: Actualizar chat
    const controlApi = dataEstatica.configuracion.controlApi.error;
    let connMySQL;
    try {
        // todo: Obtener conexión del pool
        connMySQL = await pool.getConnection();

        const query = `
            UPDATE tbl_chat
            SET 
                cht_descripcion = ?, 
                cht_control_api = ?,
                cht_resultado_api = ?
            WHERE cht_id = ?;
        `;
        await connMySQL.query(query, [descripcion, controlApi, resultadoApi, idChat]);

        await crearMensaje(idChat, remitente, estadoMensaje, tipoMensaje, contenidoAlertaErrorAPI, descripcion);
    } catch (error) {
        logger.error({
            contexto: 'model',
            recurso: 'arbolChatBot.errorAPI',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            idChat,
            remitente,
            api,
            procesoApi
        }, 'Error en v1/models/widget/arbolChatBot.model.js → errorAPI');
    } finally {
        // todo: Liberar conexión al pool
        if (connMySQL) connMySQL.release();
    }
    return false;
};

// todo: Crear alerta de inactividad
const crearAlertaInactividad = async (idChatWeb, descripcion, nombreCliente = null) => {
    const chat = await modelChat.filtrar(idChatWeb);
    if (chat.length > 0) {
        const idChat = chat[0].ID_CHAT;
        const remitente = idChatWeb;
        const estadoMensaje = dataEstatica.configuracion.estadoMensaje.enviado;
        const tipoMensaje = dataEstatica.configuracion.tipoMensaje.inactividad;

        // Validar si el nombre del cliente es válido
        const esNombreValido = nombreCliente && nombreCliente.trim() && nombreCliente !== '-';

        // Construir el contenido del mensaje según el tiempo de inactividad
        let contenido;
        if (descripcion.includes('2 minutos')) {
            contenido = esNombreValido
                ? `<p class=\"alertaInactividadArbol\"><b>Inactividad de 2 minutos.</b><br/><br/>
                    ⏳ Apreciado(a) ${nombreCliente}, hemos notado que lleva 2 minutos de inactividad.<br/><br/>
                    🤔 ¿Necesita ayuda? <br/><br/>
                    💬 Estamos aquí para asistirle. <br/><br/> 
                    👉 Por favor, responda a su última interacción para continuar. 😊</p>`
                : `<p class=\"alertaInactividadArbol\"><b>Inactividad de 2 minutos.</b><br/><br/>
                    ⏳ Apreciado Usuario, hemos notado que lleva 2 minutos de inactividad.<br/><br/>
                    🤔 ¿Necesita ayuda? <br/><br/> 
                    💬 Estamos aquí para asistirle. <br/><br/> 
                    👉 Por favor, responda a su última interacción para continuar. 😊</p>`;
        } else if (descripcion.includes('3 minutos')) {
            contenido = esNombreValido
                ? `<p class=\"alertaInactividadArbol\"><b>Inactividad de 3 minutos.</b><br/><br/>
                    ⏳ Apreciado(a) ${nombreCliente}, lleva 3 minutos de inactividad.<br/><br/>
                    ⚠️ Recuerde que si no responde, la sesión se cerrará automáticamente.<br/><br/>
                    💬 Responda por favor para mantener la conversación activa.</p>`
                : `<p class=\"alertaInactividadArbol\"><b>Inactividad de 3 minutos.</b><br/><br/>
                    ⏳ Apreciado Usuario, lleva 3 minutos de inactividad.<br/><br/>
                    ⚠️ Recuerde que si no responde, la sesión se cerrará automáticamente.<br/><br/>
                    💬 Responda por favor para mantener la conversación activa.</p>`;
        } else if (descripcion.includes('4 minutos')) {
            contenido = esNombreValido
                ? `<p class=\"alertaInactividadArbol\"><b>Inactividad de 4 minutos.</b><br/><br/>
                    ⚠️ Apreciado(a) ${nombreCliente}, su sesión se cerrará en 1 minuto por inactividad.<br/><br/>
                    🚨 ¡Última advertencia! <br/><br/>
                    💬 Responda por favor ahora para mantener la conversación activa. <br/><br/>
                    👉 Si no responde, el chat se cerrará automáticamente. 😔</p>`
                : `<p class=\"alertaInactividadArbol\"><b>Inactividad de 4 minutos.</b><br/><br/>
                    ⚠️ Apreciado Usuario, su sesión se cerrará en 1 minuto por inactividad.<br/><br/>
                    🚨 ¡Última advertencia! <br/><br/>
                    💬 Responda por favor ahora para mantener la conversación activa. <br/><br/>
                    👉 Si no responde, el chat se cerrará automáticamente. 😔</p>`;
        }

        const enlaces = '-';
        const lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
        const estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
        const responsable = dataEstatica.configuracion.responsable;

        await modelMensaje.crear(idChat, remitente, estadoMensaje, tipoMensaje, contenido, enlaces, lectura, descripcion, estadoRegistro, responsable);
    }
};

// todo: Crear mensaje de cierre por inactividad
const crearMensajeCierreInactividad = async (idChatWeb) => {
    const chat = await modelChat.filtrar(idChatWeb);
    if (chat.length > 0) {
        const idChat = chat[0].ID_CHAT;
        const remitente = idChatWeb;
        const estadoMensaje = dataEstatica.configuracion.estadoMensaje.enviado;
        const tipoMensaje = dataEstatica.configuracion.tipoMensaje.finChat;
        const contenido = `<p class=\"mensajeCierreInactividadArbol\"><b>Chat cerrado por inactividad</b><br/><br/>
        🚫 Su sesión ha finalizado debido a un periodo prolongado de inactividad (5 minutos). <br/><br/>
        💬 ¡Estamos aquí para ayudarle! 😊<br/><br/>
        👉 <b>Por favor, cierre esta ventana y vuelva a abrir el chat para iniciar una nueva conversación.</b></p>`;
        const enlaces = '-';
        const lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
        const estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
        const responsable = dataEstatica.configuracion.responsable;
        const descripcion = 'Chat cerrado por inactividad.';

        await modelMensaje.crear(idChat, remitente, estadoMensaje, tipoMensaje, contenido, enlaces, lectura, descripcion, estadoRegistro, responsable);
    }
};

// todo: Chat cerrado
const chatCerrado = async (idChat, remitente) => {
    const enlaces = '-';
    const lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
    const estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
    const responsable = dataEstatica.configuracion.responsable;
    const descripcion = 'Este chat está actualmente cerrado.'
    return await crearMensaje(
        idChat,
        remitente,
        dataEstatica.configuracion.estadoMensaje.enviado,
        dataEstatica.configuracion.tipoMensaje.finChat,
        dataEstatica.mensajes.chatDiferenteAbierto,
        descripcion,
        enlaces,
        lectura,
        estadoRegistro,
        responsable
    );
};

// ! EXPORTACIONES
module.exports = {
    arbolChatBot,
    // actualizarRutaAdjuntos,
    // procesarArchivosAdjuntos,
    crearAlertaInactividad,
    crearMensajeCierreInactividad,
};