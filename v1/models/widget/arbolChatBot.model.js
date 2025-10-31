// ! ================================================================================================================================================
// !                                                      MODELOS PARA ARBOL CHAT BOT
// ! ================================================================================================================================================
// @autor Ramón Dario Rozo Torres (24 de Enero de 2025)
// @últimaModificación Ramón Dario Rozo Torres (24 de Enero de 2025)
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

// ! VARIABLES GLOBALES
let chatData = {
    controlApi: '-',
    controlPeticiones: '-',
    resultadoApi: '-',
    nombresApellidos: '-',
    genero: '-',
    correoElectronico: '-',
    telefono: '-',
    localidad: '-',
    enQuePodemosAyudarle: '-',
    rangoEdad: '-',
    autorizacionTratamientoDatos: '-',
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
    const idChat = chat[0].ID_CHAT;
    const arbolChat = chat[0].ARBOL;
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
    chatData.nombresApellidos = chat[0].NOMBRES_APELLIDOS || defaultData;
    chatData.genero = chat[0].GENERO || defaultData;
    chatData.correoElectronico = chat[0].CORREO_ELECTRONICO || defaultData;
    chatData.telefono = chat[0].TELEFONO || defaultData;
    chatData.localidad = chat[0].LOCALIDAD || defaultData;
    chatData.enQuePodemosAyudarle = chat[0].EN_QUE_PODEMOS_AYUDARLE || defaultData;
    chatData.rangoEdad = chat[0].RANGO_EDAD || defaultData;
    chatData.autorizacionTratamientoDatos = chat[0].AUTORIZACION_TRATAMIENTO_DATOS || defaultData;
    chatData.descripcion = chat[0].DESCRIPCION || defaultData;
    chatData.estadoRegistro = chat[0].REGISTRO || defaultData;
    chatData.responsable = chat[0].RESPONSABLE || defaultData;

    if (estadoGestionChat !== 'Cerrado') {
        try {
            // todo: Saludo Arbol
            if (arbolChat === 'Saludo' || arbolChat === 'Alerta No Entiendo - Saludo') {
                    
                // todo: Solicitar Nombres y Apellidos
                return await solicitarNombresApellidos(idChat, remitente);                
            }

            // todo: Nombres y Apellidos Arbol
            if (arbolChat === 'Solicitar Nombres Apellidos' || arbolChat === 'Alerta No Entiendo - Solicitar Nombres Apellidos') {
                // ? Procesar Nombres y Apellidos
                return await procesarNombresApellidos(idChat, remitente, contenido);
            }

            // todo: Género Arbol
            if (arbolChat === 'Solicitar Genero' || arbolChat === 'Alerta No Entiendo - Solicitar Genero') {
                // ? Procesar Género
                return await procesarGenero(idChat, remitente, contenido);
            }

            // todo: Correo Electrónico Arbol
            if (arbolChat === 'Solicitar Correo Electrónico' || arbolChat === 'Alerta No Entiendo - Solicitar Correo Electrónico') {
                // ? Procesar Correo Electrónico
                return await procesarCorreoElectronico(idChat, remitente, contenido);
            }

            // todo: Número de Teléfono Arbol
            if (arbolChat === 'Solicitar Numero Telefono' || arbolChat === 'Alerta No Entiendo - Solicitar Numero Telefono') {
                // ? Procesar Número de Teléfono
                return await procesarNumeroTelefono(idChat, remitente, contenido);
            }

            // todo: Localidad Arbol
            if (arbolChat === 'Solicitar Localidad' || arbolChat === 'Alerta No Entiendo - Solicitar Localidad') {
                // ? Procesar Localidad
                return await procesarLocalidad(idChat, remitente, contenido);
            }

            // todo: En Que Podemos Ayudarle Arbol
            if (arbolChat === 'Solicitar En Que Podemos Ayudarle' || arbolChat === 'Alerta No Entiendo - Solicitar En Que Podemos Ayudarle') {
                // ? Procesar En Que Podemos Ayudarle
                return await procesarEnQuePodemosAyudarle(idChat, remitente, contenido);
            }

            // todo: Rango Edad Arbol
            if (arbolChat === 'Solicitar Rango Edad' || arbolChat === 'Alerta No Entiendo - Solicitar Rango Edad') {
                // ? Procesar Rango Edad
                return await procesarRangoEdad(idChat, remitente, contenido);
            }

            // todo: Autorizacion Tratamiento Datos Arbol
            if (arbolChat === 'Solicitar Autorizacion Tratamiento Datos' || arbolChat === 'Alerta No Entiendo - Solicitar Autorizacion Tratamiento Datos') {
                // ? Procesar Autorizacion Tratamiento Datos
                return await procesarAutorizacionTratamientoDatos(idChat, remitente, contenido);
            }

            return true;
        } catch (error) {
            // todo: Enviar mensaje de error por API
            const api = dataEstatica.configuracion.responsable;
            const procesoApi = 'Arbol Chat Bot';
            console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → arbolChatBot: ', error);
            return await errorAPI(api, procesoApi, error, idChat, remitente);
        }
    } else {
        return await chatCerrado(idChat, remitente);
    }
};

