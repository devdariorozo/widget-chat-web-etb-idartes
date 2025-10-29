// ! ================================================================================================================================================
// !                                                             HANDLEBARS
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres (20 de Junio de 2024)
// @lastModified Ramón Dario Rozo Torres (20 de Junio de 2024)
// @version 1.0.0
// frontend/v1/helpers/handlebars.js

// ! REQUIRES
const Handlebars = require('handlebars');

// ! HELPER PARA FORMATEAR JSON
Handlebars.registerHelper('json', function (context) {
    return JSON.stringify(context, null, 2);
});

// ! EXPORTACIONES
module.exports = Handlebars;