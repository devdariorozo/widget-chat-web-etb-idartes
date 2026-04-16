// ! ================================================================================================================================================
// !                                                      CONTROLADORES PARA MENSAJE
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/controllers/widget/mensaje.controller.js

// ! REQUIRES
const moment = require('moment');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, './../../.env') });
const model = require('../../models/widget/mensaje.model.js');
const dataEstatica = require('../../seeds/dataEstatica.js');
const modelChat = require('../../models/widget/chat.model.js');
const modelArbolChatBot = require('../../models/widget/arbolChatBot.model.js');
const serviceSoulChat = require('../../services/serviceSoulChat.service.js');
const logger = require('../../logger');
const { getOrigen, getDestino, getContextoRecurso } = require('../../logger/context');


const normalizarNombre = (nombre) =>
    Buffer.from(nombre, 'latin1').toString('utf8');

// ! CONTROLADORES
// * CREAR
const crear = async (req, res) => {
    try {
        logger.info({
            contexto: 'controller',
            recurso: 'mensaje.crear',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            body: req.body
        }, 'Controller mensaje.controller.js → crear');
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn({
                contexto: 'controller',
                recurso: 'mensaje.crear',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: errors.array()[0].msg,
                erroresValidacion: errors.array()
            }, 'Error de validación en mensaje.crear');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: errors.array()[0].msg
            });
        }

        // todo: Obtener los datos de la petición
        const {
            idChatWeb,
            mensaje
        } = req.body;

        // todo: Validar si el chat existe
        const verificarChat = await modelChat.filtrar(idChatWeb);
        if (verificarChat.length > 0) {
            // todo: Preparamos los datos por defecto
            let idChat = verificarChat[0].ID_CHAT;
            let remitente = idChatWeb;
            let estadoMensaje = dataEstatica.configuracion.estadoMensaje.recibido;
            let tipoMensaje = dataEstatica.configuracion.tipoMensaje.texto;
            let contenido = mensaje;
            let enlaces = '-';
            let lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
            let descripcion = 'Se crea el mensaje con éxito.';
            let estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
            let responsable = dataEstatica.configuracion.responsable;

            // todo: Crear el registro
            const result = await model.crear(idChat, remitente, estadoMensaje, tipoMensaje, contenido, enlaces, lectura, descripcion, estadoRegistro, responsable);

            // todo: Enviar respuesta
            if (result) {

                // todo: Navegar arbol chat bot
                const resultArbol = await modelArbolChatBot.arbolChatBot(remitente, contenido);                
                // Si resultArbol es false (mensaje duplicado), aún consideramos exitoso el envío
                // Si resultArbol es undefined, hay un problema
                if (resultArbol !== undefined) {
                    // todo: Enviar respuesta
                    logger.info({
                        contexto: 'controller',
                        recurso: 'mensaje.crear',
                        origen: getOrigen(req),
                        destino: getDestino(req),
                        contextoRecurso: getContextoRecurso(req),
                        codigoRespuesta: 200,
                        rta: 'El mensaje se ha creado correctamente en el sistema.',
                        idChat,
                        remitente
                    }, 'Mensaje creado exitosamente');
                    return res.json({
                        status: 200,
                        type: 'success',
                        title: 'Widget Chat Web ETB - IDARTES',
                        message: 'El mensaje se ha creado correctamente en el sistema.',
                    });
                }
            }
        } else {
            // todo: Enviar respuesta
            logger.warn({
                contexto: 'controller',
                recurso: 'mensaje.crear',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: 'El chat no existe en el sistema.',
                idChatWeb
            }, 'Intento de crear mensaje sin chat existente');
            res.json({
                status: 400,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: 'El chat no existe en el sistema.'
            });
        }
    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'mensaje.crear',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/mensaje.controller.js → crear');
        res.status(500).json({
            status: 500,
            type: 'error',
            title: 'Widget Chat Web ETB - IDARTES',
            message: 'No se pudo crear el mensaje, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * CREAR MENSJAJE DESDE SOUL CHAT
const crearSoulChat = async (req, res) => {
    try {
        logger.info({
            contexto: 'controller',
            recurso: 'mensaje.crearSoulChat',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            body: req.body
        }, 'Controller mensaje.controller.js → crearSoulChat');

        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn({
                contexto: 'controller',
                recurso: 'mensaje.crearSoulChat',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: errors.array()[0].msg,
                erroresValidacion: errors.array()
            }, 'Error de validación en mensaje.crearSoulChat');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: errors.array()[0].msg
            });
        }

        // todo: Obtener los datos de la petición
        const {
            idChat,
            remitente,
            estado,
            tipo,
            contenido,
            adjuntos,
            enlaces
        } = req.body;

        // todo: Procesar y validar campo enlaces para botones interactivos
        let enlacesProcesados = enlaces || '-';

        if (enlaces && enlaces !== '-') {
            try {
                let enlacesObj = typeof enlaces === 'string' ? JSON.parse(enlaces) : enlaces;

                const tieneBotones = Array.isArray(enlacesObj) ||
                    (enlacesObj.buttons && Array.isArray(enlacesObj.buttons)) ||
                    (enlacesObj.action && Array.isArray(enlacesObj.action.buttons)) ||
                    (enlacesObj.quick_replies && Array.isArray(enlacesObj.quick_replies));

                if (tieneBotones) {
                    enlacesProcesados = typeof enlacesObj === 'string' ? enlacesObj : JSON.stringify(enlacesObj);
                    logger.info({
                        contexto: 'controller',
                        recurso: 'mensaje.crearSoulChat',
                        origen: getOrigen(req),
                        destino: getDestino(req),
                        contextoRecurso: getContextoRecurso(req),
                        mensaje: 'Botones interactivos detectados y procesados',
                        totalBotones: Array.isArray(enlacesObj) ? enlacesObj.length :
                            (enlacesObj.buttons?.length || enlacesObj.action?.buttons?.length || enlacesObj.quick_replies?.length || 0)
                    }, 'Estructura de botones validada en crearSoulChat');
                } else {
                    enlacesProcesados = typeof enlaces === 'string' ? enlaces : JSON.stringify(enlaces);
                }
            } catch (e) {
                logger.warn({
                    contexto: 'controller',
                    recurso: 'mensaje.crearSoulChat',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    mensaje: 'Error al procesar enlaces, usando valor original',
                    error: e.message
                }, 'Error al validar estructura de botones');
                enlacesProcesados = typeof enlaces === 'string' ? enlaces : String(enlaces);
            }
        }

        // todo: Data por defecto
        const lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
        const descripcion = 'Se crea el mensaje solicitado por soul chat con éxito.';
        const registro = dataEstatica.configuracion.estadoRegistro.activo;
        const responsable = dataEstatica.configuracion.responsable;

        // Por defecto, el contenido es el que viene de SoulChat
        let contenidoFinal = contenido;

        // ! Manejo de adjuntos
        // - enlacesChatFinal: todas las rutas consolidadas (received + send) para tbl_chat
        // - enlacesMensajeFinal: solo las rutas de carpeta send (lo que nosotros enviamos al cliente) para tbl_mensaje
        let enlacesChatFinal = '-';
        let enlacesMensajeFinal = '-';

        // Soportar varias formas de multer: single, array o fields
        let archivos = [];
        if (Array.isArray(req.files) && req.files.length > 0) {
            archivos = req.files;
        } else if (req.files && typeof req.files === 'object') {
            // multer .fields produce objeto {fieldname: [files]}
            archivos = Object.values(req.files).flat();
        } else if (req.file) {
            archivos = [req.file];
        }

        const MAX_SIZE = 5 * 1024 * 1024;

        const invalidSize = archivos.filter(file => file.size > MAX_SIZE);

        if (invalidSize.length > 0) {
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: 'Uno o más archivos superan el tamaño permitido de 5MB.'
            });
        }
        const tieneArchivos = archivos && archivos.length > 0;

        if (tieneArchivos) {
            // Validar extensiones de archivos
            const allowedExtensions = ['pdf', 'xls', 'xlsx', 'jpg', 'png', 'doc', 'docx'];
            const invalidFiles = archivos.filter(file => {
                const nombreArchivo = normalizarNombre(file.originalname);
                const fileExtension = nombreArchivo.split('.').pop().toLowerCase();
                return !allowedExtensions.includes(fileExtension);
            });

            if (invalidFiles.length > 0) {
                logger.warn({
                    contexto: 'controller',
                    recurso: 'mensaje.crearSoulChat',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    codigoRespuesta: 400,
                    rta: 'Algunos archivos tienen extensiones no permitidas.'
                }, 'Adjuntos SoulChat con extensiones inválidas');
                return res.status(400).json({
                    status: 400,
                    type: 'warning',
                    title: 'Widget Chat Web ETB - IDARTES',
                    message: 'Algunos archivos tienen extensiones no permitidas.'
                });
            }

            // Crear estructura de carpetas: uploads/files/{idChat}-{remitente}/send/
            const nombreCarpetaChat = `${idChat}-${remitente}`;
            const chatDir = path.join(__dirname, '../../uploads/files', nombreCarpetaChat);
            const receivedDir = path.join(chatDir, 'received');
            const sendDir = path.join(chatDir, 'send');

            // Crear carpetas si no existen
            if (!fs.existsSync(chatDir)) {
                fs.mkdirSync(chatDir, { recursive: true });
            }
            if (!fs.existsSync(receivedDir)) {
                fs.mkdirSync(receivedDir, { recursive: true });
                const gitkeepReceived = path.join(receivedDir, '.gitkeep');
                if (!fs.existsSync(gitkeepReceived)) {
                    fs.writeFileSync(gitkeepReceived, '');
                }
            }
            if (!fs.existsSync(sendDir)) {
                fs.mkdirSync(sendDir, { recursive: true });
                const gitkeepSend = path.join(sendDir, '.gitkeep');
                if (!fs.existsSync(gitkeepSend)) {
                    fs.writeFileSync(gitkeepSend, '');
                }
            }

            // Mover archivos a la carpeta send (archivos de SoulChat)
            const nuevosEnlaces = archivos.map(file => {
                const nombreArchivo = normalizarNombre(file.originalname);

                const filePath = path.join(sendDir, nombreArchivo);
                fs.renameSync(file.path, filePath);

                return `/files/${nombreCarpetaChat}/send/${nombreArchivo}`;
            }).join('|');

            // Obtener enlaces existentes del chat
            const chatEnlaces = await modelChat.filtrarEnlaces(idChat);
            const enlacesExistentes = chatEnlaces && chatEnlaces.RUTA_ADJUNTOS && chatEnlaces.RUTA_ADJUNTOS !== '-'
                ? chatEnlaces.RUTA_ADJUNTOS
                : '';

            // Concatenar enlaces para el chat (received + send acumulados)
            enlacesChatFinal = enlacesExistentes ? `${enlacesExistentes}|${nuevosEnlaces}` : nuevosEnlaces;

            // Actualizar el campo cht_ruta_adjuntos y cht_adjuntos en tbl_chat
            await modelArbolChatBot.actualizarRutaAdjuntos(idChat, enlacesChatFinal);

            // Para el mensaje que ve el usuario, solo usar los adjuntos del mensaje actual
            const enlacesParaMensaje = nuevosEnlaces.split('|').filter(e => e.trim());
            enlacesMensajeFinal = enlacesParaMensaje.length > 0 ? enlacesParaMensaje.join('|') : '-';

            // Construir mensaje HTML con SOLO los adjuntos del mensaje actual (send)
            const APP_URL = process.env.APP_URL || '';
            const enlacesSendActuales = enlacesParaMensaje.filter(enlace => {
                const enlaceNormalizado = enlace.trim();
                return enlaceNormalizado.includes('/send/') && !enlaceNormalizado.includes('/received/');
            });

            let mensajeConArchivos = '<p class="mensajeAdjuntosChatbot"><b>He adjuntado los siguientes archivos:</b><br/><br/>';
            enlacesSendActuales.forEach(enlace => {
                const nombreArchivo = enlace.split('/').pop();
                const rutaCompleta = `${APP_URL}/uploads${enlace}`;
                mensajeConArchivos += `<a href="${rutaCompleta}" target="_blank">${nombreArchivo}</a><br/>`;
            });
            mensajeConArchivos += '</p>';

            // Actualizar enlacesMensajeFinal para que solo contenga los send del mensaje actual
            enlacesMensajeFinal = enlacesSendActuales.length > 0 ? enlacesSendActuales.join('|') : '-';

            // Cuando hay archivos, usar el mensaje construido e ignorar el contenido de SoulChat
            contenidoFinal = mensajeConArchivos;

            logger.info({
                contexto: 'controller',
                recurso: 'mensaje.crearSoulChat',
                idChat,
                remitente,
                accion: 'construyendo_mensaje_adjuntos',
                adjuntosNuevos: enlacesSendActuales.length,
                enlacesSendActuales: enlacesSendActuales,
                contenidoOriginalIgnorado: contenido ? 'Si' : 'No'
            }, '📎 Construyendo mensaje con solo adjuntos del mensaje actual (send)');
        }

        // Si no hubo adjuntos en este mensaje, mantener enlacesMensajeFinal en '-'
        if (!tieneArchivos) {
            enlacesMensajeFinal = '-';
        }

        // todo: Crear el registro
        const result = await model.crearSoulChat(
            idChat,
            remitente,
            estado,
            tipo,
            contenidoFinal,
            enlacesMensajeFinal,
            lectura,
            descripcion,
            registro,
            responsable
        );

        // todo: Enviar respuesta
        if (result) {
            logger.info({
                contexto: 'controller',
                recurso: 'mensaje.crearSoulChat',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 200,
                rta: 'El mensaje se ha creado correctamente en el sistema.',
                idChat,
                remitente
            }, 'Mensaje Soul Chat creado exitosamente');
            return res.json({
                status: 200,
                type: 'success',
                title: 'Widget Chat Web ETB - IDARTES',
                message: 'El mensaje se ha creado correctamente en el sistema.',
            });
        }
    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'mensaje.crearSoulChat',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/mensaje.controller.js → crearSoulChat');
        res.status(500).json({
            status: 500,
            type: 'error',
            title: 'Widget Chat Web ETB - IDARTES',
            message: 'No se pudo crear el mensaje, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * CREAR MENSJAJE DESDE SOUL CHAT - PASO WIDGET ARBOL ENCUESTA
const encuestaSoulChat = async (req, res) => {
    try {
        logger.info({
            contexto: 'controller',
            recurso: 'mensaje.encuestaSoulChat',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            body: req.body
        }, 'Controller mensaje.controller.js → encuestaSoulChat');
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn({
                contexto: 'controller',
                recurso: 'mensaje.encuestaSoulChat',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: errors.array()[0].msg,
                erroresValidacion: errors.array()
            }, 'Error de validación en mensaje.encuestaSoulChat');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: errors.array()[0].msg
            });
        }

        // todo: Obtener los datos de la petición
        const {
            idChat,
            remitente,
            estado,
            tipo,
            contenido,
            enlaces
        } = req.body;

        // todo: Procesar enlaces si es necesario
        let enlacesProcesados = enlaces || '-';
        if (enlaces && enlaces !== '-' && typeof enlaces === 'object') {
            try {
                enlacesProcesados = JSON.stringify(enlaces);
            } catch (e) {
                logger.warn({
                    contexto: 'controller',
                    recurso: 'mensaje.encuestaSoulChat',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    mensaje: 'Error al serializar enlaces en encuesta',
                    error: e.message
                }, 'Error en serialización de enlaces');
            }
        }

        // todo: Data por defecto
        const solicitoInicioEncuestaArbol = dataEstatica.arbol.solicitoInicioEncuesta;
        const mensajeSolicitoInicioEncuesta = typeof dataEstatica.mensajes.solicitoInicioEncuesta === 'object'
            ? dataEstatica.mensajes.solicitoInicioEncuesta.contenido
            : dataEstatica.mensajes.solicitoInicioEncuesta;
        const lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
        const descripcion = 'Se crea el mensaje solicitado por soul chat - Se solicita inicio de encuesta.';
        const registro = dataEstatica.configuracion.estadoRegistro.activo;
        const responsable = dataEstatica.configuracion.responsable;

        // todo: Actualizar el chat
        const updateChat = await modelChat.encuestaSoulChat(idChat, solicitoInicioEncuestaArbol, descripcion);
        if (updateChat) {

            // todo: Crear el registro - Solicitando inicio de encuesta
            const resultMensajeSolicitoInicioEncuesta = await model.encuestaSoulChat(idChat, remitente, estado, tipo, mensajeSolicitoInicioEncuesta, enlaces, lectura, descripcion, registro, responsable);

            // todo: Si el mensaje solicitando inicio de encuesta se creó correctamente, se solicita el mensaje solicitando calificar servicio
            if (resultMensajeSolicitoInicioEncuesta) {

                // todo: Data por defecto
                const solicitarCalificarServicioArbol = dataEstatica.arbol.solicitarCalificarServicio;
                const descripcion = 'Se solicita calificar servicio.';

                // todo: Actualizar el chat
                const updateChatSolicitarCalificarServicio = await modelChat.encuestaSoulChat(idChat, solicitarCalificarServicioArbol, descripcion);
                if (updateChatSolicitarCalificarServicio) {

                    // todo: Data por defecto
                    const mensajeSolicitarCalificarServicio = dataEstatica.mensajes.solicitarCalificarServicio;
                    const contenidoCalificacion = typeof mensajeSolicitarCalificarServicio === 'object'
                        ? mensajeSolicitarCalificarServicio.contenido
                        : mensajeSolicitarCalificarServicio;
                    const enlacesCalificacion = typeof mensajeSolicitarCalificarServicio === 'object' && mensajeSolicitarCalificarServicio.botones
                        ? JSON.stringify(mensajeSolicitarCalificarServicio.botones)
                        : '-';
                    const lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
                    const descripcion = 'Se crea el mensaje solicitando calificar servicio.';
                    const registro = dataEstatica.configuracion.estadoRegistro.activo;
                    const responsable = dataEstatica.configuracion.responsable;

                    // todo: Crear el registro - Solicitando Calificar Servicio
                    const resultMensajeSolicitarCalificarServicio = await model.encuestaSoulChat(idChat, remitente, estado, tipo, mensajeSolicitarCalificarServicio, enlaces, lectura, descripcion, registro, responsable);

                    // todo: Si el mensaje solicitando calificar servicio se creó correctamente, se envía la respuesta
                    if (resultMensajeSolicitarCalificarServicio) {
                        // todo: Enviar respuesta
                        logger.info({
                            contexto: 'controller',
                            recurso: 'mensaje.encuestaSoulChat',
                            origen: getOrigen(req),
                            destino: getDestino(req),
                            contextoRecurso: getContextoRecurso(req),
                            codigoRespuesta: 200,
                            rta: 'El mensaje se ha creado correctamente en el sistema.',
                            idChat,
                            remitente
                        }, 'Mensaje Soul Chat - paso a widget árbol encuesta - creado exitosamente');
                        return res.json({
                            status: 200,
                            type: 'success',
                            title: 'Widget Chat Web ETB - IDARTES',
                            message: 'El mensaje se ha creado correctamente en el sistema.',
                        });
                    }
                }
            }
        }
    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'mensaje.encuestaSoulChat',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/mensaje.controller.js → encuestaSoulChat');
        res.status(500).json({
            status: 500,
            type: 'error',
            title: 'Widget Chat Web ETB - IDARTES',
            message: 'No se pudo crear el mensaje, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * LISTAR NO LEÍDOS
const listarNoLeido = async (req, res) => {
    try {
        logger.info({
            contexto: 'controller',
            recurso: 'mensaje.listarNoLeido',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            query: req.query
        }, 'Controller mensaje.controller.js → listarNoLeido');
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn({
                contexto: 'controller',
                recurso: 'mensaje.listarNoLeido',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: errors.array()[0].msg,
                erroresValidacion: errors.array()
            }, 'Error de validación en mensaje.listarNoLeido');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: errors.array()[0].msg
            });
        }

        // todo: Obtener los datos de la petición
        const {
            idChatWeb
        } = req.query;

        // todo: Valores por defecto
        let lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;

        // todo: Listar los mensajes
        const result = await model.listarNoLeido(idChatWeb, lectura);

        if (result) {
            // todo: Enviar respuesta
            logger.info({
                contexto: 'controller',
                recurso: 'mensaje.listarNoLeido',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 200,
                rta: 'Los mensajes se han listado correctamente en el sistema.',
                totalMensajes: result.length,
                idChatWeb
            }, 'Mensajes no leídos listados exitosamente');
            res.json({
                status: 200,
                type: 'success',
                title: 'Widget Chat Web ETB - IDARTES',
                message: 'Los mensajes se han listado correctamente en el sistema.',
                data: result
            });
        }
    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'mensaje.listarNoLeido',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/mensaje.controller.js → listarNoLeido');
        res.status(500).json({
            status: 500,
            type: 'error',
            title: 'Widget Chat Web ETB - IDARTES',
            message: 'No se pudo listar los mensajes, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * LEER
const leer = async (req, res) => {
    try {
        logger.info({
            contexto: 'controller',
            recurso: 'mensaje.leer',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            body: req.body
        }, 'Controller mensaje.controller.js → leer');
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn({
                contexto: 'controller',
                recurso: 'mensaje.leer',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: errors.array()[0].msg,
                erroresValidacion: errors.array()
            }, 'Error de validación en mensaje.leer');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: errors.array()[0].msg
            });
        }

        // todo: Obtener los datos de la petición
        const {
            idMensaje
        } = req.body;

        // todo: Valores por defecto
        let lectura = dataEstatica.configuracion.lecturaMensaje.leido;

        // todo: Leer el mensaje
        const result = await model.leer(idMensaje, lectura);

        if (result) {
            // todo: Enviar respuesta
            logger.info({
                contexto: 'controller',
                recurso: 'mensaje.leer',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 200,
                rta: 'El mensaje se ha leído correctamente en el sistema.',
                idMensaje
            }, 'Mensaje leído exitosamente');
            res.json({
                status: 200,
                type: 'success',
                title: 'Widget Chat Web ETB - IDARTES',
                message: 'El mensaje se ha leído correctamente en el sistema.',
            });
        }
    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'mensaje.leer',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/mensaje.controller.js → leer');
        res.status(500).json({
            status: 500,
            type: 'error',
            title: 'Widget Chat Web ETB - IDARTES',
            message: 'No se pudo leer el mensaje, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * ADJUNTAR ARCHIVOS
const adjuntarArchivos = async (req, res) => {
    try {
        logger.info({
            contexto: 'controller',
            recurso: 'mensaje.adjuntarArchivos',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            body: req.body
        }, 'Controller mensaje.controller.js → adjuntarArchivos');

        // Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn({
                contexto: 'controller',
                recurso: 'mensaje.adjuntarArchivos',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: errors.array()[0].msg,
                erroresValidacion: errors.array()
            }, 'Error de validación en mensaje.adjuntarArchivos');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: errors.array()[0].msg
            });
        }

        // Obtener los datos de la petición
        const { idChatWeb, mensaje } = req.body;
        const archivos = req.files;

        const MAX_SIZE = 5 * 1024 * 1024;

        const invalidSize = archivos.filter(file => file.size > MAX_SIZE);

        if (invalidSize.length > 0) {
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: 'Uno o más archivos superan el tamaño permitido de 5MB.'
            });
        }

        if (!archivos || archivos.length === 0) {
            logger.warn({
                contexto: 'controller',
                recurso: 'mensaje.adjuntarArchivos',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: 'No se han recibido archivos.'
            }, 'Adjuntar archivos - sin archivos recibidos');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: 'No se han recibido archivos.'
            });
        }

        // Validar extensiones de archivos
        const allowedExtensions = ['pdf', 'xls', 'xlsx', 'jpg', 'png', 'doc', 'docx'];
        const invalidFiles = archivos.filter(file => {
            const nombreArchivo = normalizarNombre(file.originalname);
            const fileExtension = nombreArchivo.split('.').pop().toLowerCase();
            return !allowedExtensions.includes(fileExtension);
        });

        if (invalidFiles.length > 0) {
            logger.warn({
                contexto: 'controller',
                recurso: 'mensaje.adjuntarArchivos',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: 'Algunos archivos tienen extensiones no permitidas.'
            }, 'Adjuntar archivos - extensiones inválidas');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: 'Algunos archivos tienen extensiones no permitidas.'
            });
        }

        // Validar si el chat existe
        const verificarChat = await modelChat.filtrar(idChatWeb);
        if (verificarChat.length > 0) {
            const idChat = verificarChat[0].ID_CHAT;
            const remitente = idChatWeb;
            const estadoMensaje = dataEstatica.configuracion.estadoMensaje.recibido;
            const tipoMensaje = dataEstatica.configuracion.tipoMensaje.adjuntos;

            // Crear estructura de carpetas: uploads/files/{idChat}-{remitente}/received/
            const nombreCarpetaChat = `${idChat}-${remitente}`;
            const chatDir = path.join(__dirname, '../../uploads/files', nombreCarpetaChat);
            const receivedDir = path.join(chatDir, 'received');
            const sendDir = path.join(chatDir, 'send');

            // Crear carpetas si no existen
            if (!fs.existsSync(chatDir)) {
                fs.mkdirSync(chatDir, { recursive: true });
            }
            if (!fs.existsSync(receivedDir)) {
                fs.mkdirSync(receivedDir, { recursive: true });
                // Crear .gitkeep en received
                const gitkeepReceived = path.join(receivedDir, '.gitkeep');
                if (!fs.existsSync(gitkeepReceived)) {
                    fs.writeFileSync(gitkeepReceived, '');
                }
            }
            if (!fs.existsSync(sendDir)) {
                fs.mkdirSync(sendDir, { recursive: true });
                // Crear .gitkeep en send
                const gitkeepSend = path.join(sendDir, '.gitkeep');
                if (!fs.existsSync(gitkeepSend)) {
                    fs.writeFileSync(gitkeepSend, '');
                }
            }




            const nuevosEnlaces = archivos.map(file => {
                const nombreArchivo = normalizarNombre(file.originalname);

                const filePath = path.join(receivedDir, nombreArchivo);
                fs.renameSync(file.path, filePath);

                return `/files/${nombreCarpetaChat}/received/${nombreArchivo}`;
            }).join('|');

            // Obtener enlaces existentes
            const chatEnlaces = await modelChat.filtrarEnlaces(idChat);
            const enlacesExistentes = chatEnlaces.RUTA_ADJUNTOS && chatEnlaces.RUTA_ADJUNTOS !== '-'
                ? chatEnlaces.RUTA_ADJUNTOS
                : '';

            // Concatenar enlaces acumulados para tbl_chat
            const enlacesAcumulados = enlacesExistentes ? `${enlacesExistentes}|${nuevosEnlaces}` : nuevosEnlaces;

            // Actualizar cht_ruta_adjuntos con todos los enlaces acumulados
            await modelArbolChatBot.actualizarRutaAdjuntos(idChat, enlacesAcumulados);

            // IMPORTANTE: Construir mensaje mostrando SOLO los archivos received del mensaje actual
            const APP_URL = process.env.APP_URL || '';
            const enlacesNuevosArray = nuevosEnlaces.split('|').filter(e => e.trim());

            // Filtrar explícitamente para asegurar que solo sean received (del cliente)
            const enlacesReceivedActuales = enlacesNuevosArray.filter(enlace => {
                const enlaceNormalizado = enlace.trim();
                return enlaceNormalizado.includes('/received/') && !enlaceNormalizado.includes('/send/');
            });

            let mensajeConArchivos = '<p class="mensajeAdjuntosUsuario"><b>He adjuntado los siguientes archivos:</b><br/><br/>';
            enlacesReceivedActuales.forEach(enlace => {
                const nombreArchivo = enlace.split('/').pop();
                const rutaCompleta = `${APP_URL}/uploads${enlace}`;
                mensajeConArchivos += `<a href="${rutaCompleta}" target="_blank">${nombreArchivo}</a><br/>`;
            });
            mensajeConArchivos += '</p>';

            logger.info({
                contexto: 'controller',
                recurso: 'mensaje.adjuntarArchivos',
                idChat,
                remitente,
                accion: 'construyendo_mensaje_adjuntos_cliente',
                adjuntosNuevos: enlacesReceivedActuales.length,
                enlacesReceivedActuales: enlacesReceivedActuales,
                totalAdjuntosAcumulados: enlacesAcumulados.split('|').filter(e => e.trim()).length
            }, '📎 Construyendo mensaje con solo adjuntos del mensaje actual (received)');

            const lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
            const descripcion = 'Archivos adjuntos subidos con éxito.';
            const estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
            const responsable = dataEstatica.configuracion.responsable;

            // Crear mensaje con SOLO los nuevos enlaces received del mensaje actual
            const result = await model.crear(
                idChat, remitente, estadoMensaje, tipoMensaje,
                mensajeConArchivos, nuevosEnlaces,
                lectura, descripcion, estadoRegistro, responsable
            );

            // Enviar respuesta
            if (result) {
                logger.info({
                    contexto: 'controller',
                    recurso: 'mensaje.adjuntarArchivos',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    codigoRespuesta: 200,
                    rta: 'Archivos y mensaje subidos exitosamente.',
                    idChat,
                    totalArchivos: archivos.length
                }, 'Archivos adjuntos procesados exitosamente');

                // Enviar adjuntos a SoulChat si el chat está en Solicitar Paso Asesor (significa que ya hizo START)
                try {
                    const chatActualizado = await modelChat.filtrar(remitente);
                    const arbolChatActualizado = chatActualizado && chatActualizado.length > 0
                        ? chatActualizado[0].ARBOL || '-'
                        : '-';

                    if (arbolChatActualizado === 'Solicitar Paso Asesor') {
                        const FormData = require('form-data');
                        const fs = require('fs');
                        const form = new FormData();

                        // Agregar campos de texto
                        form.append('provider', 'web');
                        form.append('canal', '3');
                        form.append('idChat', idChat.toString());
                        form.append('remitente', remitente);
                        form.append('estado', 'ATTENDING');
                        form.append('mensaje', 'Adjuntando archivos desde el widget');
                        form.append('type', 'TEXT');
                        form.append('responsable', dataEstatica.configuracion.responsable);

                        // Agregar archivos
                        archivos.forEach(file => {
                            const filePath = path.join(receivedDir, normalizarNombre(file.originalname));
                            if (fs.existsSync(filePath)) {
                                form.append('files', fs.createReadStream(filePath), {
                                    filename: file.originalname,
                                    contentType: file.mimetype || 'application/octet-stream'
                                });
                            }
                        });

                        // Enviar a SoulChat
                        const responseSoul = await serviceSoulChat.procesarMensajeAISoul(form);
                    }
                } catch (errorSoul) {
                    // Error silencioso - los adjuntos se guardaron localmente de todos modos
                }

                return res.json({
                    status: 200,
                    type: 'success',
                    title: 'Widget Chat Web ETB - IDARTES',
                    message: 'Archivos y mensaje subidos exitosamente.',
                });
            }
        } else {
            logger.warn({
                contexto: 'controller',
                recurso: 'mensaje.adjuntarArchivos',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: 'El chat no existe en el sistema.',
                idChatWeb
            }, 'Adjuntar archivos - chat no existe');
            res.json({
                status: 400,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: 'El chat no existe en el sistema.'
            });
        }
    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'mensaje.adjuntarArchivos',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/mensaje.controller.js → adjuntarArchivos');
        res.status(500).json({
            status: 500,
            type: 'error',
            title: 'Widget Chat Web ETB - IDARTES',
            message: 'No se pudo adjuntar los archivos, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * ADJUNTAR ARCHIVOS DESDE SOUL CHAT
const adjuntarArchivosSoulChat = async (req, res) => {
    try {
        logger.info({
            contexto: 'controller',
            recurso: 'mensaje.adjuntarArchivosSoulChat',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            body: req.body
        }, 'Controller mensaje.controller.js → adjuntarArchivosSoulChat');

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn({
                contexto: 'controller',
                recurso: 'mensaje.adjuntarArchivosSoulChat',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: errors.array()[0].msg,
                erroresValidacion: errors.array()
            }, 'Error de validación en mensaje.adjuntarArchivosSoulChat');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: errors.array()[0].msg
            });
        }

        const { idChat, remitente } = req.body;
        const archivos = req.files;

        if (!archivos || archivos.length === 0) {
            logger.warn({
                contexto: 'controller',
                recurso: 'mensaje.adjuntarArchivosSoulChat',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: 'No se han recibido archivos.'
            }, 'Adjuntar archivos SoulChat - sin archivos recibidos');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: 'No se han recibido archivos.'
            });
        }

        // Validar extensiones de archivos
        const allowedExtensions = ['pdf', 'xls', 'xlsx', 'jpg', 'png', 'doc', 'docx'];
        const invalidFiles = archivos.filter(file => {
            const nombreArchivo = normalizarNombre(file.originalname);
            const fileExtension = nombreArchivo.split('.').pop().toLowerCase();
            return !allowedExtensions.includes(fileExtension);
        });

        if (invalidFiles.length > 0) {
            logger.warn({
                contexto: 'controller',
                recurso: 'mensaje.adjuntarArchivosSoulChat',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: 'Algunos archivos tienen extensiones no permitidas.'
            }, 'Adjuntar archivos SoulChat - extensiones inválidas');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: 'Algunos archivos tienen extensiones no permitidas.'
            });
        }

        // Obtener chat por idChat para conseguir idChatWeb
        const chatData = await modelChat.filtrarPorIdChat(idChat);
        if (!chatData) {
            logger.warn({
                contexto: 'controller',
                recurso: 'mensaje.adjuntarArchivosSoulChat',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 404,
                rta: 'El chat no existe en el sistema.',
                idChat
            }, 'Adjuntar archivos SoulChat - chat no encontrado');
            return res.status(404).json({
                status: 404,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: 'El chat no existe en el sistema.'
            });
        }

        const idChatWeb = chatData.REMITENTE; // cht_remitente es el idChatWeb
        const estadoMensaje = dataEstatica.configuracion.estadoMensaje.recibido;
        const tipoMensaje = dataEstatica.configuracion.tipoMensaje.adjuntos;

        // Crear carpeta para el chat
        const chatDir = path.join(__dirname, '../../uploads', idChatWeb);
        if (!fs.existsSync(chatDir)) {
            fs.mkdirSync(chatDir, { recursive: true });
        }

        // Mover archivos
        const nuevosEnlaces = archivos.map(file => {
            const nombreArchivo = normalizarNombre(file.originalname);

            const filePath = path.join(chatDir, nombreArchivo);
            fs.renameSync(file.path, filePath);

            return `/${idChatWeb}/${nombreArchivo}`;
        }).join('|');

        // Obtener enlaces existentes
        const chatExistente = await modelChat.filtrarEnlaces(idChat);
        const enlacesExistentes = chatExistente.RUTA_ADJUNTOS && chatExistente.RUTA_ADJUNTOS !== '-' ? chatExistente.RUTA_ADJUNTOS : '';
        const enlacesAcumulados = enlacesExistentes ? `${enlacesExistentes}|${nuevosEnlaces}` : nuevosEnlaces;

        // Actualizar rutas de adjuntos
        await modelArbolChatBot.actualizarRutaAdjuntos(idChat, enlacesAcumulados);

        // Construir mensaje
        const APP_URL = process.env.APP_URL || '';
        let mensajeConArchivos = '<p id="archivosAdjuntosSoulChat"><b>Se han recibido los siguientes archivos adjuntos:</b><br/><br/>';
        nuevosEnlaces.split('|').filter(e => e.trim()).forEach(enlace => {
            const nombreArchivo = enlace.split('/').pop();
            mensajeConArchivos += `<a href="${APP_URL}${enlace}" target="_blank">${nombreArchivo}</a><br/><br/>`;
        });
        mensajeConArchivos += '</p>';

        const lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
        const descripcion = 'Archivos adjuntos recibidos desde Soul Chat.';
        const estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
        const responsable = dataEstatica.configuracion.responsable;

        // Crear mensaje
        const result = await model.crearSoulChat(
            idChat, remitente, estadoMensaje, tipoMensaje,
            mensajeConArchivos, nuevosEnlaces,
            lectura, descripcion, estadoRegistro, responsable
        );

        if (result) {
            logger.info({
                contexto: 'controller',
                recurso: 'mensaje.adjuntarArchivosSoulChat',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 200,
                rta: 'Archivos y mensaje subidos exitosamente desde Soul Chat.',
                idChat,
                totalArchivos: archivos.length
            }, 'Archivos adjuntos SoulChat procesados exitosamente');
            return res.json({
                status: 200,
                type: 'success',
                title: 'Widget Chat Web ETB - IDARTES',
                message: 'Archivos y mensaje subidos exitosamente desde Soul Chat.',
            });
        }
    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'mensaje.adjuntarArchivosSoulChat',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/mensaje.controller.js → adjuntarArchivosSoulChat');
        res.status(500).json({
            status: 500,
            type: 'error',
            title: 'Widget Chat Web ETB - IDARTES',
            message: 'No se pudo adjuntar los archivos, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * LISTAR CONVERSACIÓN COMPLETA
const listarConversacion = async (req, res) => {
    try {
        logger.info({
            contexto: 'controller',
            recurso: 'mensaje.listarConversacion',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            query: req.query
        }, 'Controller mensaje.controller.js → listarConversacion');
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn({
                contexto: 'controller',
                recurso: 'mensaje.listarConversacion',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: errors.array()[0].msg,
                erroresValidacion: errors.array()
            }, 'Error de validación en mensaje.listarConversacion');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'Widget Chat Web ETB - IDARTES',
                message: errors.array()[0].msg
            });
        }

        // todo: Obtener los datos de la petición
        const { idChatWeb } = req.query;

        // todo: Listar todos los mensajes de la conversación
        const result = await model.listarConversacion(idChatWeb);

        if (result) {
            // todo: Enviar respuesta
            logger.info({
                contexto: 'controller',
                recurso: 'mensaje.listarConversacion',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 200,
                rta: 'La conversación se ha listado correctamente en el sistema.',
                totalMensajes: result.length,
                idChatWeb
            }, 'Conversación listada exitosamente');
            res.json({
                status: 200,
                type: 'success',
                title: 'Widget Chat Web ETB - IDARTES',
                message: 'La conversación se ha listado correctamente en el sistema.',
                data: result
            });
        }
    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'mensaje.listarConversacion',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/mensaje.controller.js → listarConversacion');
        res.status(500).json({
            status: 500,
            type: 'error',
            title: 'Widget Chat Web ETB - IDARTES',
            message: 'No se pudo listar la conversación, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * VIGILAR INACTIVIDAD DEL CHAT
const vigilaInactividadChat = async (req, res) => {
    try {
        logger.info({
            contexto: 'controller',
            recurso: 'mensaje.vigilaInactividadChat',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            body: req.body
        }, 'Controller mensaje.controller.js → vigilaInactividadChat');
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn({
                contexto: 'controller',
                recurso: 'mensaje.vigilaInactividadChat',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: errors.array()[0].msg,
                erroresValidacion: errors.array()
            }, 'Error de validación en mensaje.vigilaInactividadChat');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'Chat Web MinTic',
                message: errors.array()[0].msg
            });
        }

        const { idChatWeb, tiempoInactividad, dispararAlerta } = req.body;

        const chat = await modelChat.filtrar(idChatWeb);

        if (chat.length > 0 && chat[0].GESTION === 'Abierto') {
            const nombreCliente = chat[0].NOMBRE_COMPLETO || null;

            if (dispararAlerta && tiempoInactividad >= 21 && tiempoInactividad < 22) {
                const descripcion = `Inactividad de 21 minutos.`;
                await modelArbolChatBot.crearAlertaInactividad(idChatWeb, descripcion, nombreCliente);
            }
            else if (dispararAlerta && tiempoInactividad >= 22 && tiempoInactividad < 23) {
                const descripcion = `Inactividad de 22 minutos.`;
                await modelArbolChatBot.crearAlertaInactividad(idChatWeb, descripcion, nombreCliente);
            }
            else if (dispararAlerta && tiempoInactividad >= 23 && tiempoInactividad < 24) {
                const descripcion = `Inactividad de 23 minutos.`;
                await modelArbolChatBot.crearAlertaInactividad(idChatWeb, descripcion, nombreCliente);
            }
            else if (dispararAlerta && tiempoInactividad >= 24 && tiempoInactividad < 25) {
                // todo: Crear mensaje de cierre por inactividad
                await modelArbolChatBot.crearMensajeCierreInactividad(idChatWeb);

                const descripcion = 'Chat cerrado por inactividad.';

                // todo: Cerrar el chat
                await modelChat.cerrar(
                    idChatWeb,
                    dataEstatica.configuracion.estadoChat.recibido,
                    dataEstatica.configuracion.estadoGestion.cerrado,
                    dataEstatica.arbol.cerradoPorInactividad,
                    dataEstatica.configuracion.controlApi.success,
                    descripcion,
                    dataEstatica.configuracion.estadoRegistro.activo,
                    dataEstatica.configuracion.responsable
                );

                // todo: Consumir servicio de soul chat para notificar cierre de chat, cambiando el estado de START a CLOSE
                const estructuraMensaje = {
                    provider: "web",
                    canal: 3,
                    idChat: chat[0].ID_CHAT,
                    remitente: idChatWeb,
                    estado: "CLOSE",
                    mensaje: descripcion,
                    type: "TEXT",
                    responsable: dataEstatica.configuracion.responsable
                }

                // Sistema de reintentos automáticos para notificar cierre de chat
                let intento = 1;
                const maxIntentos = 5;
                let response = null;
                let error = null;

                while (intento <= maxIntentos) {
                    try {
                        // Consumir servicio de Soul Chat
                        response = await serviceSoulChat.procesarMensajeSoulChat(estructuraMensaje);

                        // Si la respuesta tiene status 200 o 202, éxito
                        if (response.status === 200 || response.status === 202) {
                            break; // Salir del bucle de reintentos
                        } else {
                            // Respuesta con error HTTP, incrementar contador y continuar con el siguiente intento

                            // Si no es el último intento, esperar antes de reintentar
                            if (intento < maxIntentos) {
                                await new Promise(resolve => setTimeout(resolve, 30000)); // Esperar 30 segundos
                            }
                        }
                    } catch (apiError) {
                        // Error de conexión o timeout, incrementar contador y continuar
                        error = apiError;
                        // Si no es el último intento, esperar antes de reintentar
                        if (intento < maxIntentos) {
                            await new Promise(resolve => setTimeout(resolve, 30000)); // Esperar 30 segundos
                        }
                    }

                    intento++;
                }
            }
        }

        const mensajesNoLeidos = await model.listarNoLeido(idChatWeb, dataEstatica.configuracion.lecturaMensaje.noLeido);

        logger.info({
            contexto: 'controller',
            recurso: 'mensaje.vigilaInactividadChat',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 200,
            rta: 'Proceso de vigilancia de inactividad completado.',
            idChatWeb
        }, 'Vigilancia de inactividad completada');
        res.json({
            status: 200,
            type: 'success',
            title: 'Chat Web MinTic',
            message: 'Proceso de vigilancia de inactividad completado.',
            data: mensajesNoLeidos
        });
    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'mensaje.vigilaInactividadChat',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/mensaje.controller.js → vigilaInactividadChat');
        res.status(500).json({
            status: 500,
            type: 'error',
            title: 'Chat Web MinTic',
            message: 'Error al vigilar la inactividad del chat.',
            error: error.message
        });
    }
};

// ! EXPORTACIONES
module.exports = {
    crear,
    crearSoulChat,
    encuestaSoulChat,
    listarNoLeido,
    leer,
    adjuntarArchivos,
    adjuntarArchivosSoulChat,
    listarConversacion,
    vigilaInactividadChat,
};