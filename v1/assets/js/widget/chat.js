// ! ================================================================================================================================================
// !                                                      CHAT WEB
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
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
            remove:  'Eliminar',
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
            const errorMessage = 'Solo se permite adjuntar un máximo de 5 archivos. ';
            const dropifyMessageElement = $('.dropify-wrapper .dropify-message p').first();
            dropifyMessageElement.text(errorMessage + 'Arrastre y suelte sus archivos y/o haz clic aquí');
            dropifyInstance.showError('fileSize');
            dropifyInstance.clearElement();
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
                    txtMensaje.value = '';
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
                body: formData,
            })
                .then(async response => {
                    // Verificar si la respuesta es un error 429
                    if (response.status === 429) {
                        const errorData = await response.json();
                        
                        // OCULTAR INMEDIATAMENTE EL FORMULARIO AL DETECTAR ERROR 429
                        const contentFormTexto = document.getElementById('contentFormTexto');
                        contentFormTexto.classList.add('hide');
                        console.log('🚨 Formulario ocultado INMEDIATAMENTE por error 429 (vigilancia)');
                        
                        manejarError429HTTP(errorData);
                        return { status: 429, message: 'Límite de API excedido' };
                    }
                    return response.json();
                })
                .then(async (data) => {
                    if (!data) return; // Si no hay data (error 429), salir
                    if (data.status === 200) {
                        $('#contentAdjuntos').addClass('hide');
                        $('#contentFormTexto').removeClass('hide');
                        txtMensaje.value = '';
                        txtMensaje.style.height = 'auto';
                        if (window.M && M.textareaAutoResize) {
                            M.textareaAutoResize(txtMensaje);
                        }
                        const resultListar = await listarMensajeNoLeido();
                        // Solo hacer scroll si hay mensajes nuevos
                        if (resultListar && resultListar.mensajesNuevos) {
                            await desplazarScrollVentana();
                            await desplazarScrollConversacion();
                        }
                        
                        // Dar focus con un pequeño delay para asegurar que el DOM se actualice
                        setTimeout(() => {
                            txtMensaje.focus();
                        }, 100);
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
        console.log('🚫 Error 429 detectado desde iframe');
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
    contentAdjuntos.classList.add('hide');;

    // * SI EL CHAT ES NUEVO
    if (chatWeb === 'Crear') {
        // todo: Listar mensajes
        const resultListar = await listarMensajeNoLeido();
        // Solo hacer scroll si hay mensajes nuevos
        if (resultListar && resultListar.mensajesNuevos) {
            await desplazarScrollVentana();
            await desplazarScrollConversacion();
        }

        // Agregar etiquetas de remitente a mensajes existentes
        agregarEtiquetasRemitente();

        // todo: Dar el foco al campo de mensaje
        setTimeout(() => {
            txtMensaje.focus();
        }, 100);

        // todo: Enviar mensajes
        btnEnviar.addEventListener('click', async () => {
            // Validar si el mensaje está vacío
            const mensaje = txtMensaje.value.trim();
            if (mensaje === '') {
                setTimeout(() => {
                    txtMensaje.focus();
                }, 100);
                return;
            }
        
            // El textarea se deshabilitará automáticamente cuando se muestre el typing indicator
            
            // Mostrar el typing indicator después de enviar el mensaje
            // (se mostrará después del mensaje del usuario)
        
            // Función para enviar el mensaje
            const enviarMensajeConReintento = async () => {
                const resultEnviarMensaje = await enviarMensaje();

                if (resultEnviarMensaje.status === 200) {
                    clearInterval(reintentoInterval); // Detener el intervalo si el envío es exitoso
                    
                    const resultListar = await listarMensajeNoLeido();
                    // Solo hacer scroll si hay mensajes nuevos
                    if (resultListar && resultListar.mensajesNuevos) {
                        await desplazarScrollVentana();
                        await desplazarScrollConversacion();
                    }
                    
                    // Limpiar el campo solo cuando el envío sea exitoso
                    txtMensaje.value = '';
                    txtMensaje.style.height = 'auto';
                    if (window.M && M.textareaAutoResize) {
                        M.textareaAutoResize(txtMensaje);
                    }
                    // El textarea se reactivará automáticamente cuando se elimine el typing indicator
                } else if (resultEnviarMensaje.status === 409) {
                    clearInterval(reintentoInterval); // Detener el intervalo si el envío es exitoso
                    const resultListar = await listarMensajeNoLeido();
                    // Solo hacer scroll si hay mensajes nuevos
                    if (resultListar && resultListar.mensajesNuevos) {
                        await desplazarScrollVentana();
                        await desplazarScrollConversacion();
                    }
                    
                    // Limpiar el campo solo cuando el envío sea exitoso (409 también es exitoso)
                    txtMensaje.value = '';
                    txtMensaje.style.height = 'auto';
                    if (window.M && M.textareaAutoResize) {
                        M.textareaAutoResize(txtMensaje);
                    }
                    // El textarea se reactivará automáticamente cuando se elimine el typing indicator
                    
                    // Hacer esto cada 3 segundos por maximo lo equivalente a 1 minutos
                    let contador = 0;
                    const maximo = 20; // 1 minuto (20 intervalos de 3 segundos)
                    const intervaloListar = setInterval(async () => {
                        contador++;
                        
                        if (contador >= maximo) {
                            clearInterval(intervaloListar);
                            return;
                        }

                        const resultListarIntervalo = await listarMensajeNoLeido();
                        // Solo hacer scroll si hay mensajes nuevos
                        if (resultListarIntervalo && resultListarIntervalo.mensajesNuevos) {
                            await desplazarScrollVentana();
                            await desplazarScrollConversacion();
                        }
                    }, 3000);
                } else if (resultEnviarMensaje.status === 429) {
                    // DETENER EL INTERVALO SI HAY ERROR 429 (Rate Limit)
                    // No reintentar porque el servidor está limitando intencionalmente
                    clearInterval(reintentoInterval);
                    console.log('🚫 Intervalo de reintento detenido por error 429 (Rate Limit)');
                } else {
                    const resultListar = await listarMensajeNoLeido();
                    // Solo hacer scroll si hay mensajes nuevos
                    if (resultListar && resultListar.mensajesNuevos) {
                        await desplazarScrollVentana();
                        await desplazarScrollConversacion();
                    }
                    console.log('❌ Error en v1/assets/js/widget/chat.js → btnEnviar.enviarMensaje ', resultEnviarMensaje);
                }
            };

            // Iniciar el envío del mensaje con reintento cada 30 segundos
            // Solo reintenta en errores técnicos (500, 502, 503, etc.), NO en 429 (Rate Limit)
            reintentoInterval = setInterval(enviarMensajeConReintento, 30000);
            enviarMensajeConReintento(); // Intentar enviar el mensaje inmediatamente
        });
        
    }

    if (chatWeb === 'Minimizar') {
        // todo: Minimizar el chat
        await listarConversacion(); // Listar la conversación completa al abrir el chat
        
        // Agregar etiquetas de remitente a mensajes existentes
        agregarEtiquetasRemitente();
    }
});

// ! ENVIAR FORMULARIO INICIAL
const observadorFormulario = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            // ! INICIALIZAR SELECT2
            $('#txt_paisResidencia').select2({
                allowClear: true,
                language: 'es',
                placeholder: 'Seleccione un país',
                width: '100%'
            }).on("select2:open", function() {
                $('#txt_paisResidencia').siblings('.select2-label').removeClass('active-ok').addClass('active');
            }).on("select2:select", function(e) {
                valida_txt_paisResidencia();
                if ($('#txt_paisResidencia').val()) {
                    $('#txt_paisResidencia').siblings('.select2-label').removeClass('active').addClass('active-ok');
                } else {
                    $('#txt_paisResidencia').siblings('.select2-label').removeClass('active');
                }

                 // Obtener el elemento seleccionado
                 const selectedOption = e.params.data.element;
                 const indicativo = selectedOption.getAttribute('data-indicativo') || '';
                 // Actualizar el campo de indicativo
                 $('#txt_indicativoPais').val(indicativo);
 
                 // Reposicionar el label si es necesario (Materialize)
                 const labelIndicativoPais = document.querySelector('label[for="txt_indicativoPais"]');
                 if (indicativo && labelIndicativoPais) {
                     labelIndicativoPais.classList.add('active');
                 }
                 // Validar el campo indicativo si tienes función
                 if (typeof valida_txt_indicativoPais === 'function') {
                     valida_txt_indicativoPais();
                 }

            }).on("select2:close", function() {
                valida_txt_paisResidencia();
                if ($('#txt_paisResidencia').val()) {
                    $('#txt_paisResidencia').siblings('.select2-label').removeClass('active').addClass('active-ok');
                } else {
                    $('#txt_paisResidencia').siblings('.select2-label').removeClass('active');
                }
            });

            const btn_Continuar = document.getElementById('btn_Continuar');
            if (btn_Continuar && !btn_Continuar.hasListener) {
                // Desconectar el observador una vez que encontramos el botón
                observadorFormulario.disconnect();
                
                // Marcar que ya tiene un listener
                btn_Continuar.hasListener = true;
                
                // Agregar el evento click al botón
                btn_Continuar.addEventListener('click', async () => {
                    try {
                        // Validar todos los campos
                        const validaciones = await Promise.all([
                            valida_txt_nombres(),
                            valida_txt_apellidos(),
                            valida_txt_numeroCedula(),
                            valida_txt_paisResidencia(),
                            valida_txt_ciudadResidencia(),
                            valida_txt_indicativoPais(),
                            valida_txt_numeroCelular(),
                            valida_txt_correoElectronico(),
                            valida_txt_autorizacionDatosPersonales()
                        ]);

                        // Si alguna validación falló, detener el envío
                        if (validaciones.includes(false)) {
                            return;
                        }

                        // Deshabilitar el botón mientras se envían los mensajes
                        btn_Continuar.disabled = true;

                        // Crear un objeto con los valores a enviar
                        const camposFormulario = {
                            nombres: document.getElementById('txt_nombres').value.trim(),
                            apellidos: document.getElementById('txt_apellidos').value.trim(),
                            numeroCedula: document.getElementById('txt_numeroCedula').value.trim(),
                            paisResidencia: document.getElementById('txt_paisResidencia').value.trim(),
                            ciudadResidencia: document.getElementById('txt_ciudadResidencia').value.trim(),
                            indicativoPais: document.getElementById('txt_indicativoPais').value.trim(),
                            numeroCelular: document.getElementById('txt_numeroCelular').value.trim(),
                            correoElectronico: document.getElementById('txt_correoElectronico').value.trim(),
                            autorizacionDatosPersonales: document.getElementById('autorizacionDatosPersonales').checked ? 'Si' : 'No'
                        };

                        let enviado = false; // Bandera para saber si ya se envió correctamente

                        // Función para intentar enviar el formulario
                        const enviarFormulario = async () => {
                            if (enviado) return; // Si ya se envió, no hacer nada

                            try {
                                const response = await fetch("/widget/chat/formularioInicial", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({ idChatWeb, camposFormulario })
                                });

                                // Verificar si la respuesta es un error 429
                                if (response.status === 429) {
                                    const errorData = await response.json();
                                    
                                    // OCULTAR INMEDIATAMENTE EL FORMULARIO AL DETECTAR ERROR 429
                                    const contentFormTexto = document.getElementById('contentFormTexto');
                                    contentFormTexto.classList.add('hide');
                                    console.log('🚨 Formulario ocultado INMEDIATAMENTE por error 429 (vigilancia)');
                                    
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

                                    // Habilitar el formulario de texto
                                    const contentFormTexto = document.getElementById('contentFormTexto');
                                    contentFormTexto.classList.remove('hide');

                                    // Habilitar el campo de mensaje
                                    const txtMensaje = document.getElementById('txt_mensaje');
                                    txtMensaje.value = '';
                                    txtMensaje.style.height = 'auto';
                                    if (window.M && M.textareaAutoResize) {
                                        M.textareaAutoResize(txtMensaje);
                                    }
                                    txtMensaje.readOnly = false;
                                    
                                    // Dar focus con un pequeño delay para asegurar que el DOM se actualice
                                    setTimeout(() => {
                                        txtMensaje.focus();
                                    }, 100);
                                } else if (resultFormulario.status === 429) {
                                    // DETENER EL INTERVALO SI HAY ERROR 429 (Rate Limit)
                                    // No reintentar porque el servidor está limitando intencionalmente
                                    clearInterval(reintentoInterval);
                                    console.log('🚫 Intervalo de reintento detenido por error 429 (Rate Limit - formulario)');
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
                                console.warn('❌ Error al enviar el formulario, reintentando en 30 segundos...');
                            }
                        };

                        // Enviar el formulario la primera vez inmediatamente
                        await enviarFormulario();

                        // Iniciar el reintento cada 30 segundos si no se ha enviado con éxito
                        // Solo reintenta en errores técnicos (500, 502, 503, etc.), NO en 429 (Rate Limit)
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
            chatWeb = event.data.chatWeb; // Asegúrate de que chatWeb esté definido
            idChatWeb = event.data.idWidgetChatWeb; // Asegúrate de que idWidgetChatWeb esté definido
            resolve(); // Resuelve la promesa cuando se recibe el mensaje
        });
    });
}