// ! FUNCIONES AUXILIARES

// todo: Solicitar Nombres y Apellidos Arbol
const solicitarNombresApellidos = async (idChat, remitente) => {
    try {
        const solicitarNombresApellidosArbol = dataEstatica.arbol.solicitarNombresApellidos;
        chatData.descripcion = 'Se solicitan los nombres y apellidos.';
        await modelChat.actualizar(idChat, solicitarNombresApellidosArbol, chatData);
        const resultadoMensaje = await crearMensaje(idChat, remitente, dataEstatica.configuracion.estadoMensaje.enviado, dataEstatica.configuracion.tipoMensaje.texto, dataEstatica.mensajes.solicitarNombresApellidos, chatData.descripcion);
        return resultadoMensaje;
    } catch (error) {
        // ? Error api  
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarNombresApellidos';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarNombresApellidos: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Procesar Nombres y Apellidos Arbol
const procesarNombresApellidos = async (idChat, remitente, contenido) => {
    try {
        // Validar que el contenido tenga al menos dos palabras (nombres y apellidos)
        if (typeof contenido === 'string') {
            const palabras = contenido.trim().split(/\s+/).filter(Boolean);
            if (palabras.length >= 2) {
                // Pasar cada palabra a Capital (primera letra mayúscula, resto minúscula) antes de guardar
                const nombresApellidosCapital = palabras
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                    console.log('nombresApellidosCapital: ', nombresApellidosCapital);
                chatData.nombresApellidos = nombresApellidosCapital;

                // Solicitar Género
                return await solicitarGenero(idChat, remitente);
            }
        }
        // Si no es válido, llamamos la función para cuando no entiende
        const pasoArbol = 'Alerta No Entiendo - Solicitar Nombres Apellidos';
            const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol">❓ <b>No entiendo su respuesta.</b><br/><br/>
            ⚠️ <i>Por favor ingresar minimo un nombre y un apellido.</i></p>`;

        const resultado = await manejarNoEntiendo(idChat, remitente, pasoArbol, alertaNoEntiendo);
        if (resultado) {
            // Mostrar nuevamente el mensaje de solicitud para que el usuario vea qué se le está pidiendo
            const resultadoSolicitar = await solicitarNombresApellidos(idChat, remitente);
            return resultadoSolicitar;
        }
        return false;
    } catch (error) {
        // ? Error api  
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion procesarNombresApellidos';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → procesarNombresApellidos: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Solicitar Genero Arbol
const solicitarGenero = async (idChat, remitente) => {
    try {
        const solicitarGeneroArbol = dataEstatica.arbol.solicitarGenero;
        chatData.descripcion = 'Se solicita el género.';
        await modelChat.actualizar(idChat, solicitarGeneroArbol, chatData);
        return await crearMensaje(idChat, remitente, dataEstatica.configuracion.estadoMensaje.enviado, dataEstatica.configuracion.tipoMensaje.texto, dataEstatica.mensajes.solicitarGenero, chatData.descripcion);
    } catch (error) {
        // ? Error api  
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarGenero';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarGenero: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Procesar Género Arbol
const procesarGenero = async (idChat, remitente, contenido) => {
    try {
        // ? Procesar Género
        if (contenido === '1') {
            chatData.genero = 'Femenino';
            return await solicitarCorreoElectronico(idChat, remitente);
        } else if (contenido === '2') {
            chatData.genero = 'Masculino';
            return await solicitarCorreoElectronico(idChat, remitente);
        } else if (contenido === '3') {
            chatData.genero = 'Transgénero';
            return await solicitarCorreoElectronico(idChat, remitente);
        } else {
            const pasoArbol = 'Alerta No Entiendo - Solicitar Genero';
            const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol">❓ <b>No entiendo su respuesta.</b><br/><br/>
            ⚠️ <i>Por favor seleccionar una opción válida para continuar.</i></p>`;
            const resultado = await manejarNoEntiendo(idChat, remitente, pasoArbol, alertaNoEntiendo);
            if (resultado) {
                // Mostrar nuevamente el mensaje de solicitud para que el usuario vea qué se le está pidiendo
                return await solicitarGenero(idChat, remitente);
            }
            return false;
        }
    } catch (error) {
        // ? Error api  
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion procesarGenero';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → procesarGenero: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Solicitar Correo Electrónico Arbol
const solicitarCorreoElectronico = async (idChat, remitente) => {
    try {
        const solicitarCorreoElectronicoArbol = dataEstatica.arbol.solicitarCorreoElectronico;
        chatData.descripcion = 'Se solicita el correo electrónico.';
        await modelChat.actualizar(idChat, solicitarCorreoElectronicoArbol, chatData);
        return await crearMensaje(idChat, remitente, dataEstatica.configuracion.estadoMensaje.enviado, dataEstatica.configuracion.tipoMensaje.texto, dataEstatica.mensajes.solicitarCorreoElectronico, chatData.descripcion);
    } catch (error) {
        // ? Error api
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarCorreoElectronico';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarCorreoElectronico: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Procesar Correo Electrónico Arbol
const procesarCorreoElectronico = async (idChat, remitente, contenido) => {
    try {
        console.log('contenido: ', contenido);
        // Validar correo electrónico usando expresión regular robusta
        // Esta regex permite emails estándar (RFC 5322 simplificada)
        const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

        if (emailRegex.test(contenido.trim())) {
            chatData.correoElectronico = contenido.trim();
            return await solicitarNumeroTelefono(idChat, remitente);
        } else {
            const pasoArbol = 'Alerta No Entiendo - Solicitar Correo Electrónico';
            const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol">❓ <b>No entiendo su respuesta.</b><br/><br/>
            ⚠️ <i>Por favor ingrese un correo electrónico válido.</i></p>`;

            const resultado = await manejarNoEntiendo(idChat, remitente, pasoArbol, alertaNoEntiendo);
            if (resultado) {
                // Mostrar nuevamente el mensaje de solicitud para que el usuario vea qué se le está pidiendo
                return await solicitarCorreoElectronico(idChat, remitente);
            }
            return false;
        }
    } catch (error) {
        // ? Error api  
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion procesarCorreoElectronico';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → procesarCorreoElectronico: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Solicitar Número de Teléfono Arbol
const solicitarNumeroTelefono = async (idChat, remitente) => {
    try {
        const solicitarNumeroTelefonoArbol = dataEstatica.arbol.solicitarNumeroTelefono;
        chatData.descripcion = 'Se solicita el número de teléfono.';
        await modelChat.actualizar(idChat, solicitarNumeroTelefonoArbol, chatData);
        return await crearMensaje(idChat, remitente, dataEstatica.configuracion.estadoMensaje.enviado, dataEstatica.configuracion.tipoMensaje.texto, dataEstatica.mensajes.solicitarNumeroTelefono, chatData.descripcion);
    } catch (error) {

        // ? Error api  
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarNumeroTelefono';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarNumeroTelefono: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Procesar Número de Teléfono Arbol
const procesarNumeroTelefono = async (idChat, remitente, contenido) => {
    try {
        // Solo aceptar números, permitir entre 10 y 15 dígitos, solo numérico
        // Eliminar espacios, guiones u otros caracteres y verificar que el input solo sean números

        // Eliminar espacios en blanco y guiones, luego validar que solo contenga números
        const limpio = contenido.replace(/\s|-/g, '');

        // Revisar que la cadena resultante solo tenga dígitos
        const soloNumeros = /^\d+$/;

        if (soloNumeros.test(limpio) && limpio.length >= 10 && limpio.length <= 15) {
            chatData.telefono = limpio;
            return await solicitarLocalidad(idChat, remitente);
        } else {
            const pasoArbol = 'Alerta No Entiendo - Solicitar Numero Telefono';
            const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol">❓ <b>No entiendo su respuesta.</b><br/><br/>
            ⚠️ <i>Por favor ingrese un número de teléfono válido. Sólo use números, entre 10 y 15 dígitos.<br/>
            <b>Ejemplos válidos:</b> <br/>
            3216549870, 6015235568, 573214569870, 93212351256
            </i></p>`;
            const resultado = await manejarNoEntiendo(idChat, remitente, pasoArbol, alertaNoEntiendo);
            if (resultado) {
                // Mostrar nuevamente el mensaje de solicitud para que el usuario vea qué se le está pidiendo
                return await solicitarNumeroTelefono(idChat, remitente);
            }
            return false;
        }
    } catch (error) {
        // ? Error api  
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion procesarNumeroTelefono';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → procesarNumeroTelefono: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Solicitar Localidad Arbol
const solicitarLocalidad = async (idChat, remitente) => {
    try {
        const solicitarLocalidadArbol = dataEstatica.arbol.solicitarLocalidad;
        chatData.descripcion = 'Se solicita la localidad.';
        await modelChat.actualizar(idChat, solicitarLocalidadArbol, chatData);
        return await crearMensaje(idChat, remitente, dataEstatica.configuracion.estadoMensaje.enviado, dataEstatica.configuracion.tipoMensaje.texto, dataEstatica.mensajes.solicitarLocalidad, chatData.descripcion);
    } catch (error) {
        // ? Error api
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarLocalidad';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarLocalidad: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Procesar Localidad Arbol
const procesarLocalidad = async (idChat, remitente, contenido) => {
    try {
        // Limpiar y trim para evitar espacios en blanco extras
        const localidadInput = contenido ? contenido.trim() : "";
        if (localidadInput.length >= 3 && localidadInput.length <= 250) {
            console.log('localidadInput: ', localidadInput);
            // Capitalizar cada palabra de la localidad (primera letra mayúscula)
            const localidadCapital = localidadInput
                .split(/\s+/)
                .filter(Boolean)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            chatData.localidad = localidadCapital;
            return await solicitarEnQuePodemosAyudarle(idChat, remitente);
        } else {
            console.log('localidadInput: ', localidadInput);
            const pasoArbol = 'Alerta No Entiendo - Solicitar Localidad';
            const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol">❓ <b>No entiendo su respuesta.</b><br/><br/>
            ⚠️ <i>Por favor ingrese una localidad válida (mínimo 3, máximo 250 caracteres).</i></p>`;
            const resultado = await manejarNoEntiendo(idChat, remitente, pasoArbol, alertaNoEntiendo);
            if (resultado) {
                // Mostrar nuevamente el mensaje de solicitud para que el usuario vea qué se le está pidiendo
                return await solicitarLocalidad(idChat, remitente);
            }
            return false;
        }
    }
    catch (error) {
        // ? Error api
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion procesarLocalidad';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → procesarLocalidad: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Solicitar En Que Podemos Ayudarle Arbol
const solicitarEnQuePodemosAyudarle = async (idChat, remitente) => {
    try {
        const solicitarEnQuePodemosAyudarleArbol = dataEstatica.arbol.solicitarEnQuePodemosAyudarle;
        chatData.descripcion = 'Se solicita en que podemos ayudarle.';
        await modelChat.actualizar(idChat, solicitarEnQuePodemosAyudarleArbol, chatData);
        return await crearMensaje(idChat, remitente, dataEstatica.configuracion.estadoMensaje.enviado, dataEstatica.configuracion.tipoMensaje.texto, dataEstatica.mensajes.solicitarEnQuePodemosAyudarle, chatData.descripcion);
    } catch (error) {
        // ? Error api
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarEnQuePodemosAyudarle';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarEnQuePodemosAyudarle: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Procesar En Que Podemos Ayudarle Arbol
const procesarEnQuePodemosAyudarle = async (idChat, remitente, contenido) => {
    try {
        // Validar mínimo 3 caracteres y máximo 1000 caracteres
        const texto = contenido ? contenido.trim() : '';
        if (texto.length >= 3 && texto.length <= 1000) {
            // Separar palabras y capitalizar solo la primera; el resto como llegue
            const palabras = texto.split(/\s+/);
            if (palabras.length > 0) {
                const primeraCapital = palabras[0].charAt(0).toUpperCase() + palabras[0].slice(1).toLowerCase();
                const resto = palabras.slice(1).join(' ');
                const resultado = resto.length > 0 ? `${primeraCapital} ${resto}` : primeraCapital;
                chatData.enQuePodemosAyudarle = resultado;
            } else {
                chatData.enQuePodemosAyudarle = '';
            }
            return await solicitarRangoEdad(idChat, remitente);
        } else {
            const pasoArbol = 'Alerta No Entiendo - Solicitar En Que Podemos Ayudarle';
            const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol">❓ <b>No entiendo su respuesta.</b><br/><br/>
            ⚠️ <i>Por favor escriba al menos 3 caracteres (máx 1000) y vuelva a intentarlo.</i></p>`;
            const resultado = await manejarNoEntiendo(idChat, remitente, pasoArbol, alertaNoEntiendo);
            if (resultado) {
                // Mostrar nuevamente el mensaje de solicitud para que el usuario vea qué se le está pidiendo
                return await solicitarEnQuePodemosAyudarle(idChat, remitente);
            }
            return false;
        }
    }
    catch (error) {
        // ? Error api
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion procesarEnQuePodemosAyudarle';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → procesarEnQuePodemosAyudarle: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Solicitar Rango Edad Arbol
const solicitarRangoEdad = async (idChat, remitente) => {
    try {
        const solicitarRangoEdadArbol = dataEstatica.arbol.solicitarRangoEdad;
        chatData.descripcion = 'Se solicita el rango de edad.';
        await modelChat.actualizar(idChat, solicitarRangoEdadArbol, chatData);
        return await crearMensaje(idChat, remitente, dataEstatica.configuracion.estadoMensaje.enviado, dataEstatica.configuracion.tipoMensaje.texto, dataEstatica.mensajes.solicitarRangoEdad, chatData.descripcion);
    } catch (error) {
        // ? Error api
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarRangoEdad';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarRangoEdad: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Procesar Rango Edad Arbol
const procesarRangoEdad = async (idChat, remitente, contenido) => {
    try {
        // ? Procesar Rango Edad
        if (contenido === '1') {
            chatData.rangoEdad = '0 a 11 años';
            return await solicitarAutorizacionTratamientoDatos(idChat, remitente);
        } else if (contenido === '2') {
            chatData.rangoEdad = '12 a 18 años';
            return await solicitarAutorizacionTratamientoDatos(idChat, remitente);
        } else if (contenido === '3') {
            chatData.rangoEdad = '19 a 29 años';
            return await solicitarAutorizacionTratamientoDatos(idChat, remitente);
        } else if (contenido === '4') {
            chatData.rangoEdad = '30 a 50 años';
            return await solicitarAutorizacionTratamientoDatos(idChat, remitente);
        } else if (contenido === '5') {
            chatData.rangoEdad = 'Más de 50 años';
            return await solicitarAutorizacionTratamientoDatos(idChat, remitente);
        } else {
            const pasoArbol = 'Alerta No Entiendo - Solicitar Rango Edad';
            const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol">❓ <b>No entiendo su respuesta.</b><br/><br/>
            ⚠️ <i>Por favor seleccione una opción válida para continuar.</i></p>`;
            const resultado = await manejarNoEntiendo(idChat, remitente, pasoArbol, alertaNoEntiendo);
            if (resultado) {
                // Mostrar nuevamente el mensaje de solicitud para que el usuario vea qué se le está pidiendo
                return await solicitarRangoEdad(idChat, remitente);
            }
            return false;
        }
    } catch (error) {
        // ? Error api
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion procesarRangoEdad';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → procesarRangoEdad: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Solicitar Autorizacion Tratamiento Datos Arbol
const solicitarAutorizacionTratamientoDatos = async (idChat, remitente) => {
    try {
        const solicitarAutorizacionTratamientoDatosArbol = dataEstatica.arbol.solicitarAutorizacionTratamientoDatos;
        chatData.descripcion = 'Se solicita la autorización de tratamiento de datos.';
        await modelChat.actualizar(idChat, solicitarAutorizacionTratamientoDatosArbol, chatData);
        return await crearMensaje(idChat, remitente, dataEstatica.configuracion.estadoMensaje.enviado, dataEstatica.configuracion.tipoMensaje.texto, dataEstatica.mensajes.solicitarAutorizacionTratamientoDatos, chatData.descripcion);
    } catch (error) {
        // ? Error api
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarAutorizacionTratamientoDatos';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarAutorizacionTratamientoDatos: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Procesar Autorizacion Tratamiento Datos Arbol
const procesarAutorizacionTratamientoDatos = async (idChat, remitente, contenido) => {
    try {
        // ? Procesar Autorizacion Tratamiento Datos
        if (contenido === '1') {
            chatData.autorizacionTratamientoDatos = 'Si';
            return await solicitarPasoAsesor(idChat, remitente);
        } else if (contenido === '2') {
            chatData.autorizacionTratamientoDatos = 'No';
            return await clienteDesiste(idChat, remitente);
        } else {
            const pasoArbol = 'Alerta No Entiendo - Solicitar Autorizacion Tratamiento Datos';
            const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol">❓ <b>No entiendo su respuesta.</b><br/><br/>
            ⚠️ <i>Por favor seleccione una opción válida para continuar.</i></p>`;
            const resultado = await manejarNoEntiendo(idChat, remitente, pasoArbol, alertaNoEntiendo);
            if (resultado) {
                // Mostrar nuevamente el mensaje de solicitud para que el usuario vea qué se le está pidiendo
                return await solicitarAutorizacionTratamientoDatos(idChat, remitente);
            }
            return false;
        }
    }
    catch (error) {
        // ? Error api
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion procesarAutorizacionTratamientoDatos';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → procesarAutorizacionTratamientoDatos: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Solicitar Paso Asesor Arbol
const solicitarPasoAsesor = async (idChat, remitente) => {
    try {
        const solicitarPasoAsesorArbol = dataEstatica.arbol.solicitarPasoAsesor;
        chatData.descripcion = 'Se solicita el paso asesor.';
        await modelChat.actualizar(idChat, solicitarPasoAsesorArbol, chatData);
        return await crearMensaje(idChat, remitente, dataEstatica.configuracion.estadoMensaje.enviado, dataEstatica.configuracion.tipoMensaje.texto, dataEstatica.mensajes.solicitarPasoAsesor, chatData.descripcion);
    } catch (error) {
        // ? Error api
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarPasoAsesor';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarPasoAsesor: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
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
        const api = 'Chat Web Thomas Greg y Sons - IDC Exterior Chatbot ';
        const procesoApi = 'Cliente Desiste';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → clienteDesiste', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
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
    try {
        const query = `
            UPDATE tbl_chat
            SET 
                cht_descripcion = ?, 
                cht_control_api = ?,
                cht_resultado_api = ?
            WHERE cht_id = ?;
        `;
        await pool.query(query, [descripcion, controlApi, resultadoApi, idChat]);

        await crearMensaje(idChat, remitente, estadoMensaje, tipoMensaje, contenidoAlertaErrorAPI, descripcion);
    } catch (error) {
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → errorAPI ', error);
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