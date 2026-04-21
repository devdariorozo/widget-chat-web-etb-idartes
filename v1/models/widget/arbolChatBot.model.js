// ! ================================================================================================================================================
// !                                                      MODELOS PARA ARBOL CHAT BOT
// ! ================================================================================================================================================
// @autor Ramón Dario Rozo Torres
// @últimaModificación Ramón Dario Rozo Torres
// @versión 1.0.0
// v1/models/widget/arbolChatBot.model.js

const pool = require('../../config/database.js');
const path = require('path');
require('dotenv').config({ path: './../../.env' });
const modelChat = require('./chat.model.js');
const modelMensaje = require('./mensaje.model.js');
const dataEstatica = require('../../seeds/dataEstatica.js');
const serviceSoulChat = require('../../services/serviceSoulChat.service.js');
const logger = require('../../logger');
const { decrypt } = require('../../utils/cryptoData.js');

// * ARBOL CHAT BOT - FLUJO FORMULARIO ÚNICO Y PASO A ASESOR
const arbolChatBot = async (remitente, contenido) => {
    // Variables
    const defaultData = '-';
    let chatData = {};
    const chat = await modelChat.filtrar(remitente);
    const idChat = chat[0].ID_CHAT;
    const arbolChat = chat[0].ARBOL;
    const estadoGestionChat = chat[0].GESTION;

    // Deserializar los datos después de recuperarlos
    chatData.controlApi = chat[0].CONTROL_API || defaultData;
    chatData.controlPeticiones = parseInt(chat[0].CONTROL_PETICIONES) || 0;
    chatData.nombresApellidos = chat[0].NOMBRES_APELLIDOS || defaultData;
    chatData.genero = chat[0].GENERO || defaultData;
    chatData.correoElectronico = chat[0].CORREO_ELECTRONICO || defaultData;
    chatData.telefono = chat[0].TELEFONO || defaultData;
    chatData.localidad = chat[0].LOCALIDAD || defaultData;
    chatData.temaConsulta = chat[0].EN_QUE_PODEMOS_AYUDARLE || defaultData;
    chatData.rangoEdad = chat[0].RANGO_EDAD || defaultData;
    chatData.autorizacionDatosPersonales = chat[0].AUTORIZACION_TRATAMIENTO_DATOS || defaultData;
    // Agregar estos después de autorizacionDatosPersonales:
    chatData.calificarServicio = chat[0].CALIFICAR_SERVICIO || defaultData;
    chatData.calificarAmabilidad = chat[0].CALIFICAR_AMABILIDAD || defaultData;
    chatData.calificarTiempo = chat[0].CALIFICAR_TIEMPO || defaultData;
    chatData.calificarCalidad = chat[0].CALIFICAR_CALIDAD || defaultData;
    chatData.calificarConocimiento = chat[0].CALIFICAR_CONOCIMIENTO || defaultData;
    chatData.calificarSolucion = chat[0].CALIFICAR_SOLUCION || defaultData;
    chatData.comentario = chat[0].COMENTARIO || defaultData;
    chatData.descripcion = chat[0].DESCRIPCION || defaultData;
    chatData.estadoRegistro = chat[0].REGISTRO || defaultData;
    chatData.responsable = chat[0].RESPONSABLE || defaultData;

    if (estadoGestionChat === 'Cerrado') {
        return await chatCerrado(idChat, remitente);
    }

    try {
        // ── ENCUESTA (prioridad absoluta) ────────────────────────────────
        if (arbolChat === 'Solicitar Calificar Servicio' || arbolChat === 'Alerta No Entiendo - Solicitar Calificar Servicio') {
            return await procesarCalificarServicio(idChat, remitente, contenido, chatData);
        }
        if (arbolChat === 'Solicitar Calificar Amabilidad' || arbolChat === 'Alerta No Entiendo - Solicitar Calificar Amabilidad') {
            return await procesarCalificarAmabilidad(idChat, remitente, contenido, chatData);
        }
        if (arbolChat === 'Solicitar Calificar Tiempo' || arbolChat === 'Alerta No Entiendo - Solicitar Calificar Tiempo') {
            return await procesarCalificarTiempo(idChat, remitente, contenido, chatData);
        }
        if (arbolChat === 'Solicitar Calificar Calidad' || arbolChat === 'Alerta No Entiendo - Solicitar Calificar Calidad') {
            return await procesarCalificarCalidad(idChat, remitente, contenido, chatData);
        }
        if (arbolChat === 'Solicitar Calificar Conocimiento' || arbolChat === 'Alerta No Entiendo - Solicitar Calificar Conocimiento') {
            return await procesarCalificarConocimiento(idChat, remitente, contenido, chatData);
        }
        if (arbolChat === 'Solicitar Calificar Solucion' || arbolChat === 'Alerta No Entiendo - Solicitar Calificar Solucion') {
            return await procesarCalificarSolucion(idChat, remitente, contenido, chatData);
        }
        if (arbolChat === 'Escuchar Comentario' || arbolChat === 'Alerta No Entiendo - Escuchar Comentario') {
            return await procesarEscucharComentario(idChat, remitente, contenido, chatData);
        }

        // ── FORMULARIO + ASESOR ──────────────────────────────────────────
        const formularioPendiente =
            chatData.nombresApellidos === '-' ||
            chatData.genero === '-' ||
            chatData.correoElectronico === '-' ||
            chatData.localidad === '-' ||
            chatData.temaConsulta === '-' ||
            chatData.rangoEdad === '-' ||
            chatData.autorizacionDatosPersonales === '-';

            


        // Cambiar el bloque final de arbolChatBot:
        if (formularioPendiente) {
            return await solicitarFormularioInicial(idChat, remitente, chatData);
        }

        // Verificar si ya se procesó el paso asesor (ya tiene resultadoApi con soulChatStart ok)
        let resultadoApiParsed = null;
        try {
            resultadoApiParsed = chat[0].RESULTADO_API ? JSON.parse(chat[0].RESULTADO_API) : null;
        } catch (e) { resultadoApiParsed = null; }

        const startAceptado = !!(resultadoApiParsed && resultadoApiParsed.soulChatStart === 'ok')
            || chat[0].RESULTADO_API === 'Message recived!';

        if (startAceptado) {
            // Ya se hizo el START, solo reenviar el mensaje del usuario como ATTENDING
            return await procesarPasoAsesorSoulChat(idChat, remitente, contenido);
        } else {
            // Primera vez: mostrar mensaje y hacer START
            return await solicitarPasoAsesor(idChat, remitente, contenido);
        }
    } catch (error) {
        return await errorAPI(dataEstatica.configuracion.responsable, 'Arbol Chat Bot', error, idChat, remitente);
    }
};


