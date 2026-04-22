// ! ================================================================================================================================================
// !                                                      CHAT WEB
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/assets/js/widget/chat.js

// ! VARIABLES GLOBALES
let chatWeb = '';
let idChatWeb = '';
let inactividadInterval;
let reintentoInterval; // Declarar fuera para que sea accesible
var tempText = '';
let ultimaActividad = Date.now();
let tiempoInactividad = 0;
let umbralesNotificados = []; // <-- NUEVO: Para llevar registro de umbrales notificados
let formularioEnviado = false;
let debounceTimeout; // Para evitar múltiples llamadas seguidas
let vigilanciaActiva = false; // Para saber si la vigilancia está activa
let typingIndicatorVisible = false; // Para saber si el typing indicator está visible
let error429Manejado = false; // Para evitar manejar múltiples veces el mismo error 429
let countdown429Interval = null; // Para controlar el countdown del error 429
// Registro local de mensajes ya renderizados para evitar duplicados visuales
const renderedMessageIds = new Set();
// Control de estado para evitar múltiples envíos simultáneos
let enviandoMensaje = false; // Flag para controlar si ya se está enviando un mensaje
let refrescoMensajesInterval = null; // Intervalo para refrescar mensajes automáticamente
let refrescandoMensajes = false; // Evita llamadas concurrentes al refresco
let chatFinalizado = false; // Indica si el chat ha sido cerrado definitivamente
// Sistema de observabilidad para el formulario
let watchdogFormularioInterval = null; // Intervalo del watchdog que monitorea el formulario
let ultimoEstadoFormulario = null; // Último estado conocido del formulario (para detectar cambios)
let contadorCorreccionesFormulario = 0; // Contador de correcciones realizadas (para debugging)
let debugFormulario = false; // Flag para activar/desactivar logs de debugging del formulario
// Sistema de prevención de duplicados para envío rápido de mensajes
let ultimoMensajeEnviado = null; // Último mensaje enviado (para prevenir duplicados)
let ultimoTimestampEnvio = 0; // Timestamp del último envío (para prevenir duplicados)
let modoAsesor = false; // Flag para indicar si el chat está en modo asesor

// ! EVENTOS DE ACTIVIDAD
// Eventos que se disparan frecuentemente (necesitan debounce)
const eventosFrecuentes = [
    'mousemove',
    'scroll',
    'touchmove',
    'pointermove'
];

// Eventos que se disparan ocasionalmente (no necesitan debounce)
const eventosOcasionales = [
    'mousedown',
    'keypress',
    'touchstart',
    'touchend',
    'pointerdown',
    'pointerup',
    'click',
    'input',
    'focus'
];

// ! INICIALIZAR MODAL TERMINOS Y CONDICIONES
$(function() {
    $('#modalTerminos').modal();
    $('#modalTerminos').modal('open');
    $('#modalTerminos').modal('close');
  })



// ! MANEJAR CLICKS EN BOTONES DE OPCIONES TIPO CHATBOT
// Usar delegación de eventos para manejar botones que se agregan dinámicamente
$(document).on('click', '.btn-opcion-chat', async function (e) {
    e.preventDefault();

    // Verificar si ya se está enviando un mensaje
    if (enviandoMensaje) {
        return;
    }

    // Verificar si el chat está finalizado
    if (chatFinalizado) {
        return;
    }

    // Verificar si hay error 429 activo
    const hayError429Activo = document.querySelector('.mensaje-error-429');
    if (hayError429Activo) {
        return;
    }

    // Obtener el valor del botón
    const valorSeleccionado = $(this).data('valor');

    // Verificar si el botón requiere entrada de texto (ej: "Otro")
    const requiereTexto = $(this).data('requiere-texto') === true;

    // Marcar el botón como seleccionado
    $(this).addClass('seleccionado');

    // Deshabilitar todos los botones del mismo grupo
    $(this).closest('.opciones-chat').find('.btn-opcion-chat').prop('disabled', true);

    // Deshabilitar el scroll del contenedor de opciones
    $(this).closest('.opciones-chat').addClass('seleccion-hecha');

    // Si requiere texto, habilitar el formulario para que el usuario escriba
    if (requiereTexto) {
        const contentFormTexto = document.getElementById('contentFormTexto');
        const txtMensaje = document.getElementById('txt_mensaje');
        if (contentFormTexto) {
            contentFormTexto.classList.remove('hide');
        }
        if (txtMensaje) {
            txtMensaje.placeholder = 'Escriba su tema de consulta...';
            txtMensaje.focus();
        }
        return; // No enviar mensaje automáticamente, esperar que el usuario escriba
    }

    // Marcar que se está enviando
    enviandoMensaje = true;

    // Ocultar el formulario de texto
    const contentFormTexto = document.getElementById('contentFormTexto');
    contentFormTexto.classList.add('hide');

    try {
        // Enviar el valor como mensaje
        const response = await fetch('/widget/mensaje/crear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'origin': window.location.origin
            },
            body: JSON.stringify({ idChatWeb, mensaje: valorSeleccionado }),
        });

        // Verificar si la respuesta es un error 429
        if (response.status === 429) {
            const errorData = await response.json();
            manejarError429HTTP(errorData);
            enviandoMensaje = false;
            return;
        }

        const result = await response.json();

        if (result.status === 200) {
            // Listar mensajes para mostrar la respuesta
            const resultListar = await listarMensajeNoLeido();
            if (resultListar && resultListar.mensajesNuevos) {
                await desplazarScrollVentana();
                await desplazarScrollConversacion();
            }

            // Verificar si hay nuevas opciones activas después de recibir respuesta
            ocultarFormularioSiHayOpciones();

            // Mostrar typing indicator solo si no hay opciones activas
            // PERO: NO mostrar si estamos en la sección de adjuntos
            const contentAdjuntos = document.getElementById('contentAdjuntos');
            const adjuntosVisible = contentAdjuntos && !contentAdjuntos.classList.contains('hide');

            const botonesActivos = document.querySelectorAll('.btn-opcion-chat:not(:disabled)');
            if (botonesActivos.length === 0 && !adjuntosVisible) {
                const datosDiligenciadosPresente = verificarOpcionesServiciosMostradas();
                if (datosDiligenciadosPresente && !typingIndicatorVisible) {
                    mostrarTypingIndicator();
                }
            }
        }
    } catch (error) {
        console.log('Error al enviar opcion seleccionada:', error);
    } finally {
        enviandoMensaje = false;
    }
});

// ! FUNCIONES PARA SELECT PERSONALIZADO (DESPLIEGA HACIA ARRIBA)
function toggleSelectCustom(selectId) {
    const container = document.getElementById(selectId);
    if (!container) return;
    
    const trigger = container.querySelector('.select-custom-trigger');
    const dropdown = container.querySelector('.select-custom-dropdown');
    const conversacion = document.getElementById('conversacion');
    
    if (trigger.classList.contains('deshabilitado')) return;
    
    // Cerrar otros selects abiertos
    document.querySelectorAll('.select-custom-container').forEach(s => {
        if (s.id !== selectId) {
            s.querySelector('.select-custom-trigger').classList.remove('abierto');
            s.querySelector('.select-custom-dropdown').classList.remove('visible');
        }
    });
    
    trigger.classList.toggle('abierto');
    dropdown.classList.toggle('visible');
    
    // Controlar scroll del chat
    if (dropdown.classList.contains('visible')) {
        if (conversacion) conversacion.style.overflow = 'hidden';
    } else {
        if (conversacion) conversacion.style.overflow = '';
    }
}

// Cerrar select al hacer click fuera
$(document).on('click', function(e) {
    if (!$(e.target).closest('.select-custom-container').length) {
        $('.select-custom-trigger').removeClass('abierto');
        $('.select-custom-dropdown').removeClass('visible');
        // Restaurar scroll del chat
        const conversacion = document.getElementById('conversacion');
        if (conversacion) conversacion.style.overflow = '';
    }
});

// Manejar click en opciones del select personalizado
$(document).on('click', '.select-custom-option', async function(e) {
    e.stopPropagation();
    
    const container = $(this).closest('.select-custom-container');
    const selectId = container.attr('id');
    
    // Si es el select de tema de consulta
    if (selectId === 'select-tema-consulta') {
        const valorSeleccionado = $(this).data('valor');
        const requiereTexto = $(this).data('requiere-texto');
        
        // Marcar opción como seleccionada
        container.find('.select-custom-option').removeClass('seleccionado');
        $(this).addClass('seleccionado');
        
        // Actualizar texto del trigger
        container.find('.select-custom-texto').text(valorSeleccionado);
        
        // Cerrar dropdown
        container.find('.select-custom-trigger').removeClass('abierto');
        container.find('.select-custom-dropdown').removeClass('visible');
        
        // Deshabilitar el select
        container.find('.select-custom-trigger').addClass('deshabilitado');
        
        // Mostrar campo de texto si es "Otro"
        const contenedorOtro = document.getElementById('contenedor-tema-otro');
        const inputOtro = document.getElementById('txt_temaOtro');
        
        if (requiereTexto) {
            contenedorOtro.style.display = 'block';
            inputOtro.focus();
        } else {
            contenedorOtro.style.display = 'none';
            inputOtro.value = '';
        }
        
        return; // No enviar nada aún, solo actualizar UI
    }
    
    enviandoMensaje = true;
    
    // Ocultar formulario de texto
    const contentFormTexto = document.getElementById('contentFormTexto');
    if (contentFormTexto) {
        contentFormTexto.classList.add('hide');
    }
    
    try {
        const response = await fetch('/widget/mensaje/crear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'origin': window.location.origin
            },
            body: JSON.stringify({ idChatWeb, mensaje: valorSeleccionado }),
        });
        
        if (response.status === 429) {
            const errorData = await response.json();
            manejarError429HTTP(errorData);
            enviandoMensaje = false;
            return;
        }
        
        const result = await response.json();
        
        if (result.status === 200) {
            const resultListar = await listarMensajeNoLeido();
            if (resultListar && resultListar.mensajesNuevos) {
                await desplazarScrollVentana();
                await desplazarScrollConversacion();
            }
            ocultarFormularioSiHayOpciones();
        }
    } catch (error) {
        console.log('Error al enviar opcion select:', error);
    } finally {
        enviandoMensaje = false;
    }
});

// ! FUNCIÓN PARA OCULTAR FORMULARIO SI HAY OPCIONES ACTIVAS
function ocultarFormularioSiHayOpciones() {
    const botonesOpcionesActivos = document.querySelectorAll('.btn-opcion-chat:not(:disabled)');
    const selectsActivos = document.querySelectorAll('.select-custom-trigger:not(.deshabilitado)');
    if (botonesOpcionesActivos.length > 0 || selectsActivos.length > 0) {
        const contentFormTexto = document.getElementById('contentFormTexto');
        if (contentFormTexto) {
            contentFormTexto.classList.add('hide');
        }
    }
}

// ! INICIALIZAR DROPIFY
$(document).ready(function(){
    const maxFiles = 5;
    const fileList = $('#file-list');
    let currentFiles = [];
    const txtMensaje = document.getElementById('txt_mensaje');

    const dropify = $('.dropify').dropify({
        messages: {
            default: 'Arrastre y suelte sus archivos y/o haz clic aquí',
            replace: 'Arrastre y suelte sus archivos o haz clic para reemplazar',
            remove: '',
            error:   'Lo siento, el archivo es demasiado grande'
        },
        error: {
            fileSize: 'El tamaño del archivo es demasiado grande ({{ value }} max).',
            fileExtension: 'Este tipo de archivo no está permitido.'
        }
    });

    const dropifyInstance = dropify.data('dropify');

    $('#input-file-now').on('change', function(event) {
        
        const files = Array.from(event.target.files);

        // Validar si no hay archivos adjuntos
        if (files.length === 0) {
            return;
        }

        const allowedExtensions = ['pdf', 'xls', 'xlsx', 'jpg', 'png', 'doc', 'docx'];
        const maxSizeMB = 5;

        const validFiles = files.filter(file => {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const fileSizeMB = file.size / 1024 / 1024;

            const dropifyMessageElement = $('.dropify-wrapper .dropify-message p').first();

            if (!allowedExtensions.includes(fileExtension)) {
                const errorMessage = `Extensión no permitida - `;
                dropifyMessageElement.text(errorMessage + 'Arrastre y suelte sus archivos y/o haz clic aquí');
                dropifyInstance.showError('fileExtension');
                dropifyInstance.clearElement();
                return false;
            }

            if (fileSizeMB > maxSizeMB) {
                const errorMessage = `El archivo ${file.name} supera el tamaño máximo permitido de ${maxSizeMB} MB. `;
                dropifyMessageElement.text(errorMessage + 'Arrastre y suelte sus archivos y/o haz clic aquí');
                dropifyInstance.showError('fileSize');
                dropifyInstance.clearElement();
                return false;
            }

            return true;
        });

        if (currentFiles.length + validFiles.length > maxFiles) {
            const errorMessage = '<span style="color: red;">Solo se permite adjuntar un máximo de 5 archivos. Se han removido todos los archivos seleccionados.</span>';
            const dropifyMessageElement = $('.dropify-wrapper .dropify-message p').first();
            dropifyMessageElement.html(errorMessage);
            dropifyInstance.showError('fileSize');
            // Limpiar todos los archivos seleccionados
            currentFiles = [];
            fileList.empty();
            dropifyInstance.clearElement();
            $('#input-file-now').val('');
            $('#input-file-now').parent().show();
            return;
        }

        validFiles.forEach(file => {
            currentFiles.push(file);
            const fileItem = $('<div>').addClass('file-item');
            const fileName = $('<span>').addClass('file-name').text(file.name);
            const fileSize = $('<span>').addClass('file-size').text((file.size / 1024 / 1024).toFixed(2) + ' MB');
            const removeButton = $('<button>').text('X').addClass('remove-file').on('click', function() {
                fileItem.remove();
                currentFiles = currentFiles.filter(f => f !== file);
                if (currentFiles.length < maxFiles) {
                    $('#input-file-now').parent().show();
                }
                if (currentFiles.length === 0) {
                    // Limpiar preview Dropify cuando ya no hay archivos disponibles
                    dropifyInstance.clearElement();
                    const dropifyMessageElement = $('.dropify-wrapper .dropify-message p').first();
                    dropifyMessageElement.text('Arrastre y suelte sus archivos y/o haz clic aquí');
                    txtMensaje.value = '';
                }

                if (currentFiles.length < maxFiles) {
                    $('#input-file-now').parent().show();
                }
            });
            fileItem.append(fileName, fileSize, removeButton);
            fileList.append(fileItem);
        });

        // Limpiar el contenedor después de agregar archivos
        dropifyInstance.clearElement();

        if (currentFiles.length >= maxFiles) {
            $('#input-file-now').parent().hide();
        }

        // Restablecer el valor del input para limpiar la selección
        $('#input-file-now').val('');
    });

    // * Evento para el botón "Adjuntar"
    $('#btnAdjuntar').on('click', function () {
        // Validar si no hay archivos adjuntos
        if (currentFiles.length === 0) {
            return; // Salir de la función
        }
    
        // Código existente para adjuntar archivos
        const allowedExtensions = ['pdf', 'xls', 'xlsx', 'jpg', 'png', 'doc', 'docx'];
        const invalidFiles = currentFiles.filter(file => {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            return !allowedExtensions.includes(fileExtension);
        });
    
        if (invalidFiles.length > 0) {
            alert('Algunos archivos tienen extensiones no permitidas.');
            return;
        }
    
        const formData = new FormData();
        currentFiles.forEach(file => {
            formData.append('archivos', file);
        });
    
        formData.append('idChatWeb', idChatWeb);
        formData.append('mensaje', 'Adjunto archivos a la conversación.');
    
        const enviarArchivos = () => {
            fetch('/widget/mensaje/adjuntarArchivos', {
                method: 'POST',
                headers: {
                    'origin': window.location.origin
                },
                body: formData,
            })
                .then(async response => {
                    // Verificar si la respuesta es un error 429
                    if (response.status === 429) {
                        const errorData = await response.json();
                        
                        // OCULTAR INMEDIATAMENTE EL FORMULARIO AL DETECTAR ERROR 429
                        const contentFormTexto = document.getElementById('contentFormTexto');
                        contentFormTexto.classList.add('hide');
                        //console.log('🚨 Formulario ocultado INMEDIATAMENTE por error 429 (vigilancia)');
                        
                        manejarError429HTTP(errorData);
                        return { status: 429, message: 'Límite de API excedido' };
                    }
                    return response.json();
                })
                .then(async (data) => {
                    if (!data) return;
                    if (data.status === 200) {
                        $('#contentAdjuntos').addClass('hide');

                        // LIMPIAR archivos
                        currentFiles = [];
                        $('#file-list').empty();
                        dropifyInstance.clearElement();
                        $('#input-file-now').parent().show();

                        // Mostrar formulario de texto
                        if (verificarOpcionesServiciosMostradas()) {
                            limpiarYEnfocarTextarea();
                        }

                        const resultListar = await listarMensajeNoLeido();
                        if (resultListar && resultListar.mensajesNuevos) {
                            await desplazarScrollVentana();
                            await desplazarScrollConversacion();
                        }
                        eliminarTypingIndicator();

                        const typingEl = document.getElementById('typing-indicator');
                        if (typingEl) typingEl.remove();
                        typingIndicatorVisible = false;
                    } else {
                        console.log('❌ Error en v1/assets/js/widget/chat.js → btnAdjuntar.enviarArchivos ', data.message);
                    }
                })
                .catch(error => {
                    console.log('❌ Error en v1/assets/js/widget/chat.js → btnAdjuntar.enviarArchivos ', error);
                });
        };
    
        enviarArchivos();
    });
});

// ! EL FRONTEND NO BLOQUEA - SOLO REACCIONA A RESPUESTAS DEL MIDDLEWARE
// Se eliminaron todos los interceptores que bloqueaban el frontend
// El middleware es quien controla el flujo de mensajes

// ! INTERCEPTAR ERRORES DEL IFRAME
window.addEventListener('message', function(event) {
    // Verificar si el mensaje contiene información de error 429
    if (event.data && event.data.type === 'error' && event.data.status === 429) {
        //console.log('🚫 Error 429 detectado desde iframe');
        if (!error429Manejado) {
            manejarError429Global(event.data.retryAfter);
        }
    }
});

