// ! ================================================================================================================================================
// !                                                             ENRUTADOR DE CHAT WEB
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres  
// @version 1.0.0
// v1/routes/widget/chat.routes.js

// ! REQUIRES
const express = require('express');
const router = express.Router();
const validator = require('../../validators/widget/chat.validator.js');
const controller = require('../../controllers/widget/chat.controller.js');
const { crearChatLimiter, formLimiter } = require('../../middlewares/rateLimiter.js');

// ! RUTAS
// * CHAT WEB
// TODO: RENDERIZAR VISTA
router.get('/web', (req, res) => {
    res.render('widget/chat.hbs');
});

// TODO: CREAR
router.post('/crear', crearChatLimiter, validator.crear, controller.crear);

// TODO: ACTUALIZAR - RECIBE DATOS DE FORMULARIO INICIAL
router.post('/formularioInicial', formLimiter, validator.formularioInicial, controller.formularioInicial);

// TODO: OPCIONES CONTROL API
router.get('/opcionesControlApi', controller.opcionesControlApi);

// TODO: LISTAR ARCHIVOS ADJUNTOS
router.get('/listarArchivosAdjuntos', validator.listarArchivosAdjuntos, controller.listarArchivosAdjuntos);

// TODO: FILTRAR
router.get('/filtrar', validator.filtrar, controller.filtrar);

// TODO: CERRAR
router.post('/cerrar', validator.cerrar, controller.cerrar);

// TODO: CERRAR CHAT DESDE SOUL CHAT
router.post('/cerrarSoulChat', validator.cerrarSoulChat, controller.cerrarSoulChat);


// * MONITOR
// TODO: RENDERIZAR VISTA
router.get('/monitor', (req, res) => {
    res.render('widget/monitor.hbs');
});
// TODO: MONITOR
router.post('/monitor', validator.monitor, controller.monitor);

// ! EXPORTACIONES
module.exports = router;
