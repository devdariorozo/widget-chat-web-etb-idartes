// ! ================================================================================================================================================
// !                                                      CONTROLADORES PARA CHAT
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres (05 de Marzo de 2025)
// @lastModified Ramón Dario Rozo Torres (05 de Marzo de 2025)
// @version 1.0.0
// v1/controllers/widget/chat.controller.js

// ! REQUIRES
const moment = require('moment');
const { validationResult } = require('express-validator');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './../../.env') });
const model = require('../../models/widget/chat.model.js');
const dataEstatica = require('../../seeds/dataEstatica.js');
const modelMensaje = require('../../models/widget/mensaje.model.js');
const logger = require('../../logger');
const { getOrigen, getDestino, getContextoRecurso } = require('../../logger/context');

// ! CONTROLADORES
// * CREAR
const crear = async (req, res) => {
    try {
        logger.info({
            contexto: 'controller',
            recurso: 'chat.crear',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            body: req.body
        }, 'Controller chat.controller.js → crear');
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn({
                contexto: 'controller',
                recurso: 'chat.crear',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: errors.array()[0].msg,
                erroresValidacion: errors.array()
            }, 'Error de validación en chat.crear');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'ETB - IDARTES',
                message: errors.array()[0].msg
            });
        }

        // todo: Obtener los datos de la petición
        const {
            idChatWeb
        } = req.body;

        // todo: Preparamos los datos por defecto
        let tipoGestion = dataEstatica.configuracion.tipoGestion.inbound;
        let remitente = idChatWeb;
        let estadoChat = dataEstatica.configuracion.estadoChat.recibido;
        let estadoGestion = dataEstatica.configuracion.estadoGestion.abierto;
        let arbol = dataEstatica.arbol.pasoDirectoSoulChat;
        let controlApi = dataEstatica.configuracion.controlApi.success;
        let controlPeticiones = 0;
        let resultadoApi = '-';
        let descripcion = 'Se crea el chat habilitado para Paso Directo Soul Chat.';
        let estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
        let responsable = dataEstatica.configuracion.responsable;

        // todo: Validar si el chat existe
        const verificarDuplicado = await model.verificarDuplicado(remitente, estadoGestion, estadoRegistro);
        if (verificarDuplicado.length > 0) {
            logger.warn({
                contexto: 'controller',
                recurso: 'chat.crear',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: 'El chat ya existe en el sistema.',
                idChatWeb: remitente
            }, 'Intento de crear chat duplicado');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'ETB - IDARTES',
                message: 'El chat ya existe en el sistema.'
            });
        }

        // todo: Crear el registro
        const result = await model.crear(tipoGestion, remitente, estadoChat, estadoGestion, arbol, controlApi, controlPeticiones, resultadoApi, descripcion, estadoRegistro, responsable);

        if (result) {
            const idChat = result[0].insertId;
            logger.info({
                contexto: 'controller',
                recurso: 'chat.crear',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 200,
                rta: 'El chat se ha creado correctamente en el sistema en modo Paso Directo Soul Chat.',
                idChat: result[0].insertId
            }, 'Chat creado exitosamente (Paso Directo Soul Chat)');
            return res.json({
                status: 200,
                type: 'success',
                title: 'ETB - IDARTES',
                message: 'El chat se ha creado correctamente en el sistema.',
                idChat
            });
        }
    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'chat.crear',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/chat.controller.js → crear');
        res.status(500).json({
            status: 500,
            type: 'error',
            title: 'ETB - IDARTES',
            message: 'No se pudo crear el chat, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * FORMULARIO INICIAL
const formularioInicial = async (req, res) => {
    logger.info({
        contexto: 'controller',
        recurso: 'chat.formularioInicial',
        origen: getOrigen(req),
        destino: getDestino(req),
        contextoRecurso: getContextoRecurso(req),
        body: req.body
    }, 'Intento de utilizar formularioInicial en modo Paso Directo Soul Chat');

    return res.status(410).json({
        status: 410,
        type: 'warning',
        title: 'ETB - IDARTES',
        message: 'El formulario inicial ha sido deshabilitado. La atención es directa con AI Soul.'
    });
};

// * OPCIONES CONTROL API
const opcionesControlApi = async (req, res) => {
    try {
        logger.info({
            contexto: 'controller',
            recurso: 'chat.opcionesControlApi',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            body: req.body
        }, 'Controller chat.controller.js → opcionesControlApi');
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn({
                contexto: 'controller',
                recurso: 'chat.opcionesControlApi',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: errors.array()[0].msg,
                erroresValidacion: errors.array()
            }, 'Error de validación en chat.opcionesControlApi');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'ETB - IDARTES',
                message: errors.array()[0].msg
            });
        }

        // todo: Obtener los datos de la petición

        // todo: Listar las opciones de control api
        const result = await model.opcionesControlApi();

        // todo: Enviar respuesta
        if (result) {
            logger.info({
                contexto: 'controller',
                recurso: 'chat.opcionesControlApi',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 200,
                rta: 'Opciones de control api listadas correctamente.',
                totalOpciones: result.length
            }, 'Opciones de control API listadas exitosamente');
            res.json({
                status: 200,
                type: 'success',
                title: 'ETB - IDARTES',
                message: 'Opciones de control api listadas correctamente.',
                data: result
            });
        }
    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'chat.opcionesControlApi',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/chat.controller.js → opcionesControlApi');
        res.status(500).json({
            status: 500,
            type: 'error',
            title: 'ETB - IDARTES',
            message: 'No se pudo listar las opciones de control api, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * MONITOR
const monitor = async (req, res) => {
    try {
        logger.info({
            contexto: 'controller',
            recurso: 'chat.monitor',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            body: req.body
        }, 'Controller chat.controller.js → monitor');
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn({
                contexto: 'controller',
                recurso: 'chat.monitor',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: errors.array()[0].msg,
                erroresValidacion: errors.array()
            }, 'Error de validación en chat.monitor');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'ETB - IDARTES',
                message: errors.array()[0].msg
            });
        }

        // todo: Obtener los datos de la petición
        const {
            fechaInicial,
            fechaFinal,
            opcionControlApi,
            numeroLimite,
            numeroDesplazamiento
        } = req.body;

        // todo: Listar los archivos adjuntos
        const result = await model.monitor(fechaInicial, fechaFinal, opcionControlApi, numeroLimite, numeroDesplazamiento);

        // todo: Formatear respuesta
        result.data.forEach(item => {
            item.FECHA_REGISTRO = moment(item.FECHA_REGISTRO).format('YYYY-MM-DD HH:mm:ss');
            item.FECHA_ACTUALIZACION = moment(item.FECHA_ACTUALIZACION).format('YYYY-MM-DD HH:mm:ss');
        });

        // todo: Enviar respuesta
        if (result) {
            logger.info({
                contexto: 'controller',
                recurso: 'chat.monitor',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 200,
                rta: 'Chats listados correctamente.',
                totalCount: result.totalCount,
                filteredCount: result.filteredCount
            }, 'Monitor de chats consultado exitosamente');
            res.json({
                status: 200,
                type: 'success',
                title: 'ETB - IDARTES',
                message: 'Chats listados correctamente.',
                data: result.data,
                totalCount: result.totalCount,
                filteredCount: result.filteredCount,
            });
        }
    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'chat.monitor',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/chat.controller.js → monitor');
        res.status(500).json({
            status: 500,
            type: 'error',
            title: 'ETB - IDARTES',
            message: 'No se pudo listar los chats, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * LISTAR ARCHIVOS ADJUNTOS
const listarArchivosAdjuntos = async (req, res) => {
    try {
        logger.info({
            contexto: 'controller',
            recurso: 'chat.listarArchivosAdjuntos',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            query: req.query
        }, 'Controller chat.controller.js → listarArchivosAdjuntos');
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn({
                contexto: 'controller',
                recurso: 'chat.listarArchivosAdjuntos',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: errors.array()[0].msg,
                erroresValidacion: errors.array()
            }, 'Error de validación en chat.listarArchivosAdjuntos');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'ETB - IDARTES',
                message: errors.array()[0].msg
            });
        }

        // todo: Obtener los datos de la petición
        const {
            idChat
        } = req.query;

        // todo: Listar los archivos adjuntos
        const result = await model.listarArchivosAdjuntos(idChat);

        // todo: Enviar respuesta
        if (result) {
            logger.info({
                contexto: 'controller',
                recurso: 'chat.listarArchivosAdjuntos',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 200,
                rta: 'Archivos adjuntos listados correctamente.',
                totalArchivos: result.length,
                idChat: req.query.idChat
            }, 'Archivos adjuntos listados exitosamente');
            res.json({
                status: 200,
                type: 'success',
                title: 'ETB - IDARTES',
                message: 'Archivos adjuntos listados correctamente.',
                data: result
            });
        }
    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'chat.listarArchivosAdjuntos',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/chat.controller.js → listarArchivosAdjuntos');
        res.status(500).json({
            status: 500,
            type: 'error',
            title: 'ETB - IDARTES',
            message: 'No se pudo listar los archivos adjuntos, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * FILTRAR
const filtrar = async (req, res) => {
    try {
        logger.info({
            contexto: 'controller',
            recurso: 'chat.filtrar',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            query: req.query
        }, 'Controller chat.controller.js → filtrar');
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn({
                contexto: 'controller',
                recurso: 'chat.filtrar',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: errors.array()[0].msg,
                erroresValidacion: errors.array()
            }, 'Error de validación en chat.filtrar');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'ETB - IDARTES',
                message: errors.array()[0].msg
            });
        }

        // todo: Obtener los datos de la petición
        const {
            idChatWeb
        } = req.query;

        // todo: Listar los archivos adjuntos
        const result = await model.filtrar(idChatWeb);

        // todo: Formatear respuesta
        result.forEach(item => {
            item.FECHA_REGISTRO = moment(item.FECHA_REGISTRO).format('YYYY-MM-DD HH:mm:ss');
            item.FECHA_ACTUALIZACION = moment(item.FECHA_ACTUALIZACION).format('YYYY-MM-DD HH:mm:ss');
        });

        // todo: Enviar respuesta
        if (result) {
            logger.info({
                contexto: 'controller',
                recurso: 'chat.filtrar',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 200,
                rta: 'Chat filtrado correctamente.',
                totalRegistros: result.length,
                idChatWeb: req.query.idChatWeb
            }, 'Chat filtrado exitosamente');
            res.json({
                status: 200,
                type: 'success',
                title: 'ETB - IDARTES',
                message: 'Chat filtrado correctamente.',
                data: result
            });
        }
    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'chat.filtrar',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/chat.controller.js → filtrar');
        res.status(500).json({
            status: 500,
            type: 'error',
            title: 'ETB - IDARTES',
            message: 'No se pudo filtrar el chat, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * CERRAR
const cerrar = async (req, res) => {
    try {
        logger.info({
            contexto: 'controller',
            recurso: 'chat.cerrar',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            body: req.body
        }, 'Controller chat.controller.js → cerrar');
        const {
            idChatWeb
        } = req.body;

        // todo: Preparamos los datos por defecto
        let remitente = idChatWeb;
        let estadoChat = dataEstatica.configuracion.estadoChat.recibido;
        let estadoGestion = dataEstatica.configuracion.estadoGestion.cerrado;
        let arbol = dataEstatica.arbol.despedida;
        let controlApi = dataEstatica.configuracion.controlApi.success;
        let descripcion = 'Se cierra el chat directamente por parte del usuario.';
        let estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
        let responsable = dataEstatica.configuracion.responsable;

        // todo: Cerrar el chat
        const result = await model.cerrar(remitente, estadoChat, estadoGestion, arbol, controlApi, descripcion, estadoRegistro, responsable);

        // todo: Enviar respuesta
        if (result) {

            // todo: Crear el mensaje de despedida
            let idChat = result[0].ID_CHAT;
            let estadoMensaje = dataEstatica.configuracion.estadoMensaje.enviado;
            let tipoMensaje = dataEstatica.configuracion.tipoMensaje.finChat;
            let contenido = dataEstatica.mensajes.despedida;
            let enlaces = '-';
            let lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
            let descripcion = 'Se crea el mensaje de despedida.';
            let estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
            let responsable = dataEstatica.configuracion.responsable;
            const resultMensajeDespedida = await modelMensaje.crear(idChat, remitente, estadoMensaje, tipoMensaje, contenido, enlaces, lectura, descripcion, estadoRegistro, responsable);

            if (resultMensajeDespedida) {
                logger.info({
                    contexto: 'controller',
                    recurso: 'chat.cerrar',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    codigoRespuesta: 200,
                    rta: 'El chat se ha cerrado correctamente en el sistema.',
                    idChat: result[0].ID_CHAT,
                    idChatWeb: remitente
                }, 'Chat cerrado exitosamente');
                res.json({
                    status: 200,
                    type: 'success',
                    title: 'ETB - IDARTES',
                    message: 'El chat se ha cerrado correctamente en el sistema.',
                });
            }
        }

    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'chat.cerrar',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/chat.controller.js → cerrar');
        res.status(500).json({
            status: 500,
            type: 'error',
            title: 'ETB - IDARTES',
            message: 'No se pudo cerrar el chat, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * CERRAR CHAT DESDE SOUL CHAT
const cerrarSoulChat = async (req, res) => {
    try {
        logger.info({
            contexto: 'controller',
            recurso: 'chat.cerrarSoulChat',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            body: req.body
        }, 'Controller chat.controller.js → cerrarSoulChat');
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn({
                contexto: 'controller',
                recurso: 'chat.cerrarSoulChat',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 400,
                rta: errors.array()[0].msg,
                erroresValidacion: errors.array()
            }, 'Error de validación en chat.cerrarSoulChat');
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: 'ETB - IDARTES',
                message: errors.array()[0].msg
            });
        }

        // todo: Obtener los datos de la petición
        const {
            idChat,
            remitente
        } = req.body;

        // todo: Data por defecto
        const estadoChat = dataEstatica.configuracion.estadoChat.recibido;
        const estadoGestion = dataEstatica.configuracion.estadoGestion.cerrado;
        const arbol = dataEstatica.arbol.despedida;
        const controlApi = dataEstatica.configuracion.controlApi.success;
        const descripcion = 'Se cierra el chat directamente por parte del usuario desde soul chat.';
        const estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
        const responsable = dataEstatica.configuracion.responsable;

        // todo: Cerrar el chat
        const result = await model.cerrarChatAI(remitente, estadoChat, estadoGestion, arbol, controlApi, descripcion, estadoRegistro, responsable);

        // todo: Enviar respuesta
        if (result) {

            // todo: Crear el mensaje de despedida
            let estadoMensaje = dataEstatica.configuracion.estadoMensaje.enviado;
            let tipoMensaje = dataEstatica.configuracion.tipoMensaje.finChat;
            let contenido = dataEstatica.mensajes.despedida;
            let enlaces = '-';
            let lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
            let descripcion = 'Se crea el mensaje de despedida.';
            let estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
            let responsable = dataEstatica.configuracion.responsable;
            const resultMensajeDespedida = await modelMensaje.crear(idChat, remitente, estadoMensaje, tipoMensaje, contenido, enlaces, lectura, descripcion, estadoRegistro, responsable);

            if (resultMensajeDespedida) {
                logger.info({
                    contexto: 'controller',
                    recurso: 'chat.cerrarSoulChat',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    codigoRespuesta: 200,
                    rta: 'El chat se ha cerrado correctamente en el sistema.',
                    idChat: req.body.idChat,
                    remitente: req.body.remitente
                }, 'Chat cerrado desde Soul Chat exitosamente');
                res.json({
                    status: 200,
                    type: 'success',
                    title: 'ETB - IDARTES',
                    message: 'El chat se ha cerrado correctamente en el sistema.',
                });
            }
        }

    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'chat.cerrarSoulChat',
            origen: getOrigen(req),
            destino: getDestino(req),
            contextoRecurso: getContextoRecurso(req),
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/chat.controller.js → cerrarSoulChat');
        res.status(500).json({
            status: 500,
            type: 'error',
            title: 'ETB - IDARTES',
            message: 'No se pudo cerrar el chat, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * CERRAR CHATS ABIERTOS ANTIGUOS AUTOMATICAMENTE
const cerrarChatsAbiertosAntiguos = async () => {
    try {
        // todo: Obtener el tiempo límite desde las variables de entorno
        const tiempoLimiteHoras = parseInt(process.env.TIEMPO_LIMITE_CHAT_ABIERTOS || '24');

        // todo: Obtener fecha y hora actual en formato correcto
        const fechaActual = moment().format('YYYY-MM-DD HH:mm:ss');

        // todo: Listar chats abiertos que superen el tiempo límite
        const chatsAntiguos = await model.listarChatsAbiertosAntiguos(tiempoLimiteHoras, fechaActual);

        if (!chatsAntiguos || chatsAntiguos.length === 0) {
            
            return {
                success: true,
                chatsCerrados: 0,
                totalChatsEncontrados: 0,
                tiempoLimiteHoras,
                message: 'No se encontraron chats abiertos que superen el tiempo límite configurado.'
            };
        }

        // todo: Preparar datos para cerrar los chats
        const estadoChat = dataEstatica.configuracion.estadoChat.recibido;
        const estadoGestion = dataEstatica.configuracion.estadoGestion.cerrado;
        const arbol = dataEstatica.arbol.despedida;
        const controlApi = dataEstatica.configuracion.controlApi.success;
        const estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
        const responsable = dataEstatica.configuracion.responsable;

        // todo: Cerrar cada chat y crear mensaje de despedida
        let chatsCerradosCount = 0;
        const resultados = [];

        for (const chat of chatsAntiguos) {
            try {
                const descripcion = `Chat cerrado automáticamente por superar ${tiempoLimiteHoras} horas (${chat.HORAS_TRANSCURRIDAS} horas transcurridas). Arbol en: ${chat.ARBOL}`;
                
                // Cerrar el chat
                const resultCerrar = await model.cerrarChatPorId(
                    chat.ID_CHAT,
                    estadoChat,
                    estadoGestion,
                    arbol,
                    controlApi,
                    descripcion,
                    estadoRegistro,
                    responsable
                );

                if (resultCerrar) {
                    // Crear mensaje de despedida
                    const contenido = `<p class="alertaCierreAutomaticoArbol"><b>⏰ Chat cerrado automáticamente.</b><br/><br/> 
                        ⚠️ Este chat ha sido cerrado automáticamente por superar las ${tiempoLimiteHoras} horas de inactividad.<br/><br/>
                        📝 Tiempo transcurrido: ${chat.HORAS_TRANSCURRIDAS} horas.<br/><br/>
                        💬 Si necesita asistencia, puede iniciar un nuevo chat.
                    </p>`;

                    await modelMensaje.crear(
                        chat.ID_CHAT,
                        chat.REMITENTE,
                        dataEstatica.configuracion.estadoMensaje.enviado,
                        dataEstatica.configuracion.tipoMensaje.finChat,
                        contenido,
                        '-',
                        dataEstatica.configuracion.lecturaMensaje.noLeido,
                        descripcion,
                        estadoRegistro,
                        responsable
                    );

                    chatsCerradosCount++;
                    resultados.push({
                        idChat: chat.ID_CHAT,
                        remitente: chat.REMITENTE,
                        horasTranscurridas: chat.HORAS_TRANSCURRIDAS,
                        arbol: chat.ARBOL,
                        nombres: chat.NOMBRES,
                        apellidos: chat.APELLIDOS,
                        cerrado: true
                    });

                }
            } catch (error) {
                logger.error({
                    contexto: 'controller',
                    recurso: 'chat.cerrarChatsAbiertosAntiguos',
                    codigoRespuesta: 500,
                    errorMensaje: error.message,
                    idChat: chat.ID_CHAT,
                    remitente: chat.REMITENTE
                }, `Error cerrando chat ${chat.ID_CHAT}`);
                resultados.push({
                    idChat: chat.ID_CHAT,
                    remitente: chat.REMITENTE,
                    horasTranscurridas: chat.HORAS_TRANSCURRIDAS,
                    cerrado: false,
                    error: error.message
                });
            }
        }

        // todo: Retornar resultado
        return {
            success: true,
            chatsCerrados: chatsCerradosCount,
            totalChatsEncontrados: chatsAntiguos.length,
            tiempoLimiteHoras,
            message: `Se cerraron ${chatsCerradosCount} chat(s) abierto(s) que superaron el tiempo límite de ${tiempoLimiteHoras} horas.`,
            resultados
        };

    } catch (error) {
        logger.error({
            contexto: 'controller',
            recurso: 'chat.cerrarChatsAbiertosAntiguos',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en v1/controllers/widget/chat.controller.js → cerrarChatsAbiertosAntiguos');
        return {
            success: false,
            chatsCerrados: 0,
            totalChatsEncontrados: 0,
            error: error.message,
            message: 'No se pudo ejecutar el proceso de cierre automático de chats antiguos.'
        };
    }
};

// ! EXPORTACIONES
module.exports = {
    crear,
    formularioInicial,
    opcionesControlApi,
    monitor,
    listarArchivosAdjuntos,
    filtrar,
    cerrar,
    cerrarSoulChat,
    cerrarChatsAbiertosAntiguos,
};