// ! LEER DOCUMENTO
document.addEventListener('DOMContentLoaded', async (event) => {
    
    await obtenerInfoWidgetChatWeb();

    // Contenedor de formulario de texto
    const contentFormTexto = document.getElementById('contentFormTexto');
    // Contenedor de formulario de adjuntos
    const contentAdjuntos = document.getElementById('contentAdjuntos');    
    // Campo de mensaje
    const txtMensaje = document.getElementById('txt_mensaje');
    // Botón de enviar
    const btnEnviar = document.getElementById('btnEnviar'); 
    // Ocultar contenedor de adjuntos
    contentAdjuntos.classList.add('hide');

    // * SI EL CHAT ES NUEVO
    if (chatWeb === 'Crear') {
        // * LIMPIAR CONTENIDO ANTERIOR INMEDIATAMENTE
        limpiarContenidoAnterior();

        // * Mostrar indicador de carga para mejorar la percepción de velocidad
        mostrarIndicadorCarga();
        
        // todo: Listar mensajes
        const resultListar = await listarMensajeNoLeido();
        
        // * Ocultar indicador de carga
        ocultarIndicadorCarga();
        
        // * GARANTIZAR QUE EL PRELOAD SE OCULTE SIEMPRE (incluso sin mensajes)
        ocultarCapaPreload();
        
        // Solo hacer scroll si hay mensajes nuevos
        if (resultListar && resultListar.mensajesNuevos) {
            await desplazarScrollVentana();
            await desplazarScrollConversacion();
        }

        // Agregar etiquetas de remitente a mensajes existentes
        agregarEtiquetasRemitente();

        // todo: Dar el foco al campo de mensaje
        txtMensaje.focus();

        // todo: Enviar mensajes
        btnEnviar.addEventListener('click', async () => {
            await manejarEnvioMensaje();
        });
        
        // Enviar con Enter, salto de línea con Shift+Enter
        txtMensaje.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                await manejarEnvioMensaje();
            }
        });
        
        txtMensaje.addEventListener('keyup', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
            }
        });
        
        // Iniciar refresco automático de mensajes
        iniciarRefrescoMensajes();

        // Agregar delegación de eventos para opciones clickeables en los mensajes
        configurarDelegacionEventosOpciones();
    }

    if (chatWeb === 'Minimizar') {
        // * LIMPIAR CONTENIDO ANTERIOR ANTES DE CARGAR CONVERSACIÓN
        limpiarContenidoAnterior();
        
        // todo: Minimizar el chat
        await listarConversacion(); // Listar la conversación completa al abrir el chat
        
        // * GARANTIZAR QUE EL PRELOAD SE OCULTE SIEMPRE (incluso sin mensajes)
        ocultarCapaPreload();
        
        // Agregar etiquetas de remitente a mensajes existentes
        agregarEtiquetasRemitente();
        
        // Iniciar refresco automático de mensajes
        iniciarRefrescoMensajes();

        // Agregar delegación de eventos para opciones clickeables en los mensajes
        configurarDelegacionEventosOpciones();
    }
});

// ! MANEJAR ENVÍO DE MENSAJE DESDE EL EVENTO CLICK
async function manejarEnvioMensaje() {
    // NO PERMITIR ENVÍO SI EL CHAT ESTÁ FINALIZADO
    if (chatFinalizado) {
        return;
    }
    
    // VERIFICAR SI HAY ERROR 429 ACTIVO - NO PERMITIR ENVÍO SI LO HAY
    const hayError429Activo = document.querySelector('.mensaje-error-429');
    if (hayError429Activo) {
       //console.log('🚫 Error 429 activo, no se permite enviar mensajes');
        return;
    }

    // Validar si el mensaje está vacío
    const txtMensaje = document.getElementById('txt_mensaje');
    const mensaje = txtMensaje.value.trim();
    if (mensaje === '') {
        txtMensaje.focus();
        return;
    }
    //console.log('📤 Pasa por aca → Enviar mensaje', mensaje);
    
    // Verificar si ya se está enviando un mensaje
    if (enviandoMensaje) {
        //console.log('⚠️ Ya se está enviando un mensaje, ignorando click');
        return;
    }
    
    // Marcar que se está enviando
    enviandoMensaje = true;
    
    // OCULTAR INMEDIATAMENTE EL FORMULARIO
    const contentFormTexto = document.getElementById('contentFormTexto');
    contentFormTexto.classList.add('hide');
    //console.log('🚨 Formulario ocultado INMEDIATAMENTE al hacer click en Enviar');
    
    // NO mostrar typing indicator aquí - se mostrará después de procesar el mensaje del usuario
    
    // LISTAR MENSAJES INMEDIATAMENTE PARA MOSTRAR EL MENSAJE DEL USUARIO MÁS RÁPIDO
    //console.log('⚡ Listando mensajes no leídos inmediatamente al enviar');
    try {
        const resultListar = await listarMensajeNoLeido();
        if (resultListar && resultListar.mensajesNuevos) {
            await desplazarScrollVentana();
            await desplazarScrollConversacion();
        }
        
        // NO MOSTRAR TYPING INDICATOR AQUÍ - SE MOSTRARÁ DESPUÉS DE PROCESAR EL MENSAJE DEL USUARIO
        // Solo asegurar que el formulario esté oculto
        contentFormTexto.classList.add('hide');
        
        // LIBERAR EL FLAG DE ENVÍO DESPUÉS DE MOSTRAR EL MENSAJE DEL USUARIO
        enviandoMensaje = false;
        //console.log('🔄 Flag enviandoMensaje liberado después de mostrar mensaje del usuario');
    } catch (error) {
        console.log('❌ Error al listar mensajes inmediatamente:', error);
        // LIBERAR EL FLAG DE ENVÍO INCLUSO SI HAY ERROR
        enviandoMensaje = false;
        //console.log('🔄 Flag enviandoMensaje liberado después de error en listado inmediato');
    }

    // Iniciar el proceso de envío con reintentos
    await iniciarProcesoEnvioMensaje();
}

// ! INICIAR PROCESO DE ENVÍO CON REINTENTOS
async function iniciarProcesoEnvioMensaje(mensajeTexto = null) {
    // Si se proporciona un mensaje, establecerlo en el textarea temporalmente para enviarMensaje()
    const txtMensaje = document.getElementById('txt_mensaje');
    let mensajeOriginal = '';
    let mensajeFueModificado = false;

    if (mensajeTexto && txtMensaje) {
        mensajeOriginal = txtMensaje.value;
        txtMensaje.value = mensajeTexto;
        mensajeFueModificado = true;
    }

    // Función para enviar el mensaje con manejo de reintentos
    const enviarMensajeConReintento = async () => {
        try {
            //console.log('🔄 Ejecutando enviarMensajeConReintento');
            const resultEnviarMensaje = await enviarMensaje();

            // Restaurar el valor original del textarea después de enviar
            if (mensajeFueModificado && txtMensaje) {
                txtMensaje.value = mensajeOriginal;
            }

            //console.log('📤 Resultado de enviarMensaje:', resultEnviarMensaje);

            if (resultEnviarMensaje.status === 200) {
                // ÉXITO: Detener el intervalo y procesar respuesta
                clearInterval(reintentoInterval);
                //console.log('✅ Mensaje enviado exitosamente');            

                // Limpiar el campo solo cuando el envío sea exitoso
                const txtMensaje = document.getElementById('txt_mensaje');
                txtMensaje.value = txtMensaje.value.replace(/\n/g, '');
                txtMensaje.value = '';
                txtMensaje.style.height = 'auto';
                if (window.M && M.textareaAutoResize) {
                    M.textareaAutoResize(txtMensaje);
                }

                // Liberar flag de envío
                enviandoMensaje = false;
                //console.log('🔄 Flag enviandoMensaje liberado (éxito)');

                // LISTAR INMEDIATAMENTE LOS MENSAJES NO LEÍDOS PARA MOSTRAR EL MENSAJE DEL USUARIO RÁPIDAMENTE
                //console.log('⚡ Listando mensajes no leídos inmediatamente después de enviar');
                const resultListar = await listarMensajeNoLeido();

                // Solo hacer scroll si hay mensajes nuevos
                if (resultListar && resultListar.mensajesNuevos) {
                    await desplazarScrollVentana();
                    await desplazarScrollConversacion();
                }

                // MOSTRAR TYPING INDICATOR DESPUÉS DE PROCESAR EL MENSAJE DEL USUARIO
                // Solo si ya apareció "datos-diligenciados" (después del formulario inicial)
                // y no hay mensajes del ChatBot (respuesta pendiente)
                const datosDiligenciadosPresente = verificarOpcionesServiciosMostradas();
                if (datosDiligenciadosPresente) {
                    // En modo asesor no queremos bloquear el formulario ni dejar el typing fijo
                    if (!modoAsesor) {
                        // VERIFICAR: NO mostrar typing si estamos en adjuntos
                        const contentAdjuntos = document.getElementById('contentAdjuntos');
                        const adjuntosVisible = contentAdjuntos && !contentAdjuntos.classList.contains('hide');
                                
                        if (!adjuntosVisible) {
                            if (!typingIndicatorVisible) {
                                //console.log('✅ Mostrando typing indicator después de procesar mensaje del usuario');
                                mostrarTypingIndicator();
                            } else {
                                //console.log('🔄 Manteniendo typing indicator ya visible');
                            }
                            const contentFormTexto = document.getElementById('contentFormTexto');
                            contentFormTexto.classList.add('hide');
                        }
                    } else {
                        // En modo asesor, asegurar que el formulario permanezca visible
                        const contentFormTexto = document.getElementById('contentFormTexto');
                        if (contentFormTexto && contentFormTexto.classList.contains('hide')) {
                            contentFormTexto.classList.remove('hide');
                        }
                        eliminarTypingIndicator();
                    }
                }
                // Si aún no aparece "datos-diligenciados", no hacer nada (el formulario inicial sigue activo)

            } else if (resultEnviarMensaje.status === 409) {
                // ERROR 409 = RATE LIMITING (del middleware, pero con código 409)
                clearInterval(reintentoInterval);
                //console.log('🚫 Error 409 detectado - Rate limiting activado (código 409)');

                // Obtener el retryAfter del error (tiempo real del middleware)
                const retryAfter = resultEnviarMensaje.retryAfter;
                const errorData = {
                    message: resultEnviarMensaje.message || 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    retryAfter: retryAfter
                };

                // OCULTAR INMEDIATAMENTE EL FORMULARIO AL DETECTAR ERROR 409 (RATE LIMITING)
                const contentFormTexto = document.getElementById('contentFormTexto');
                contentFormTexto.classList.add('hide');
                //console.log('🚨 Formulario ocultado INMEDIATAMENTE por error 409 (rate limiting)');

                // Liberar el flag de envío cuando se active rate limiting
                enviandoMensaje = false;
                //console.log('🔄 Flag enviandoMensaje liberado por rate limiting');

                // DETENER INMEDIATAMENTE CUALQUIER REINTENTO ACTIVO
                if (reintentoInterval) {
                    clearInterval(reintentoInterval);
                    //console.log('🛑 Reintentos detenidos por error 409 (rate limiting)');
                }

                // Manejar como error 429 (rate limiting) con el tiempo correcto
                manejarError429HTTP(errorData);

            } else if (resultEnviarMensaje.status === 429) {
                // ERROR 429 = RATE LIMITING REAL (del middleware)
                clearInterval(reintentoInterval);
                //console.log('🚫 Error 429 detectado - Rate limiting real activado');

                // Liberar el flag de envío cuando se active rate limiting
                enviandoMensaje = false;
                //console.log('🔄 Flag enviandoMensaje liberado por rate limiting (429)');

                // NO MANEJAR ERROR 429 AQUÍ - YA SE MANEJÓ EN enviarMensaje()
                //console.log('🔄 Error 429 ya manejado en enviarMensaje(), no duplicar manejo');

                // DETENER INMEDIATAMENTE CUALQUIER REINTENTO ACTIVO
                if (reintentoInterval) {
                    clearInterval(reintentoInterval);
                    //console.log('🛑 Reintentos detenidos por error 429');
                }

            } else {
                // ERROR GENÉRICO: Continuar reintentando cada 30 segundos
                //console.log('❌ Error en el envío del mensaje, reintentando en 30 segundos:', resultEnviarMensaje);

                // LISTAR MENSAJES INMEDIATAMENTE AUN EN CASO DE ERROR PARA MOSTRAR RÁPIDAMENTE
                //console.log('⚡ Listando mensajes no leídos inmediatamente (caso error)');
                const resultListar = await listarMensajeNoLeido();
                // Solo hacer scroll si hay mensajes nuevos
                if (resultListar && resultListar.mensajesNuevos) {
                    await desplazarScrollVentana();
                    await desplazarScrollConversacion();
                }
            }

            return resultEnviarMensaje;
        } catch (error) {
            // Restaurar el valor original del textarea incluso si hay error
            if (mensajeFueModificado && txtMensaje) {
                txtMensaje.value = mensajeOriginal;
            }
            console.log('❌ Error en enviarMensajeConReintento:', error);
            return { status: 500, message: 'Error de conexión' };
        }
    };

    // Iniciar el envío del mensaje con reintento cada 30 segundos
    // Solo reintenta en errores técnicos (500, 502, 503, etc.), NO en 429 (Rate Limit)
    reintentoInterval = setInterval(() => {
        // Verificar si hay error 429 activo antes de reintentar
        const hayError429Activo = document.querySelector('.mensaje-error-429');
        if (hayError429Activo) {
            //console.log('🚫 Error 429 activo, deteniendo reintentos');
            clearInterval(reintentoInterval);
            return;
        }
        enviarMensajeConReintento();
    }, 30000);
    await enviarMensajeConReintento(); // Intentar enviar el mensaje inmediatamente
}