// * MOSTRAR INDICADOR DE ESCRIBIENDO
function mostrarTypingIndicator() {
    // Verificar si ya existe un typing indicator
    const existingIndicator = document.getElementById('typing-indicator');
    if (existingIndicator) {
        return; // Ya existe, no crear otro
    }

    // CONDICIÓN 1: Verificar que exista el saludo de usuario
    const saludoUsuario = document.querySelector('.saludoUsuario');
    if (!saludoUsuario) {
        return; // No mostrar typing si no existe el saludo
    }

    // CONDICIÓN 2: Verificar que haya al menos un mensaje del usuario (mensaje-recibido)
    const mensajesUsuario = document.querySelectorAll('.mensaje-recibido');
    if (mensajesUsuario.length === 0) {
        return; // No mostrar typing si no hay mensajes del usuario
    }

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
    
    // Deshabilitar el textarea mientras está el typing indicator
    const contentFormTexto = document.getElementById('contentFormTexto');
    contentFormTexto.classList.add('hide');
    console.log('🚨 Formulario ocultado INMEDIATAMENTE por mostrarTypingIndicator');
    
    // Hacer scroll al final para mostrar el indicador
    desplazarScrollConversacion();
}

// * ELIMINAR INDICADOR DE ESCRIBIENDO
function eliminarTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
        typingIndicatorVisible = false;
        
        // Reactivar el textarea cuando se elimine el typing indicator
        const txtMensaje = document.getElementById('txt_mensaje');
        const contentFormTexto = document.getElementById('contentFormTexto');
        if (txtMensaje && contentFormTexto) {
            // Limpiar saltos de línea del textarea cuando llegue respuesta del ChatBot
            txtMensaje.value = '';
            txtMensaje.style.height = 'auto';
            if (window.M && M.textareaAutoResize) {
                M.textareaAutoResize(txtMensaje);
            }
            
            txtMensaje.readOnly = false;
            contentFormTexto.classList.remove('hide');
            
            // Dar focus con un pequeño delay para asegurar que el DOM se actualice
            setTimeout(() => {
                txtMensaje.focus();
            }, 100);
        }
    }
}

