// ! ================================================================================================================================================
// !                                                    SERVICIO DE CHAT AI SOUL
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

// ! PROCESAR MENSAJE AI SOUL
// * CONSUMO API
const enviarMensajeSoulChat = async (estructuraMensaje) => {
    const url = `${process.env.URL_API_SOUL_CHAT}/v1/messenger/in-message`;
    try {
        const response = await axios.post(url, estructuraMensaje, {
            headers: { "Content-Type": "application/json" }
        });
        
        // Retornar la respuesta de la API
        return response;
    } catch (error) {
        logger.error({
            contexto: 'service',
            recurso: 'serviceSoulChat.enviarMensajeSoulChat',
            codigoRespuesta: error.response?.status || 500,
            errorMensaje: error.message || error.response?.data?.message || 'Error desconocido',
            errorStack: error.stack,
            url,
            estructuraMensaje: {
                idChat: estructuraMensaje.idChat,
                remitente: estructuraMensaje.remitente,
                estado: estructuraMensaje.estado,
                type: estructuraMensaje.type
            },
            errorResponse: error.response?.data || null
        }, 'Error al procesar mensaje AI Soul');
        throw error;
    }
};


// ! EXPORTACIONES
module.exports = {
    enviarMensajeSoulChat,
};