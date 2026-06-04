import express from 'express';
import { envs } from './config/env';
import webhookRouter from './routes/webhook';
import { telegramService } from './services/telegram';

const app = express();
app.use(express.json());

// Endpoint del Webhook
app.use('/api/webhook', webhookRouter);

// Endpoint de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.listen(envs.PORT, async () => {
  console.log(`Servidor Express corriendo en el puerto ${envs.PORT}`);
  
  // Configurar webhook automáticamente al arrancar
  try {
    const res = await telegramService.configurarWebhook();
    console.log('Configuración de Webhook en Telegram:', res);
  } catch (error) {
    console.error('Error al configurar webhook de Telegram:', error);
  }
});