// * MANEJAR ERROR 429 (Límite de API excedido)
function manejarError429(mensajes) {
    // Buscar el mensaje de error 429
    const mensajeError = mensajes.find(mensaje => mensaje.ESTADO === 'Error API' && mensaje.CONTENIDO.includes('status":429'));
    
    if (mensajeError) {
        try {
            // Parsear el JSON del error
            const errorData = JSON.parse(mensajeError.CONTENIDO);
            const retryAfter = errorData.retryAfter || 900; // 15 minutos por defecto
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
            
            console.log(`🚫 Error 429 detectado. Chat se reactivará en ${retryAfter} segundos (${minutos} minutos)`);
            
        } catch (error) {
            console.error('Error al parsear el mensaje de error 429:', error);
        }
    }
}

// * MOSTRAR MENSAJE AMIGABLE DE ERROR 429
function mostrarMensajeError429(retryAfter, minutos, errorData) {
    console.log('📝 Creando mensaje de error 429 con retryAfter:', retryAfter);
    
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
    
    console.log('✅ Mensaje de error 429 agregado al DOM');
    
    // Hacer scroll para mostrar el mensaje
    desplazarScrollConversacion();
    
    // Iniciar countdown después de un pequeño delay para asegurar que el DOM se actualice
    setTimeout(() => {
        console.log('🚀 Iniciando countdown después del delay');
        iniciarCountdown429(retryAfter);
    }, 100);
}

