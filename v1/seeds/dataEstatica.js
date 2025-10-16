// ! ================================================================================================================================================
// !                                                          SEEDS DE DATOS ESTATICOS
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/seeds/dataEstatica.js

// ! VALORES ESTATICOS
// * TIPO DE GESTION
const tipoGestion = {
    inbound: 'Inbound',
    outbound: 'Outbound'
};

// * ESTADO DE CHAT
const estadoChat = {
    recibido: 'Recibido',
    enviado: 'Enviado'
};

// * ESTADO DE GESTION
const estadoGestion = {
    abierto: 'Abierto',
    cerrado: 'Cerrado'
};

// * ARBOL
const arbol = {
    saludo: 'Saludo',
    despedida: 'Despedida',
    instrucciones: 'Instrucciones',
    inicio: 'Inicio',
    solicitarFormularioInicial: 'Solicitar Formulario Inicial',
    procesarFormularioInicial: 'Procesar Formulario Inicial',
    interaccionAISoul: 'Interaccion AI Soul',
    condicionAdjuntos: 'Condicion Adjuntos',
    confirmarAdjuntos: 'Confirmar Adjuntos',
    alertaNoEntiendo: 'Alerta No Entiendo',
    errorApi: 'Error API',
    clienteDesiste: 'Cliente Desiste',
    alertaInactividad: 'Alerta Inactividad',
    cerradoPorInactividad: 'Cerrado Por Inactividad'
};

// * CONTROL DE ARBOL
const controlApi = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info'
};

// * MENSAJES
// TODO: MENSAJE DE SALUDO
const saludo = `<p class="saludoChat">
                    🙋‍♂️ Hola, saludo pendiente por definir...
                </p>`;

// TODO: MENSAJE DE DESPEDIDA
const despedida = `<p class="despedidaChat">🌟 ¡Gracias por haber utilizado nuestro servicio!<br/><br/>
                    😊 Esperamos haberle ayudado.<br/>
                    <b>¡Estamos para servirle!</b> 👋</p>`

// TODO: MENSAJE DE INSTRUCCIONES
const instrucciones = `<p class="instruccionesArbol">Hola,<br/><br/>
                        📝 <b>En el momento que desee volver a empezar, por favor escriba <b>inicio</b> o <b>INICIO</b> para regresar al menú principal🔄</b></p>`;

// TODO: MENSAJE SOLICITANDO NOMBRES Y APELLIDOS
const solicitarNombresApellidos = `  <p class="solicitarNombresApellidosArbol">👉 <b>Nombres y Apellidos.</b><br/><br/>
                                        <i>Por favor, ingrese sus nombres y apellidos completos.</i>
                                    </p>`;

// TODO: MENSAJE SOLICITANDO GENERO
const solicitarGenero = `  <p class="solicitarGeneroArbol">👉 <b>Género.</b><br/><br/>

                                <b>1.</b> Femenino<br/>
                                <b>2.</b> Masculino<br/>
                                <b>3.</b> Transgénero<br/><br/>
                                
                                <i>Por favor, seleccione una opción para continuar.</i>
                            </p>`;

// TODO: MENSAJE SOLICITANDO CORREO ELECTRONICO
const solicitarCorreoElectronico = `  <p class="solicitarCorreoElectronicoArbol">👉 <b>Correo Electrónico.</b><br/><br/>
                                        <i>Por favor, ingrese su correo electrónico.</i>
                                    </p>`;

// TODO: MENSAJE SOLICITANDO NUMERO DE TELEFONO
const solicitarNumeroTelefono = `  <p class="solicitarNumeroTelefonoArbol">👉 <b>Número de Teléfono.</b><br/><br/>
                                        <i>Por favor, ingrese su número de teléfono.</i>
                                    </p>`;

// TODO: MENSAJE SOLICITANDO LOCALIDAD
const solicitarLocalidad = `  <p class="solicitarLocalidadArbol">👉 <b>Localidad.</b><br/><br/>
                                        <i>Por favor, ingrese en que localidad vive.</i>
                                    </p>`;

// TODO: MENSAJE SOLICITANDO EN QUE PODEMOS AYUDARLE
const solicitarEnQuePodemosAyudarle = `  <p class="solicitarEnQuePodemosAyudarleArbol">👉 <b>En que podemos ayudarle?</b><br/><br/>
                                        <i>Por favor, ingrese su solicitud.</i>
                                    </p>`;

// TODO: MENSAJE SOLICITANDO RANGO DE EDAD
const solicitarRangoEdad = `  <p class="solicitarRangoEdadArbol">👉 <b>Rango de Edad.</b><br/><br/>

                                <b>1.</b> 0 a 11 años<br/>
                                <b>2.</b> 12 a 18 años<br/>
                                <b>3.</b> 19 a 29 años<br/>
                                <b>4.</b> 30 a 50 años<br/>
                                <b>10.</b> Más de 50 años<br/><br/>
                                
                                <i>Por favor, seleccione una opción para continuar.</i>
                            </p>`;

// TODO: MENSAJE SOLICITANDO AUTORIZACION DE TRATAMIENTO DE DATOS
const solicitarAutorizacionTratamientoDatos = `  <p class="solicitarAutorizacionTratamientoDatosArbol">👉 <b>Autorización de Tratamiento de Datos.</b><br/><br/>

                                                    Idartes tratará su información con fines exclusivos para el trámite del servicio; en cumplimiento de lo establecido en la Ley 1581 de 2012 y demás normas, sobre el tratamiento de datos.<br/><br/>

                                                    1. Sí<br/>
                                                    2. No<br/><br/>
                                                    
                                                    <i>Por favor, seleccione una opción para continuar.</i>
                                                </p>`;

