// ChatWeb/src/public/dist/js/widget-chat.js

// ! Variables globales
const APP_URL = 'http://localhost:5526';

// ! Widget Chat Bot
document.addEventListener('DOMContentLoaded', async () => {
  // * Contenedor del widget
  const contenedorWidget = document.querySelector('#cont-widget-chat-bot');
  const contenidoWidget = `
    <div id='widgetChatBot'>
      <div id='contChat' class='cont-chat'>
        <div class='bar-chat'>
          <div class='bar-box bar-box1' style="flex-grow: 1">
            <img class="bar-img" src='${APP_URL}/img/logo_sistema_sm.png' alt=''>
          </div>
          <div class='bar-box bar-box2' style="flex-grow: 2">
            <span id="tituloChatWeb">THOMAS GREG & SONS</span>
            <span id="estadoChatWeb">
              <i class="material-icons">brightness_1</i> Online
            </span>
          </div>
          <div class='bar-box bar-box3' style="flex-grow: 1">
            <i id='btnCerrar' class="material-icons">close</i>
          </div>
        </div>
        <div class='main-chat'>
          <iframe id='iframeChatWeb' frameborder='0'></iframe>
        </div>
      </div>
      <div id='btnToggleChat' class='btn-chat-pau'>
        <img class='img-btn' src='${APP_URL}/img/widget.png' alt=''>  
      </div>
    </div>`;

  contenedorWidget.innerHTML = contenidoWidget;

  // * Control de la ventana
  const btnToggleChat = document.querySelector('#widgetChatBot #btnToggleChat');
  const contChat = document.querySelector('#widgetChatBot #contChat');
  const iframeChatWeb = document.querySelector('#widgetChatBot #iframeChatWeb');

  // * Obtener el token de autenticación
  // const getJWT = async () => {
  //   const response = await fetch(`${APP_URL}/generarToken`);
  //   const data = await response.json();
  //   return data.token;
  // };

  // * Abrir el chat
  btnToggleChat.addEventListener('click', async () => {
    const token = await getJWT();
    // const chatURL = `${APP_URL}/chat?token=${token}`;
    const chatURL = `${APP_URL}/chat`;
    iframeChatWeb.src = chatURL;
    contChat.style.animationName = 'ani-open-chat';
    contChat.style.display = 'block';
  });

  // * Cerrar el chat
  btnCerrar.addEventListener('click', () => {
    contChat.style.animationName = 'ani-close-chat'; // Cerrar el chat
  });
});