// * INICIAR COUNTDOWN PARA ERROR 429
function iniciarCountdown429(segundos) {
    console.log('⏱️ Iniciando countdown con:', segundos, 'segundos');
    
    // LIMPIAR CUALQUIER COUNTDOWN ANTERIOR
    if (countdown429Interval) {
        console.log('🗑️ Limpiando countdown anterior');
        clearInterval(countdown429Interval);
        countdown429Interval = null;
    }
    
    const countdownElement = document.getElementById('countdown-429');
    console.log('🔍 Elemento countdown encontrado:', countdownElement);
    
    if (!countdownElement) {
        console.log('❌ No se encontró el elemento countdown-429');
        return;
    }
    
    let tiempoRestante = segundos;
    console.log('🎯 Countdown iniciado con', tiempoRestante, 'segundos');
    
    countdown429Interval = setInterval(() => {
        tiempoRestante--;
        console.log('⏰ Tiempo restante:', tiempoRestante);
        
        if (countdownElement) {
            countdownElement.textContent = tiempoRestante;
        }
        
        if (tiempoRestante <= 0) {
            console.log('⏰ Countdown terminado');
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
        console.log('🗑️ Limpiando countdown al reactivar chat');
        clearInterval(countdown429Interval);
        countdown429Interval = null;
    }
    
    // ELIMINAR EL MENSAJE DE ERROR CUANDO SE REACTIVE EL CHAT
    const mensajeErrorAnterior = document.querySelector('.mensaje-error-429');
    if (mensajeErrorAnterior) {
        mensajeErrorAnterior.remove();
        console.log('🗑️ Mensaje de error 429 eliminado al reactivar chat');
    }
    
    // REACTIVAR EL FORMULARIO DESPUÉS DEL ERROR 429
    const txtMensaje = document.getElementById('txt_mensaje');
    const contentFormTexto = document.getElementById('contentFormTexto');
    if (txtMensaje && contentFormTexto) {
        txtMensaje.readOnly = false;
        contentFormTexto.classList.remove('hide');
        
        // Dar focus con un pequeño delay para asegurar que el DOM se actualice
        setTimeout(() => {
            txtMensaje.focus();
        }, 100);
        console.log('👁️ Formulario reactivado después del error 429');
    }
    
    // Limpiar cualquier typing indicator que pueda estar activo
    eliminarTypingIndicator();
    
    console.log('✅ Chat reactivado completamente después del error 429');
}

// * FUNCIÓN ELIMINADA - YA NO SE NECESITA MOSTRAR MENSAJE DE REACTIVACIÓN
// Solo se reactiva el formulario mostrando contentFormTexto

// * MANEJAR ERROR 429 DESDE PETICIONES HTTP
function manejarError429HTTP(errorData) {
    console.log('🚫 manejarError429HTTP llamado con:', errorData);
    
    const retryAfter = errorData.retryAfter || 900; // 15 minutos por defecto
    const minutos = Math.round(retryAfter / 60);
    
    // LIMPIAR COUNTDOWN ANTERIOR SI EXISTE
    if (countdown429Interval) {
        console.log('🗑️ Limpiando countdown anterior');
        clearInterval(countdown429Interval);
        countdown429Interval = null;
    }
    
    // ELIMINAR MENSAJE DE ERROR 429 ANTERIOR SI EXISTE
    const mensajeErrorAnterior = document.querySelector('.mensaje-error-429');
    if (mensajeErrorAnterior) {
        mensajeErrorAnterior.remove();
        console.log('🗑️ Mensaje de error 429 anterior eliminado');
    }
    
    // OCULTAR FORMULARIO VISUALMENTE CUANDO HAY ERROR 429
    const contentFormTexto = document.getElementById('contentFormTexto');
    contentFormTexto.classList.add('hide');
    console.log('🚨 Formulario ocultado INMEDIATAMENTE por error 429 (vigilancia)');
    
    // Limpiar cualquier typing indicator activo
    eliminarTypingIndicator();
    
    // Mostrar mensaje amigable en la conversación
    mostrarMensajeError429(retryAfter, minutos, errorData);
    
    // Configurar temporizador para reactivar el chat
    setTimeout(() => {
        reactivarChatDespuesDeError429();
    }, retryAfter * 1000); // Convertir segundos a milisegundos
    
    console.log(`🚫 Error 429 HTTP detectado. Chat se reactivará en ${retryAfter} segundos (${minutos} minutos)`);
}

// * MANEJAR ERROR 429 GLOBAL (SOLO VISUAL)
function manejarError429Global(retryAfter = 900) {
    const minutos = Math.round(retryAfter / 60);
    
    // LIMPIAR COUNTDOWN ANTERIOR SI EXISTE
    if (countdown429Interval) {
        console.log('🗑️ Limpiando countdown anterior (global)');
        clearInterval(countdown429Interval);
        countdown429Interval = null;
    }
    
    // ELIMINAR MENSAJE DE ERROR 429 ANTERIOR SI EXISTE
    const mensajeErrorAnterior = document.querySelector('.mensaje-error-429');
    if (mensajeErrorAnterior) {
        mensajeErrorAnterior.remove();
        console.log('🗑️ Mensaje de error 429 anterior eliminado (global)');
    }
    
    // OCULTAR FORMULARIO VISUALMENTE CUANDO HAY ERROR 429
    const contentFormTexto = document.getElementById('contentFormTexto');
    contentFormTexto.classList.add('hide');
    console.log('� Formulario ocultado INMEDIATAMENTE por error 429 (global)');
    
    // Limpiar cualquier typing indicator activo
    eliminarTypingIndicator();
    
    // Mostrar mensaje amigable en la conversación
    mostrarMensajeError429(retryAfter, minutos, { message: 'Límite de consultas excedido' });
    
    // Configurar temporizador para reactivar el chat
    setTimeout(() => {
        reactivarChatDespuesDeError429();
    }, retryAfter * 1000); // Convertir segundos a milisegundos
    
    console.log(`🚫 Error 429 Global detectado. Chat se reactivará en ${retryAfter} segundos (${minutos} minutos)`);
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

// * ENVIAR MENSAJE
async function enviarMensaje() {
    console.log('📤 enviarMensaje() llamado - mensaje:', document.getElementById('txt_mensaje').value);
    
    // todo: Obtener el mensaje
    // Obtener el mensaje
    let mensaje = document.getElementById('txt_mensaje').value.replace(/\n/g, '<br/>');

    // Eliminar el último salto de línea si existe
    mensaje = mensaje.replace(/<br\/>$/, '');
    
    // NO limpiar el campo de mensaje aquí - se limpiará solo si el envío es exitoso
    // document.getElementById('txt_mensaje').value = '';
    
    // NO mostrar el typing indicator aquí - se mostrará cuando llegue el mensaje del usuario desde el servidor
    
    // todo: Enviar el mensaje
    try {
        const response = await fetch('/widget/mensaje/crear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ idChatWeb, mensaje }),
        });
        
        // Verificar si la respuesta es un error 429
        if (response.status === 429) {
            console.log('🚫 Error 429 detectado en enviarMensaje', response);
            const errorData = await response.json();
            
            // OCULTAR INMEDIATAMENTE EL FORMULARIO AL DETECTAR ERROR 429
            const contentFormTexto = document.getElementById('contentFormTexto');
            contentFormTexto.classList.add('hide');
            console.log('🚨 Formulario ocultado INMEDIATAMENTE por error 429 (vigilancia)');
            
            manejarError429HTTP(errorData);
            return { status: 429, message: 'Límite de API excedido' };
        }
        
        const result = await response.json();
        
        // Solo limpiar el campo si el envío fue exitoso
        if (result.status === 200) {
            document.getElementById('txt_mensaje').value = '';
        }
        
        return result;
    } catch (error) {
        console.log('❌ Error en v1/assets/js/widget/chat.js → enviarMensaje ', error);
    }
}

// * LISTAR MENSAJES NO LEÍDOS
async function listarMensajeNoLeido() {
    try {
        const response = await fetch('/widget/mensaje/listarNoLeido?idChatWeb=' + idChatWeb, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        
        // Verificar si la respuesta es un error 429
        if (response.status === 429) {
            console.log('🚫 Error 429 detectado en listarMensajeNoLeido', response);
            const errorData = await response.json();
            
            // OCULTAR INMEDIATAMENTE EL FORMULARIO AL DETECTAR ERROR 429
            const contentFormTexto = document.getElementById('contentFormTexto');
            contentFormTexto.classList.add('hide');
            console.log('🚨 Formulario ocultado INMEDIATAMENTE por error 429 (vigilancia)');
            
            manejarError429HTTP(errorData);
            return { mensajesNuevos: false };
        }
        
        const result = await response.json();
        // Contenedor de la conversación
        const conversacionDiv = document.getElementById('conversacion');

        // Mapeo de mensajes
        const mensajes = result.data;
        let mensajesNuevos = false; // Flag para detectar si hay mensajes nuevos
        
        // CONDICIÓN: Eliminar typing indicator cuando responda el ChatBot
        const hayMensajeEnviado = mensajes.some(mensaje => mensaje.ESTADO === 'Enviado');
        if (typingIndicatorVisible && hayMensajeEnviado) {
            eliminarTypingIndicator();
        }

        // MANEJAR ERROR 429 (Límite de API excedido)
        const hayError429 = mensajes.some(mensaje => mensaje.ESTADO === 'Error API' && mensaje.CONTENIDO.includes('status":429'));
        if (hayError429) {
            manejarError429(mensajes);
        }
        
        // Usar for...of en lugar de forEach para poder usar await correctamente
        for (const mensaje of mensajes) {
            const contentFormTexto = document.getElementById('contentFormTexto');
            const txtMensaje = document.getElementById('txt_mensaje');
            const conversacionDiv = document.getElementById('conversacion');
            
            // Mostrar el formulario de texto por defecto
            contentFormTexto.classList.remove('hide');
            
            // Dar focus al textarea cuando se muestre el formulario
            setTimeout(() => {
                txtMensaje.focus();
            }, 100);

            // Si el mensaje es de tipo Formulario
            if (mensaje.TIPO === 'Formulario') {
                contentFormTexto.classList.add('hide');
            }
            // Si el mensaje es de tipo Multimedia
            if (mensaje.TIPO === 'Adjuntos') {
                contentAdjuntos.classList.remove('hide');
            } else {
                contentAdjuntos.classList.add('hide');
            }
            // Si el mensaje es de tipo Error API
            if (mensaje.TIPO === 'Error API') {
                txtMensaje.readOnly = true;
                contentFormTexto.classList.add('hide');
            }
            // Si el mensaje es de tipo Fin Chat
            if (mensaje.TIPO === 'Fin Chat') {
                txtMensaje.readOnly = true;
                contentFormTexto.classList.add('hide');
                // ¡NO ocultar ni modificar los controles del widget!
            }
            // Evitar duplicados visuales: si ya está renderizado, no volver a pintarlo
            const idMensajeActual = mensaje.ID_MENSAJE;
            const yaRenderizado = renderedMessageIds.has(idMensajeActual) ||
                !!conversacionDiv.querySelector(`[data-id-mensaje="${idMensajeActual}"]`);

            if (!yaRenderizado) {
                // Mostrar el mensaje
                const mensajeDiv = document.createElement('div');
                mensajeDiv.className = (mensaje.ESTADO === 'Enviado' ? 'mensaje-enviado' : 'mensaje-recibido') + ' mensaje-mostrado';
                mensajeDiv.setAttribute('data-id-mensaje', idMensajeActual);
                
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
                
                mensajeDiv.appendChild(textoDiv);
                conversacionDiv.appendChild(mensajeDiv);

                // Registrar el ID para futuras verificaciones
                renderedMessageIds.add(idMensajeActual);
                
                // Marcar que se agregó un mensaje nuevo
                mensajesNuevos = true;
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
        
        // MOSTRAR TYPING INDICATOR DESPUÉS DE PROCESAR TODOS LOS MENSAJES
        // Solo si hay mensajes del usuario y no hay mensajes del ChatBot después
        const hayMensajeRecibido = mensajes.some(mensaje => mensaje.ESTADO === 'Recibido');
        if (hayMensajeRecibido && !hayMensajeEnviado && !typingIndicatorVisible) {
            mostrarTypingIndicator();
        }
        
        // Retornar si hubo mensajes nuevos
        return { mensajesNuevos };
    } catch (error) {
        console.log('❌ Error en v1/assets/js/widget/chat.js → listarMensajeNoLeido ', error);
        return { mensajesNuevos: false };
    }
}

// * FUNCIÓN PARA DESPLAZAR EL SCROLL DE LA VENTANA
async function desplazarScrollVentana() {
    // Esperar un breve momento para asegurarse de que el DOM se haya actualizado
    await new Promise(resolve => setTimeout(resolve, 100)); // Espera 100 ms
    // Desplazar el body hacia abajo
    window.scrollTo(0, document.body.scrollHeight);
}

// * FUNCIÓN PARA DESPLAZAR EL SCROLL DE LA CONVERSACIÓN
async function desplazarScrollConversacion() {
    // Esperar un breve momento para asegurarse de que el DOM se haya actualizado
    await new Promise(resolve => setTimeout(resolve, 100)); // Espera 100 ms
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
                'Content-Type': 'application/json'
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
                
                mensajeDiv.appendChild(textoDiv);
                conversacionDiv.appendChild(mensajeDiv);
            });
        }
    } catch (error) {
        console.log('❌ Error en v1/assets/js/widget/chat.js → listarConversacion ', error);
    }
}

// ! FUNCIÓN PARA VERIFICAR SI EL FORMULARIO HA SIDO DILIGENCIADO
function verificarOpcionesServiciosMostradas() {
    // Activar vigilancia solo cuando los datos diligenciados estén presentes
    // Esto indica que el formulario fue enviado y procesado correctamente
    const datosDiligenciados = document.querySelector('.datos-diligenciados');
    return !!datosDiligenciados;
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
    const umbrales = [2, 3, 4, 5];
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
            console.log('🚨 Formulario ocultado INMEDIATAMENTE por error 429 (vigilancia)');
        
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
    const btnEnviar = document.getElementById('btnEnviar');
    const txtMensaje = document.getElementById('txt_mensaje');
    
    if (btnEnviar) {
        btnEnviar.addEventListener('click', async () => {
            // Reiniciar inmediatamente sin detener la vigilancia
            console.log('🔄 Reiniciando inactividad por envío de mensaje');
            ultimaActividad = Date.now();
            tiempoInactividad = 0;
            umbralesNotificados = [];
        });
    }
    
    // También reiniciar cuando el usuario escriba en el campo de mensaje
    if (txtMensaje) {
        txtMensaje.addEventListener('input', () => {
            if (vigilanciaActiva || verificarOpcionesServiciosMostradas()) {
                console.log('🔄 Reiniciando inactividad por escritura en campo');
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
// todo: validacion campo tipo grupo
async function valida_txt_tipoGrupo() {
    const txt_tipoGrupo = document.getElementById('txt_tipoGrupo');
    const txt_tipoGrupo_value = txt_tipoGrupo.value.trim();

    if (!txt_tipoGrupo_value) {
        campoInvalido(txt_tipoGrupo, 'Por favor complete este campo...', true);
    } else if (txt_tipoGrupo_value.length < 1 || txt_tipoGrupo_value.length > 44) {
        campoInvalido(txt_tipoGrupo, 'Este valor no es valido...', true);
    } else {
        campoValido(txt_tipoGrupo);
    }
}

// todo: validacion campo Nombres
async function valida_txt_nombres() {
    const txt_nombres = document.getElementById('txt_nombres');
    let txt_nombres_value = txt_nombres.value;

    // * Letra capital intercalada (solo letras y caracteres especiales del español)
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]+$/;
    if (regex.test(txt_nombres_value)) {
        txt_nombres_value = txt_nombres_value.toLowerCase().replace(/^(.)|\s(.)/g, function ($1) {
            return $1.toUpperCase();
        });
        txt_nombres.value = txt_nombres_value;
    } else {
        txt_nombres.value = txt_nombres_value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]+/g, "")
    }

    // * Validación si está vacío
    if (!txt_nombres_value) {
        campoInvalido(txt_nombres, 'Por favor complete este campo...', true);
    } else if (txt_nombres_value.length < 3 || txt_nombres_value.length > 44) {
        campoInvalido(txt_nombres, 'Este valor no es valido...', true);
    } else {
        campoValido(txt_nombres);
    }
}

// todo: validacion campo Apellidos
async function valida_txt_apellidos() {
    const txt_apellidos = document.getElementById('txt_apellidos');
    let txt_apellidos_value = txt_apellidos.value;

    // * Letra capital intercalada (solo letras y caracteres especiales del español)
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]+$/;
    if (regex.test(txt_apellidos_value)) {
        txt_apellidos_value = txt_apellidos_value.toLowerCase().replace(/^(.)|\s(.)/g, function ($1) {
            return $1.toUpperCase();
        });
        txt_apellidos.value = txt_apellidos_value;
    } else {
        txt_apellidos.value = txt_apellidos_value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]+/g, "")
    }

    // * Validación si está vacío
    if (!txt_apellidos_value) {
        campoInvalido(txt_apellidos, 'Por favor complete este campo...', true);
    } else if (txt_apellidos_value.length < 3 || txt_apellidos_value.length > 44) {
        campoInvalido(txt_apellidos, 'Este valor no es valido...', true);
    } else {
        campoValido(txt_apellidos);
    }
}