// ! ENVIAR FORMULARIO INICIAL
const observadorFormulario = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            // SELECT2 PARA GÉNERO
            $('#txt_genero').select2({
                allowClear: true,
                language: 'es',
                placeholder: 'Seleccione su género',
                width: '100%'
            }).on("select2:open", function () {
                $('#txt_genero').siblings('.select2-label').removeClass('active-ok').addClass('active');
            }).on("select2:select", function (e) {
                valida_txt_genero();
                if ($('#txt_genero').val()) {
                    $('#txt_genero').siblings('.select2-label').removeClass('active').addClass('active-ok');
                } else {
                    $('#txt_genero').siblings('.select2-label').removeClass('active');
                }
            }).on("select2:close", function () {
                valida_txt_genero();
                if ($('#txt_genero').val()) {
                    $('#txt_genero').siblings('.select2-label').removeClass('active').addClass('active-ok');
                } else {
                    $('#txt_genero').siblings('.select2-label').removeClass('active');
                }
            });

            // SELECT2 PARA RANGO DE EDAD
            $('#txt_rangoEdad').select2({
                allowClear: true,
                language: 'es',
                placeholder: 'Seleccione su rango de edad',
                width: '100%'
            }).on("select2:open", function () {
                $('#txt_rangoEdad').siblings('.select2-label').removeClass('active-ok').addClass('active');
            }).on("select2:select", function (e) {
                valida_txt_rangoEdad();
                if ($('#txt_rangoEdad').val()) {
                    $('#txt_rangoEdad').siblings('.select2-label').removeClass('active').addClass('active-ok');
                } else {
                    $('#txt_rangoEdad').siblings('.select2-label').removeClass('active');
                }
            }).on("select2:close", function () {
                valida_txt_rangoEdad();
                if ($('#txt_rangoEdad').val()) {
                    $('#txt_rangoEdad').siblings('.select2-label').removeClass('active').addClass('active-ok');
                } else {
                    $('#txt_rangoEdad').siblings('.select2-label').removeClass('active');
                }
            });

            // SELECT2 PARA LOCALIDAD
            $('#txt_localidad').select2({
                allowClear: true,
                language: 'es',
                placeholder: 'Seleccione su localidad',
                width: '100%'
            }).on("select2:open", function () {
                $('#txt_localidad').siblings('.select2-label').removeClass('active-ok').addClass('active');
            }).on("select2:select", function (e) {
                valida_txt_localidad();
                if ($('#txt_localidad').val()) {
                    $('#txt_localidad').siblings('.select2-label').removeClass('active').addClass('active-ok');
                } else {
                    $('#txt_localidad').siblings('.select2-label').removeClass('active');
                }
            }).on("select2:close", function () {
                valida_txt_localidad();
                if ($('#txt_localidad').val()) {
                    $('#txt_localidad').siblings('.select2-label').removeClass('active').addClass('active-ok');
                } else {
                    $('#txt_localidad').siblings('.select2-label').removeClass('active');
                }
            });

            // SELECT2 PARA TEMA DE CONSULTA
            $('#txt_temaConsulta').select2({
                allowClear: true,
                language: 'es',
                placeholder: 'Seleccione el tema de consulta',
                width: '100%'
            }).on("select2:open", function () {
                $('#txt_temaConsulta').siblings('.select2-label').removeClass('active-ok').addClass('active');
            }).on("select2:select", function (e) {
                const valorSeleccionado = e.params.data.id;

                // Mostrar/ocultar campo de texto según la selección
                const contenedorOtro = document.getElementById('contenedor-tema-otro');
                const inputOtro = document.getElementById('txt_temaOtro');
                const labelOtro = contenedorOtro?.querySelector('label');

                if (valorSeleccionado === 'Otro') {
                    if (contenedorOtro) {
                        contenedorOtro.style.display = 'block';
                        if (inputOtro) {
                            inputOtro.focus();
                            // Activar el label
                            if (labelOtro) {
                                labelOtro.classList.add('active');
                            }
                        }
                    }
                } else {
                    if (contenedorOtro) {
                        contenedorOtro.style.display = 'none';
                        if (inputOtro) {
                            inputOtro.value = '';
                            // Desactivar el label
                            if (labelOtro) {
                                labelOtro.classList.remove('active', 'active-ok');
                            }
                        }
                    }
                }

                const txt_temaOtro = document.getElementById('txt_temaOtro');
                if (txt_temaOtro) {
                    txt_temaOtro.addEventListener('input', function () {
                        if (this.value.trim().length > 0) {
                            valida_txt_temaConsulta();
                        }
                    });
                    txt_temaOtro.addEventListener('blur', function () {
                        valida_txt_temaConsulta();
                    });
                }

                valida_txt_temaConsulta();
                if ($('#txt_temaConsulta').val()) {
                    $('#txt_temaConsulta').siblings('.select2-label').removeClass('active').addClass('active-ok');
                } else {
                    $('#txt_temaConsulta').siblings('.select2-label').removeClass('active');
                }
            }).on("select2:close", function () {
                valida_txt_temaConsulta();
                if ($('#txt_temaConsulta').val()) {
                    $('#txt_temaConsulta').siblings('.select2-label').removeClass('active').addClass('active-ok');
                } else {
                    $('#txt_temaConsulta').siblings('.select2-label').removeClass('active');
                }
            });

            const btn_Continuar = document.getElementById('btn_Continuar');
            if (btn_Continuar && !btn_Continuar.hasListener) {
                // Desconectar el observador una vez que encontramos el botón
                observadorFormulario.disconnect();
                
                // Marcar que ya tiene un listener
                btn_Continuar.hasListener = true;

                // AGREGAR VALIDACIÓN EN TIEMPO REAL PARA TODOS LOS CAMPOS
                // Nombres y Apellidos
                const txt_nombresApellidos = document.getElementById('txt_nombresApellidos');
                if (txt_nombresApellidos) {
                    txt_nombresApellidos.addEventListener('input', function () {
                        if (this.value.trim().length > 0) {
                            valida_txt_nombresApellidos();
                        }
                    });
                    txt_nombresApellidos.addEventListener('blur', function () {
                        valida_txt_nombresApellidos();
                    });
                }

                // Correo Electrónico
                const txt_correoElectronico = document.getElementById('txt_correoElectronico');
                if (txt_correoElectronico) {
                    txt_correoElectronico.addEventListener('input', function () {
                        if (this.value.trim().length > 0) {
                            valida_txt_correoElectronico();
                        }
                    });
                    txt_correoElectronico.addEventListener('blur', function () {
                        valida_txt_correoElectronico();
                    });
                }

                // Número de Contacto
                const txt_numeroContacto = document.getElementById('txt_numeroContacto');
                if (txt_numeroContacto) {
                    txt_numeroContacto.addEventListener('input', function () {
                        if (this.value.trim().length > 0) {
                            valida_txt_numeroContacto();
                        }
                    });
                    txt_numeroContacto.addEventListener('blur', function () {
                        valida_txt_numeroContacto();
                    });
                }

                // Ayuda
                const txt_ayuda = document.getElementById('txt_ayuda');
                if (txt_ayuda) {
                    txt_ayuda.addEventListener('input', function () {
                        if (this.value.trim().length > 0) {
                            valida_txt_temaConsulta();
                        }
                    });
                    txt_ayuda.addEventListener('blur', function () {
                        valida_txt_temaConsulta();
                    });
                }

                // Checkbox
                const txt_autorizacionDatosPersonales = document.getElementById('txt_autorizacionDatosPersonales');
                if (txt_autorizacionDatosPersonales) {
                    txt_autorizacionDatosPersonales.addEventListener('change', function () {
                        valida_txt_autorizacionDatosPersonales();
                    });
                }

                // Agregar el evento click al botón
                btn_Continuar.addEventListener('click', async () => {
                    try {
                        // Validar todos los campos
                        const validaciones = await Promise.all([
                            valida_txt_nombresApellidos(),
                            valida_txt_genero(),
                            valida_txt_correoElectronico(),
                            valida_txt_numeroContacto(),
                            valida_txt_localidad(),
                            valida_txt_rangoEdad(),
                            valida_txt_temaConsulta(),
                            valida_txt_autorizacionDatosPersonales()
                        ]);

                        // Si alguna validación falló, detener el envío
                        if (validaciones.includes(false)) {
                            return;
                        }

                        // Deshabilitar el botón mientras se envían los mensajes
                        btn_Continuar.disabled = true;

                        // OCULTAR EL FORMULARIO INICIAL INMEDIATAMENTE
                        document.getElementById('content_form').classList.add('hide');

                        // Crear un objeto con los valores a enviar
                        const camposFormulario = {
                            nombresApellidos: document.getElementById('txt_nombresApellidos').value.trim(),
                            genero: document.getElementById('txt_genero').value.trim(),
                            correoElectronico: document.getElementById('txt_correoElectronico').value.trim(),
                            numeroContacto: document.getElementById('txt_numeroContacto').value.trim(),
                            localidad: document.getElementById('txt_localidad').value.trim(),
                            rangoEdad: document.getElementById('txt_rangoEdad').value.trim(),
                            temaConsulta: (() => {
                                const temaConsulta = document.getElementById('txt_temaConsulta').value.trim();
                                if (temaConsulta === 'Otro') {
                                    const temaOtro = document.getElementById('txt_temaOtro').value.trim();
                                    return `Otro: ${temaOtro}`;
                                }
                                return temaConsulta;
                            })(),
                            autorizacionDatosPersonales: document.getElementById('txt_autorizacionDatosPersonales').checked ? 'Si' : 'No'
                        };

                        let enviado = false; // Bandera para saber si ya se envió correctamente

                        // Función para intentar enviar el formulario
                        const enviarFormulario = async () => {
                            if (enviado) return; // Si ya se envió, no hacer nada

                            try {
                                const response = await fetch("/widget/chat/formularioInicial", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "origin": window.location.origin
                                    },
                                    body: JSON.stringify({ idChatWeb, camposFormulario })
                                });

                                // Verificar si la respuesta es un error 429
                                if (response.status === 429) {
                                    const errorData = await response.json();
                                    
                                    // OCULTAR INMEDIATAMENTE EL FORMULARIO AL DETECTAR ERROR 429
                                    const contentFormTexto = document.getElementById('contentFormTexto');
                                    contentFormTexto.classList.add('hide');
                                    
                                    manejarError429HTTP(errorData);
                                    return { status: 429, message: 'Límite de API excedido' };
                                }

                                const resultFormulario = await response.json();
                                if (resultFormulario.status === 200) {
                                    enviado = true; // Marcar como enviado
                                    clearInterval(reintentoInterval); // <-- ¡DETENER EL INTERVALO AQUÍ!

                                    // Ocultar el formulario
                                    document.getElementById('content_form').classList.add('hide');

                                    // Llamar a la función para listar mensajes no leídos
                                    const resultListar = await listarMensajeNoLeido();

                                    // Solo hacer scroll si hay mensajes nuevos
                                    if (resultListar && resultListar.mensajesNuevos) {
                                        await desplazarScrollVentana();
                                        await desplazarScrollConversacion();
                                    }

                                    // NO habilitar el formulario todavía
                                    // El formulario se habilitará automáticamente cuando aparezca el mensaje "saludoChat"
                                    // en procesarMensajes() después de que el ChatBot responda
                                    const contentFormTexto = document.getElementById('contentFormTexto');
                                    contentFormTexto.classList.add('hide');
                                } else if (resultFormulario.status === 429) {
                                    // DETENER EL INTERVALO SI HAY ERROR 429 (Rate Limit)
                                    clearInterval(reintentoInterval);
                                } else {
                                    // Actualizar bandera
                                    enviado = false;

                                    // Habilitar el botón
                                    btn_Continuar.disabled = false;

                                    const resultListar = await listarMensajeNoLeido();
                                    // Solo hacer scroll si hay mensajes nuevos
                                    if (resultListar && resultListar.mensajesNuevos) {
                                        await desplazarScrollVentana();
                                        await desplazarScrollConversacion();
                                    }
                                    console.log('❌ Error en v1/assets/js/widget/chat.js → btn_Continuar.enviarFormulario ', resultFormulario);
                                }
                            } catch (error) {
                                // Puedes mostrar un mensaje de error si quieres, pero el reintento seguirá
                                console.warn('❌ Error al enviar el formulario, reintentando en 30 segundos...', error);
                            }
                        };

                        // Enviar el formulario la primera vez inmediatamente
                        await enviarFormulario();

                        // Iniciar el reintento cada 30 segundos si no se ha enviado con éxito
                        reintentoInterval = setInterval(enviarFormulario, 30000);
                    } catch (error) {
                        console.log('❌ Error en v1/assets/js/widget/chat.js → btn_Continuar.enviarFormulario ', error);
                    }
                });
            }
        }
    });
});

// Iniciar la observación del DOM solo si no está ya observando
if (!observadorFormulario._isObserving) {
    document.addEventListener('DOMContentLoaded', () => {
        observadorFormulario.observe(document.body, {
            childList: true,
            subtree: true
        });
        observadorFormulario._isObserving = true;
    });
}

// ! FUNCIONES AUXILIARES
// * OBTENER INFORMACIÓN DEL WIDGET CHAT WEB
async function obtenerInfoWidgetChatWeb() {
    return new Promise((resolve) => {
        window.addEventListener("message", async (event) => {
            chatWeb = event.data.chatWeb;
            idChatWeb = event.data.idWidgetChatWeb;
            resolve();
        });
    });
}

// * DESHABILITAR FORMULARIO DE MENSAJE
function deshabilitarFormularioMensaje() {
    if (modoAsesor) return; // No deshabilitar en modo asesor

    const txtMensaje = document.getElementById('txt_mensaje');
    const contentFormTexto = document.getElementById('contentFormTexto');
    const btnEnviar = document.getElementById('btnEnviar');
    if (txtMensaje) {
        txtMensaje.value = '';
        txtMensaje.readOnly = true;
        txtMensaje.blur();
    }
    if (contentFormTexto) {
        contentFormTexto.classList.add('hide');
    }
    if (btnEnviar) {
        btnEnviar.disabled = true;
        btnEnviar.style.opacity = '0.6';
        btnEnviar.style.cursor = 'not-allowed';
    }
}

// * MARCAR CHAT COMO FINALIZADO
function marcarChatComoFinalizado() {
    chatFinalizado = true;
    deshabilitarFormularioMensaje();
    eliminarTypingIndicator();
    enviandoMensaje = false;
    detenerVigilanciaInactividad();
    detenerRefrescoMensajes();
    detenerWatchdogFormulario();
}

// * LIMPIAR Y ENFOCAR TEXTAREA
function limpiarYEnfocarTextarea(debeEnfocar = true) {
    const contentFormTexto = document.getElementById('contentFormTexto');
    if (debeEnfocar && contentFormTexto) {
        contentFormTexto.classList.remove('hide');
    }
    const txtMensaje = document.getElementById('txt_mensaje');
    if (txtMensaje) {
        txtMensaje.readOnly = false;
        txtMensaje.value = '';
        txtMensaje.style.height = 'auto';
        if (window.M && M.textareaAutoResize) {
            M.textareaAutoResize(txtMensaje);
        }
        if (debeEnfocar) {
            setTimeout(() => {
                txtMensaje.focus();
                // Llevar el cursor al final
                const longitud = txtMensaje.value.length;
                if (typeof txtMensaje.setSelectionRange === 'function') {
                    txtMensaje.setSelectionRange(longitud, longitud);
                }
            }, 200);
        }
    }
}

// * MOSTRAR INDICADOR DE ESCRIBIENDO
function mostrarTypingIndicator() {
    // VERIFICAR SI HAY ERROR 429 ACTIVO - NO MOSTRAR TYPING SI LO HAY
    const hayError429Activo = document.querySelector('.mensaje-error-429');
    if (hayError429Activo) {
        //console.log('⏸️  Error 429 activo, no se muestra typing indicator');
        return;
    }

    // VERIFICACIÓN CRÍTICA: NO mostrar typing si la sección de adjuntos está visible
    // El typing solo debe aparecer cuando estamos en la sección de texto
    const contentAdjuntos = document.getElementById('contentAdjuntos');
    const adjuntosVisible = contentAdjuntos && !contentAdjuntos.classList.contains('hide');
    if (adjuntosVisible) {
        //console.log('⏸️  Sección de adjuntos visible, no se muestra typing indicator');
        return;
    }

    // CRÍTICO: NO mostrar typing indicator si el ÚLTIMO mensaje es del ChatBot
    // PERO: Si hay un typing indicator ya visible, permitir mantenerlo (puede ser que el mensaje del usuario aún no se haya renderizado)
    const conversacionDivCheck = document.getElementById('conversacion');
    if (conversacionDivCheck) {
        const todosLosMensajes = conversacionDivCheck.querySelectorAll('.mensaje-enviado.mensaje-mostrado, .mensaje-recibido.mensaje-mostrado');
        if (todosLosMensajes.length > 0) {
            const ultimoMensaje = todosLosMensajes[todosLosMensajes.length - 1];
            const esUltimoMensajeDelChatBot = ultimoMensaje && ultimoMensaje.classList.contains('mensaje-enviado');
            if (esUltimoMensajeDelChatBot && !typingIndicatorVisible) {
                // Si el último mensaje es del ChatBot Y no hay typing indicator visible, no mostrar uno nuevo
                // (pero si ya hay uno visible, permitir mantenerlo porque puede ser que el mensaje del usuario aún no se haya renderizado)
                //console.log('⏸️  El último mensaje es del ChatBot y no hay typing visible, NO se muestra typing indicator');
                return;
            } else if (esUltimoMensajeDelChatBot && typingIndicatorVisible) {
                // Si el último mensaje es del ChatBot pero hay typing visible, eliminarlo
                const typingIndicator = document.getElementById('typing-indicator');
                if (typingIndicator) {
                    typingIndicator.remove();
                    typingIndicatorVisible = false;
                    
                    // EJECUTAR SCROLL INMEDIATAMENTE para mostrar el mensaje del ChatBot
                    setTimeout(() => {
                        desplazarScrollConversacion();
                        desplazarScrollVentana();
                    }, 50);
                }
                //console.log('🗑️ Eliminando typing indicator - último mensaje es del ChatBot');
                return;
            }
        }
    }

    // Solo mostrar typing indicator DESPUÉS de que aparezca "saludoChat" o "solicitarNombresApellidosArbol"
    // (después del formulario inicial)
    const datosDiligenciadosPresente = verificarOpcionesServiciosMostradas();
    if (!datosDiligenciadosPresente) {
        //console.log('⏸️  Aún no aparece "saludoChat" o "solicitarNombresApellidosArbol", no se muestra typing indicator');
        return;
    }


    // SELECT2 PARA GÉNERO
    $('#txt_genero').select2({
        allowClear: true,
        language: 'es',
        placeholder: 'Seleccione su género',
        width: '100%'
    }).on("select2:open", function () {
        $('#txt_genero').siblings('.select2-label').removeClass('active-ok').addClass('active');
    }).on("select2:select", function (e) {
        valida_txt_genero();
        if ($('#txt_genero').val()) {
            $('#txt_genero').siblings('.select2-label').removeClass('active').addClass('active-ok');
        } else {
            $('#txt_genero').siblings('.select2-label').removeClass('active');
        }
    }).on("select2:close", function () {
        valida_txt_genero();
        if ($('#txt_genero').val()) {
            $('#txt_genero').siblings('.select2-label').removeClass('active').addClass('active-ok');
        } else {
            $('#txt_genero').siblings('.select2-label').removeClass('active');
        }
    });
    // Verificar si ya existe un typing indicator
    const existingIndicator = document.getElementById('typing-indicator');
    if (existingIndicator) {
        return; // Ya existe, no crear otro
    }

    // Mostrar typing indicator siempre que se llame (sin condiciones restrictivas)
    //console.log('🔄 Mostrando typing indicator...');

    // Crear el elemento del typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'typing-indicator';
    
    // Crear el contenedor de los puntos
    const dotsDiv = document.createElement('div');
    dotsDiv.className = 'typing-dots';
    
    // Crear los tres puntos
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dotsDiv.appendChild(dot);
    }
    
    typingDiv.appendChild(dotsDiv);
    
    // Agregar al contenedor de conversación
    const conversacionDiv = document.getElementById('conversacion');
    conversacionDiv.appendChild(typingDiv);
    
    typingIndicatorVisible = true;
    
    // NO ocultar el formulario aquí - se manejará en listarMensajeNoLeido según las condiciones
    // const contentFormTexto = document.getElementById('contentFormTexto');
    // contentFormTexto.classList.add('hide');
    //console.log('🔄 Typing indicator creado, formulario se manejará según condiciones');
    
    // Hacer scroll al final para mostrar el indicador
    desplazarScrollConversacion();
}


