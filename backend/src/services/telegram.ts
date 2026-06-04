import { envs } from '../config/env';

export const telegramService = {
  async enviarMensaje(chatId: number, texto: string, replyMarkup?: any): Promise<any> {
    const url = `https://api.telegram.org/bot${envs.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: texto,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    });
    return response.json();
  },

  async editarMensaje(chatId: number, messageId: number, texto: string, replyMarkup?: any): Promise<any> {
    const url = `https://api.telegram.org/bot${envs.TELEGRAM_BOT_TOKEN}/editMessageText`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: texto,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    });
    return response.json();
  },

  async responderCallback(callbackQueryId: string, texto?: string): Promise<any> {
    const url = `https://api.telegram.org/bot${envs.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: texto
      })
    });
    return response.json();
  },

  async configurarWebhook(): Promise<any> {
    const url = `https://api.telegram.org/bot${envs.TELEGRAM_BOT_TOKEN}/setWebhook`;
    const webhookUrl = `${envs.WEBHOOK_URL}/api/webhook`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl })
    });
    return response.json();
  }
};