// (El bloque anterior estaba fuera de la función principal y causaba el error de await fuera de async)

// ! FUNCIONES AUXILIARES
// todo: Solicitar Formulario Inicial Arbol
const solicitarFormularioInicial = async (idChat, remitente,chatData) => {
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


// todo: Solicitar Paso Asesor Arbol
const solicitarPasoAsesor = async (idChat, remitente, contenido) => {
    try {
        // Obtener chatData actualizado del chat
        const chat = await modelChat.filtrar(remitente);
        const defaultData = '-';
        let chatData = {};
        chatData.controlApi = chat[0].CONTROL_API || defaultData;
        chatData.controlPeticiones = parseInt(chat[0].CONTROL_PETICIONES) || 0;
        chatData.nombresApellidos = chat[0].NOMBRES_APELLIDOS || defaultData;
        chatData.genero = chat[0].GENERO || defaultData;
        chatData.correoElectronico = chat[0].CORREO_ELECTRONICO || defaultData;
        chatData.telefono = chat[0].TELEFONO || defaultData;
        chatData.localidad = chat[0].LOCALIDAD || defaultData;
        chatData.temaConsulta = chat[0].EN_QUE_PODEMOS_AYUDARLE || defaultData;
        chatData.rangoEdad = chat[0].RANGO_EDAD || defaultData;
        chatData.autorizacionDatosPersonales = chat[0].AUTORIZACION_TRATAMIENTO_DATOS || defaultData;
        chatData.descripcion = 'Se solicita el paso asesor.';
        chatData.estadoRegistro = chat[0].REGISTRO || defaultData;
        chatData.responsable = chat[0].RESPONSABLE || defaultData;

        const solicitarPasoAsesorArbol = dataEstatica.arbol.solicitarPasoAsesor;
        await modelChat.actualizar(idChat, solicitarPasoAsesorArbol, chatData);
        await crearMensaje(idChat, remitente, dataEstatica.configuracion.estadoMensaje.enviado, dataEstatica.configuracion.tipoMensaje.texto, dataEstatica.mensajes.solicitarPasoAsesor, chatData.descripcion);

        return await procesarPasoAsesorSoulChat(idChat, remitente, contenido);
    } catch (error) {
        // ? Error api
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarPasoAsesor';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarPasoAsesor: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Procesar Paso Asesor Arbol - Mensajes hacia Soul Chat
const procesarPasoAsesorSoulChat = async (idChat, remitente, contenido) => {

    let chatData = {};
    try {
        // Obtener chatData actualizado del chat
        const chat = await modelChat.filtrar(remitente);
        const defaultData = '-';
        chatData.controlApi = chat[0].CONTROL_API || defaultData;
        chatData.controlPeticiones = parseInt(chat[0].CONTROL_PETICIONES) || 0;
        chatData.nombresApellidos = chat[0].NOMBRES_APELLIDOS || defaultData;
        chatData.genero = chat[0].GENERO || defaultData;
        chatData.correoElectronico = chat[0].CORREO_ELECTRONICO || defaultData;
        chatData.telefono = chat[0].TELEFONO || defaultData;
        chatData.localidad = chat[0].LOCALIDAD || defaultData;
        chatData.temaConsulta = chat[0].EN_QUE_PODEMOS_AYUDARLE || defaultData;
        chatData.rangoEdad = chat[0].RANGO_EDAD || defaultData;
        chatData.autorizacionDatosPersonales = chat[0].AUTORIZACION_TRATAMIENTO_DATOS || defaultData;
        chatData.descripcion = chat[0].DESCRIPCION || defaultData;
        chatData.estadoRegistro = chat[0].REGISTRO || defaultData;
        chatData.responsable = chat[0].RESPONSABLE || defaultData;
        chatData.resultadoApi = chat[0].RESULTADO_API || undefined;

        // Determinar si ya se envió (y fue aceptado) el START a Soul Chat.
        // Se marca mediante chatData.resultadoApi persistiéndose como JSON con { soulChatStart: 'ok' }.
        let resultadoApiParsed = null;
        try {
            resultadoApiParsed = typeof chatData.resultadoApi === 'object' ? chatData.resultadoApi : JSON.parse(chatData.resultadoApi);
        } catch (e) {
            resultadoApiParsed = null;
        }
        const startAceptado = !!(resultadoApiParsed && resultadoApiParsed.soulChatStart === 'ok') || chatData.resultadoApi === 'Message recived!';

        // Definir si el mensaje actual debe ser START (datos del cliente) o ATTENDING (contenido del usuario)
        const esMensajeInicial = !startAceptado;

        // Construcción del mensaje legible para Soul Chat
        const mensajeDatosCliente = [
            'Cliente solicita su ayuda, estos son los datos del cliente:',
            `• Nombres y Apellidos: ${chatData.nombresApellidos}`,
            `• Género: ${chatData.genero}`,
            `• Correo Electrónico: ${chatData.correoElectronico}`,
            `• Teléfono: ${chatData.telefono}`,
            `• Localidad: ${chatData.localidad}`,
            `• En qué podemos ayudarle: ${chatData.temaConsulta}`,
            `• Rango de Edad: ${chatData.rangoEdad}`,
            `• Autorización Tratamiento de Datos: ${chatData.autorizacionDatosPersonales}`
        ].join('\n');

        // Función para capitalizar la primera letra del contenido
        const capitalizarPrimeraLetra = (str) => {
            if (!str || typeof str !== 'string') return str;
            return str.charAt(0).toUpperCase() + str.slice(1);
        };

        const mensajeAEnviar = esMensajeInicial ? mensajeDatosCliente : capitalizarPrimeraLetra(typeof contenido === 'string' ? contenido : `${contenido}`);

        const estructuraMensaje = {
            provider: "web",
            canal: 3,
            idChat: idChat,
            remitente: remitente,
            estado: esMensajeInicial ? "START" : "ATTENDING",
            mensaje: mensajeAEnviar,
            type: "TEXT",
            // Contexto de formulario para la AI
            nombres: chatData.nombresApellidos,
            genero: chatData.genero,
            correoElectronico: chatData.correoElectronico,
            telefono: chatData.telefono,
            localidad: chatData.localidad,
            temaConsulta: chatData.temaConsulta,
            rangoEdad: chatData.rangoEdad,
            autorizacionDatosPersonales: chatData.autorizacionDatosPersonales,
            responsable: dataEstatica.configuracion.responsable
        };

        // Control de intentos
        if (chatData.controlPeticiones <= 5) {

            // ? Consumir servicio de Soul Chat
                const response = await serviceSoulChat.procesarMensajeAISoul(estructuraMensaje);
                chatData.resultadoApi = response.data;
                // ? Consumir servicio de Soul Chat - SIMULADO PARA PRUEBAS 
                // const response = { status: 200, data: 'Simulado Procesar Paso Asesor Soul Chat' };
                // chatData.resultadoApi = response.data;

            // Si la respuesta tiene status 200 o 202
            if (response.status === 200 || response.status === 202) {
                // Variables
                const solicitarPasoAsesorArbol = dataEstatica.arbol.solicitarPasoAsesor;
                chatData.controlApi = dataEstatica.configuracion.controlApi.success;
                chatData.descripcion = esMensajeInicial
                    ? 'Soul Chat ha recibido los datos del cliente (START).'
                    : 'Soul Chat ha recibido el mensaje del cliente.';

                // Actualizar el chat
                // Persistimos un flag de inicio exitoso para diferenciar los siguientes mensajes
                try {
                    const persisted = {
                        soulChatStart: esMensajeInicial ? 'ok' : (startAceptado ? 'ok' : 'pending'),
                        response: response.data
                    };
                    chatData.resultadoApi = persisted;
                } catch (e) {
                    // Si no se puede envolver, dejamos el data crudo
                    chatData.resultadoApi = response.data;
                }
                const updateResult = await modelChat.actualizar(idChat, solicitarPasoAsesorArbol, chatData);
                return updateResult || true; // Asegurar que siempre retorne algo válido
            } else {
                // Variables
                const solicitarPasoAsesorArbol = dataEstatica.arbol.solicitarPasoAsesor;
                chatData.controlPeticiones++;
                chatData.descripcion = 'Soul Chat está presentando una novedad o incidencia técnica.';


                // Actualizar el chat
                await modelChat.actualizar(idChat, solicitarPasoAsesorArbol, chatData);

                // todo: Enviar mensaje de error por API
                const api = 'Soul Chat';
                const procesoApi = 'Procesar Paso Asesor';
                const error = response;
                const errorResult = await errorAPI(api, procesoApi, error, idChat, remitente);

                return errorResult || false;
            }

        } else {
            return await cerrarNovedadTecnicaLimiteIntentos(idChat, remitente);
        }

    } catch (error) {
        // Obtener chatData actualizado del chat para el catch
        try {
            const chat = await modelChat.filtrar(remitente);
            const defaultData = '-';
            chatData.controlApi = chat[0].CONTROL_API || defaultData;
            chatData.controlPeticiones = parseInt(chat[0].CONTROL_PETICIONES) || 0;
            chatData.nombresApellidos = chat[0].NOMBRES_APELLIDOS || defaultData;
            chatData.genero = chat[0].GENERO || defaultData;
            chatData.correoElectronico = chat[0].CORREO_ELECTRONICO || defaultData;
            chatData.telefono = chat[0].TELEFONO || defaultData;
            chatData.localidad = chat[0].LOCALIDAD || defaultData;
            chatData.temaConsulta = chat[0].EN_QUE_PODEMOS_AYUDARLE || defaultData;
            chatData.rangoEdad = chat[0].RANGO_EDAD || defaultData;
            chatData.autorizacionDatosPersonales = chat[0].AUTORIZACION_TRATAMIENTO_DATOS || defaultData;
            chatData.descripcion = chat[0].DESCRIPCION || defaultData;
            chatData.estadoRegistro = chat[0].REGISTRO || defaultData;
            chatData.responsable = chat[0].RESPONSABLE || defaultData;
        } catch (e) {
            // Si falla, dejar chatData como objeto vacío
            chatData = {};
        }
        // Variables
        const solicitarPasoAsesorArbol = dataEstatica.arbol.solicitarPasoAsesor;
        chatData.controlPeticiones = (chatData.controlPeticiones || 0) + 1;
        chatData.descripcion = 'Soul Chat está presentando una novedad o incidencia técnica.';

        // Actualizar el chat
        await modelChat.actualizar(idChat, solicitarPasoAsesorArbol, chatData);

        const api = 'Soul Chat';
        const procesoApi = 'Procesar Paso Asesor';
        logger.error({
            contexto: 'model',
            recurso: 'arbolChatBot.procesarPasoAsesorSoulChat',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            idChat,
            remitente,
            api,
            procesoApi,
            controlPeticiones: chatData.controlPeticiones
        }, 'Error en v1/models/widget/arbolChatBot.model.js → procesarPasoAsesorSoulChat');
        const errorResult = await errorAPI(api, procesoApi, error, idChat, remitente);

        // Si al incrementar el contador se superó el límite, cerrar inmediatamente
        if (chatData.controlPeticiones > 5) {
            return await cerrarNovedadTecnicaLimiteIntentos(idChat, remitente);
        }
        return errorResult || false;
    }
};

// todo: Solicitar Calificar Servicio Arbol
const solicitarCalificarServicio = async (idChat, remitente,chatData) => {
    try {
        const solicitarCalificarServicioArbol = dataEstatica.arbol.solicitarCalificarServicio;
        chatData.descripcion = 'Se solicita calificar el servicio.';
        await modelChat.actualizar(idChat, solicitarCalificarServicioArbol, chatData);
        return await crearMensaje(
            idChat,
            remitente,
            dataEstatica.configuracion.estadoMensaje.enviado,
            dataEstatica.configuracion.tipoMensaje.texto,
            dataEstatica.mensajes.solicitarCalificarServicio,
            chatData.descripcion
        );
    } catch (error) {
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarCalificarServicio';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarCalificarServicio: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Procesar Paso Calificar Servicio Arbol
const procesarCalificarServicio = async (idChat, remitente, contenido, chatData) => {
    try {
        // Normalizar contenido
        const opcion = typeof contenido === 'string' ? contenido.trim() : '';

        // Mapear opción a valor descriptivo
        const mapaCalificacion = {
            '1': 'Malo',
            '2': 'Regular',
            '3': 'Ni bueno ni malo',
            '4': 'Bueno',
            '5': 'Excelente'
        };

        if (mapaCalificacion[opcion]) {
            chatData.calificarServicio = mapaCalificacion[opcion];

            // Pasar al siguiente paso de la encuesta
            return await solicitarCalificarAmabilidad(idChat, remitente, chatData);
        } else {
            const pasoArbol = 'Alerta No Entiendo - Solicitar Calificar Servicio';
            const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol"><b>No entiendo su respuesta.</b><br/><br/>
            <i>Por favor seleccione una opción válida (1 a 5) para continuar.</i></p>`;
            const resultado = await manejarNoEntiendo(idChat, remitente, pasoArbol, alertaNoEntiendo,chatData);
            if (resultado) {
                // Mostrar nuevamente el mensaje de solicitud
                return await solicitarCalificarServicio(idChat, remitente, chatData);
            }
            return false;
        }
    } catch (error) {
        // ? Error api
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion procesarCalificarServicio';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → procesarCalificarServicio: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Solicitar Calificar Amabilidad Arbol
const solicitarCalificarAmabilidad = async (idChat, remitente, chatData) => {
    try {
        const solicitarCalificarAmabilidadArbol = dataEstatica.arbol.solicitarCalificarAmabilidad;
        chatData.descripcion = 'Se solicita calificar la amabilidad.';
        await modelChat.actualizar(idChat, solicitarCalificarAmabilidadArbol, chatData);
        return await crearMensaje(
            idChat,
            remitente,
            dataEstatica.configuracion.estadoMensaje.enviado,
            dataEstatica.configuracion.tipoMensaje.texto,
            dataEstatica.mensajes.solicitarCalificarAmabilidad,
            chatData.descripcion
        );
    } catch (error) {
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarCalificarAmabilidad';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarCalificarAmabilidad: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Procesar Calificar Amabilidad Arbol
const procesarCalificarAmabilidad = async (idChat, remitente, contenido, chatData) => {
    try {
        const opcion = typeof contenido === 'string' ? contenido.trim() : '';
        const mapaCalificacion = {
            '1': 'Mala',
            '2': 'Regular',
            '3': 'Ni buena ni mala',
            '4': 'Buena',
            '5': 'Excelente'
        };

        if (mapaCalificacion[opcion]) {
            chatData.calificarAmabilidad = mapaCalificacion[opcion];
            return await solicitarCalificarTiempo(idChat, remitente, chatData);
        } else {
            const pasoArbol = 'Alerta No Entiendo - Solicitar Calificar Amabilidad';
            const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol"><b>No entiendo su respuesta.</b><br/><br/>
            <i>Por favor seleccione una opción válida (1 a 5) para continuar.</i></p>`;
            const resultado = await manejarNoEntiendo(idChat, remitente, pasoArbol, alertaNoEntiendo,chatData);
            if (resultado) {
                return await solicitarCalificarAmabilidad(idChat, remitente, chatData);
            }
            return false;
        }
    } catch (error) {
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion procesarCalificarAmabilidad';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → procesarCalificarAmabilidad: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Solicitar Calificar Tiempo Arbol
const solicitarCalificarTiempo = async (idChat, remitente, chatData) => {
    try {
        const solicitarCalificarTiempoArbol = dataEstatica.arbol.solicitarCalificarTiempo;
        chatData.descripcion = 'Se solicita calificar el tiempo de respuesta.';
        await modelChat.actualizar(idChat, solicitarCalificarTiempoArbol, chatData);
        return await crearMensaje(
            idChat,
            remitente,
            dataEstatica.configuracion.estadoMensaje.enviado,
            dataEstatica.configuracion.tipoMensaje.texto,
            dataEstatica.mensajes.solicitarCalificarTiempo,
            chatData.descripcion
        );
    } catch (error) {
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarCalificarTiempo';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarCalificarTiempo: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Procesar Calificar Tiempo Arbol
const procesarCalificarTiempo = async (idChat, remitente, contenido, chatData) => {
    try {
        const opcion = typeof contenido === 'string' ? contenido.trim() : '';
        const mapaCalificacion = {
            '1': 'Malo',
            '2': 'Regular',
            '3': 'Ni bueno ni malo',
            '4': 'Bueno',
            '5': 'Excelente'
        };

        if (mapaCalificacion[opcion]) {
            chatData.calificarTiempo = mapaCalificacion[opcion];
            return await solicitarCalificarCalidad(idChat, remitente, chatData);
        } else {
            const pasoArbol = 'Alerta No Entiendo - Solicitar Calificar Tiempo';
            const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol"><b>No entiendo su respuesta.</b><br/><br/>
            <i>Por favor seleccione una opción válida (1 a 5) para continuar.</i></p>`;
            const resultado = await manejarNoEntiendo(idChat, remitente, pasoArbol, alertaNoEntiendo,chatData);
            if (resultado) {
                return await solicitarCalificarTiempo(idChat, remitente, chatData);
            }
            return false;
        }
    } catch (error) {
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion procesarCalificarTiempo';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → procesarCalificarTiempo: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Solicitar Calificar Calidad Arbol
const solicitarCalificarCalidad = async (idChat, remitente, chatData) => {
    try {
        const solicitarCalificarCalidadArbol = dataEstatica.arbol.solicitarCalificarCalidad;
        chatData.descripcion = 'Se solicita calificar la calidad de la información.';
        await modelChat.actualizar(idChat, solicitarCalificarCalidadArbol, chatData);
        return await crearMensaje(
            idChat,
            remitente,
            dataEstatica.configuracion.estadoMensaje.enviado,
            dataEstatica.configuracion.tipoMensaje.texto,
            dataEstatica.mensajes.solicitarCalificarCalidad,
            chatData.descripcion
        );
    } catch (error) {
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarCalificarCalidad';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarCalificarCalidad: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Procesar Calificar Calidad Arbol
const procesarCalificarCalidad = async (idChat, remitente, contenido, chatData) => {
    try {
        const opcion = typeof contenido === 'string' ? contenido.trim() : '';
        const mapaCalificacion = {
            '1': 'Mala',
            '2': 'Regular',
            '3': 'Ni buena ni mala',
            '4': 'Buena',
            '5': 'Excelente'
        };

        if (mapaCalificacion[opcion]) {
            chatData.calificarCalidad = mapaCalificacion[opcion];
            return await solicitarCalificarConocimiento(idChat, remitente, chatData);
        } else {
            const pasoArbol = 'Alerta No Entiendo - Solicitar Calificar Calidad';
            const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol"><b>No entiendo su respuesta.</b><br/><br/>
            <i>Por favor seleccione una opción válida (1 a 5) para continuar.</i></p>`;
            const resultado = await manejarNoEntiendo(idChat, remitente, pasoArbol, alertaNoEntiendo,chatData);
            if (resultado) {
                return await solicitarCalificarCalidad(idChat, remitente, chatData);
            }
            return false;
        }
    } catch (error) {
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion procesarCalificarCalidad';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → procesarCalificarCalidad: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Solicitar Calificar Conocimiento Arbol
const solicitarCalificarConocimiento = async (idChat, remitente, chatData) => {
    try {
        const solicitarCalificarConocimientoArbol = dataEstatica.arbol.solicitarCalificarConocimiento;
        chatData.descripcion = 'Se solicita calificar el conocimiento del funcionario.';
        await modelChat.actualizar(idChat, solicitarCalificarConocimientoArbol, chatData);
        return await crearMensaje(
            idChat,
            remitente,
            dataEstatica.configuracion.estadoMensaje.enviado,
            dataEstatica.configuracion.tipoMensaje.texto,
            dataEstatica.mensajes.solicitarCalificarConocimiento,
            chatData.descripcion
        );
    } catch (error) {
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarCalificarConocimiento';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarCalificarConocimiento: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Procesar Calificar Conocimiento Arbol
const procesarCalificarConocimiento = async (idChat, remitente, contenido, chatData) => {
    try {
        const opcion = typeof contenido === 'string' ? contenido.trim() : '';
        const mapaCalificacion = {
            '1': 'Mala',
            '2': 'Regular',
            '3': 'Ni buena ni mala',
            '4': 'Buena',
            '5': 'Excelente'
        };

        if (mapaCalificacion[opcion]) {
            chatData.calificarConocimiento = mapaCalificacion[opcion];
            return await solicitarCalificarSolucion(idChat, remitente, chatData);
        } else {
            const pasoArbol = 'Alerta No Entiendo - Solicitar Calificar Conocimiento';
            const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol"><b>No entiendo su respuesta.</b><br/><br/>
            <i>Por favor seleccione una opción válida (1 a 5) para continuar.</i></p>`;
            const resultado = await manejarNoEntiendo(idChat, remitente, pasoArbol, alertaNoEntiendo,chatData);
            if (resultado) {
                return await solicitarCalificarConocimiento(idChat, remitente, chatData);
            }
            return false;
        }
    } catch (error) {
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion procesarCalificarConocimiento';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → procesarCalificarConocimiento: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Solicitar Calificar Solucion Arbol
const solicitarCalificarSolucion = async (idChat, remitente, chatData) => {
    try {
        const solicitarCalificarSolucionArbol = dataEstatica.arbol.solicitarCalificarSolucion;
        chatData.descripcion = 'Se solicita indicar si la solicitud fue solucionada.';
        await modelChat.actualizar(idChat, solicitarCalificarSolucionArbol, chatData);
        return await crearMensaje(
            idChat,
            remitente,
            dataEstatica.configuracion.estadoMensaje.enviado,
            dataEstatica.configuracion.tipoMensaje.texto,
            dataEstatica.mensajes.solicitarCalificarSolucion,
            chatData.descripcion
        );
    } catch (error) {
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarCalificarSolucion';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarCalificarSolucion: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Procesar Calificar Solucion Arbol
const procesarCalificarSolucion = async (idChat, remitente, contenido, chatData) => {
    try {
        const opcion = typeof contenido === 'string' ? contenido.trim() : '';
        if (opcion === '1') {
            chatData.calificarSolucion = 'Si';
        } else if (opcion === '2') {
            chatData.calificarSolucion = 'No';
        } else {
            const pasoArbol = 'Alerta No Entiendo - Solicitar Calificar Solucion';
            const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol"><b>No entiendo su respuesta.</b><br/><br/>
            <i>Por favor seleccione una opción válida (1 o 2) para continuar.</i></p>`;
            const resultado = await manejarNoEntiendo(idChat, remitente, pasoArbol, alertaNoEntiendo,chatData);
            if (resultado) {
                return await solicitarCalificarSolucion(idChat, remitente, chatData);
            }
            return false;
        }

        // Si la opción es válida, solicitar comentario
        return await solicitarEscucharComentario(idChat, remitente, chatData);
    } catch (error) {
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion procesarCalificarSolucion';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → procesarCalificarSolucion: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Solicitar Comentario Arbol
const solicitarEscucharComentario = async (idChat, remitente, chatData) => {
    try {
        const escucharComentarioArbol = dataEstatica.arbol.escucharComentario;
        chatData.descripcion = 'Se solicita comentario de la atención recibida.';
        await modelChat.actualizar(idChat, escucharComentarioArbol, chatData);
        return await crearMensaje(
            idChat,
            remitente,
            dataEstatica.configuracion.estadoMensaje.enviado,
            dataEstatica.configuracion.tipoMensaje.texto,
            dataEstatica.mensajes.escucharComentario,
            chatData.descripcion
        );
    } catch (error) {
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion solicitarEscucharComentario';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → solicitarEscucharComentario: ', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};

// todo: Procesar Comentario Arbol (cierre de chat)
const procesarEscucharComentario = async (idChat, remitente, contenido, chatData) => {
    try {
        const texto = typeof contenido === 'string' ? contenido.trim() : '';

        // Validar mínimo 3 caracteres y máximo 1000 caracteres (coherente con la tabla)
        if (texto.length >= 3 && texto.length <= 1000) {
            // Capitalizar primera palabra, resto se mantiene
            const palabras = texto.split(/\s+/);
            let comentarioFormateado = texto;
            if (palabras.length > 0) {
                const primera = palabras[0].charAt(0).toUpperCase() + palabras[0].slice(1).toLowerCase();
                const resto = palabras.slice(1).join(' ');
                comentarioFormateado = resto.length > 0 ? `${primera} ${resto}` : primera;
            }

            chatData.comentario = comentarioFormateado;
            chatData.descripcion = 'Encuesta de satisfacción finalizada. Se cierra el chat.';

            // Actualizar el chat con los datos finales de la encuesta
            await modelChat.actualizar(idChat, dataEstatica.arbol.escucharComentario, chatData);

            // Cerrar el chat
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

            // Enviar mensaje de despedida (Fin Chat)
            return await crearMensaje(
                idChat,
                remitente,
                dataEstatica.configuracion.estadoMensaje.enviado,
                dataEstatica.configuracion.tipoMensaje.finChat,
                dataEstatica.mensajes.despedida,
                chatData.descripcion
            );
        } else {
            const pasoArbol = 'Alerta No Entiendo - Escuchar Comentario';
            const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol"><b>No entiendo su respuesta.</b><br/><br/>
            <i>Por favor ingrese un comentario válido (mínimo 3, máximo 1000 caracteres).</i></p>`;
            const resultado = await manejarNoEntiendo(idChat, remitente, pasoArbol, alertaNoEntiendo, chatData);
            if (resultado) {
                return await solicitarEscucharComentario(idChat, remitente, chatData);
            }
            return false;
        }
    } catch (error) {
        const api = dataEstatica.configuracion.responsable;
        const procesoApi = 'Funcion procesarEscucharComentario';
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → procesarEscucharComentario: ', error);
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

// todo: Actualizar ruta de adjuntos en chat
const actualizarRutaAdjuntos = async (idChat, enlaces) => {
    let connMySQL;
    try {
        connMySQL = await pool.getConnection();
        const adjuntos = (enlaces && enlaces !== '-' && enlaces.trim() !== '') ? 'Si' : 'No';
        const query = `
            UPDATE tbl_chat
            SET cht_ruta_adjuntos = ?,
                cht_adjuntos = ?
            WHERE cht_id = ?;
        `;
        const [result] = await connMySQL.query(query, [enlaces, adjuntos, idChat]);
        return result && result.affectedRows > 0;
    } catch (error) {
        logger.error({
            contexto: 'model',
            recurso: 'arbolChatBot.actualizarRutaAdjuntos',
            errorMensaje: error.message,
            idChat
        }, 'Error → actualizarRutaAdjuntos');
        return false;
    } finally {
        if (connMySQL) connMySQL.release();
    }
};

// todo: Enviar los archivos adjuntos
const procesarArchivosAdjuntos = async (idChat, remitente, mensaje) => {
    try {
        const enlacesChat = await modelChat.filtrarEnlaces(idChat);
        const rutaAdjuntos = enlacesChat.RUTA_ADJUNTOS;

        if (!rutaAdjuntos || rutaAdjuntos === '-') {
            logger.warn({
                contexto: 'model',
                recurso: 'arbolChatBot.procesarArchivosAdjuntos',
                idChat, remitente
            }, 'No hay adjuntos para procesar');
            return true;
        }

        const APP_URL = process.env.APP_URL || '';
        const enlaces = rutaAdjuntos
            .split('|')
            .map(e => e.trim())
            .filter(e => e && e !== '-');

        let mensajeEnlaces = '<p id="archivosAdjuntosClienteArbol">✅ <b>Hemos recibido los siguientes archivos adjuntos:</b><br/><br/>';

        enlaces.forEach(enlace => {
            const nombreArchivo = enlace.split('/').pop();
            mensajeEnlaces += `📄 <a href="${APP_URL}/uploads${enlace}" target="_blank">${nombreArchivo}</a><br/><br/>`;
        });

        mensajeEnlaces += '</p>';

        const descripcion = 'Enlaces de archivos adjuntos enviados.';
        return await crearMensaje(
            idChat,
            remitente,
            dataEstatica.configuracion.estadoMensaje.enviado,
            dataEstatica.configuracion.tipoMensaje.adjuntos,
            mensajeEnlaces,
            descripcion
        );
    } catch (error) {
        logger.error({
            contexto: 'model',
            recurso: 'arbolChatBot.procesarArchivosAdjuntos',
            errorMensaje: error.message,
            errorStack: error.stack,
            idChat, remitente
        }, 'Error → procesarArchivosAdjuntos');
        return false;
    }
};

// todo: Manejar no entender
const manejarNoEntiendo = async (idChat, remitente, pasoArbol, alertaNoEntiendo,chatData) => {
    try {
        chatData.descripcion = 'Se notifica que no se entiende el mensaje.';
        // Marcar el control de API como Warning en este caso
        chatData.controlApi = dataEstatica.configuracion.controlApi.warning;
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
const clienteDesiste = async (idChat, remitente,chatData) => {
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
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → clienteDesiste', error);
        return await errorAPI(api, procesoApi, error, idChat, remitente);
    }
};


// todo: Crear mensaje
const crearMensaje = async (idChat, remitente, estadoMensaje, tipoMensaje, contenido, descripcion) => {
    // Procesar contenido y enlaces para botones interactivos
    let contenidoFinal = contenido;
    let enlaces = '-';

    // Si el contenido es un objeto con estructura de botones (nuevo formato)
    if (typeof contenido === 'object' && contenido !== null) {
        if (contenido.contenido) {
            // Extraer contenido HTML
            contenidoFinal = contenido.contenido;

            // Si tiene botones, convertirlos a JSON string para el campo enlaces
            if (contenido.botones && Array.isArray(contenido.botones)) {
                enlaces = JSON.stringify(contenido.botones);
            }
        } else {
            // Si es un objeto pero no tiene la estructura esperada, convertirlo a string
            contenidoFinal = JSON.stringify(contenido);
        }
    }

    const lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
    const estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
    const responsable = dataEstatica.configuracion.responsable;
    return await modelMensaje.crear(idChat, remitente, estadoMensaje, tipoMensaje, contenidoFinal, enlaces, lectura, descripcion, estadoRegistro, responsable);
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
        console.log('❌ Error en v1/models/widget/arbolChatBot.model.js → errorAPI ', error);
    }
    return false;
};

// todo: Cerrar por límite de intentos con mensaje de novedad técnica (Fin Chat)
const cerrarNovedadTecnicaLimiteIntentos = async (idChat, remitente,chatData) => {
    try {
        chatData.descripcion = 'Se presenta novedad con el servicio de Soul Chat, se procede a cerrar el chat por limite de intentos.';
        // Log informativo previo al cierre
        logger.info({
            contexto: 'model',
            recurso: 'arbolChatBot.cerrarNovedadTecnicaLimiteIntentos',
            idChat,
            remitente,
            controlPeticiones: chatData.controlPeticiones,
            descripcion: chatData.descripcion
        }, 'Cierre por límite de intentos');
        await crearMensaje(
            idChat,
            remitente,
            dataEstatica.configuracion.estadoMensaje.enviado,
            dataEstatica.configuracion.tipoMensaje.finChat,
            dataEstatica.mensajes.novedadIncidenciaTecnica,
            chatData.descripcion
        );
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
        // Log de éxito de cierre
        logger.info({
            contexto: 'model',
            recurso: 'arbolChatBot.cerrarNovedadTecnicaLimiteIntentos',
            idChat,
            remitente,
            resultado: 'cerrado'
        }, 'Chat cerrado por límite de intentos');
        return false;
    } catch (error) {
        logger.error({
            contexto: 'model',
            recurso: 'arbolChatBot.cerrarNovedadTecnicaLimiteIntentos',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack,
            idChat,
            remitente
        }, 'Error en v1/models/widget/arbolChatBot.model.js → cerrarNovedadTecnicaLimiteIntentos');
        return false;
    }
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
        if (descripcion.includes('21 minutos')) {
            contenido = esNombreValido
                ? `<p class=\"alertaInactividadArbol\"><b>Inactividad de 21 minutos.</b><br/><br/>
                    Apreciado(a) ${nombreCliente}, hemos notado que lleva 21 minutos de inactividad.<br/><br/>
                    ¿Necesita ayuda? <br/><br/>
                    Estamos aquí para asistirle. <br/><br/>
                    Por favor, responda para continuar. </p>`
                : `<p class=\"alertaInactividadArbol\"><b>Inactividad de 21 minutos.</b><br/><br/>
                    Apreciado Usuario, hemos notado que lleva 21 minutos de inactividad.<br/><br/>
                    ¿Necesita ayuda? Estamos aquí para asistirle. </p>`;
        } else if (descripcion.includes('22 minutos')) {
            contenido = esNombreValido
                ? `<p class=\"alertaInactividadArbol\"><b>Inactividad de 22 minutos.</b><br/><br/>
                    Apreciado(a) ${nombreCliente}, lleva 22 minutos de inactividad.<br/><br/>
                    Recuerde que si no responde, la sesión se cerrará automáticamente. </p>`
                : `<p class=\"alertaInactividadArbol\"><b>Inactividad de 22 minutos.</b><br/><br/>
                    Lleva 22 minutos de inactividad.<br/><br/>
                    Si no responde, la sesión se cerrará. </p>`;
        } else if (descripcion.includes('23 minutos')) {
            contenido = esNombreValido
                ? `<p class=\"alertaInactividadArbol\"><b>Inactividad de 23 minutos.</b><br/><br/>
                    Apreciado(a) ${nombreCliente}, su sesión se cerrará en 2 minutos por inactividad.<br/><br/>
                    ¡Última advertencia! </p>`
                : `<p class=\"alertaInactividadArbol\"><b>Inactividad de 23 minutos.</b><br/><br/>
                    Su sesión se cerrará en 2 minutos por inactividad.<br/><br/>
                    ¡Última advertencia! </p>`;
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
        Su sesión ha finalizado debido a un periodo prolongado de inactividad (25 minutos). <br/><br/>
        ¡Estamos aquí para ayudarle! <br/><br/>
        <b>Por favor, cierre esta ventana y vuelva a abrir el chat para iniciar una nueva conversación.</b></p>`;
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
    solicitarPasoAsesor,
    actualizarRutaAdjuntos,
    procesarArchivosAdjuntos,
    solicitarFormularioInicial,
    crearAlertaInactividad,
    crearMensajeCierreInactividad,
};