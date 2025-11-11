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

// ! CONTROLADORES
// * CREAR
const crear = async (req, res) => {
    try {
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: dataEstatica.configuracion.responsable,
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
        let arbol = dataEstatica.arbol.saludo;
        let controlApi = dataEstatica.configuracion.controlApi.success;
        let controlPeticiones = 0;
        let resultadoApi = '-';
        let descripcion = 'Se crea el chat con éxito.';
        let estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
        let responsable = dataEstatica.configuracion.responsable;

        // todo: Validar si el chat existe
        const verificarDuplicado = await model.verificarDuplicado(remitente, estadoGestion, estadoRegistro);
        if (verificarDuplicado.length > 0) {
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: dataEstatica.configuracion.responsable,
                message: 'El chat ya existe en el sistema.'
            });
        }

        // todo: Crear el registro
        const result = await model.crear(tipoGestion, remitente, estadoChat, estadoGestion, arbol, controlApi, controlPeticiones, resultadoApi, descripcion, estadoRegistro, responsable);

        if (result) {
            // todo: Crear el mensaje de bienvenida
            let idChat = result[0].insertId;
            let estadoMensaje = dataEstatica.configuracion.estadoMensaje.enviado;
            let tipoMensaje = dataEstatica.configuracion.tipoMensaje.texto;
            let contenido = dataEstatica.mensajes.saludo;
            let enlaces = '-';
            let lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
            let descripcion = 'Se crea el mensaje de bienvenida.';
            let estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
            let responsable = dataEstatica.configuracion.responsable;
            const resultMensajeBienvenida = await modelMensaje.crear(idChat, remitente, estadoMensaje, tipoMensaje, contenido, enlaces, lectura, descripcion, estadoRegistro, responsable);

            if (resultMensajeBienvenida) {
                // todo: Enviar respuesta
                res.json({
                    status: 200,
                    type: 'success',
                    title: dataEstatica.configuracion.responsable,
                    message: 'El chat se ha creado correctamente en el sistema.',
                });
            }
        }
    } catch (error) {
        console.log('❌ Error en v1/controllers/widget/chat.controller.js → crear ', error);
        res.status(500).json({
            status: 500,
            type: 'error',
            title: dataEstatica.configuracion.responsable,
            message: 'No se pudo crear el chat, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * FORMULARIO INICIAL
const formularioInicial = async (req, res) => {
    try {
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: dataEstatica.configuracion.responsable,
                message: errors.array()[0].msg
            });
        }

        // todo: Obtener los datos de la petición
        const {
            idChatWeb,
            camposFormulario
        } = req.body;

        // todo: Preparamos los datos
        let pasoArbol = dataEstatica.arbol.procesarFormularioInicial;
        let nombres = camposFormulario.nombres;
        let apellidos = camposFormulario.apellidos;
        let numeroCedula = camposFormulario.numeroCedula;
        let paisResidencia = camposFormulario.paisResidencia;
        let ciudadResidencia = camposFormulario.ciudadResidencia;
        let indicativoPais = camposFormulario.indicativoPais;
        let numeroCelular = camposFormulario.numeroCelular;
        let correoElectronico = camposFormulario.correoElectronico;
        let autorizacionDatosPersonales = camposFormulario.autorizacionDatosPersonales;
        let descripcion = 'Se diligenció el formulario inicial.';

        // todo: Crear el mensaje de formulario inicial
        const result = await model.formularioInicial(idChatWeb, pasoArbol, nombres, apellidos, numeroCedula, paisResidencia, ciudadResidencia, indicativoPais, numeroCelular, correoElectronico, autorizacionDatosPersonales, descripcion);
        // todo: Enviar respuesta
        if (result) {

            // todo: Crear el mensaje de formulario inicial diligenciado
            const idChat = result[0].ID_CHAT;
            let remitente = idChatWeb;
            let estadoMensaje = dataEstatica.configuracion.estadoMensaje.recibido;
            let tipoMensaje = dataEstatica.configuracion.tipoMensaje.texto;
            let contenido = `
            <p class="datos-diligenciados">📝 <strong class="label-fuerte">Datos diligenciados:</strong><br/><br/>
                <strong class="label-fuerte">Nombres:</strong> ${camposFormulario.nombres}<br/>
                <strong class="label-fuerte">Apellidos:</strong> ${camposFormulario.apellidos}<br/>
                <strong class="label-fuerte">Número de cédula:</strong> ${camposFormulario.numeroCedula}<br/>
                <strong class="label-fuerte">País de residencia:</strong> ${camposFormulario.paisResidencia}<br/>
                <strong class="label-fuerte">Ciudad de residencia:</strong> ${camposFormulario.ciudadResidencia}<br/>
                <strong class="label-fuerte">Indicativo de país:</strong> ${camposFormulario.indicativoPais}<br/>
                <strong class="label-fuerte">Número de celular:</strong> ${camposFormulario.numeroCelular}<br/>
                <strong class="label-fuerte">Correo electrónico:</strong> ${camposFormulario.correoElectronico}<br/>
                <strong class="label-fuerte">Autorización datos personales:</strong> ${camposFormulario.autorizacionDatosPersonales}<br/>
            </p>
          `;

            let enlaces = '-';
            let lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
            let estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
            let responsable = dataEstatica.configuracion.responsable;
            const resultMensajeFormularioInicialDiligenciado = await modelMensaje.crear(idChat, remitente, estadoMensaje, tipoMensaje, contenido, enlaces, lectura, descripcion, estadoRegistro, responsable);

            if (resultMensajeFormularioInicialDiligenciado) {
                // todo: Crear el mensaje de saludo al usuario
                let remitente = idChatWeb;
                let estadoMensaje = dataEstatica.configuracion.estadoMensaje.enviado;
                let tipoMensaje = dataEstatica.configuracion.tipoMensaje.texto;
                let contenido = `
                    <p class="saludoUsuario">🤝 <b> Hola, ${camposFormulario.nombres} ${camposFormulario.apellidos}</b><br/><br/>
                        <i>¿En que puedo ayudarlo?</i><br/><br/>
                        👉 <i>Escriba una pregunta.</i>
                    </p>
                `;
                let enlaces = '-';
                let lectura = dataEstatica.configuracion.lecturaMensaje.noLeido;
                let estadoRegistro = dataEstatica.configuracion.estadoRegistro.activo;
                let responsable = dataEstatica.configuracion.responsable;
                const resultMensajeSaludoUsuario = await modelMensaje.crear(idChat, remitente, estadoMensaje, tipoMensaje, contenido, enlaces, lectura, descripcion, estadoRegistro, responsable);

                if (resultMensajeSaludoUsuario) {
                    // todo: Vamos a actualizar el chat dando paso a la IA
                    // todo: Preparamos los datos
                    pasoArbol = dataEstatica.arbol.pasoDirectoSoulChat;
                    descripcion = 'Se brinda paso AI Soul';

                    // todo: Crear el mensaje de formulario inicial
                    const result = await model.formularioInicial(idChatWeb, pasoArbol, nombres, apellidos, numeroCedula, paisResidencia, ciudadResidencia, indicativoPais, numeroCelular, correoElectronico, autorizacionDatosPersonales, descripcion);

                    if (result) {
                        // todo: Enviar respuesta
                        res.json({
                            status: 200,
                            type: 'success',
                            title: dataEstatica.configuracion.responsable,
                            message: 'El formulario inicial se ha diligenciado correctamente en el sistema y se ha enviado el saludo al usuario, se brinda paso AI Soul.',
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.log('❌ Error en v1/controllers/widget/chat.controller.js → formularioInicial ', error);
        res.status(500).json({
            status: 500,
            type: 'error',
            title: dataEstatica.configuracion.responsable,
            message: 'No se pudo diligenciar el formulario inicial, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * OPCIONES CONTROL API
const opcionesControlApi = async (req, res) => {
    try {
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: dataEstatica.configuracion.responsable,
                message: errors.array()[0].msg
            });
        }

        // todo: Obtener los datos de la petición

        // todo: Listar las opciones de control api
        const result = await model.opcionesControlApi();

        // todo: Enviar respuesta
        if (result) {
            res.json({
                status: 200,
                type: 'success',
                title: dataEstatica.configuracion.responsable,
                message: 'Opciones de control api listadas correctamente.',
                data: result
            });
        }
    } catch (error) {
        console.log('❌ Error en v1/controllers/widget/chat.controller.js → opcionesControlApi ', error);
        res.status(500).json({
            status: 500,
            type: 'error',
            title: dataEstatica.configuracion.responsable,
            message: 'No se pudo listar las opciones de control api, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * MONITOR
const monitor = async (req, res) => {
    try {
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: dataEstatica.configuracion.responsable,
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
            res.json({
                status: 200,
                type: 'success',
                title: dataEstatica.configuracion.responsable,
                message: 'Chats listados correctamente.',
                data: result.data,
                totalCount: result.totalCount,
                filteredCount: result.filteredCount,
            });
        }
    } catch (error) {
        console.log('❌ Error en v1/controllers/widget/chat.controller.js → monitor ', error);
        res.status(500).json({
            status: 500,
            type: 'error',
            title: dataEstatica.configuracion.responsable,
            message: 'No se pudo listar los chats, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * LISTAR ARCHIVOS ADJUNTOS
const listarArchivosAdjuntos = async (req, res) => {
    try {
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: dataEstatica.configuracion.responsable,
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
            res.json({
                status: 200,
                type: 'success',
                title: dataEstatica.configuracion.responsable,
                message: 'Archivos adjuntos listados correctamente.',
                data: result
            });
        }
    } catch (error) {
        console.log('❌ Error en v1/controllers/widget/chat.controller.js → listarArchivosAdjuntos ', error);
        res.status(500).json({
            status: 500,
            type: 'error',
            title: dataEstatica.configuracion.responsable,
            message: 'No se pudo listar los archivos adjuntos, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * FILTRAR
const filtrar = async (req, res) => {
    try {
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
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
            res.json({
                status: 200,
                type: 'success',
                title: dataEstatica.configuracion.responsable,
                message: 'Chat filtrado correctamente.',
                data: result
            });
        }
    } catch (error) {
        console.log('❌ Error en v1/controllers/widget/chat.controller.js → filtrar ', error);
        res.status(500).json({
            status: 500,
            type: 'error',
            title: dataEstatica.configuracion.responsable,
            message: 'No se pudo filtrar el chat, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * CERRAR
const cerrar = async (req, res) => {
    try {
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
                res.json({
                    status: 200,
                    type: 'success',
                    title: dataEstatica.configuracion.responsable,
                    message: 'El chat se ha cerrado correctamente en el sistema.',
                });
            }
        }

    } catch (error) {
        console.log('❌ Error en v1/controllers/widget/chat.controller.js → cerrar ', error);
        res.status(500).json({
            status: 500,
            type: 'error',
            title: dataEstatica.configuracion.responsable,
            message: 'No se pudo cerrar el chat, por favor intenta de nuevo o comunícate con nosotros.',
            error: error.message
        });
    }
};

// * CERRAR CHAT DESDE SOUL CHAT
const cerrarSoulChat = async (req, res) => {
    try {
        // todo: Validar los datos
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 400,
                type: 'warning',
                title: dataEstatica.configuracion.responsable,
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
                res.json({
                    status: 200,
                    type: 'success',
                    title: dataEstatica.configuracion.responsable,
                    message: 'El chat se ha cerrado correctamente en el sistema.',
                });
            }
        }

    } catch (error) {
        console.log('❌ Error en v1/controllers/widget/chat.controller.js → cerrarSoulChat ', error);
        res.status(500).json({
            status: 500,
            type: 'error',
            title: dataEstatica.configuracion.responsable,
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
                console.log(`❌ [${fechaActual}] Error cerrando chat ${chat.ID_CHAT}:`, error.message);
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
        console.log(`❌ [${moment().format('YYYY-MM-DD HH:mm:ss')}] Error en v1/controllers/widget/chat.controller.js → cerrarChatsAbiertosAntiguos `, error);
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