// todo: validacion campo Número de cédula
async function valida_txt_numeroCedula() {
    const txt_numeroCedula = document.getElementById('txt_numeroCedula');
    let txt_numeroCedula_value = txt_numeroCedula.value;

    // Solo acepta números y elimina cualquier otro carácter
    txt_numeroCedula_value = txt_numeroCedula_value.replace(/[^0-9]/g, '');
    txt_numeroCedula.value = txt_numeroCedula_value;

    // Validación si está vacío
    if (!txt_numeroCedula_value) {
        campoInvalido(txt_numeroCedula, 'Por favor complete este campo...', true);
    } else if (/(\d)\1{10,}/.test(txt_numeroCedula_value)) {
        campoInvalido(txt_numeroCedula, 'Este valor no es valido...', true);
    } else if (txt_numeroCedula_value.length < 5) {
        campoInvalido(txt_numeroCedula, 'El número de cédula debe tener al menos 5 dígitos...', true);
    } else if (txt_numeroCedula_value.length > 12) {
        campoInvalido(txt_numeroCedula, 'El número de cédula no puede tener más de 12 dígitos...', true);
    } else {
        campoValido(txt_numeroCedula);
    }
}

// todo: validacion campo País Residencia
async function valida_txt_paisResidencia() {
    const txt_paisResidencia = document.getElementById('txt_paisResidencia');
    const txt_paisResidencia_value = txt_paisResidencia.value.trim();

    if (!txt_paisResidencia_value) {
        campoInvalido(txt_paisResidencia, 'Por favor complete este campo...', true);
    } else if (txt_paisResidencia_value.length < 1 || txt_paisResidencia_value.length > 44) {
        campoInvalido(txt_paisResidencia, 'Este valor no es valido...', true);
    } else {
        campoValido(txt_paisResidencia);
    }
}