// VALIDACIÓN REACTIVA PARA INPUTS Y SELECTS
$('#txt_nombresApellidos, #txt_correoElectronico, #txt_telefono, #txt_localidad, #txt_temaConsulta').on('input change', function () {
    if ($(this).val().trim() !== '') {
        $(this).removeClass('input-error');
        $(this).siblings('.error-message').hide();
    }
});
$('#txt_genero, #txt_tipoDocumento, #txt_paisResidencia').on('change', function () {
    if ($(this).val()) {
        $(this).removeClass('input-error');
        $(this).siblings('.error-message').hide();
    }
});
// * FUNCIÓN CENTRALIZADA PARA ASEGURAR QUE EL FORMULARIO ESTÉ VISIBLE
// Esta función tiene prioridad y se asegura de mostrar el formulario cuando corresponde
// Retorna true si el formulario debería estar visible, false si no debería
function asegurarFormularioVisible() {
    // VERIFICACIÓN CRÍTICA: Si estamos en la sección de adjuntos, NUNCA mostrar el formulario de texto
    const contentAdjuntos = document.getElementById('contentAdjuntos');
    const contentFormTexto = document.getElementById('contentFormTexto');
    const adjuntosVisible = contentAdjuntos && !contentAdjuntos.classList.contains('hide');

    if (adjuntosVisible) {
        // Estamos en adjuntos, ocultar el formulario de texto
        if (contentFormTexto && !contentFormTexto.classList.contains('hide')) {
            contentFormTexto.classList.add('hide');
            //console.log('🚫 Formulario de texto ocultado - estamos en adjuntos');
        }
        return;
    }

    // En modo asesor, siempre mostrar el formulario (si no estamos en adjuntos)
    if (modoAsesor) {
        if (contentFormTexto && contentFormTexto.classList.contains('hide')) {
            contentFormTexto.classList.remove('hide');
            limpiarYEnfocarTextarea();
            habilitarBotonEnviar();
        }
        return;
    }

    // NO mostrar formulario si el chat está finalizado
    if (chatFinalizado) {
        return;
    }
    
    const datosDiligenciadosPresente = verificarOpcionesServiciosMostradas();
    if (!datosDiligenciadosPresente) {
        return; // Aún no aparece "saludoChat" o "solicitarNombresApellidosArbol"
    }
    
    // Verificar condiciones que impiden mostrar el formulario
    const hayError429Activo = document.querySelector('.mensaje-error-429');
    const hayFinChat = document.querySelector('.mensaje-fin-chat');
    const typingIndicator = document.getElementById('typing-indicator');
    
    if (hayError429Activo || hayFinChat || typingIndicator) {
        return; // No mostrar formulario si hay error 429, fin de chat o typing indicator visible
    }
    
    // VERIFICAR SI HAY BOTONES DE OPCIONES O SELECTS PERSONALIZADOS ACTIVOS
    const botonesOpcionesActivos = document.querySelectorAll('.btn-opcion-chat:not(:disabled)');
    const selectsActivos = document.querySelectorAll('.select-custom-trigger:not(.deshabilitado)');
    if (botonesOpcionesActivos.length > 0 || selectsActivos.length > 0) {
        // Hay opciones pendientes de seleccionar, ocultar el formulario
        const contentFormTexto = document.getElementById('contentFormTexto');
        if (contentFormTexto) {
            contentFormTexto.classList.add('hide');
        }
        return; // No mostrar formulario mientras hay opciones activas
    }
    // Verificar si el último mensaje es de tipo "Error API" o "Fin Chat"
    const conversacionDivCheck = document.getElementById('conversacion');
    if (conversacionDivCheck) {
        const todosLosMensajes = conversacionDivCheck.querySelectorAll('.mensaje-enviado.mensaje-mostrado, .mensaje-recibido.mensaje-mostrado');
        if (todosLosMensajes.length > 0) {
            const ultimoMensaje = todosLosMensajes[todosLosMensajes.length - 1];
            const tipoUltimoMensaje = ultimoMensaje.getAttribute('data-tipo-mensaje');
            if (tipoUltimoMensaje === 'Error API' || tipoUltimoMensaje === 'Fin Chat') {
                return; // No mostrar formulario si el último mensaje es de tipo "Error API" o "Fin Chat"
            }
        }
    }
    
    // Verificar el último mensaje en el DOM
    const conversacionDiv = document.getElementById('conversacion');
    if (conversacionDiv) {
        const todosLosMensajes = conversacionDiv.querySelectorAll('.mensaje-enviado.mensaje-mostrado, .mensaje-recibido.mensaje-mostrado');
        if (todosLosMensajes.length > 0) {
            const ultimoMensaje = todosLosMensajes[todosLosMensajes.length - 1];
            const esUltimoMensajeDelChatBot = ultimoMensaje && ultimoMensaje.classList.contains('mensaje-enviado');
            
            // Si el último mensaje es del ChatBot, mostrar el formulario
            // PERO NO si es de tipo "Fin Chat" o "Error API"
            if (esUltimoMensajeDelChatBot) {
                // Verificar el tipo del último mensaje
                const tipoUltimoMensaje = ultimoMensaje.getAttribute('data-tipo-mensaje');
                const esMensajeErrorAPI = tipoUltimoMensaje === 'Error API';
                const esMensajeFinChat = tipoUltimoMensaje === 'Fin Chat';
                
                // NO mostrar formulario si el último mensaje es de tipo "Error API" o "Fin Chat"
                if (!esMensajeErrorAPI && !esMensajeFinChat) {
                    const contentFormTexto = document.getElementById('contentFormTexto');
                    if (contentFormTexto && contentFormTexto.classList.contains('hide')) {
                        contentFormTexto.classList.remove('hide');
                        limpiarYEnfocarTextarea();
                        habilitarBotonEnviar();
                        desplazarScrollConversacion();
                        //console.log('✅ Formulario mostrado por asegurarFormularioVisible()');
                    }
                }
            }
        }
    }
}

// * ELIMINAR INDICADOR DE ESCRIBIENDO
function eliminarTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    let fueEliminado = false;
    if (typingIndicator) {
        typingIndicator.remove();
        typingIndicatorVisible = false;
        fueEliminado = true;
        //console.log('🗑️ Typing indicator eliminado');
        
        // EJECUTAR SCROLL INMEDIATAMENTE cuando se elimina el typing indicator
        // para asegurar que el usuario vea el mensaje recién mostrado
        setTimeout(() => {
            desplazarScrollConversacion();
            desplazarScrollVentana();
        }, 50);
    } else {
        // Si no existe el elemento, asegurar que la variable esté en false
        typingIndicatorVisible = false;
    }
    
    // NO intentar mostrar el formulario si el chat está finalizado
    if (chatFinalizado) {
        return;
    }
    
    // Usar la función centralizada para asegurar que el formulario esté visible
    setTimeout(() => {
        asegurarFormularioVisible();
    }, 100);
}

// * MANEJAR ERROR 429 (Límite de API excedido)
function manejarError429(mensajes) {
    // Buscar el mensaje de error 429
    const mensajeError = mensajes.find(mensaje => mensaje.ESTADO === 'Error API' && mensaje.CONTENIDO.includes('status":429'));
    
    if (mensajeError) {
        try {
            // Parsear el JSON del error
            const errorData = JSON.parse(mensajeError.CONTENIDO);
            const retryAfter = errorData.retryAfter * 60; // Convertir minutos a segundos
            const minutos = Math.round(retryAfter / 60);
            
            // NO aplicar fondo negro, solo ocultar el textarea
            const contentFormTexto = document.getElementById('contentFormTexto');
            contentFormTexto.classList.add('hide');
            
            // Limpiar cualquier typing indicator activo
            eliminarTypingIndicator();
            
            // Mostrar mensaje amigable en la conversación
            mostrarMensajeError429(retryAfter, minutos);
            
            // Configurar temporizador para reactivar el chat
            setTimeout(() => {
                reactivarChatDespuesDeError429();
            }, retryAfter * 1000); // Convertir segundos a milisegundos
            
            //console.log(`🚫 Error 429 detectado. Chat se reactivará en ${retryAfter} segundos (${minutos} minutos)`);
            
        } catch (error) {
            console.error('Error al parsear el mensaje de error 429:', error);
        }
    }
}

// * MOSTRAR MENSAJE AMIGABLE DE ERROR 429
function mostrarMensajeError429(retryAfter, minutos, errorData) {
    //console.log('📝 Creando mensaje de error 429 con retryAfter:', retryAfter);
    
    const conversacionDiv = document.getElementById('conversacion');
    
    // Crear mensaje amigable
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = 'mensaje-error-429';
    
    const textoDiv = document.createElement('div');
    textoDiv.className = 'texto';
    textoDiv.innerHTML = `
        <div class="remitente">Sistema</div>
        <p><strong>⚠️ ${errorData.message || 'Límite de consultas excedido'}</strong></p>
        <p>El chat se reactivará automáticamente en <strong>${retryAfter} segundos</strong>.</p>
        <p><small>Tiempo restante: <span id="countdown-429">${retryAfter}</span> segundos</small></p>
    `;
    
    mensajeDiv.appendChild(textoDiv);
    conversacionDiv.appendChild(mensajeDiv);
    
    //console.log('✅ Mensaje de error 429 agregado al DOM');
    
    // Hacer scroll para mostrar el mensaje
    desplazarScrollConversacion();
    
    // Iniciar countdown después de un pequeño delay para asegurar que el DOM se actualice
    setTimeout(() => {
        //console.log('🚀 Iniciando countdown después del delay');
        iniciarCountdown429(retryAfter);
        // Inhabilitar el elmento contentFormTexto con la clase hide
        const contentFormTexto = document.getElementById('contentFormTexto');
        contentFormTexto.classList.add('hide');
        //console.log('🚨 Formulario ocultado INMEDIATAMENTE por mostrarMensajeError429');
    }, 100);
}

// * INICIAR COUNTDOWN PARA ERROR 429
function iniciarCountdown429(segundos) {
    //console.log('⏱️ Iniciando countdown con:', segundos, 'segundos');
    
    // LIMPIAR CUALQUIER COUNTDOWN ANTERIOR
    if (countdown429Interval) {
        //console.log('🗑️ Limpiando countdown anterior');
        clearInterval(countdown429Interval);
        countdown429Interval = null;
    }
    
    const countdownElement = document.getElementById('countdown-429');
    //console.log('🔍 Elemento countdown encontrado:', countdownElement);
    
    if (!countdownElement) {
        //console.log('❌ No se encontró el elemento countdown-429');
        return;
    }
    
    let tiempoRestante = segundos;
    //console.log('🎯 Countdown iniciado con', tiempoRestante, 'segundos');
    
    countdown429Interval = setInterval(() => {
        tiempoRestante--;
        //console.log('⏰ Tiempo restante:', tiempoRestante);
        
        if (countdownElement) {
            countdownElement.textContent = tiempoRestante;
        }
        
        if (tiempoRestante <= 0) {
            //console.log('⏰ Countdown terminado');
            clearInterval(countdown429Interval);
            countdown429Interval = null;
            // El mensaje se actualizará cuando se reactive el chat
        }
    }, 1000);
}

// * REACTIVAR CHAT DESPUÉS DE ERROR 429
function reactivarChatDespuesDeError429() {
    // LIMPIAR COUNTDOWN SI ESTÁ ACTIVO
    if (countdown429Interval) {
        //console.log('🗑️ Limpiando countdown al reactivar chat');
        clearInterval(countdown429Interval);
        countdown429Interval = null;
    }
    
    // ELIMINAR EL MENSAJE DE ERROR CUANDO SE REACTIVE EL CHAT
    const mensajeErrorAnterior = document.querySelector('.mensaje-error-429');
    if (mensajeErrorAnterior) {
        mensajeErrorAnterior.remove();
        //console.log('🗑️ Mensaje de error 429 eliminado al reactivar chat');
    }
    
    // LIBERAR EL FLAG DE ENVÍO CUANDO SE REACTIVE EL CHAT
    enviandoMensaje = false;
    //console.log('🔄 Flag enviandoMensaje liberado al reactivar chat');
    
    // LIMPIAR CUALQUIER REINTENTO ACTIVO AL REACTIVAR EL CHAT
    if (reintentoInterval) {
        clearInterval(reintentoInterval);
        reintentoInterval = null;
        //console.log('🛑 Reintentos limpiados al reactivar chat');
    }
    
    // REACTIVAR EL FORMULARIO DESPUÉS DEL ERROR 429
    // Solo si ya apareció el mensaje "saludoChat"
    if (verificarOpcionesServiciosMostradas()) {
        limpiarYEnfocarTextarea();
        //console.log('👁️ Formulario reactivado después del error 429');
    }
    
    // Limpiar cualquier typing indicator que pueda estar activo
    eliminarTypingIndicator();
    
    //console.log('✅ Chat reactivado completamente después del error 429');
}

// * FUNCIÓN ELIMINADA - YA NO SE NECESITA MOSTRAR MENSAJE DE REACTIVACIÓN
// Solo se reactiva el formulario mostrando contentFormTexto

// * MANEJAR ERROR 429 DESDE PETICIONES HTTP
function manejarError429HTTP(errorData) {
    //console.log('🚫 manejarError429HTTP llamado con:', errorData);
    
    // Usar el retryAfter del backend (ya viene en minutos)
    // Asegurar que retryAfter sea un número válido
    const retryAfterMinutes = errorData.retryAfter || 1; // Default a 1 minuto si no viene
    const retryAfter = retryAfterMinutes * 60; // Convertir minutos a segundos
    const minutos = Math.round(retryAfter / 60);
    
    //console.log('⏰ RetryAfter del backend:', retryAfterMinutes, 'minutos →', retryAfter, 'segundos');
    
    // LIMPIAR COUNTDOWN ANTERIOR SI EXISTE
    if (countdown429Interval) {
        //console.log('🗑️ Limpiando countdown anterior');
        clearInterval(countdown429Interval);
        countdown429Interval = null;
    }
    
    // ELIMINAR MENSAJE DE ERROR 429 ANTERIOR SI EXISTE
    const mensajeErrorAnterior = document.querySelector('.mensaje-error-429');
    if (mensajeErrorAnterior) {
        mensajeErrorAnterior.remove();
        //console.log('🗑️ Mensaje de error 429 anterior eliminado');
    }
    
    // OCULTAR FORMULARIO VISUALMENTE CUANDO HAY ERROR 429
    const contentFormTexto = document.getElementById('contentFormTexto');
    contentFormTexto.classList.add('hide');
    //console.log('🚨 Formulario ocultado INMEDIATAMENTE por error 429 (vigilancia)');
    
    // Limpiar cualquier typing indicator activo
    eliminarTypingIndicator();
    
    // Mostrar mensaje amigable en la conversación
    mostrarMensajeError429(retryAfter, minutos, errorData);
    
    // Configurar temporizador para reactivar el chat
    // Usar el tiempo exacto del servidor para sincronización
    setTimeout(() => {
        reactivarChatDespuesDeError429();
    }, retryAfter * 1000); // Convertir segundos a milisegundos
    
    //console.log('⏰ Frontend: Reactivación programada en', retryAfter, 'segundos');
    //console.log(`🚫 Error 429 HTTP detectado. Chat se reactivará en ${retryAfter} segundos (${minutos} minutos)`);
}

// * MANEJAR ERROR 429 GLOBAL (SOLO VISUAL)
function manejarError429Global(retryAfter) {
    const minutos = Math.round(retryAfter / 60);
    
    // LIMPIAR COUNTDOWN ANTERIOR SI EXISTE
    if (countdown429Interval) {
        //console.log('🗑️ Limpiando countdown anterior (global)');
        clearInterval(countdown429Interval);
        countdown429Interval = null;
    }
    
    // ELIMINAR MENSAJE DE ERROR 429 ANTERIOR SI EXISTE
    const mensajeErrorAnterior = document.querySelector('.mensaje-error-429');
    if (mensajeErrorAnterior) {
        mensajeErrorAnterior.remove();
        //console.log('🗑️ Mensaje de error 429 anterior eliminado (global)');
    }
    
    // OCULTAR FORMULARIO VISUALMENTE CUANDO HAY ERROR 429
    const contentFormTexto = document.getElementById('contentFormTexto');
    contentFormTexto.classList.add('hide');
    //console.log('� Formulario ocultado INMEDIATAMENTE por error 429 (global)');
    
    // Limpiar cualquier typing indicator activo
    eliminarTypingIndicator();
    
    // Mostrar mensaje amigable en la conversación
    mostrarMensajeError429(retryAfter, minutos, { message: 'Límite de consultas excedido' });
    
    // Configurar temporizador para reactivar el chat
    setTimeout(() => {
        reactivarChatDespuesDeError429();
    }, retryAfter * 1000); // Convertir segundos a milisegundos
    
    //console.log(`🚫 Error 429 Global detectado. Chat se reactivará en ${retryAfter} segundos (${minutos} minutos)`);
}

// * FUNCIONES HELPER PARA CONTROL DE ESTADO DEL BOTÓN
function deshabilitarBotonEnviar() {
    const btnEnviar = document.getElementById('btnEnviar');
    if (btnEnviar) {
        btnEnviar.disabled = true;
        btnEnviar.style.opacity = '0.6';
        btnEnviar.style.cursor = 'not-allowed';
        // Cambiar el texto del botón para indicar que está enviando
        const textoOriginal = btnEnviar.innerHTML;
        btnEnviar.setAttribute('data-texto-original', textoOriginal);
        btnEnviar.innerHTML = 'Enviando...';
    }
}

function habilitarBotonEnviar() {
    const btnEnviar = document.getElementById('btnEnviar');
    if (btnEnviar) {
        btnEnviar.disabled = false;
        btnEnviar.style.opacity = '1';
        btnEnviar.style.cursor = 'pointer';
        // Restaurar el texto original del botón
        const textoOriginal = btnEnviar.getAttribute('data-texto-original');
        if (textoOriginal) {
            btnEnviar.innerHTML = textoOriginal;
            btnEnviar.removeAttribute('data-texto-original');
        }
    }
}

// * MOSTRAR INDICADOR DE CARGA
function mostrarIndicadorCarga() {
    const conversacionDiv = document.getElementById('conversacion');
    if (conversacionDiv && !document.getElementById('indicador-carga')) {
        const indicadorDiv = document.createElement('div');
        indicadorDiv.id = 'indicador-carga';
        indicadorDiv.className = 'indicador-carga';
        indicadorDiv.innerHTML = `
            <div class="carga-spinner">
                <div class="spinner"></div>
                <span>Iniciando chat...</span>
            </div>
        `;
        conversacionDiv.appendChild(indicadorDiv);
        
        // Hacer scroll para mostrar el indicador
        setTimeout(() => {
            desplazarScrollConversacion();
        }, 10);
    }
}

// * OCULTAR INDICADOR DE CARGA
function ocultarIndicadorCarga() {
    const indicador = document.getElementById('indicador-carga');
    if (indicador) {
        indicador.remove();
    }
    
    // También ocultar la capa de preload cuando se oculta el indicador de carga
    ocultarCapaPreload();
}

// * OCULTAR CAPA DE PRELOAD
function ocultarCapaPreload() {
    // Intentar ocultar desde el iframe
    const preloadLayer = document.getElementById('preload-layer');
    if (preloadLayer) {
        preloadLayer.style.display = 'none';
    }
    
    // También intentar ocultar desde el parent window (chatWeb.js)
    try {
        if (window.parent && window.parent.WidgetChatAPI && window.parent.WidgetChatAPI.ocultarPreload) {
            window.parent.WidgetChatAPI.ocultarPreload();
        }
    } catch (error) {
        // Si hay error de same-origin, continuar sin problemas
        console.log('No se pudo acceder al parent window para ocultar preload');
    }
    
    // Enviar mensaje al parent para ocultar el preload
    try {
        if (window.parent) {
            window.parent.postMessage({
                type: 'ocultarPreload'
            }, '*');
        }
    } catch (error) {
        console.log('Error enviando mensaje para ocultar preload:', error);
    }
}

// * LIMPIAR CONTENIDO ANTERIOR
function limpiarContenidoAnterior() {
    // Limpiar la conversación
    const conversacionDiv = document.getElementById('conversacion');
    if (conversacionDiv) {
        conversacionDiv.innerHTML = '';
    }
    
    // Limpiar el campo de mensaje
    const txtMensaje = document.getElementById('txt_mensaje');
    if (txtMensaje) {
        txtMensaje.value = '';
        txtMensaje.style.height = 'auto';
        if (window.M && M.textareaAutoResize) {
            M.textareaAutoResize(txtMensaje);
        }
    }
    
    // Limpiar el registro de mensajes renderizados
    renderedMessageIds.clear();
    
    // Limpiar cualquier typing indicator activo
    eliminarTypingIndicator();
    
    // Ocultar iconos de paso agente (adjuntar y volver a texto)
    ocultarIconoAdjuntarPasoAgente();
    ocultarIconoTextoPasoAgente();
    
    // Limpiar cualquier error 429 activo
    const mensajeError429 = document.querySelector('.mensaje-error-429');
    if (mensajeError429) {
        mensajeError429.remove();
    }
    
    // Resetear variables globales
    typingIndicatorVisible = false;
    enviandoMensaje = false;
    error429Manejado = false;
    chatFinalizado = false;
    ultimoMensajeEnviado = null;
    ultimoTimestampEnvio = 0;
    
    // Detener refresco de mensajes
    detenerRefrescoMensajes();
    
    // Detener watchdog del formulario
    detenerWatchdogFormulario();
    
    // Limpiar intervalos activos
    if (countdown429Interval) {
        clearInterval(countdown429Interval);
        countdown429Interval = null;
    }
    
    if (reintentoInterval) {
        clearInterval(reintentoInterval);
        reintentoInterval = null;
    }
}

