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
            enlaces
        } = req.body;

        // todo: Data por defecto
        const lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
        const descripcion = 'Se crea el mensaje solicitado por soul chat con éxito.';
        const registro = dataEstatica.configuracion.estadoRegistro.activo;
        const responsable = dataEstatica.configuracion.responsable;

        // todo: Crear el registro
        const result = await model.crearSoulChat(idChat, remitente, estado, tipo, contenido, enlaces, lectura, descripcion, registro, responsable);
        
        // todo: Enviar respuesta
        if (result) {
            // todo: Enviar respuesta
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

        // todo: Data por defecto
        const solicitoInicioEncuestaArbol = dataEstatica.arbol.solicitoInicioEncuesta;
        const mensajeSolicitoInicioEncuesta = dataEstatica.mensajes.solicitoInicioEncuesta;
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
            const fileExtension = file.originalname.split('.').pop().toLowerCase();
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
            const estadoMensaje = dataEstatica.configuracion.estadoMensaje.recibido; // No leído
            const tipoMensaje = dataEstatica.configuracion.tipoMensaje.adjuntos; // Adjuntos

            // Crear carpeta para el chat si no existe
            const chatDir = path.join(__dirname, '../../uploads', idChatWeb);
            if (!fs.existsSync(chatDir)) {
                fs.mkdirSync(chatDir, { recursive: true });
            }

            // Mover archivos a la carpeta del chat
            const nuevosEnlaces = archivos.map(file => {
                const filePath = path.join(chatDir, file.originalname);
                fs.renameSync(file.path, filePath);
                return `/${idChatWeb}/${file.originalname}`;
            }).join('|');

            // Obtener enlaces existentes
            const chatData = await modelChat.filtrarEnlaces(idChat);
            const enlacesExistentes = chatData.RUTA_ADJUNTOS && chatData.RUTA_ADJUNTOS !== '-' ? chatData.RUTA_ADJUNTOS : '';

            // Concatenar enlaces
            const enlaces = enlacesExistentes ? `${enlacesExistentes}|${nuevosEnlaces}` : nuevosEnlaces;

            const lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
            const descripcion = 'Archivos adjuntos subidos con éxito.';
            const estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
            const responsable = dataEstatica.configuracion.responsable;

            // Crear el registro en tbl_mensaje
            const result = await model.crear(idChat, remitente, estadoMensaje, tipoMensaje, mensaje, enlaces, lectura, descripcion, estadoRegistro, responsable);

            // Actualizar el campo cht_ruta_adjuntos en tbl_chat
            await modelArbolChatBot.actualizarRutaAdjuntos(idChat, enlaces);

            // Enviar los archivos adjuntos en un mensaje
            await modelArbolChatBot.procesarArchivosAdjuntos(idChat, remitente, mensaje);

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

            // Primer aviso a los 2 minutos
            if (dispararAlerta && tiempoInactividad === 2) {
                const descripcion = `Inactividad de 2 minutos.`;
                await modelArbolChatBot.crearAlertaInactividad(idChatWeb, descripcion, nombreCliente);
            }
            // Segundo aviso a los 3 minutos
            else if (dispararAlerta && tiempoInactividad === 3) {
                const descripcion = `Inactividad de 3 minutos.`;
                await modelArbolChatBot.crearAlertaInactividad(idChatWeb, descripcion, nombreCliente);
            }
            // Tercer aviso a los 4 minutos
            else if (dispararAlerta && tiempoInactividad === 4) {
                const descripcion = `Inactividad de 4 minutos.`;
                await modelArbolChatBot.crearAlertaInactividad(idChatWeb, descripcion, nombreCliente);
            }
            // Cierre del chat a los 5 minutos
            else if (dispararAlerta && tiempoInactividad === 5) {
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
    listarConversacion,
    vigilaInactividadChat,
};