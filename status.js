const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'inf.env' }); // Cargar variables de entorno

// Obtener el token y el ID del canal desde las variables de entorno
const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;
let videoCount = 0; // Contador de videos recibidos
const logFile = 'status.log'; // Archivo donde se guardará el estado

// Función para escribir en el archivo de estado
const updateStatus = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(message); // También se muestra en la consola
};

// Validar que las variables de entorno estén configuradas
if (!token || !channelId) {
  updateStatus('❌ ERROR: Debes definir TELEGRAM_BOT_TOKEN y TELEGRAM_CHANNEL_ID en inf.env');
  process.exit(1);
}

// Instanciar el bot en modo polling
const bot = new TelegramBot(token, { polling: true });

// Verificar el estado del bot con getMe()
bot.getMe()
  .then((botInfo) => {
    updateStatus(`✅ Bot conectado: ${botInfo.username} (ID: ${botInfo.id})`);
  })
  .catch((error) => {
    updateStatus(`❌ Error al verificar el token: ${error.message}`);
    process.exit(1);
  });

// Carpeta donde se guardarán los videos
const downloadFolder = './videos';
if (!fs.existsSync(downloadFolder)) {
  fs.mkdirSync(downloadFolder, { recursive: true });
  updateStatus(`📂 Carpeta de videos creada en: ${downloadFolder}`);
}

// Función para descargar archivos de Telegram
const downloadFile = async (fileId) => {
  try {
    const fileLink = await bot.getFileLink(fileId); // Obtener la URL del archivo
    const filePath = path.join(downloadFolder, `${fileId}.mp4`);

    // Descargar el archivo desde la URL
    const response = await fetch(fileLink);
    const fileStream = fs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream);
      response.body.on("error", reject);
      fileStream.on("finish", resolve);
    });

    videoCount++;
    updateStatus(`✅ Video guardado en: ${filePath} | Total videos descargados: ${videoCount}`);
  } catch (error) {
    updateStatus(`❌ Error al descargar el video: ${error.message}`);
  }
};

// Escuchar mensajes y detectar videos en el canal específico
bot.on('message', async (msg) => {
  try {
    if (!msg.chat) {
      updateStatus('⚠️ Mensaje recibido sin información de chat.');
      return;
    }

    // Verifica si el mensaje proviene del canal configurado
    if (msg.chat.id.toString() === channelId.toString()) {
      if (msg.video) {
        updateStatus(`🎥 Nuevo video detectado: ${msg.video.file_id}`);
        await downloadFile(msg.video.file_id);
      } else {
        updateStatus(`📩 Mensaje recibido en el canal, pero no es un video.`);
      }
    } else {
      updateStatus(`⚠️ Mensaje recibido de un chat NO autorizado (ID: ${msg.chat.id})`);
    }
  } catch (error) {
    updateStatus(`❌ Error procesando mensaje: ${error.message}`);
  }
});

// Manejo de errores de polling
bot.on('polling_error', (error) => {
  updateStatus(`❌ Polling error: ${error.message}`);
});

updateStatus('🤖 Bot en ejecución, esperando videos...');
