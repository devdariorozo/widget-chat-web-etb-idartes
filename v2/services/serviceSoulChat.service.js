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

// ! PROCESAR MENSAJE AI SOUL
// * CONSUMO API
const procesarMensajeAISoul = async (estructuraMensaje) => {
    const url = `${process.env.URL_API_SOUL_CHAT}/v1/messenger/in-message`;
    try {
        const response = await axios.post(url, estructuraMensaje, {
            headers: { "Content-Type": "application/json" }
        });
        
        // Retornar la respuesta de la API
        return response;
    } catch (error) {
        console.log('Error al procesar mensaje AI Soul:', error);
        throw error;
    }
};


// ! EXPORTACIONES
module.exports = {
    procesarMensajeAISoul,
};