// ! ================================================================================================================================================
// !                                                    SERVICIO DE SOUL CHAT
// ! ================================================================================================================================================
// @autor Ramón Dario Rozo Torres (26 de Enero de 2025)
// @últimaModificación Ramón Dario Rozo Torres (26 de Enero de 2025)
// @versión 1.0.0
// v1/services/serviceSoulChat.service.js

// ! REQUIRES
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: './../../.env' });
const logger = require('../logger');

// ! PROCESAR MENSAJE SOUL CHAT
// * CONSUMO API
const procesarMensajeAISoul = async (estructuraMensaje) => {

    const url = `${process.env.URL_API_SOUL_CHAT}/v1/messenger/in-message`;
    
    try {
        // Verificar si estructuraMensaje es FormData (tiene el método getHeaders)
        const esFormData = estructuraMensaje && typeof estructuraMensaje.getHeaders === 'function';
        
        let config;
        if (esFormData) {
            // Si es FormData, usar multipart/form-data
            config = {
                headers: {
                    ...estructuraMensaje.getHeaders()
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            };
        } else {
            // Si es objeto JSON, usar application/json
            config = {
                headers: { "Content-Type": "application/json" }
            };
        }

        const response = await axios.post(url, estructuraMensaje, config);
        
        // Manejo y control logger
        logger.info({
            contexto: 'service',
            recurso: 'serviceSoulChat.procesarMensajeAISoul',
            codigoRespuesta: response.status,
            respuesta: response.data
        }, 'Mensaje AI Soul procesado exitosamente');

        return response;
    } catch (error) {
        const esFormData = estructuraMensaje && typeof estructuraMensaje.getHeaders === 'function';
        
        logger.error({
            contexto: 'service',
            recurso: 'serviceSoulChat.procesarMensajeAISoul',
            codigoRespuesta: error.response?.status || 500,
            errorMensaje: error.message || error.response?.data?.message || 'Error desconocido',
            errorStack: error.stack,
            url,
            estructuraMensaje: esFormData ? 'FormData (con archivos)' : {
                idChat: estructuraMensaje?.idChat,
                remitente: estructuraMensaje?.remitente,
                estado: estructuraMensaje?.estado,
                type: estructuraMensaje?.type
            },
            errorResponse: error.response?.data || null
        }, 'Error al procesar mensaje AI Soul');
        throw error;
    }
};


// ! EXPORTACIONES
module.exports = {
    procesarMensajeAISoul,
};