// * AGREGAR ETIQUETAS DE REMITENTE A MENSAJES EXISTENTES
function agregarEtiquetasRemitente() {
    // Buscar todos los mensajes existentes
    const mensajesRecibidos = document.querySelectorAll('.mensaje-recibido');
    const mensajesEnviados = document.querySelectorAll('.mensaje-enviado');
    
    // Agregar etiqueta "Usuario" a mensajes recibidos
    mensajesRecibidos.forEach(mensaje => {
        // Verificar si ya tiene etiqueta
        if (!mensaje.querySelector('.remitente')) {
            const remitente = document.createElement('div');
            remitente.className = 'remitente';
            remitente.textContent = 'Usuario';
            
            // Insertar al inicio del contenido del mensaje
            const texto = mensaje.querySelector('.texto');
            if (texto) {
                texto.insertBefore(remitente, texto.firstChild);
            }
        }
    });
    
    // Agregar etiqueta "ChatBot" a mensajes enviados
    mensajesEnviados.forEach(mensaje => {
        // Verificar si ya tiene etiqueta
        if (!mensaje.querySelector('.remitente')) {
            const remitente = document.createElement('div');
            remitente.className = 'remitente';
            remitente.textContent = 'ChatBot';
            
            // Insertar al inicio del contenido del mensaje
            const texto = mensaje.querySelector('.texto');
            if (texto) {
                texto.insertBefore(remitente, texto.firstChild);
            }
        }
    });
}

// * ENVIAR MENSAJE - FUNCIÓN PRINCIPAL
async function enviarMensaje() {
    //console.log('📤 enviarMensaje() llamado');
    
    // Obtener el mensaje
    const txtMensaje = document.getElementById('txt_mensaje');
    let mensaje = txtMensaje.value.replace(/\n/g, '<br/>');

    // Eliminar el último salto de línea si existe
    mensaje = mensaje.replace(/<br\/>$/, '');
    
    // Verificar si el mensaje está vacío después del procesamiento
    if (!mensaje || mensaje.trim() === '' || mensaje === '<br/>') {
        //console.log('⚠️ Mensaje vacío detectado, no enviando');
        return { status: 400, message: 'El mensaje está vacío' };
    }
    
    //console.log('📤 Pasa por aca → Enviar mensaje antes del try ===>', mensaje);

    try {
        const response = await fetch('/widget/mensaje/crear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'origin': window.location.origin
            },
            body: JSON.stringify({ idChatWeb, mensaje }),
        });
        
        //console.log('📤 Status de la respuesta:', response.status);
        
        // Verificar si la respuesta es un error 429
        if (response.status === 429) {
            const errorData = await response.json();
            
            // OCULTAR INMEDIATAMENTE EL FORMULARIO AL DETECTAR ERROR 429
            const contentFormTexto = document.getElementById('contentFormTexto');
            contentFormTexto.classList.add('hide');
            //console.log('🚨 Formulario ocultado INMEDIATAMENTE por error 429 (vigilancia)');
            
            manejarError429HTTP(errorData);
            return { status: 429, message: 'Límite de API excedido' };
        }
        
        const result = await response.json();
        //console.log('📤 Pasa por aca → Resultado de enviarMensaje', result);
        
        return result;
    } catch (error) {
        console.log('❌ Error en v1/assets/js/widget/chat.js → enviarMensaje ', error);
        return { status: 500, message: 'Error de conexión' };
    }
}

// * LISTAR MENSAJES NO LEÍDOS
async function listarMensajeNoLeido() {
    try {
        const response = await fetch('/widget/mensaje/listarNoLeido?idChatWeb=' + idChatWeb, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'origin': window.location.origin
            },
        });
        
        // Verificar si la respuesta es un error 429
        if (response.status === 429) {
            //console.log('🚫 Error 429 detectado en listarMensajeNoLeido', response);
            const errorData = await response.json();
            
            // OCULTAR INMEDIATAMENTE EL FORMULARIO AL DETECTAR ERROR 429
            const contentFormTexto = document.getElementById('contentFormTexto');
            contentFormTexto.classList.add('hide');
            //console.log('🚨 Formulario ocultado INMEDIATAMENTE por error 429 (vigilancia)');
            
            manejarError429HTTP(errorData);
            return { mensajesNuevos: false };
        }
        
        const result = await response.json();
        
        // VERIFICAR SI HAY ERROR 429 ACTIVO - SI LO HAY, NO PROCESAR MENSAJES NUEVOS
        const hayError429Activo = document.querySelector('.mensaje-error-429');
        if (hayError429Activo) {
            //console.log('⏸️  Error 429 activo, ignorando mensajes nuevos hasta que se reactive el chat');
            return { mensajesNuevos: false };
        }
        
        // Contenedor de la conversación
        const conversacionDiv = document.getElementById('conversacion');

        // Mapeo de mensajes
        const mensajes = result.data || [];
        let mensajesNuevos = false; // Flag para detectar si hay mensajes nuevos
        
        // * SOLUCIÓN: Si no hay mensajes, esperar un poco y reintentar
        if (!mensajes || mensajes.length === 0) {
            //console.log('⚠️ No se encontraron mensajes, esperando y reintentando...');
            await new Promise(resolve => setTimeout(resolve, 200)); // Reducido a 200ms para mejor responsividad
            
            // Reintentar una vez más
            try {
                const retryResponse = await fetch('/widget/mensaje/listarNoLeido?idChatWeb=' + idChatWeb, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'origin': window.location.origin
                    },
                });
                
                if (retryResponse.ok) {
                    const retryResult = await retryResponse.json();
                    const retryMensajes = retryResult.data || [];
                    
                    if (retryMensajes.length > 0) {
                        //console.log('✅ Mensajes encontrados en el reintento:', retryMensajes.length);
                        return await procesarMensajes(retryMensajes);
                    }
                }
            } catch (retryError) {
                //console.log('❌ Error en reintento:', retryError);
            }
            
            //console.log('⚠️ No se encontraron mensajes después del reintento');
            return { mensajesNuevos: false };
        }
        
        return await procesarMensajes(mensajes);
    } catch (error) {
        console.log('❌ Error en v1/assets/js/widget/chat.js → listarMensajeNoLeido ', error);
        return { mensajesNuevos: false };
    }
}

// * FUNCIÓN AUXILIAR PARA PROCESAR MENSAJES
async function procesarMensajes(mensajes) {
    try {
        // Contenedor de la conversación
        const conversacionDiv = document.getElementById('conversacion');
        let mensajesNuevos = false; // Flag para detectar si hay mensajes nuevos
        
        // MANEJAR ERROR 429 (Límite de API excedido)
        const hayError429 = mensajes.some(mensaje => mensaje.ESTADO === 'Error API' && mensaje.CONTENIDO.includes('status":429'));
        if (hayError429) {
            manejarError429(mensajes);
            // Si hay error 429, no procesar más mensajes
            return { mensajesNuevos: false };
        }
        
        // Verificar si ya apareció "saludoChat" o "solicitarNombresApellidosArbol" ANTES del loop
        // Esto determina si podemos controlar el typing indicator
        let datosDiligenciadosPresente = verificarOpcionesServiciosMostradas();
        
        // Usar for...of en lugar de forEach para poder usar await correctamente
        for (const mensaje of mensajes) {
            const contentFormTexto = document.getElementById('contentFormTexto');
            const txtMensaje = document.getElementById('txt_mensaje');
            const conversacionDiv = document.getElementById('conversacion');
            
            // VERIFICAR NUEVAMENTE SI HAY ERROR 429 ACTIVO DENTRO DEL LOOP
            const hayError429ActivoEnLoop = document.querySelector('.mensaje-error-429');
            if (hayError429ActivoEnLoop) {
                //console.log('⏸️  Error 429 activo en loop, saltando procesamiento de mensajes');
                break;
            }

            // MENSAJES DE TIPO "INACTIVIDAD" NO DEBEN AFECTAR LA VISIBILIDAD DE LOS FORMULARIOS
            // Solo se renderizan sin modificar el estado de contentFormTexto o contentAdjuntos
            const esMensajeInactividad = mensaje.TIPO === 'Inactividad';

            // Si el mensaje es de tipo Formulario
            if (mensaje.TIPO === 'Formulario') {
                contentFormTexto.classList.add('hide');
            }
            // Si el mensaje es de tipo Adjuntos
            if (mensaje.TIPO === 'Adjuntos') {
                if (!modoAsesor) {
                    contentAdjuntos.classList.remove('hide');
                    contentFormTexto.classList.add('hide');
                    ocultarIconoAdjuntarPasoAgente();
                }
            } else if (!esMensajeInactividad) {
                contentAdjuntos.classList.add('hide');
            }

            // Si el mensaje es de tipo Paso Agente, mostrar icono de adjunto
            if (mensaje.TIPO === 'Paso Agente' && mensaje.ESTADO === 'Enviado') {
                mostrarIconoAdjuntarPasoAgente();
            }

            // Si el mensaje es de tipo Paso Agente, mostrar icono de adjunto
            if (mensaje.TIPO === 'Paso Agente' && mensaje.ESTADO === 'Enviado') {
                mostrarIconoAdjuntarPasoAgente();
            }
            // Si el mensaje es de tipo Error API
            if (mensaje.TIPO === 'Error API') {
                txtMensaje.readOnly = true;
                contentFormTexto.classList.add('hide');
                // NO permitir que se habilite el formulario después (similar a Fin Chat)
                // El formulario permanecerá oculto hasta que se resuelva el error
            }
            
            // Si el mensaje es de tipo Error API
            if (mensaje.TIPO === 'Error API') {
                txtMensaje.readOnly = true;
                contentFormTexto.classList.add('hide');
                // NO permitir que se habilite el formulario después (similar a Fin Chat)
                // El formulario permanecerá oculto hasta que se resuelva el error
            }
            // Evitar duplicados visuales: si ya está renderizado, no volver a pintarlo
            const idMensajeActual = mensaje.ID_MENSAJE;
            const yaRenderizado = renderedMessageIds.has(idMensajeActual) ||
                !!conversacionDiv.querySelector(`[data-id-mensaje="${idMensajeActual}"]`);

            // Verificar "datos-diligenciados" o "saludoUsuario" antes de procesar el mensaje
            datosDiligenciadosPresente = verificarOpcionesServiciosMostradas();
            
            // ELIMINAR TYPING INDICATOR INMEDIATAMENTE cuando se detecta un mensaje del ChatBot
            // Verificar si el mensaje contiene "saludoUsuario" en su contenido (puede estar en el HTML)
            const mensajeContieneSaludoUsuario = mensaje.CONTENIDO && mensaje.CONTENIDO.includes('saludoUsuario');
            const puedeEliminarTyping = datosDiligenciadosPresente || mensajeContieneSaludoUsuario;
            
            // ELIMINAR TYPING INDICATOR DIRECTAMENTE DEL DOM si es un mensaje del ChatBot
            // Esto es más agresivo y directo, sin depender de la variable typingIndicatorVisible
            if (mensaje.ESTADO === 'Enviado' && puedeEliminarTyping) {
                const typingIndicator = document.getElementById('typing-indicator');
                if (typingIndicator) {
                    typingIndicator.remove();
                    typingIndicatorVisible = false;
                    //console.log('🗑️ Typing indicator eliminado directamente del DOM');
                    
                    // EJECUTAR SCROLL INMEDIATAMENTE para mostrar el mensaje recién recibido
                    setTimeout(() => {
                        desplazarScrollConversacion();
                        desplazarScrollVentana();
                    }, 50);
                }
            }

            if (!yaRenderizado) {
                // Mostrar el mensaje
                const mensajeDiv = document.createElement('div');
                mensajeDiv.className = (mensaje.ESTADO === 'Enviado' ? 'mensaje-enviado' : 'mensaje-recibido') + ' mensaje-mostrado';
                mensajeDiv.setAttribute('data-id-mensaje', idMensajeActual);
                // Agregar atributo para identificar el tipo de mensaje
                if (mensaje.TIPO) {
                    mensajeDiv.setAttribute('data-tipo-mensaje', mensaje.TIPO);
                }
                
                // Crear el contenido con etiqueta de remitente
                const textoDiv = document.createElement('div');
                textoDiv.className = 'texto';
                
                // Agregar etiqueta de remitente
                const remitenteDiv = document.createElement('div');
                remitenteDiv.className = 'remitente';
                remitenteDiv.textContent = mensaje.ESTADO === 'Enviado' ? 'ChatBot' : 'Usuario';
                
                // Agregar contenido del mensaje
                textoDiv.appendChild(remitenteDiv);
                textoDiv.innerHTML += mensaje.CONTENIDO;
                normalizarLinksAdjuntos(textoDiv);

                // Detectar si el mensaje indica paso a asesor
                if (mensaje.CONTENIDO.includes('solicitarPasoAsesorArbol')) {
                    modoAsesor = true;
                    mostrarIconoAdjuntarPasoAgente(); // ← AGREGAR ESTA LÍNEA
                    mostrarIconoTextoPasoAgente();    // ← Y ESTA
                }

                if (mensaje.CONTENIDO.includes('escucharComentarioArbol')) {
                    ocultarIconoAdjuntarPasoAgente();
                    ocultarIconoTextoPasoAgente();
                }

                mensajeDiv.appendChild(textoDiv);
                conversacionDiv.appendChild(mensajeDiv);

                // Registrar el ID para futuras verificaciones
                renderedMessageIds.add(idMensajeActual);
                
                // Marcar que se agregó un mensaje nuevo
                mensajesNuevos = true;
                
                // EJECUTAR SCROLL INMEDIATAMENTE cuando se renderiza un mensaje del ChatBot
                // para asegurar que el usuario vea el mensaje recién mostrado
                if (mensaje.ESTADO === 'Enviado') {
                    setTimeout(() => {
                        desplazarScrollConversacion();
                        desplazarScrollVentana();
                    }, 50);
                }
                
                // DESPUÉS de renderizar, verificar nuevamente "saludoChat" o "solicitarNombresApellidosArbol"
                // porque puede estar en el contenido que acabamos de renderizar
                datosDiligenciadosPresente = verificarOpcionesServiciosMostradas();
                
                // ELIMINAR TYPING INDICATOR DIRECTAMENTE DEL DOM si es un mensaje del ChatBot
                // Esto es una verificación de seguridad por si no se eliminó antes
                if (mensaje.ESTADO === 'Enviado' && datosDiligenciadosPresente) {
                    const typingIndicator = document.getElementById('typing-indicator');
                    if (typingIndicator) {
                        typingIndicator.remove();
                        typingIndicatorVisible = false;
                        //console.log('🗑️ Typing indicator eliminado después de renderizar');
                        
                        // EJECUTAR SCROLL INMEDIATAMENTE para mostrar el mensaje recién renderizado
                        setTimeout(() => {
                            desplazarScrollConversacion();
                            desplazarScrollVentana();
                        }, 50);
                    }
                    
                    // Si el mensaje es de tipo Fin Chat, marcar el chat como finalizado
                    if (mensaje.TIPO === 'Fin Chat') {
                        marcarChatComoFinalizado();
                        // ¡NO ocultar ni modificar los controles del widget!
                    } else if (mensaje.TIPO === 'Error API') {
                        // Si el mensaje es de tipo Error API, NO mostrar el formulario
                        // Similar a Fin Chat, pero sin marcar el chat como finalizado
                        // (el error puede ser temporal y resolverse después)
                        contentFormTexto.classList.add('hide');
                        txtMensaje.readOnly = true;
                        // NO llamar a asegurarFormularioVisible() ni eliminarTypingIndicator()
                        // para evitar que se reactive el formulario
                    } else {
                        // NO mostrar formulario si el chat está finalizado (por mensaje "Fin Chat" anterior)
                        if (!chatFinalizado) {
                            // MOSTRAR FORMULARIO si el mensaje NO es de tipo "Formulario" o "Error API"
                            // Esto asegura que después de cualquier respuesta normal del ChatBot, el usuario pueda responder
                            if (mensaje.TIPO !== 'Formulario' && mensaje.TIPO !== 'Error API') {
                                // Usar la función centralizada para asegurar que el formulario esté visible
                                setTimeout(() => {
                                    asegurarFormularioVisible();
                                }, 100);
                            }
                            
                            // Llamar a eliminarTypingIndicator para reactivar el formulario (si aplica)
                            eliminarTypingIndicator();
                        }
                    }
                }
            }
            
            // Actualizar la lectura del mensaje segun el ID_MENSAJE
            const idMensaje = mensaje.ID_MENSAJE;
            try {
                await fetch('/widget/mensaje/leer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ idMensaje }),
                });
            } catch (error) {
                console.log('❌ Error en v1/assets/js/widget/chat.js → listarMensajeNoLeido.leerMensaje ', error);
            }
        }
        
        // Verificar si ya apareció el mensaje "datos-diligenciados" o "saludoUsuario" DESPUÉS de renderizar todos los mensajes
        // Esto es importante porque el mensaje puede estar en el contenido renderizado
        const datosDiligenciadosPresenteFinal = verificarOpcionesServiciosMostradas();
        
        // Verificar si hay mensajes del ChatBot después de renderizar
        const hayMensajeEnviado = mensajes.some(mensaje => mensaje.ESTADO === 'Enviado');
        
        // CONDICIÓN: Eliminar typing indicator cuando responda el ChatBot (si aún está visible)
        // Solo si ya apareció "datos-diligenciados" o "saludoUsuario" (después del formulario inicial)
        // También verificar si algún mensaje contiene "saludoUsuario" en su contenido
        const algunMensajeContieneSaludoUsuario = mensajes.some(mensaje =>
            mensaje.CONTENIDO && mensaje.CONTENIDO.includes('saludoUsuario')
        );
        const puedeEliminarTypingFinal = datosDiligenciadosPresenteFinal || algunMensajeContieneSaludoUsuario;
        
        // ELIMINAR TYPING INDICATOR DIRECTAMENTE DEL DOM si hay mensaje del ChatBot
        // Esto es una verificación final de seguridad
        if (hayMensajeEnviado && puedeEliminarTypingFinal) {
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
                typingIndicatorVisible = false;
                //console.log('🗑️ Typing indicator eliminado en verificación final');
                
                // EJECUTAR SCROLL INMEDIATAMENTE para mostrar el mensaje recién recibido
                setTimeout(() => {
                    desplazarScrollConversacion();
                    desplazarScrollVentana();
                }, 50);
            }
            // Llamar a eliminarTypingIndicator para reactivar el formulario
            eliminarTypingIndicator();
        }
        
        // Asegurar que el formulario esté visible si hay mensaje del ChatBot y no hay typing indicator
        if (!typingIndicatorVisible && hayMensajeEnviado && datosDiligenciadosPresenteFinal) {
            setTimeout(() => {
                asegurarFormularioVisible();
            }, 200);
        }
        
        // MOSTRAR TYPING INDICATOR DESPUÉS DE PROCESAR TODOS LOS MENSAJES
        // Solo si hay mensajes del usuario y no hay mensajes del ChatBot después Y NO hay error 429 activo
        // Y solo si ya apareció el mensaje "datos-diligenciados"
        const hayMensajeRecibido = mensajes.some(mensaje => mensaje.ESTADO === 'Recibido');
        const hayError429ActivoFinal = document.querySelector('.mensaje-error-429');
        
        // console.log('🔍 Verificando condiciones para mostrar typing:', {
        //     hayMensajeRecibido,
        //     hayMensajeEnviado,
        //     typingIndicatorVisible,
        //     hayError429ActivoFinal: !!hayError429ActivoFinal,
        //     datosDiligenciadosPresenteFinal
        // });
        
        // Control del typing indicator y formulario SOLO DESPUÉS de paso asesor
        if (datosDiligenciadosPresenteFinal) {
            // PRIMERO: SIEMPRE eliminar typing indicator si el ÚLTIMO mensaje es del ChatBot
            // Esto es CRÍTICO - debe hacerse ANTES de cualquier otra lógica
            // Verificar tanto en el array de mensajes como en el DOM (último mensaje)
            const conversacionDiv = document.getElementById('conversacion');
            let esUltimoMensajeDelChatBot = false;
            if (conversacionDiv) {
                const todosLosMensajes = conversacionDiv.querySelectorAll('.mensaje-enviado.mensaje-mostrado, .mensaje-recibido.mensaje-mostrado');
                if (todosLosMensajes.length > 0) {
                    const ultimoMensaje = todosLosMensajes[todosLosMensajes.length - 1];
                    esUltimoMensajeDelChatBot = ultimoMensaje && ultimoMensaje.classList.contains('mensaje-enviado');
                }
            }
            
            if (hayMensajeEnviado || esUltimoMensajeDelChatBot) {
                const typingIndicator = document.getElementById('typing-indicator');
                if (typingIndicator) {
                    typingIndicator.remove();
                    typingIndicatorVisible = false;
                    //console.log('🗑️ Typing indicator ELIMINADO FORZOSAMENTE - último mensaje es del ChatBot');
                    
                    // EJECUTAR SCROLL INMEDIATAMENTE para mostrar el mensaje del ChatBot
                    setTimeout(() => {
                        desplazarScrollConversacion();
                        desplazarScrollVentana();
                    }, 50);
                }
                // Reactivar el formulario inmediatamente cuando el último mensaje es del ChatBot
                setTimeout(() => {
                    asegurarFormularioVisible();
                }, 100);
            }
            
            // MANTENER TYPING INDICATOR si ya está visible y no hay respuesta del ChatBot
            if (typingIndicatorVisible && !hayMensajeEnviado && !hayError429ActivoFinal && !modoAsesor) {
                //console.log('🔄 Manteniendo typing indicator - esperando respuesta del ChatBot');
                const contentFormTexto = document.getElementById('contentFormTexto');
                contentFormTexto.classList.add('hide');
            }
            // MOSTRAR TYPING INDICATOR solo si:
            // 1. Hay mensaje del usuario sin respuesta
            // 2. No está visible
            // 3. No hay error 429 activo
            // 4. NO hay mensaje del ChatBot (IMPORTANTE - esto previene mostrar typing después de respuesta)
            // 5. NO hay mensaje del ChatBot visible en el DOM (verificación adicional)
            // 6. Ya apareció el mensaje "datos-diligenciados" o "paso asesor" 
            else if (hayMensajeRecibido && !hayMensajeEnviado && !typingIndicatorVisible && !hayError429ActivoFinal && !modoAsesor) {
                // Verificación adicional: NO mostrar typing si el ÚLTIMO mensaje es del ChatBot
                const conversacionDivCheck = document.getElementById('conversacion');
                let esUltimoMensajeDelChatBotCheck = false;
                if (conversacionDivCheck) {
                    const todosLosMensajes = conversacionDivCheck.querySelectorAll('.mensaje-enviado.mensaje-mostrado, .mensaje-recibido.mensaje-mostrado');
                    if (todosLosMensajes.length > 0) {
                        const ultimoMensaje = todosLosMensajes[todosLosMensajes.length - 1];
                        esUltimoMensajeDelChatBotCheck = ultimoMensaje && ultimoMensaje.classList.contains('mensaje-enviado');
                    }
                }
                if (!esUltimoMensajeDelChatBotCheck) {
                    // El typing solo debe aparecer cuando estamos en la sección de texto
                    const contentAdjuntos = document.getElementById('contentAdjuntos');
                    const adjuntosVisible = contentAdjuntos && !contentAdjuntos.classList.contains('hide');

                    if (!adjuntosVisible) {
                        mostrarTypingIndicator();
                        // Ocultar el formulario cuando se muestra el typing indicator
                        const contentFormTexto = document.getElementById('contentFormTexto');
                        contentFormTexto.classList.add('hide');
                    }
                } else {
                    // Si el último mensaje es del ChatBot, eliminar typing indicator
                    const typingIndicator = document.getElementById('typing-indicator');
                    if (typingIndicator) {
                        typingIndicator.remove();
                        typingIndicatorVisible = false;
                        
                        // EJECUTAR SCROLL INMEDIATAMENTE para mostrar el mensaje del ChatBot
                        setTimeout(() => {
                            desplazarScrollConversacion();
                            desplazarScrollVentana();
                        }, 50);
                    }
                }
            }
            
            // Si ya apareció "datos-diligenciados" o "paso asesor" y el último mensaje es del ChatBot, habilitar formulario
            // Esto asegura que cuando el ChatBot responde, se habilite el formulario
            if ((hayMensajeEnviado || esUltimoMensajeDelChatBot) && !typingIndicatorVisible && !hayError429ActivoFinal) {
                // Habilitar el formulario inmediatamente cuando el ChatBot responde
                setTimeout(() => {
                    asegurarFormularioVisible(true); // Force show
                }, 150);

                // Verificación adicional con el watchdog
                setTimeout(() => {
                    watchdogFormulario();
                }, 200);
            }
            // Si no hay mensajes del usuario pendientes y no hay typing, también habilitar formulario
            else if (!hayMensajeRecibido && !typingIndicatorVisible && !hayError429ActivoFinal) {
                setTimeout(() => {
                    asegurarFormularioVisible(true); // Force show
                }, 0);

                // Verificación adicional con el watchdog
                setTimeout(() => {
                    watchdogFormulario();
                }, 100);
            }
        }
        // Si aún no aparece "datos-diligenciados" o "paso asesor", no hacer nada con el typing
        // (el formulario inicial sigue activo)
        
        // VERIFICACIÓN FINAL CRÍTICA: SIEMPRE mostrar el formulario si el último mensaje es del ChatBot
        // Esto asegura que el formulario se muestre incluso después de múltiples interacciones
        // Esta verificación se ejecuta SIEMPRE, sin importar si hay mensajes nuevos o no
        const datosDiligenciadosPresenteFinalCheck = verificarOpcionesServiciosMostradas();
        if (datosDiligenciadosPresenteFinalCheck) {
            // Verificar el tipo del último mensaje del ChatBot en el array
            let ultimoMensajeChatBotEnArray = null;
            for (let i = mensajes.length - 1; i >= 0; i--) {
                if (mensajes[i].ESTADO === 'Enviado') {
                    ultimoMensajeChatBotEnArray = mensajes[i];
                    break;
                }
            }
            
            // Si hay un mensaje del ChatBot y es de tipo normal, asegurar que el formulario esté visible
            if (ultimoMensajeChatBotEnArray) {
                const esMensajeNormal = ultimoMensajeChatBotEnArray.TIPO !== 'Fin Chat' && 
                                       ultimoMensajeChatBotEnArray.TIPO !== 'Formulario' && 
                                       ultimoMensajeChatBotEnArray.TIPO !== 'Error API';
                
                if (esMensajeNormal) {
                    // Usar múltiples timeouts para asegurar que se ejecute
                    setTimeout(() => {
                        const botonesActivos = document.querySelectorAll('.btn-opcion-chat:not(:disabled)');
                        const selectsActivos = document.querySelectorAll('.select-custom-trigger:not(.deshabilitado)');
                        if (botonesActivos.length === 0 && selectsActivos.length === 0) {
                            asegurarFormularioVisible();
                        }
                    }, 200);

                    // Verificación adicional con más delay por si acaso
                    setTimeout(() => {
                        const botonesActivos = document.querySelectorAll('.btn-opcion-chat:not(:disabled)');
                        const selectsActivos = document.querySelectorAll('.select-custom-trigger:not(.deshabilitado)');
                        if (botonesActivos.length === 0 && selectsActivos.length === 0) {
                            asegurarFormularioVisible();
                        }
                    }, 500);

                    // Verificación final con aún más delay para casos extremos
                    setTimeout(() => {
                        const botonesActivos = document.querySelectorAll('.btn-opcion-chat:not(:disabled)');
                        const selectsActivos = document.querySelectorAll('.select-custom-trigger:not(.deshabilitado)');
                        if (botonesActivos.length === 0 && selectsActivos.length === 0) {
                            asegurarFormularioVisible();
                        }
                    }, 1000);
                }
            } else {
                // Si no hay mensaje del ChatBot en el array, verificar en el DOM
                setTimeout(() => {
                    asegurarFormularioVisible();
                }, 300);
            }
        }

        // LLAMADA FINAL AL WATCHDOG: Forzar verificación inmediata después de procesar mensajes
        // Esto asegura que el watchdog corrija cualquier problema de visibilidad inmediatamente
        setTimeout(() => {
            watchdogFormulario();
        }, 100);
        
        // Ocultar la capa de preload cuando se procesen mensajes
        if (mensajesNuevos) {
            ocultarCapaPreload();
        }

        // VERIFICACIÓN FINAL: Ocultar formulario si hay opciones activas
        // Esto asegura que después de renderizar mensajes con botones, el formulario permanezca oculto
        setTimeout(() => {
            ocultarFormularioSiHayOpciones();
        }, 100);
        
        // Retornar si hubo mensajes nuevos
        return { mensajesNuevos };
    } catch (error) {
        console.log('❌ Error en v1/assets/js/widget/chat.js → procesarMensajes ', error);
        return { mensajesNuevos: false };
    }
}

