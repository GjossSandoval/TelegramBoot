const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'inf.env' }); // Cargar las variables de entorno desde inf.env

// Obtener el token y el ID del canal desde las variables de entorno
const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

// Validar que las variables de entorno estén configuradas
if (!token || !channelId) {
  console.error('❌ ERROR: Debes definir TELEGRAM_BOT_TOKEN y TELEGRAM_CHANNEL_ID en inf.env');
  process.exit(1);
}

// Instanciar el bot en modo polling
const bot = new TelegramBot(token, { polling: true });

// Si deleteWebhook está disponible, se elimina el webhook para evitar conflictos con el polling
if (typeof bot.deleteWebhook === 'function') {
  bot.deleteWebhook()
    .then(() => console.log('Webhook eliminado, iniciando polling...'))
    .catch((err) => console.error('Error eliminando webhook:', err));
} else {
  console.log('deleteWebhook no está disponible, continuando en modo polling.');
}

// Si deleteWebhook está disponible, se elimina el webhook para evitar conflictos con el polling
if (typeof bot.deleteWebhook === 'function') {
  bot.deleteWebhook()
    .then(() => console.log('Webhook eliminado, iniciando polling...'))
    .catch((err) => console.error('Error eliminando webhook:', err));
} else {
  console.log('deleteWebhook no está disponible, continuando en modo polling.');
}

// Función para descargar archivos de Telegram
const downloadFile = async (fileId) => {
  try {
    const filePath = path.join(downloadFolder, `${fileId}.mp4`);
    await bot.downloadFile(fileId, downloadFolder);
    console.log(`✅ Video guardado en: ${filePath}`);
  } catch (error) {
    console.error('❌ Error al descargar el video:', error);
  }
};

// Escuchar mensajes y detectar videos en el canal específico
bot.on('message', async (msg) => {
  try {
    // Verifica si el mensaje proviene del canal configurado
    if (msg.chat && msg.chat.id.toString() === channelId.toString()) {
      if (msg.video) {
        console.log('🎥 Nuevo video detectado:', msg.video.file_id);
        await downloadFile(msg.video.file_id);
      }
    }
  } catch (error) {
    console.error('❌ Error procesando mensaje:', error);
  }
});

// Manejo de errores de polling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 Bot en ejecución, esperando videos...');