// TODO: MENSAJE SOLICITANDO TIPO DE DOCUMENTO
const solicitarTipoDocumento = `  <p class="solicitarTipoDocumentoArbol">👉 <b>Tipo de Documento.</b><br/><br/>
                                        <i>Por favor, ingrese su tipo de documento.</i>
                                    </p>`;

// TODO: MENSAJE SOLICITANDO CONDICION DE ADJUNTOS
const condicionAdjuntos = `<p class="condicionAdjuntosArbol">📝 <b>Adjuntar documentos:</b> <br/><br/>
                            📢 <i>No es obligatorio.</i><br/><br/>
                            ⚠️ <i>Se permite un máximo de 5 archivos.</i><br/>
                            ⚠️ <i>Los documentos deben ser archivos tipo .pdf .xls .xlsx .jpg .png .doc .docx únicamente y no deben superar los 5 MB.</i><br/><br/>
                            1. Adjuntar documentos <br/>
                            2. Continuar.</p>`;

// TODO: MENSAJE DE CONFIRMAR ADJUNTOS
const confirmarAdjuntos = `<p class="confirmarAdjuntosArbol">📝 <b>Por favor, adjuntar los archivos.</b></p>`;

// TODO: MENSAJE DE ALERTA DE NO ENTIENDO
const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol">❓ <b>No entiendo su respuesta.</b><br/><br/>
                            ⚠️ <i>Por favor, asegúrese de seguir las instrucciones y proporcione una respuesta válida.</i></p>`;
// // TODO: MENSAJE DE ALERTA DE NO ENTIENDO
// const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol">❓ <b>No entiendo su respuesta.</b><br/><br/>
//                             ⚠️ <i>Por favor, asegúrese de seguir las instrucciones y proporcione una respuesta válida.</i><br/><br/>
//                             ⚠️ <i>En el momento que desee volver, por favor escriba <b>inicio</b> o <b>INICIO</b> para volver a empezar 🔄.</i></p>`;

// TODO: MENSAJE DE ALERTA DE ERROR API
const alertaErrorAPI = `<p class="alertaErrorAPIArbol">⏳ <b>Estamos experimentando una incidencia técnica.</b><br/><br/>
                            🙏 <i>Le pedimos que espere o nos visite nuevamente en breve mientras solucionamos el inconveniente; agradecemos su comprensión.</i></p>`;

// TODO: MENSAJE DE NOVEDAD O INCIDENCIA TECNICA
const novedadIncidenciaTecnica = `<p class="novedadIncidenciaTecnicaArbol">🚨 ¡Atención!<br/><br/>
                                🔄 Estamos experimentando una novedad o incidencia técnica.<br/>
                                🕰️ Por favor, intente nuevamente más tarde. Agradecemos su paciencia.</p>`;

// TODO: MENSAJE DE CLIENTE DESISTE
const clienteDesiste = `<p class="clienteDesisteArbol">⚠️ <b>Hemos notado que ha decidido no continuar con la atención en nuestro sistema.</b><br/><br/>
                           👉 <i>Si necesita asistencia no dude en contactarnos nuevamente.</i></p>`;

// TODO: MENSAJE POR CHAT DIFERENTE A ABIERTO
const chatDiferenteAbierto = `<p class="chatDiferenteAbiertoArbol">⚠️ <b>Este chat está actualmente cerrado.</b><br/><br/>
                            📞 <i>Para continuar la comunicación, por favor, inicie un nuevo chat o contáctenos a través de nuestros canales oficiales.<br/><br/>
                            Agradecemos su comprensión, estamos aquí para ayudarle.</i></p>`;

                            
// * ESTADO DE MENSAJE
const estadoMensaje = {
    recibido: 'Recibido',
    enviado: 'Enviado'
};

// * TIPO DE MENSAJE
const tipoMensaje = {
    texto: 'Texto',
    adjuntos: 'Adjuntos',
    multimedia: 'Multimedia',
    inactividad: 'Inactividad',
    finChat: 'Fin Chat',
    errorApi: 'Error API',
    formulario: 'Formulario'
};

// * LECTURA MENSAJE
const lecturaMensaje = {
    noLeido: 'No leido',
    leido: 'Leido'
};

// * ESTADO REGISTRO
const estadoRegistro = {
    activo: 'Activo',
    inactivo: 'Inactivo'
};

// * RESPONSABLE
const responsable = 'Thomas Greg y Sons - IDC Exterior Chatbot';

// ! EXPORTACIONES ORGANIZADAS POR CATEGORÍAS
module.exports = {
    // * CONFIGURACIONES DEL SISTEMA
    configuracion: {
        tipoGestion,
        estadoChat,
        estadoGestion,
        controlApi,
        estadoMensaje,
        tipoMensaje,
        lecturaMensaje,
        estadoRegistro,
        responsable
    },

    // * ESTRUCTURA DEL ARBOL DE NAVEGACION
    arbol,

    // * MENSAJES DEL SISTEMA
    mensajes: {
        saludo,
        despedida,
        instrucciones,
        solicitarFormularioInicial,
        condicionAdjuntos,
        confirmarAdjuntos,
        alertaNoEntiendo,
        alertaErrorAPI,
        novedadIncidenciaTecnica,
        clienteDesiste,
        chatDiferenteAbierto
    }
};