// * FUNCIÓN PARA DESPLAZAR EL SCROLL DE LA VENTANA
async function desplazarScrollVentana() {
    // Esperar un momento mínimo para asegurarse de que el DOM se haya actualizado
    await new Promise(resolve => setTimeout(resolve, 50)); // Reducido a 50ms
    // Desplazar el body hacia abajo
    window.scrollTo(0, document.body.scrollHeight);
}

// * FUNCIÓN PARA DESPLAZAR EL SCROLL DE LA CONVERSACIÓN
async function desplazarScrollConversacion() {
    // Esperar un momento mínimo para asegurarse de que el DOM se haya actualizado
    await new Promise(resolve => setTimeout(resolve, 50)); // Reducido a 50ms
    // Desplazar el scroll de la conversación
    const conversacionDiv = document.getElementById('conversacion');
    conversacionDiv.scrollTop = conversacionDiv.scrollHeight;
}

// * FUNCION PARA LISTAR LA CONVERSACION COMPLETA
async function listarConversacion() {
    try {
        const response = await fetch('/widget/mensaje/listarConversacion?idChatWeb=' + idChatWeb, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'origin': window.location.origin
            },
        });
        const result = await response.json();

        if (result.status === 200) {
            const mensajes = result.data;
            const conversacionDiv = document.getElementById('conversacion');
            conversacionDiv.innerHTML = ''; // Limpiar el contenedor
            // Reiniciar registro local al reconstruir la conversación completa
            renderedMessageIds.clear();

            mensajes.forEach(mensaje => {
                const mensajeDiv = document.createElement('div');
                mensajeDiv.className = (mensaje.ESTADO === 'Enviado' ? 'mensaje-enviado' : 'mensaje-recibido') + ' mensaje-mostrado';
                if (mensaje.ID_MENSAJE) {
                    mensajeDiv.setAttribute('data-id-mensaje', mensaje.ID_MENSAJE);
                    renderedMessageIds.add(mensaje.ID_MENSAJE);
                }
                // Agregar atributo para identificar el tipo de mensaje
                if (mensaje.TIPO) {
                    mensajeDiv.setAttribute('data-tipo-mensaje', mensaje.TIPO);
                }
                
                // Crear el contenido con etiqueta de remitente
                const textoDiv = document.createElement('div');
                textoDiv.className = 'texto';
                
                // Agregar etiqueta de remitente
                const remitenteDiv = document.createElement('div');
                remitenteDiv.className = 'remitente';
                remitenteDiv.textContent = mensaje.ESTADO === 'Enviado' ? 'ChatBot' : 'Usuario';
                
                // Agregar contenido del mensaje
                textoDiv.appendChild(remitenteDiv);
                textoDiv.innerHTML += mensaje.CONTENIDO;
                normalizarLinksAdjuntos(textoDiv);

                // Detectar si el mensaje indica paso a asesor
                if (mensaje.CONTENIDO.includes('solicitarPasoAsesorArbol')) {
                    modoAsesor = true;
                    mostrarIconoAdjuntarPasoAgente(); // ← AGREGAR ESTA LÍNEA
                    mostrarIconoTextoPasoAgente();    // ← Y ESTA
                }
                
                mensajeDiv.appendChild(textoDiv);
                conversacionDiv.appendChild(mensajeDiv);
            });
            
            // Ocultar la capa de preload cuando se muestre la conversación
            ocultarCapaPreload();
        }
    } catch (error) {
        console.log('❌ Error en v1/assets/js/widget/chat.js → listarConversacion ', error);
    }
}

// ! FUNCIÓN PARA VERIFICAR SI EL FORMULARIO HA SIDO DILIGENCIADO
function verificarOpcionesServiciosMostradas() {
    // Activar vigilancia solo cuando los datos diligenciados o el saludoUsuario estén presentes
    // Esto indica que el formulario fue enviado y procesado correctamente
    const datosDiligenciados = document.querySelector('.datos-diligenciados');
    const saludoUsuario = document.querySelector('.saludoUsuario');
    return !!(datosDiligenciados || saludoUsuario);
}

// ! FUNCIÓN PARA ACTUALIZAR ÚLTIMA ACTIVIDAD (SOLO ACTIVIDAD REAL DEL USUARIO)
function actualizarUltimaActividad() {
    // Reiniciar si la vigilancia está activa o si ya está el saludo mostrado (ciclo válido)
    if (vigilanciaActiva || verificarOpcionesServiciosMostradas()) {
        // Implementar debounce para evitar múltiples llamadas seguidas
        clearTimeout(debounceTimeout);
        
        debounceTimeout = setTimeout(() => {
            // SIEMPRE resetear cuando hay actividad real del usuario
            ultimaActividad = Date.now();
            tiempoInactividad = 0;
            umbralesNotificados = [];
        }, 100); // Esperar 100ms antes de procesar la actividad
    }
}

// ! AGREGAR EVENTOS DE ACTIVIDAD REAL DEL USUARIO
// Eventos frecuentes (con debounce)
eventosFrecuentes.forEach(evento => {
    document.addEventListener(evento, actualizarUltimaActividad);
});

// Eventos ocasionales (sin debounce - respuesta inmediata)
eventosOcasionales.forEach(evento => {
    document.addEventListener(evento, () => {
        if (vigilanciaActiva || verificarOpcionesServiciosMostradas()) {
            ultimaActividad = Date.now();
            tiempoInactividad = 0;
            umbralesNotificados = [];
        }
    });
});

// * FUNCION PARA VIGILAR LA INACTIVIDAD DEL CHAT
async function vigilarInactividad() {
    if (!vigilanciaActiva && !verificarOpcionesServiciosMostradas()) return;

    const tiempoActual = Date.now();
    tiempoInactividad = Math.floor((tiempoActual - ultimaActividad) / 1000);
    const tiempoInactividadMinutos = Math.floor(tiempoInactividad / 60);

    // --- Notificar solo una vez por umbral ---
    const umbrales = [21, 22, 23, 24];
    let dispararAlerta = false;
    if (umbrales.includes(tiempoInactividadMinutos) && !umbralesNotificados.includes(tiempoInactividadMinutos)) {
        umbralesNotificados.push(tiempoInactividadMinutos);
        dispararAlerta = true;
    }
    // --- FIN ---

    const response = await fetch('/widget/mensaje/vigilaInactividadChat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            idChatWeb,
            tiempoInactividad: tiempoInactividadMinutos,
            dispararAlerta,
        }),
    });
    
    // Verificar si la respuesta es un error 429
    if (response.status === 429) {
        const errorData = await response.json();
        
        // OCULTAR INMEDIATAMENTE EL FORMULARIO AL DETECTAR ERROR 429
        const contentFormTexto = document.getElementById('contentFormTexto');
            contentFormTexto.classList.add('hide');
            //console.log('🚨 Formulario ocultado INMEDIATAMENTE por error 429 (vigilancia)');
        
        manejarError429HTTP(errorData);
        return;
    }

    const result = await response.json();

    if (result.status === 200) {
        const resultListar = await listarMensajeNoLeido();
        // Solo hacer scroll si hay mensajes nuevos
        if (resultListar && resultListar.mensajesNuevos) {
            await desplazarScrollVentana();
            await desplazarScrollConversacion();
        }
    }
}