// todo: validacion campo Ciudad Residencia
async function valida_txt_ciudadResidencia() {
    const txt_ciudadResidencia = document.getElementById('txt_ciudadResidencia');
    let txt_ciudadResidencia_value = txt_ciudadResidencia.value;

    // * Letra capital intercalada (solo letras y caracteres especiales del español)
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]+$/;
    if (regex.test(txt_ciudadResidencia_value)) {
        txt_ciudadResidencia_value = txt_ciudadResidencia_value.toLowerCase().replace(/^(.)|\s(.)/g, function ($1) {
            return $1.toUpperCase();
        });
        txt_ciudadResidencia.value = txt_ciudadResidencia_value;
    } else {
        txt_ciudadResidencia.value = txt_ciudadResidencia_value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]+/g, "")
    }

    // * Validación si está vacío
    if (!txt_ciudadResidencia_value) {
        campoInvalido(txt_ciudadResidencia, 'Por favor complete este campo...', true);
    } else if (txt_ciudadResidencia_value.length < 3 || txt_ciudadResidencia_value.length > 44) {
        campoInvalido(txt_ciudadResidencia, 'Este valor no es valido...', true);
    } else {
        campoValido(txt_ciudadResidencia);
    }
}

// todo: validacion campo Indicativo país
async function valida_txt_indicativoPais() {
    const txt_indicativoPais = document.getElementById('txt_indicativoPais');
    let txt_indicativoPais_value = txt_indicativoPais.value;

    // * Solo acepta números y el símbolo +
    txt_indicativoPais_value = txt_indicativoPais_value.replace(/[^0-9+]/g, '');
    
    // * Asegurar que comience con +
    if (!txt_indicativoPais_value.startsWith('+')) {
        txt_indicativoPais_value = '+' + txt_indicativoPais_value.replace(/\+/g, '');
    }
    
    // * Actualizar el valor en el campo
    txt_indicativoPais.value = txt_indicativoPais_value;

    // * Validación si está vacío o solo tiene el +
    if (!txt_indicativoPais_value || txt_indicativoPais_value === '+') {
        campoInvalido(txt_indicativoPais, 'Por favor complete este campo...', true);
    } else if (txt_indicativoPais_value.length < 2 || txt_indicativoPais_value.length > 10) {
        campoInvalido(txt_indicativoPais, 'El indicativo debe tener entre 2 y 10 dígitos después del +...', true);
    } else {
        campoValido(txt_indicativoPais);
    }
}

