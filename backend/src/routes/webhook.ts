import { Router, Request, Response } from 'express';
import { telegramService } from '../services/telegram';
import { openaiService } from '../services/openai';
import { supabaseService } from '../services/supabase';
import { envs } from '../config/env';
import { TransaccionExtraida } from '../types';

const router = Router();

// Verificar si el chat ID está en la lista blanca
function isChatAllowed(chatId: number): boolean {
  if (!envs.ALLOWED_TELEGRAM_IDS) {
    // Si no está configurada la lista blanca, permitimos todos por compatibilidad
    return true;
  }
  const allowed = envs.ALLOWED_TELEGRAM_IDS.split(',').map(id => parseInt(id.trim(), 10));
  return allowed.includes(chatId);
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, callback_query } = req.body;

    // --- MANEJO DE CALLBACKS (Botones inline de Confirmar / Cancelar) ---
    if (callback_query) {
      const chat_id = callback_query.message.chat.id;
      const message_id = callback_query.message.message_id;
      const callback_query_id = callback_query.id;
      const data = callback_query.data; 

      if (!isChatAllowed(chat_id)) {
        await telegramService.responderCallback(callback_query_id, 'Acceso denegado');
        return res.sendStatus(200);
      }

      if (data === 'confirmar_todos') {
        await supabaseService.confirmarMovimientosPendientes(chat_id);
        await supabaseService.borrarSesion(chat_id);
        
        await telegramService.responderCallback(callback_query_id, '¡Movimientos guardados!');
        await telegramService.editarMensaje(
          chat_id,
          message_id,
          '<b>✅ Transacciones guardadas con éxito.</b>\nTodos los movimientos han sido registrados en la base de datos.'
        );
      } else if (data === 'cancelar_todos') {
        await supabaseService.eliminarMovimientosPendientes(chat_id);
        await supabaseService.borrarSesion(chat_id);

        await telegramService.responderCallback(callback_query_id, 'Transacciones canceladas');
        await telegramService.editarMensaje(
          chat_id,
          message_id,
          '<b>❌ Transacciones canceladas.</b>\nNo se guardó ningún registro.'
        );
      }
      return res.sendStatus(200);
    }

    // --- MANEJO DE MENSAJES DE TEXTO ---
    if (message && message.text) {
      const chat_id = message.chat.id;
      const texto = message.text.trim();

      if (!isChatAllowed(chat_id)) {
        await telegramService.enviarMensaje(chat_id, '🚫 <b>Acceso no autorizado</b>\nNo tienes permisos para interactuar con este bot.');
        return res.sendStatus(200);
      }

      // Ignorar comandos de inicio silenciosamente
      if (texto.startsWith('/start')) {
        return res.sendStatus(200);
      }

      // 1. Verificar si hay una sesión activa
      const sesion = await supabaseService.obtenerSesion(chat_id);

      if (sesion) {
        const datosSession = sesion.datos_parciales as {
          lista: TransaccionExtraida[];
          indexPendiente?: number;
          campoPendiente?: string;
          confirmacionMessageId?: number;
        };

        const lista = datosSession.lista || [];
        const index = datosSession.indexPendiente ?? 0;
        const campo = datosSession.campoPendiente;

        if (sesion.estado === 'esperando_campo' && campo && lista[index]) {
          // Asignar el dato según el campo que faltaba
          if (campo === 'monto') {
            const montoNum = parseFloat(texto.replace(/[^0-9.]/g, ''));
            lista[index].monto = isNaN(montoNum) ? null : montoNum;
          } else if (campo === 'concepto') {
            lista[index].concepto = texto;
          } else if (campo === 'tipo') {
            const tipoNormalizado = texto.toLowerCase();
            if (tipoNormalizado.includes('gasto') || tipoNormalizado.includes('compra') || tipoNormalizado.includes('egreso')) {
              lista[index].tipo = 'gasto';
            } else if (tipoNormalizado.includes('ingreso') || tipoNormalizado.includes('pago') || tipoNormalizado.includes('nomina')) {
              lista[index].tipo = 'ingreso';
            } else {
              lista[index].tipo = 'gasto'; // default
            }
          }
          await procesarTransacciones(chat_id, lista);
        } else if (sesion.estado === 'esperando_confirmacion') {
          // El usuario envió una corrección de texto
          try {
            await telegramService.enviarMensaje(chat_id, '✍️ Aplicando corrección...');
            const listaCorregida = await openaiService.corregirTransaccion(lista, texto);
            await procesarTransacciones(chat_id, listaCorregida, datosSession.confirmacionMessageId);
          } catch (err: any) {
            console.error('Error aplicando corrección:', err);
            await telegramService.enviarMensaje(chat_id, '❌ No se pudo aplicar la corrección. Intenta de nuevo o presiona Cancelar.');
          }
        }
        return res.sendStatus(200);
      }

      // 2. Si no hay sesión, procesar con OpenAI
      try {
        await telegramService.enviarMensaje(chat_id, '🔍 Analizando transacción...');
        const extracciones = await openaiService.extraerDatosTransaccion(texto);

        if (extracciones.length === 0) {
          await telegramService.enviarMensaje(
            chat_id,
            '❌ No encontré ningún movimiento financiero en tu mensaje. Intenta escribir algo como "150 super" o "200 super y 600 crossfit".'
          );
          return res.sendStatus(200);
        }

        await procesarTransacciones(chat_id, extracciones);
      } catch (err: any) {
        console.error('Error procesando mensaje:', err);
        if (err.status === 429 || (err.message && err.message.includes('quota'))) {
          await telegramService.enviarMensaje(
            chat_id,
            '⚠️ <b>Error de OpenAI:</b> Se ha excedido la cuota de facturación o saldo de la API Key. Por favor, verifica tu plan y saldo en: https://platform.openai.com/api-keys'
          );
        } else {
          await telegramService.enviarMensaje(
            chat_id,
            '❌ Ocurrió un error interno al analizar el mensaje. Por favor, intenta de nuevo.'
          );
        }
      }
      return res.sendStatus(200);
    }

    res.sendStatus(200);
  } catch (error: any) {
    console.error('Error en Webhook:', error);
    res.sendStatus(500);
  }
});