function iniciarVigilanciaInactividad() {
    if (inactividadInterval) clearInterval(inactividadInterval);
    // Solo iniciar la vigilancia si ya se mostraron las opciones del flujo
    if (verificarOpcionesServiciosMostradas()) {
        vigilanciaActiva = true;
        // Al iniciar un ciclo, reiniciar contadores y umbrales
        ultimaActividad = Date.now();
        tiempoInactividad = 0;
        umbralesNotificados = [];
        inactividadInterval = setInterval(vigilarInactividad, 10000); // Vigilar cada 10 segundos
    }
}

function detenerVigilanciaInactividad() {
    if (inactividadInterval) clearInterval(inactividadInterval);
    vigilanciaActiva = false;
}

// * FUNCIONES PARA REFRESCO AUTOMÁTICO DE MENSAJES
async function refrescarMensajes() {
    if (refrescandoMensajes) return;
    const hayError429Activo = document.querySelector('.mensaje-error-429');
    if (hayError429Activo) return;
    refrescandoMensajes = true;
    try {
        await listarMensajeNoLeido();
    } catch (error) {
        console.log('❌ Error en refrescarMensajes:', error);
    } finally {
        refrescandoMensajes = false;
    }
}

function iniciarRefrescoMensajes() {
    if (refrescoMensajesInterval) return;
    refrescarMensajes(); // Primer intento inmediato
    refrescoMensajesInterval = setInterval(refrescarMensajes, 2500); // Refrescar cada 2.5 segundos
}

function detenerRefrescoMensajes() {
    if (refrescoMensajesInterval) {
        clearInterval(refrescoMensajesInterval);
        refrescoMensajesInterval = null;
    }
    refrescandoMensajes = false;
}

// Llamar a iniciarVigilanciaInactividad cuando se inicie el chat
document.addEventListener('DOMContentLoaded', () => {
    // Verificar el estado del formulario cada 5 segundos hasta que sea enviado
    const verificarFormularioInterval = setInterval(() => {
        if (verificarOpcionesServiciosMostradas()) {
            clearInterval(verificarFormularioInterval);
            iniciarVigilanciaInactividad();
        }
    }, 5000);
});

// Detener la vigilancia cuando el cliente envíe un mensaje
document.addEventListener('DOMContentLoaded', () => {
    const txtMensaje = document.getElementById('txt_mensaje');
    
    // También reiniciar cuando el usuario escriba en el campo de mensaje
    if (txtMensaje) {
        txtMensaje.addEventListener('input', () => {
            if (vigilanciaActiva || verificarOpcionesServiciosMostradas()) {
                //console.log('🔄 Reiniciando inactividad por escritura en campo');
                ultimaActividad = Date.now();
                tiempoInactividad = 0;
                umbralesNotificados = [];
            }
        });
        
        txtMensaje.addEventListener('keydown', () => {
            if (vigilanciaActiva || verificarOpcionesServiciosMostradas()) {
                ultimaActividad = Date.now();
                tiempoInactividad = 0;
                umbralesNotificados = [];
            }
        });
    }
});

// ! VALIDACION CAMPOS Y CONTROL VISUAL FORMULARIO
// * VALIDACION CAMPOS


// todo: validacion campo Nombres y apellidos
async function valida_txt_nombresApellidos() {
    const txt_nombresApellidos = document.getElementById('txt_nombresApellidos');
    if (!txt_nombresApellidos) return false;
    let value = txt_nombresApellidos.value || '';
    
    // Permitir solo letras y espacios (caracteres especiales en español)
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]+$/;
    if (regex.test(value)) {
        value = value.toLowerCase().replace(/^(.)|\s(.)/g, function ($1) { return $1.toUpperCase(); });
        txt_nombresApellidos.value = value;
    } else {
        txt_nombresApellidos.value = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]+/g, '');
        value = txt_nombresApellidos.value;
    }
    
    // Validación
    if (!value || value.trim().length === 0) {
        campoInvalido(txt_nombresApellidos, 'Por favor complete este campo...', true);
        return false;
    }

    // Requerir al menos nombre y un apellido (mínimo 2 palabras)
    const partes = value.trim().split(/\s+/);
    if (partes.length < 2 || value.length < 3 || value.length > 88) {
        campoInvalido(txt_nombresApellidos, 'Ingrese sus nombres y apellidos correctamente...', true);
        return false;
    }

    campoValido(txt_nombresApellidos);
    return true;
}

// Validación campo Género
async function valida_txt_genero() {
    const txt_genero = document.getElementById('txt_genero');
    if (!txt_genero) return false;
    let value = txt_genero.value || '';
    const generosPermitidos = [
        'Femenino',
        'Masculino',
        'Transgénero'
    ];
    if (!value || !generosPermitidos.includes(value)) {
        campoInvalido(txt_genero, 'Debe seleccionar un género válido', true);
        return false;
    }
    campoValido(txt_genero);
    return true;
}

// Validación campo Localidad
async function valida_txt_localidad() {
    const txt_localidad = document.getElementById('txt_localidad');
    if (!txt_localidad) return false;
    let value = txt_localidad.value || '';
    // Solo letras, espacios y longitud entre 3 y 30
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]+$/;
    if (!value || value.trim().length < 3 || value.length > 30 || !regex.test(value)) {
        campoInvalido(txt_localidad, 'Debe seleccionar una localidad válida', true);
        return false;
    }
    campoValido(txt_localidad);
    return true;
}

// Validación campo Rango de Edad
async function valida_txt_rangoEdad() {
    const txt_rangoEdad = document.getElementById('txt_rangoEdad');
    if (!txt_rangoEdad) return false;
    let value = txt_rangoEdad.value || '';
    const rangosPermitidos = [
        '0 a 11 años',
        '12 a 18 años',
        '19 a 29 años',
        '30 a 50 años',
        'Más de 50 años'
    ];
    if (!value || !rangosPermitidos.includes(value)) {
        campoInvalido(txt_rangoEdad, 'Debe seleccionar un rango de edad válido', true);
        return false;
    }
    campoValido(txt_rangoEdad);
    return true;
}

// Validación campo Tema de consulta
async function valida_txt_temaConsulta() {
    const txt_temaConsulta = document.getElementById('txt_temaConsulta');
    if (!txt_temaConsulta) return false;
    let value = txt_temaConsulta.value || '';
    
    // Validar que se seleccionó algo
    if (!value || value.trim().length === 0) {
        campoInvalido(txt_temaConsulta, 'Debe seleccionar un tema de consulta', true);
        return false;
    }
    
    // Si seleccionó "Otro", validar el campo de texto
    if (value === 'Otro') {
        const txt_temaOtro = document.getElementById('txt_temaOtro');
        if (!txt_temaOtro) return false;
        
        let valorOtro = txt_temaOtro.value || '';
        
        if (!valorOtro || valorOtro.trim().length < 3) {
            campoInvalido(txt_temaOtro, 'Especifique su tema de consulta (mínimo 3 caracteres)', true);
            return false;
        }
        
        if (valorOtro.length > 200) {
            campoInvalido(txt_temaOtro, 'El texto es demasiado largo (máximo 200 caracteres)', true);
            return false;
        }
        
        campoValido(txt_temaOtro);
    }
    
    campoValido(txt_temaConsulta);
    return true;
}

function mostrarErrorSelect(selectContainer, mensaje) {
    const feedback = selectContainer.parentElement.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.textContent = mensaje;
        feedback.style.display = 'block';
    }
    selectContainer.querySelector('.select-custom-trigger').classList.add('input-error');
}

function ocultarErrorSelect(selectContainer) {
    const feedback = selectContainer.parentElement.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.style.display = 'none';
    }
    selectContainer.querySelector('.select-custom-trigger').classList.remove('input-error');
}

window.cambiarTemaConsulta = function() {
    // Resetear el select
    const selectContainer = document.getElementById('select-tema-consulta');
    const trigger = selectContainer.querySelector('.select-custom-trigger');
    const texto = selectContainer.querySelector('.select-custom-texto');
    
    // Resetear apariencia
    trigger.classList.remove('deshabilitado');
    texto.textContent = 'Seleccione el tema de consulta';
    
    // Limpiar selecciones
    selectContainer.querySelectorAll('.select-custom-option').forEach(opt => {
        opt.classList.remove('seleccionado');
    });
    
    // Ocultar campo de "Otro"
    const contenedorOtro = document.getElementById('contenedor-tema-otro');
    const inputOtro = document.getElementById('txt_temaOtro');
    contenedorOtro.style.display = 'none';
    inputOtro.value = '';
};

// todo: validacion campo Número de documento
async function valida_txt_numeroDocumento() {
    const txt_numeroDocumento = document.getElementById('txt_numeroDocumento');
    let txt_numeroDocumento_value = txt_numeroDocumento.value;

    // Solo acepta números y elimina cualquier otro carácter
    txt_numeroDocumento_value = txt_numeroDocumento_value.replace(/[^0-9]/g, '');
    txt_numeroDocumento.value = txt_numeroDocumento_value;
    // Validación si está vacío
    if (!txt_numeroDocumento_value) {
        campoInvalido(txt_numeroDocumento, 'Por favor complete este campo...', true);
        return false;
    } else if (/(\d)\1{10,}/.test(txt_numeroDocumento_value)) {
        campoInvalido(txt_numeroDocumento, 'Este valor no es valido...', true);
        return false;
    } else if (txt_numeroDocumento_value.length < 5) {
        campoInvalido(txt_numeroDocumento, 'El número de documento debe tener al menos 5 dígitos...', true);
        return false;
    } else if (txt_numeroDocumento_value.length > 12) {
        campoInvalido(txt_numeroDocumento, 'El número de documento no puede tener más de 12 dígitos...', true);
        return false;
    } else {
        campoValido(txt_numeroDocumento);
        return true;
    }
}

// todo: validacion campo Número de celular o teléfono
async function valida_txt_numeroContacto() {
    const txt_numeroContacto = document.getElementById('txt_numeroContacto');
    let txt_numeroContacto_value = txt_numeroContacto.value;

    // * Solo acepta números
    txt_numeroContacto_value = txt_numeroContacto_value.replace(/[^0-9]/g, '');
    txt_numeroContacto.value = txt_numeroContacto_value;

    // * Si está vacío, es válido (campo opcional)
    if (!txt_numeroContacto_value) {
        campoValido(txt_numeroContacto);
        return true;
    }
    
    // * Si tiene valor, validar longitud
    if (txt_numeroContacto_value.length < 10 || txt_numeroContacto_value.length > 15) {
        campoInvalido(txt_numeroContacto, 'El número de celular debe tener entre 10 y 15 dígitos...', true);
        return false;
    }
    
    campoValido(txt_numeroContacto);
    return true;
}

// todo: validacion campo Correo electrónico
async function valida_txt_correoElectronico() {
    const txt_correoElectronico = document.getElementById('txt_correoElectronico');
    let txt_correoElectronico_value = txt_correoElectronico.value;

    // * Validación si está vacío
    if (!txt_correoElectronico_value) {
        campoInvalido(txt_correoElectronico, 'Por favor complete este campo...', true);
        return false;
    } else {
        // Validar formato de correo y evitar dos puntos seguidos
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const hasConsecutiveDots = /\.{2,}/.test(txt_correoElectronico_value);
        
        if (hasConsecutiveDots) {
            campoInvalido(txt_correoElectronico, 'El correo electrónico no puede contener dos puntos seguidos...', true);
            return false;
        } else if (!emailRegex.test(txt_correoElectronico_value)) {
            campoInvalido(txt_correoElectronico, 'El correo electrónico no es válido...', true);
            return false;
        } else {
            campoValido(txt_correoElectronico);
            return true;
        }
    }
}

// todo: Agregar función de validación para el checkbox
async function valida_txt_autorizacionDatosPersonales() {
    const checkbox = document.getElementById('txt_autorizacionDatosPersonales');
    if (!checkbox.checked) {
        checkboxInvalido(checkbox, 'Debe aceptar los términos y condiciones...');
        return false;
    } else {
        checkboxValido(checkbox);
        return true;
    }
}

async function listarConversacionCompleta() {
    try {
        // 1. Mostrar toda la conversación
        const response = await fetch('/widget/mensaje/listarConversacion?idChatWeb=' + idChatWeb, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'origin': window.location.origin
            },
        });
        const result = await response.json();

        const conversacionDiv = document.getElementById('conversacion');
        conversacionDiv.innerHTML = '';
        // Reiniciar registro local al reconstruir
        renderedMessageIds.clear();

        const mensajes = result.data;
        mensajes.forEach((mensaje) => {
            const mensajeDiv = document.createElement('div');
            mensajeDiv.className = (mensaje.ESTADO === 'Enviado' ? 'mensaje-enviado' : 'mensaje-recibido') + ' mensaje-mostrado';
            if (mensaje.ID_MENSAJE) {
                mensajeDiv.setAttribute('data-id-mensaje', mensaje.ID_MENSAJE);
                renderedMessageIds.add(mensaje.ID_MENSAJE);
            }
            // Agregar atributo para identificar el tipo de mensaje
            if (mensaje.TIPO) {
                mensajeDiv.setAttribute('data-tipo-mensaje', mensaje.TIPO);
            }
            mensajeDiv.innerHTML = `<div class="texto">${mensaje.CONTENIDO}</div>`;
            normalizarLinksAdjuntos(mensajeDiv);
            conversacionDiv.appendChild(mensajeDiv);
        });

        // 2. Después de mostrar, buscar los mensajes no leídos y marcarlos como leídos
        marcarMensajesNoLeidosComoLeidos();
    } catch (error) {
        console.log('❌ Error en listarConversacionCompleta', error);
    }
}

// * NORMALIZAR LINKS DE ADJUNTOS + PREVISUALIZACIÓN
// ─────────────────────────────────────────────────
// Recorre todos los <a href> dentro del elemento dado:
// 1. Convierte URLs relativas /uploads/... → absolutas con window.location.origin
// 2. Garantiza target="_blank" y rel="noopener noreferrer"
// 3. Para links de adjuntos reemplaza el <a> por una tarjeta de preview:
//    · Imágenes (jpg/png) → miniatura + lightbox Swal2 al hacer clic
//    · PDF               → tarjeta con ícono rojo + "Abrir"
//    · Word (doc/docx)   → tarjeta con ícono azul + "Descargar"
//    · Excel (xls/xlsx)  → tarjeta con ícono verde + "Descargar"
function normalizarLinksAdjuntos(elemento) {
    const links = Array.from(elemento.querySelectorAll('a[href]'));
    links.forEach(link => {
        let href = link.getAttribute('href');

        // 1. Normalizar URL relativa → absoluta
        if (href && href.startsWith('/uploads/')) {
            href = window.location.origin + href;
            link.setAttribute('href', href);
        }

        // 2. Apertura segura en nueva pestaña (para links que no se reemplacen)
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');

        // 3. Solo procesar links que apunten a /uploads/
        if (!href || !href.includes('/uploads/')) return;

        const nombre = decodeURIComponent(href.split('/').pop().split('?')[0]);
        const ext    = nombre.split('.').pop().toLowerCase();

        // 4. Construir tarjeta según extensión
        let tarjeta;
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            tarjeta = _adjuntoTarjetaImagen(href, nombre);
        } else if (ext === 'pdf') {
            tarjeta = _adjuntoTarjetaArchivo(href, nombre, 'pdf');
        } else if (['doc', 'docx'].includes(ext)) {
            tarjeta = _adjuntoTarjetaArchivo(href, nombre, 'doc');
        } else if (['xls', 'xlsx'].includes(ext)) {
            tarjeta = _adjuntoTarjetaArchivo(href, nombre, 'excel');
        }

        if (tarjeta && link.parentNode) {
            link.parentNode.replaceChild(tarjeta, link);
        }
    });
}

// ── Tarjeta: imagen con miniatura ─────────────────────────────────────────
// La miniatura se renderiza inline; clic en ella abre el lightbox Swal2.
// El link "Abrir" dentro de la tarjeta siempre abre en nueva pestaña.
function _adjuntoTarjetaImagen(href, nombre) {
    const card = document.createElement('div');
    card.className = 'adjunto-card adjunto-card-imagen';
    card.innerHTML = `
        <img class="adjunto-thumbnail" src="${href}" alt="${nombre}" loading="lazy" title="Clic para ampliar" />
        <div class="adjunto-info">
            <a href="${href}" target="_blank" rel="noopener noreferrer"
               class="adjunto-nombre adjunto-nombre-link" title="Abrir en nueva pestaña">${nombre}</a>
        </div>
    `;
    card.querySelector('.adjunto-thumbnail').addEventListener('click', () => {
        _adjuntoLightbox(href, nombre);
    });
    return card;
}

// ── Tarjeta: PDF / Word / Excel ───────────────────────────────────────────
function _adjuntoTarjetaArchivo(href, nombre, tipo) {
    const mapa = {
        pdf:   { icono: 'fa-file-pdf',   clase: 'adjunto-card-pdf',     color: '#e74c3c', accion: 'Abrir'     },
        doc:   { icono: 'fa-file-word',  clase: 'adjunto-card-doc',     color: '#2b579a', accion: 'Descargar' },
        excel: { icono: 'fa-file-excel', clase: 'adjunto-card-excel',   color: '#217346', accion: 'Descargar' },
    };
    const cfg = mapa[tipo] || { icono: 'fa-file', clase: 'adjunto-card-generico', color: '#555', accion: 'Abrir' };

    const card = document.createElement('div');
    card.className = `adjunto-card adjunto-card-archivo ${cfg.clase}`;
    card.innerHTML = `
        <div class="adjunto-icono" style="color:${cfg.color}">
            <i class="fas ${cfg.icono}"></i>
        </div>
        <a href="${href}" target="_blank" rel="noopener noreferrer"
           class="adjunto-nombre adjunto-nombre-link" title="${cfg.accion}: ${nombre}">${nombre}</a>
    `;
    return card;
}

// ── Lightbox Swal2 para imágenes ──────────────────────────────────────────
// "Abrir en nueva pestaña" descarga/abre la imagen original.
// "Cerrar" simplemente cierra el modal sin navegar.
function _adjuntoLightbox(url, nombre) {
    Swal.fire({
        imageUrl: url,
        imageAlt: nombre,
        title: null,
        showConfirmButton: true,
        confirmButtonText: '<i class="fas fa-external-link-alt" style="margin-right:4px;"></i>Abrir en nueva pestaña',
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
        confirmButtonColor: '#372564',
        cancelButtonColor: '#555555',
        width: 'auto',
        padding: '1rem',
        customClass: {
            popup: 'swal-adjunto-imagen',
            image: 'swal-adjunto-imagen__img',
        }
    }).then(r => {
        if (r.isConfirmed) window.open(url, '_blank', 'noopener,noreferrer');
    });
}