// todo: validacion campo Número de celular
async function valida_txt_numeroCelular() {
    const txt_numeroCelular = document.getElementById('txt_numeroCelular');
    let txt_numeroCelular_value = txt_numeroCelular.value;

    // * Solo acepta números
    txt_numeroCelular_value = txt_numeroCelular_value.replace(/[^0-9]/g, '');
    txt_numeroCelular.value = txt_numeroCelular_value;

    // * Validación si está vacío
    if (!txt_numeroCelular_value) {
        campoInvalido(txt_numeroCelular, 'Por favor complete este campo...', true);
    } else if (txt_numeroCelular_value.length < 10 || txt_numeroCelular_value.length > 15) {
        campoInvalido(txt_numeroCelular, 'El número de celular debe tener entre 10 y 15 dígitos...', true);
    } else {
        campoValido(txt_numeroCelular);
    }
}

// todo: validacion campo Correo electrónico
async function valida_txt_correoElectronico() {
    const txt_correoElectronico = document.getElementById('txt_correoElectronico');
    let txt_correoElectronico_value = txt_correoElectronico.value;

    // * Validación si está vacío
    if (!txt_correoElectronico_value) {
        campoInvalido(txt_correoElectronico, 'Por favor complete este campo...', true);
    } else {
        // Validar formato de correo y evitar dos puntos seguidos
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const hasConsecutiveDots = /\.{2,}/.test(txt_correoElectronico_value);
        
        if (hasConsecutiveDots) {
            campoInvalido(txt_correoElectronico, 'El correo electrónico no puede contener dos puntos seguidos...', true);
        } else if (!emailRegex.test(txt_correoElectronico_value)) {
            campoInvalido(txt_correoElectronico, 'El correo electrónico no es válido...', true);
        } else {
            campoValido(txt_correoElectronico);
        }
    }
}

// Agregar función de validación para el checkbox
async function valida_txt_autorizacionDatosPersonales() {
    const checkbox = document.getElementById('autorizacionDatosPersonales');
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
                'Content-Type': 'application/json'
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
            mensajeDiv.innerHTML = `<div class="texto">${mensaje.CONTENIDO}</div>`;
            conversacionDiv.appendChild(mensajeDiv);
        });

        // 2. Después de mostrar, buscar los mensajes no leídos y marcarlos como leídos
        marcarMensajesNoLeidosComoLeidos();
    } catch (error) {
        console.log('❌ Error en listarConversacionCompleta', error);
    }
}

async function marcarMensajesNoLeidosComoLeidos() {
    try {
        const response = await fetch('/widget/mensaje/listarNoLeido?idChatWeb=' + idChatWeb, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
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
