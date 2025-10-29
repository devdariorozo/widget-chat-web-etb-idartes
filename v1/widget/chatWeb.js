// ! ================================================================================================================================================
// !                                                          WIDGET CHAT WEB
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/widget/chatWeb.js

// ! VARIABLES GLOBALES
// const APP_URL = 'https://idcexteriorchatbot.mysoul.software'; // Producción
// const APP_URL = 'https://idcexteriorchatbotdos.mysoul.software'; // 715 QA
const APP_URL = 'http://localhost:5006'; // Desarrollo
let chatWeb = '';
let idChatWeb = '';
let chatCreado = false;
let isChatOpen = false;


// * FUNCIÓN PARA ENVIAR PETICIONES CON ORIGEN VÁLIDO
async function enviarPeticion(url, metodo = 'GET', datos = null) {
    
    const opciones = {
        method: metodo,
        headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin,
        },
        credentials: 'same-origin'
    };
    
    if (datos && (metodo === 'POST' || metodo === 'PUT')) {
        opciones.body = JSON.stringify(datos);
    }
    
    try {
        const response = await fetch(url, opciones);
        return await response.json();
    } catch (error) {
        console.error('❌ Error en v1/widget/chatWeb.js → enviarPeticion → Error al enviar petición a la API:', error);
        throw error;
    }
}