async function marcarMensajesNoLeidosComoLeidos() {
    try {
        const response = await fetch('/widget/mensaje/listarNoLeido?idChatWeb=' + idChatWeb, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'origin': window.location.origin
            },
        });
        const result = await response.json();
        const mensajesNoLeidos = result.data;
        for (const mensaje of mensajesNoLeidos) {
            await fetch('/widget/mensaje/leer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ idMensaje: mensaje.ID_MENSAJE }),
            });
        }
    } catch (error) {
        console.log('❌ Error en marcarMensajesNoLeidosComoLeidos', error);
    }
}

function ajustarAltoChat() {
  var main = document.getElementById('main');
  if (main) {
    main.style.height = window.innerHeight + 'px';
  }
}
window.addEventListener('resize', ajustarAltoChat);
window.addEventListener('orientationchange', ajustarAltoChat);
document.addEventListener('DOMContentLoaded', ajustarAltoChat);

// Al final de la sección de eventos de actividad globales, agregar:
document.addEventListener('DOMContentLoaded', () => {
    // Agregar evento de scroll al contenedor de la conversación (para móviles y contenedores con overflow)
    const conversacionDiv = document.getElementById('conversacion');
    if (conversacionDiv) {
        conversacionDiv.addEventListener('scroll', () => {
            // No considerar scroll como actividad real del usuario para no resetear inactividad
        });
    }
    
    // Agregar observador para mensajes nuevos (no cuenta como actividad del usuario)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                const nuevoMensaje = mutation.addedNodes[0];
                if (nuevoMensaje.nodeType === Node.ELEMENT_NODE && 
                    (nuevoMensaje.classList.contains('mensaje-recibido') || 
                     nuevoMensaje.classList.contains('mensaje-enviado'))) {
                    // Si es un mensaje recibido, no modificar ultimaActividad
                }
            }
        });
    });
    
    if (conversacionDiv) {
        observer.observe(conversacionDiv, { childList: true, subtree: true });
    }
});


// * VERIFICAR SI HAY MENSAJES TIPO PASO AGENTE EN LA CONVERSACIÓN
function hayMensajePasoAgente() {
    const conversacionDiv = document.getElementById('conversacion');
    if (!conversacionDiv) return false;

    // Buscar todos los mensajes enviados (del ChatBot) con tipo "Paso Agente"
    const mensajesEnviados = conversacionDiv.querySelectorAll('.mensaje-enviado.mensaje-mostrado');
    for (const mensaje of mensajesEnviados) {
        const tipoMensaje = mensaje.getAttribute('data-tipo-mensaje');
        if (tipoMensaje === 'Paso Agente') {
            return true;
        }
    }
    return false;
}


// * MOSTRAR ICONO DE ADJUNTAR PARA PASO AGENTE
function mostrarIconoAdjuntarPasoAgente() {
    const iconoAdjuntar = document.getElementById('iconoAdjuntarPasoAgente');
    if (iconoAdjuntar) {
        iconoAdjuntar.style.setProperty('display', 'block', 'important');

        // Agregar evento click si no existe
        if (!iconoAdjuntar.hasAttribute('data-listener-agregado')) {
            iconoAdjuntar.setAttribute('data-listener-agregado', 'true');
            iconoAdjuntar.addEventListener('click', () => {
                const contentAdjuntos = document.getElementById('contentAdjuntos');
                const contentFormTexto = document.getElementById('contentFormTexto');

                if (!contentAdjuntos || !contentFormTexto) return;

                // CRÍTICO: Eliminar cualquier typing indicator visible cuando se abren los adjuntos
                const typingIndicator = document.getElementById('typing-indicator');
                if (typingIndicator) {
                    typingIndicator.remove();
                    typingIndicatorVisible = false;
                    //console.log('🗑️ Typing indicator eliminado al abrir adjuntos');
                }

                // Mostrar formulario de adjuntos y ocultar formulario de texto
                contentAdjuntos.classList.remove('hide');
                contentFormTexto.classList.add('hide');

                // Scroll suave
                setTimeout(() => {
                    contentAdjuntos.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest'
                    });
                }, 100);
            });
        }
    }
}

// * OCULTAR ICONO DE ADJUNTAR PARA PASO AGENTE
function ocultarIconoAdjuntarPasoAgente() {
    const iconoAdjuntar = document.getElementById('iconoAdjuntarPasoAgente');
    if (iconoAdjuntar) {
        iconoAdjuntar.style.setProperty('display', 'none', 'important');
    }
}

// * MOSTRAR ICONO DE TEXTO PARA PASO AGENTE (VOLVER DE ADJUNTOS A MENSAJE)
function mostrarIconoTextoPasoAgente() {
    const iconoTexto = document.getElementById('iconoTextoPasoAgente');
    if (iconoTexto) {
        iconoTexto.style.setProperty('display', 'block', 'important');

        // Agregar evento click si no existe
        if (!iconoTexto.hasAttribute('data-listener-agregado')) {
            iconoTexto.setAttribute('data-listener-agregado', 'true');
            iconoTexto.addEventListener('click', () => {
                const contentAdjuntos = document.getElementById('contentAdjuntos');
                const contentFormTexto = document.getElementById('contentFormTexto');

                if (!contentAdjuntos || !contentFormTexto) return;

                // Ocultar formulario de adjuntos y mostrar formulario de texto
                contentAdjuntos.classList.add('hide');
                contentFormTexto.classList.remove('hide');

                // RESTAURAR el icono de adjuntar cuando volvemos al texto
                const iconoAdjuntar = document.getElementById('iconoAdjuntarPasoAgente');
                if (iconoAdjuntar) {
                    iconoAdjuntar.style.setProperty('display', 'block', 'important');
                    //console.log('✅ Icono de adjuntar restaurado al volver a texto');
                }

                // Reutilizar helper existente para preparar el textarea
                limpiarYEnfocarTextarea(true);
            });
        }
    }
}

// * OCULTAR ICONO DE TEXTO PARA PASO AGENTE
function ocultarIconoTextoPasoAgente() {
    const iconoTexto = document.getElementById('iconoTextoPasoAgente');
    if (iconoTexto) {
        iconoTexto.style.setProperty('display', 'none', 'important');
    }
}

// * VERIFICAR Y ACTUALIZAR ICONO DE ADJUNTAR SEGÚN MENSAJES PASO AGENTE
function verificarYActualizarIconoPasoAgente() {
    if (hayMensajePasoAgente()) {
        mostrarIconoAdjuntarPasoAgente();
        mostrarIconoTextoPasoAgente();
    } else {
        ocultarIconoAdjuntarPasoAgente();
        ocultarIconoTextoPasoAgente();
    }
}

// ! ================================================================================================================================================
// ! SISTEMA DE OBSERVABILIDAD Y WATCHDOG PARA EL FORMULARIO
// ! ================================================================================================================================================

// * WATCHDOG: Monitorea continuamente el estado del formulario y lo corrige si es necesario
function watchdogFormulario() {
    const contentFormTexto = document.getElementById('contentFormTexto');
    if (!contentFormTexto) {
        return; // El formulario aún no existe en el DOM
    }

    const estaOculto = contentFormTexto.classList.contains('hide');
    const deberiaEstarVisible = asegurarFormularioVisible(false);

    // Detectar cambios de estado
    const estadoActual = {
        oculto: estaOculto,
        deberiaVisible: deberiaEstarVisible,
        timestamp: Date.now()
    };

    // Si el estado cambió desde la última verificación, registrar el cambio
    if (ultimoEstadoFormulario &&
        (ultimoEstadoFormulario.oculto !== estadoActual.oculto ||
            ultimoEstadoFormulario.deberiaVisible !== estadoActual.deberiaVisible)) {

        if (debugFormulario) {
            console.log('🔄 [Watchdog] Cambio de estado detectado:', {
                anterior: ultimoEstadoFormulario,
                actual: estadoActual
            });
        }
    }

    // CORRECCIÓN: Si el formulario debería estar visible pero está oculto, corregirlo
    if (deberiaEstarVisible && estaOculto) {
        contadorCorreccionesFormulario++;
        if (debugFormulario) {
            console.warn(`⚠️ [Watchdog] CORRECCIÓN #${contadorCorreccionesFormulario}: Formulario debería estar visible pero está oculto. Corrigiendo...`);
        }

        // Intentar corregir con forceShow
        asegurarFormularioVisible(true);

        // Verificar si la corrección funcionó
        setTimeout(() => {
            const sigueOculto = contentFormTexto.classList.contains('hide');
            if (sigueOculto) {
                console.error(`❌ [Watchdog] La corrección #${contadorCorreccionesFormulario} no funcionó. El formulario sigue oculto.`);
                // Intentar una corrección más agresiva
                contentFormTexto.classList.remove('hide');
                limpiarYEnfocarTextarea();
                habilitarBotonEnviar();
            } else {
                if (debugFormulario) {
                    console.log(`✅ [Watchdog] Corrección #${contadorCorreccionesFormulario} exitosa. Formulario ahora visible.`);
                }
            }
        }, 100);
    }

    // CORRECCIÓN: Si el formulario NO debería estar visible pero está visible, corregirlo
    if (!deberiaEstarVisible && !estaOculto) {
        if (debugFormulario) {
            console.log('🔍 [Watchdog] Formulario visible pero no debería estarlo. Ocultando...');
        }
        contentFormTexto.classList.add('hide');
    }

    // Guardar el estado actual para la próxima verificación
    ultimoEstadoFormulario = estadoActual;
}
// * INICIAR WATCHDOG DEL FORMULARIO
function iniciarWatchdogFormulario() {
    // Detener cualquier watchdog anterior
    if (watchdogFormularioInterval) {
        clearInterval(watchdogFormularioInterval);
    }

    // Solo iniciar si ya apareció "datos-diligenciados" o "saludoUsuario"
    if (!verificarOpcionesServiciosMostradas()) {
        // Esperar a que aparezca el formulario inicial
        const verificarFormularioInterval = setInterval(() => {
            if (verificarOpcionesServiciosMostradas()) {
                clearInterval(verificarFormularioInterval);
                // Iniciar el watchdog después de que aparezca el formulario
                watchdogFormularioInterval = setInterval(watchdogFormulario, 500); // Verificar cada 500ms
                if (debugFormulario) {
                    console.log('✅ [Watchdog] Sistema de observabilidad iniciado (verificación cada 500ms)');
                }
            }
        }, 1000);
    } else {
        // Ya está disponible, iniciar inmediatamente
        watchdogFormularioInterval = setInterval(watchdogFormulario, 500); // Verificar cada 500ms
        if (debugFormulario) {
            console.log('✅ [Watchdog] Sistema de observabilidad iniciado inmediatamente (verificación cada 500ms)');
        }
    }
}

// * DETENER WATCHDOG DEL FORMULARIO
function detenerWatchdogFormulario() {
    if (watchdogFormularioInterval) {
        clearInterval(watchdogFormularioInterval);
        watchdogFormularioInterval = null;
        if (debugFormulario) {
            console.log('🛑 [Watchdog] Sistema de observabilidad detenido');
        }
    }
}

// * FUNCIÓN PARA ACTIVAR/DESACTIVAR DEBUG DEL FORMULARIO
// Puedes llamar a esta función desde la consola del navegador para activar logs detallados
// Ejemplo: window.activarDebugFormulario(true)
window.activarDebugFormulario = function (activar) {
    debugFormulario = activar;
    console.log(activar ? '🔍 [Debug] Logs de formulario ACTIVADOS' : '🔍 [Debug] Logs de formulario DESACTIVADOS');
};

// * FUNCIÓN PARA OBTENER ESTADÍSTICAS DEL WATCHDOG
// Puedes llamar a esta función desde la consola del navegador
// Ejemplo: window.obtenerEstadisticasFormulario()
window.obtenerEstadisticasFormulario = function () {
    const contentFormTexto = document.getElementById('contentFormTexto');
    const estaOculto = contentFormTexto ? contentFormTexto.classList.contains('hide') : 'N/A';
    const deberiaVisible = asegurarFormularioVisible(false);

    return {
        correccionesRealizadas: contadorCorreccionesFormulario,
        estadoActual: {
            oculto: estaOculto,
            deberiaVisible: deberiaVisible,
            estadoCorrecto: estaOculto === !deberiaVisible
        },
        ultimoEstado: ultimoEstadoFormulario,
        watchdogActivo: watchdogFormularioInterval !== null,
        debugActivo: debugFormulario
    };
};



// ! ================================================================================================================================================
// ! SISTEMA DE DELEGACIÓN DE EVENTOS PARA OPCIONES CLICKEABLES
// ! ================================================================================================================================================

// * CONFIGURAR DELEGACIÓN DE EVENTOS PARA OPCIONES DEL CHAT
// Esta función configura un listener de delegación de eventos que captura clics
// en opciones clickeables dentro de los mensajes del chat
function configurarDelegacionEventosOpciones() {
    const conversacionDiv = document.getElementById('conversacion');
    if (!conversacionDiv) {
        // Si el contenedor aún no existe, intentar de nuevo después de un delay
        setTimeout(configurarDelegacionEventosOpciones, 500);
        return;
    }

    // Usar delegación de eventos para capturar clics en opciones
    // Esto funciona incluso si las opciones se agregan dinámicamente después
    conversacionDiv.addEventListener('click', async (event) => {
        // Buscar el elemento clickeado y sus padres para encontrar opciones
        let elementoClickeado = event.target;

        // LISTA DE BOTONES DEL SISTEMA QUE DEBEN SER EXCLUIDOS
        // Estos botones tienen sus propios handlers y NO deben ser capturados
        const botonesExcluidos = [
            'btn_Continuar',      // Botón del formulario inicial
            'btnEnviar',          // Botón de enviar mensaje
            'btnAdjuntar',        // Botón de adjuntar archivos
            'iconoAdjuntarPasoAgente' // Icono de adjuntar
        ];

        // Verificar si el elemento clickeado o alguno de sus padres es un botón excluido
        let elementoActual = elementoClickeado;
        let esBotonExcluido = false;
        while (elementoActual && elementoActual !== conversacionDiv) {
            if (elementoActual.id && botonesExcluidos.includes(elementoActual.id)) {
                esBotonExcluido = true;
                break;
            }
            elementoActual = elementoActual.parentElement;
        }

        // Si es un botón excluido, NO procesar el clic (dejar que su handler original lo maneje)
        if (esBotonExcluido) {
            if (debugFormulario) {
                console.log('[Opciones] Botón del sistema excluido:', elementoActual?.id);
            }
            return; // Salir sin procesar
        }

        // Verificar si el clic es dentro de un formulario (content_form)
        // Los botones dentro de formularios NO deben ser capturados
        const estaEnFormulario = elementoClickeado.closest('#content_form') !== null;
        if (estaEnFormulario) {
            if (debugFormulario) {
                console.log('[Opciones] Clic dentro de formulario, excluido');
            }
            return; // Salir sin procesar
        }

        // Buscar elementos que puedan ser opciones (botones, enlaces marcados explícitamente, elementos con data-opcion, etc.)
        while (elementoClickeado && elementoClickeado !== conversacionDiv) {
            // Verificar si es un elemento clickeable de opción
            // IMPORTANTE: Solo capturar opciones que estén explícitamente marcadas.
            // Enlaces generales (por ejemplo, URLs de pago) NO deben ser tratados como opciones,
            // para que se comporten como links normales (abrir en nueva pestaña).
            const esOpcion = elementoClickeado.hasAttribute('data-opcion') ||
                elementoClickeado.classList.contains('opcion-chat') ||
                elementoClickeado.classList.contains('btn-opcion') ||
                // Solo capturar elementos LI dentro de listas de opciones
                (elementoClickeado.tagName === 'LI' && elementoClickeado.closest('.mensaje-enviado') && !estaEnFormulario);

            // NO capturar botones genéricos dentro de mensajes enviados
            // Solo capturar si tienen atributos específicos que los identifiquen como opciones
            const esBotonOpcion = elementoClickeado.tagName === 'BUTTON' &&
                elementoClickeado.closest('.mensaje-enviado') &&
                !estaEnFormulario &&
                (elementoClickeado.hasAttribute('data-opcion') ||
                    elementoClickeado.classList.contains('opcion-chat') ||
                    elementoClickeado.classList.contains('btn-opcion'));

            if (esOpcion || esBotonOpcion) {
                // Prevenir el comportamiento por defecto
                event.preventDefault();
                event.stopPropagation();

                // Obtener el texto de la opción
                let textoOpcion = '';

                // Intentar obtener el texto de diferentes formas
                if (elementoClickeado.hasAttribute('data-opcion')) {
                    textoOpcion = elementoClickeado.getAttribute('data-opcion');
                } else if (elementoClickeado.textContent) {
                    // Limpiar el texto para remover iconos y caracteres especiales
                    textoOpcion = elementoClickeado.textContent.trim();
                    // Remover emojis y caracteres especiales comunes
                    textoOpcion = textoOpcion.replace(/[🔧🧾🔍🤩🧹🛠👇]/g, '').trim();
                    // Remover texto de iconos Material Icons (como "arrow_forward")
                    textoOpcion = textoOpcion.replace(/arrow_forward|arrow_back|send|attach_file/gi, '').trim();
                } else if (elementoClickeado.innerText) {
                    textoOpcion = elementoClickeado.innerText.trim();
                    // Limpiar el texto
                    textoOpcion = textoOpcion.replace(/[🔧🧾🔍🤩🧹🛠👇]/g, '').trim();
                    textoOpcion = textoOpcion.replace(/arrow_forward|arrow_back|send|attach_file/gi, '').trim();
                }

                // Validar que el texto no esté vacío y no sea solo caracteres especiales
                if (textoOpcion && textoOpcion.length > 0 && /[a-zA-Z0-9]/.test(textoOpcion)) {
                    if (debugFormulario) {
                        console.log('[Opciones] Opción clickeada:', textoOpcion);
                    }

                    // Enviar el mensaje con el elemento clickeado para deshabilitarlo
                    await manejarEnvioMensaje(textoOpcion, elementoClickeado);
                } else {
                    if (debugFormulario) {
                        console.log('⚠️ [Opciones] Texto de opción inválido o vacío, ignorando:', textoOpcion);
                    }
                }

                return; // Salir después de procesar la opción
            }

            // Continuar buscando en el elemento padre
            elementoClickeado = elementoClickeado.parentElement;
        }
    });

    if (debugFormulario) {
        console.log('[Opciones] Delegación de eventos configurada para opciones clickeables');
    }
}