// Función auxiliar para validar la lista de transacciones y pedir campos faltantes o enviar la confirmación consolidada
async function procesarTransacciones(chatId: number, lista: TransaccionExtraida[], messageId?: number) {
  // 1. Validar campos obligatorios en cada transacción (monto, concepto, tipo)
  for (let i = 0; i < lista.length; i++) {
    const t = lista[i];

    // Autocompletar método de pago por defecto a 'Efectivo'
    if (!t.metodo_pago) {
      t.metodo_pago = 'Efectivo';
    }

    if (!t.monto) {
      await supabaseService.guardarSesion(chatId, 'esperando_campo', {
        lista,
        indexPendiente: i,
        campoPendiente: 'monto'
      });
      await telegramService.enviarMensaje(
        chatId,
        `❓ ¿De cuánto fue el monto/cantidad para <b>"${t.concepto || 'este movimiento'}"</b>?`
      );
      return;
    }

    if (!t.concepto) {
      await supabaseService.guardarSesion(chatId, 'esperando_campo', {
        lista,
        indexPendiente: i,
        campoPendiente: 'concepto'
      });
      await telegramService.enviarMensaje(
        chatId,
        `❓ ¿Cuál es el concepto o descripción para el movimiento de <b>$${t.monto}</b>?`
      );
      return;
    }

    if (!t.tipo) {
      await supabaseService.guardarSesion(chatId, 'esperando_campo', {
        lista,
        indexPendiente: i,
        campoPendiente: 'tipo'
      });
      await telegramService.enviarMensaje(
        chatId,
        `❓ ¿El registro de $${t.monto} para <b>"${t.concepto}"</b> es un <b>gasto</b> o un <b>ingreso</b>?`
      );
      return;
    }
  }

  // 2. Si todo está completo, guardamos los movimientos en Supabase con confirmado = false
  await supabaseService.crearMovimientosTemporales(chatId, lista);

  // 3. Formatear la tarjeta consolidada
  let mensajeConfirmacion = `<b>¿Confirmas los siguientes registros?</b>\n\n`;
  
  lista.forEach((t, i) => {
    const icon = t.tipo === 'ingreso' ? '🟢' : '🔴';
    const sign = t.tipo === 'ingreso' ? '+' : '-';
    const fechaFormat = t.fecha ? ` | 📅 ${t.fecha}` : '';
    mensajeConfirmacion += `${i + 1}. ${icon} <b>${t.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}:</b> ${sign}$${t.monto} - <i>"${t.concepto}"</i> (${t.categoria}) | 💳 ${t.metodo_pago}${fechaFormat}\n`;
  });

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: 'Confirmar ✅', callback_data: 'confirmar_todos' },
        { text: 'Cancelar ❌', callback_data: 'cancelar_todos' }
      ]
    ]
  };

  let response;
  if (messageId) {
    try {
      response = await telegramService.editarMensaje(chatId, messageId, mensajeConfirmacion, inlineKeyboard);
    } catch (e) {
      console.error('Error al editar mensaje, enviando uno nuevo:', e);
      response = await telegramService.enviarMensaje(chatId, mensajeConfirmacion, inlineKeyboard);
    }
  } else {
    response = await telegramService.enviarMensaje(chatId, mensajeConfirmacion, inlineKeyboard);
  }

  // Guardamos el message_id en la sesión para poder editarlo con correcciones posteriores
  const sentMessageId = response?.result?.message_id;
  await supabaseService.guardarSesion(chatId, 'esperando_confirmacion', {
    lista,
    confirmacionMessageId: sentMessageId || messageId
  });
}

export default router;