function inicializarWidgetChat() {
    // * Contenedor del widget
    const contenedorWidget = document.querySelector('#contenedorWidget');
    if (!contenedorWidget) {
        console.error('❌ Error en v1/widget/chatWeb.js → inicializarWidgetChat → No se encontró el contenedor del widget');
        return;
    }

    // Evitar inicialización múltiple
    if (contenedorWidget.dataset.widgetInitialized === "true") {
        return;
    }
    contenedorWidget.dataset.widgetInitialized = "true";

    const estructuraWidget = `
        <div id='chatOverlay' style="display:none;"></div>
        <div id='estructuraWidget'>
            <div id='contentChatWeb' class='cont-chat'>
                <div class='bar-chat'>
                    <div class='bar-box bar-box1'>
                        <img class="bar-img" src='${APP_URL}/images/imagen-corporativa/logo_sistema_sm.png' alt='Logo de la aplicación'>
                    </div>
                    <div class='bar-box bar-box2'>
                        <div class="tituloChatWeb">
                            <span id="nombreChatWeb">ETB IDARTES</span>
                            <span id="versionChatWeb">V 1.0.0</span>
                        </div>
                        <div id="estadoChatWeb">
                            <i class="material-icons">brightness_1</i> Online
                        </div>
                    </div>
                    <div class='bar-box bar-box3'>
                        <i id='btnMinimizarChatWeb' class="material-icons">remove</i>
                        <i id='btnCerrarChatWeb' class="material-icons">close</i>
                    </div>
                </div>
                <div class='main-chat'>
                    <iframe id='iframeChatWeb' frameborder='0'></iframe>
                </div>
            </div>
            <div id='btnCrearChatWeb' class='btn-chat-pau'>
                <img class='img-btn' src='${APP_URL}/images/imagen-corporativa/widget.png' alt=''>  
            </div>
        </div>`;

    contenedorWidget.innerHTML = estructuraWidget;

    // * Control de la ventana
    const btnCrearChatWeb = document.getElementById('btnCrearChatWeb');
    const contentChatWeb = document.getElementById('contentChatWeb');
    const iframeChatWeb = document.getElementById('iframeChatWeb');
    const btnMinimizarChatWeb = document.getElementById('btnMinimizarChatWeb');
    const btnCerrarChatWeb = document.getElementById('btnCerrarChatWeb');
    const overlay = document.getElementById('chatOverlay');

    // * Función para manejar el estado del chat
    const toggleChatState = (open) => {
        isChatOpen = open;
        document.body.style.overflow = open ? 'hidden' : '';
        contentChatWeb.style.display = open ? 'flex' : 'none';
        contentChatWeb.style.animationName = open ? 'ani-open-chat' : 'ani-close-chat';
        overlay.style.display = open ? 'block' : 'none';
    };

    // * Crear el chat web
    btnCrearChatWeb.addEventListener('click', async () => {
        // VERIFICAR SI HAY ERROR 429 ACTIVO - NO PERMITIR CLICK SI LO HAY
        if (btnCrearChatWeb.classList.contains('error-429')) {
            // console.log('🚫 Error 429 activo, no se permite crear chat');
            return;
        }
        
        // * LIMPIAR COMPLETAMENTE EL ESTADO ANTERIOR
        idChatWeb = '';
        chatWeb = '';
        chatCreado = false;
        
        if (!chatCreado) {
            const chatURL = `${APP_URL}/widget/chat/web`;
            
            // * GENERAR NUEVO ID SIEMPRE
            idChatWeb = Math.random().toString(36).substring(2, 16);
            // console.log('🆕 Nuevo ID generado:', idChatWeb);

            try {
                // todo: Crear el chat CON ORIGEN VÁLIDO
                const result = await enviarPeticion(
                    `${APP_URL}/widget/chat/crear`,
                    'POST',
                    { idChatWeb }
                );
                // console.log('📤 Resultado de crear chat:', result);

                if (result.status === 429) {
                    // Manejar error 429 - Límite de API excedido
                    // console.log('🚫 Error 429 detectado en crear chat');
                    
                    const btnCrearChatWeb = document.getElementById('btnCrearChatWeb');
                    
                    // DESHABILITAR COMPLETAMENTE EL BOTÓN
                    btnCrearChatWeb.disabled = true;
                    btnCrearChatWeb.style.pointerEvents = 'none';
                    btnCrearChatWeb.style.cursor = 'not-allowed';
                    
                    // Aplicar clase CSS de error
                    btnCrearChatWeb.classList.add('error-429');
                    
                    // Crear elemento de countdown si no existe
                    let countdownText = btnCrearChatWeb.querySelector('.countdown-text');
                    if (!countdownText) {
                        countdownText = document.createElement('div');
                        countdownText.className = 'countdown-text';
                        btnCrearChatWeb.appendChild(countdownText);
                    }
                    
                    // Calcular tiempo en segundos
                    const retryMinutes = result.retryAfter || 1;
                    let retrySeconds = retryMinutes * 60;
                    
                    function actualizarCountdown() {
                        if (retrySeconds > 0) {
                            const minutos = Math.floor(retrySeconds / 60);
                            const segundos = retrySeconds % 60;
                            countdownText.innerHTML = `${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;
                            retrySeconds--;
                            setTimeout(actualizarCountdown, 1000);
                        } else {
                            // Restaurar botón normal
                            btnCrearChatWeb.classList.remove('error-429');
                            btnCrearChatWeb.disabled = false;
                            btnCrearChatWeb.style.pointerEvents = 'auto';
                            btnCrearChatWeb.style.cursor = 'pointer';
                            countdownText.remove();
                            // console.log('✅ Botón de chat restaurado y habilitado después del countdown');
                        }
                    }
                    
                    // Iniciar countdown
                    actualizarCountdown();
                    
                    return chatCreado = false;
                }
                
                chatCreado = true;

            } catch (error) {
                console.error('❌ Error en v1/widget/chatWeb.js → btnCrearChatWeb.addEventListener → Error al crear chat:', error);
                return;
            }
        }

        // * SOLUCIÓN OPTIMIZADA: Limpiar contenido y mostrar chat limpio
        const chatURL = `${APP_URL}/widget/chat/web`;
        
        // * Limpiar el iframe antes de cargar nuevo contenido
        iframeChatWeb.src = 'about:blank';
        
        // * Mostrar el chat INMEDIATAMENTE para mejor UX
        toggleChatState(true);
        
        // * MOSTRAR CAPA DE PRELOAD
        mostrarCapaPreload();
        
        // * FALLBACK: Ocultar preload después de 10 segundos como medida de seguridad
        setTimeout(() => {
            ocultarCapaPreload();
        }, 10000);

        // * DESHABILITADO - EL HTML MANEJA LA COMUNICACIÓN CON EL IFRAME
        // Esto evita conflictos de IDs duplicados
        iframeChatWeb.onload = function() {
            // console.log('📤 Iframe cargado - El HTML manejará la comunicación');
            
            // * Ocultar preload cuando el iframe esté completamente cargado
            setTimeout(() => {
                ocultarCapaPreload();
            }, 1000); // Dar tiempo para que el iframe se inicialice
        };
        
        // * Cargar el nuevo chat después de un breve momento para asegurar limpieza
        setTimeout(() => {
            iframeChatWeb.src = chatURL;
        }, 10); // Mínimo delay para asegurar que about:blank se procese
    });

    // * Minimizar el chat web
    btnMinimizarChatWeb.addEventListener('click', () => {
        
        iframeChatWeb.contentWindow.postMessage(
            { 
                chatWeb: 'Minimizar', 
                idWidgetChatWeb: idChatWeb 
            }, 
            window.location.origin
        );
        
        toggleChatState(false);
    });

    // * Cerrar el chat web
    btnCerrarChatWeb.addEventListener('click', async () => {
        toggleChatState(false);

        try {
            // todo: Cerrar el chat CON ORIGEN VÁLIDO
            const result = await enviarPeticion(
                `${APP_URL}/widget/chat/cerrar`,
                'POST',
                { idChatWeb }
            );
            
        } catch (error) {
            console.error('❌ Error en v1/widget/chatWeb.js → btnCerrarChatWeb.addEventListener → Error al cerrar chat:', error);
        }

        // todo: Reiniciar el idChatWeb y el estado de creación
        idChatWeb = '';
        chatWeb = '';
        chatCreado = false;
    });

    // * Manejar mensajes desde el iframe
    window.addEventListener('message', function(event) {

        const data = event.data;
        
        // Manejar mensaje para ocultar preload
        if (data.type === 'ocultarPreload') {
            ocultarCapaPreload();
            return;
        }
        
        if (data.type === 'enviarMensaje') {
            // El iframe quiere enviar un mensaje
            enviarPeticion(
                `${APP_URL}/widget/mensaje/crear`,
                'POST',
                data.datos
            ).then(response => {
                // Enviar respuesta de vuelta al iframe
                iframeChatWeb.contentWindow.postMessage({
                    type: 'respuestaMensaje',
                    id: data.id,
                    response: response
                }, window.location.origin);
            }).catch(error => {
                iframeChatWeb.contentWindow.postMessage({
                    type: 'respuestaMensaje',
                    id: data.id,
                    error: error.message
                }, window.location.origin);
            });
        }
        
        else if (data.type === 'listarMensajes') {
            // El iframe quiere listar mensajes
            enviarPeticion(
                `${APP_URL}/widget/mensaje/listarNoLeido?idChatWeb=${data.idChatWeb}`,
                'GET'
            ).then(response => {
                iframeChatWeb.contentWindow.postMessage({
                    type: 'respuestaListarMensajes',
                    id: data.id,
                    response: response
                }, window.location.origin);
            }).catch(error => {
                iframeChatWeb.contentWindow.postMessage({
                    type: 'respuestaListarMensajes',
                    id: data.id,
                    error: error.message
                }, window.location.origin);
            });
        }
        
        // else if (data.type === 'enviarFormulario') {
        //     // El iframe quiere enviar formulario inicial
        //     enviarPeticion(
        //         `${APP_URL}/widget/chat/formularioInicial`,
        //         'POST',
        //         data.datos
        //     ).then(response => {
        //         iframeChatWeb.contentWindow.postMessage({
        //             type: 'respuestaFormulario',
        //             id: data.id,
        //             response: response
        //         }, window.location.origin);
        //     }).catch(error => {
        //         iframeChatWeb.contentWindow.postMessage({
        //             type: 'respuestaFormulario',
        //             id: data.id,
        //             error: error.message
        //         }, window.location.origin);
        //     });
        // }
    });
}

// * FUNCIÓN PARA AJUSTAR ALTO DEL WIDGET
function ajustarAltoWidgetChat() {
    const contChat = document.querySelector('#contenedorWidget .cont-chat');
    if (contChat) {
        contChat.style.height = window.innerHeight + 'px';
        contChat.style.maxHeight = window.innerHeight + 'px';
    }
}

// * FUNCIÓN PARA MOSTRAR CAPA DE PRELOAD
function mostrarCapaPreload() {
    // Verificar si ya existe la capa de preload
    let preloadLayer = document.getElementById('preload-layer');
    
    if (!preloadLayer) {
        // Crear la capa de preload
        preloadLayer = document.createElement('div');
        preloadLayer.id = 'preload-layer';
        
        // Crear el contenido del preload
        const preloadContent = document.createElement('div');
        preloadContent.className = 'preload-content';
        
        // Crear spinner
        const spinner = document.createElement('div');
        spinner.className = 'preload-spinner';
        
        // Crear texto
        const text = document.createElement('div');
        text.textContent = 'Creando nuevo chat...';
        text.className = 'preload-text';
        
        // Ensamblar el preload
        preloadContent.appendChild(spinner);
        preloadContent.appendChild(text);
        preloadLayer.appendChild(preloadContent);
        
        // Agregar al contenedor del widget (por encima del iframe)
        const contentChatWeb = document.getElementById('contentChatWeb');
        if (contentChatWeb) {
            contentChatWeb.appendChild(preloadLayer);
        }
    } else {
        // Si ya existe, solo mostrarla
        preloadLayer.style.display = 'flex';
    }
}

// * FUNCIÓN PARA OCULTAR CAPA DE PRELOAD
function ocultarCapaPreload() {
    const preloadLayer = document.getElementById('preload-layer');
    if (preloadLayer) {
        preloadLayer.style.display = 'none';
        // console.log('✅ Preload ocultado correctamente');
    } else {
        console.log('⚠️ No se encontró el elemento preload-layer');
    }
}

// * API PARA COMUNICACIÓN CON EL IFRAME
window.WidgetChatAPI = {
    // Función para que el iframe envíe mensajes
    enviarMensaje: function(datos) {
        return enviarPeticion(`${APP_URL}/widget/mensaje/crear`, 'POST', datos);
    },
    
    // Función para que el iframe liste mensajes
    listarMensajes: function(idChatWeb) {
        return enviarPeticion(`${APP_URL}/widget/mensaje/listarNoLeido?idChatWeb=${idChatWeb}`, 'GET');
    },
    
    // // Función para que el iframe envíe formulario inicial
    // enviarFormulario: function(datos) {
    //     return enviarPeticion(`${APP_URL}/widget/chat/formularioInicial`, 'POST', datos);
    // },
    
    // Función para obtener la URL base
    obtenerAppUrl: function() {
        return APP_URL;
    },
    
    // Función para ocultar la capa de preload
    ocultarPreload: ocultarCapaPreload
};

// * INICIALIZACIÓN GLOBAL
window.WidgetChat = {
    init: inicializarWidgetChat,
    ajustarAlto: ajustarAltoWidgetChat,
    getEstado: function() {
        return {
            chatCreado: chatCreado,
            isChatOpen: isChatOpen,
            idChatWeb: idChatWeb
        };
    }
};

// * EVENTOS DE INICIALIZACIÓN
window.addEventListener('DOMContentLoaded', function() {
    inicializarWidgetChat();
    ajustarAltoWidgetChat();
});

window.addEventListener('resize', ajustarAltoWidgetChat);
window.addEventListener('orientationchange', ajustarAltoWidgetChat);

// * INICIALIZACIÓN AUTOMÁTICA SI EL CONTENEDOR EXISTE
if (document.querySelector('#contenedorWidget')) {
    inicializarWidgetChat();
    ajustarAltoWidgetChat();
}