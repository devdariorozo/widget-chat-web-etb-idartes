// ! ================================================================================================================================================
// !                                                          WIDGET CHAT WEB
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/widget/chatWeb.js

// ! VARIABLES GLOBALES
// const APP_URL = '????';
const APP_URL = 'http://localhost:5006';
let chatWeb = '';
let idChatWeb = '';
let chatCreado = false; // Variable para rastrear si el chat ya ha sido creado
let isChatOpen = false; // Variable para controlar el estado del chat

function inicializarWidgetChat() {
  // * Contenedor del widget
  const contenedorWidget = document.querySelector('#contenedorWidget');
  if (!contenedorWidget) {
    console.error('No se encontró el contenedor del widget');
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
    if (!chatCreado) {
      // todo: Variables
      const chatURL = `${APP_URL}/widget/chat/web`;
      
      // todo: Asignar la URL del chat
      iframeChatWeb.src = chatURL;

      // todo: Asignar un idChatWeb solo si está vacío
      if (idChatWeb === '') {
        idChatWeb = Math.random().toString(36).substring(2, 16);
      }

      // todo: Crear el chat
      const response = await fetch(`${APP_URL}/widget/chat/crear`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ idChatWeb }),
      });
      const result = await response.json();

      chatCreado = true; // Marcar el chat como creado
    }

    toggleChatState(true);

    iframeChatWeb.onload = function() {
        // todo: Envía el mensaje solo después de que el iframe esté cargado
        iframeChatWeb.contentWindow.postMessage({chatWeb: 'Crear', idWidgetChatWeb: idChatWeb }, '*');
    };
  });

  // * Minimizar el chat web
  btnMinimizarChatWeb.addEventListener('click', () => {
    // todo: Envía el mensaje solo después de que el iframe esté cargado
    iframeChatWeb.contentWindow.postMessage({chatWeb: 'Minimizar', idWidgetChatWeb: idChatWeb }, '*');
    toggleChatState(false);
  });

  // * Cerrar el chat web
  btnCerrarChatWeb.addEventListener('click', async () => {
    toggleChatState(false);

    // todo: Cerrar el chat
    const response = await fetch(`${APP_URL}/widget/chat/cerrar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idChatWeb })
    });
    const result = await response.json();

    // todo: Reiniciar el idChatWeb y el estado de creación
    idChatWeb = '';
    chatWeb = '';
    chatCreado = false; // Reiniciar el estado de creación
  });
}

function ajustarAltoWidgetChat() {
  const contChat = document.querySelector('#contenedorWidget .cont-chat');
  if (contChat) {
    contChat.style.height = window.innerHeight + 'px';
    contChat.style.maxHeight = window.innerHeight + 'px';
  }
}

// Llama la función en los eventos relevantes
window.addEventListener('resize', ajustarAltoWidgetChat);
window.addEventListener('orientationchange', ajustarAltoWidgetChat);
window.addEventListener('DOMContentLoaded', ajustarAltoWidgetChat);

// Si usas frameworks o el widget se abre dinámicamente, llama también al abrir el chat:
if (typeof window.WidgetChat !== 'undefined') {
  const originalInit = window.WidgetChat.init;
  window.WidgetChat.init = function() {
    if (originalInit) originalInit();
    ajustarAltoWidgetChat();
  }
}

// Exponer la función global para inicialización manual:
window.WidgetChat = {
  init: inicializarWidgetChat
};