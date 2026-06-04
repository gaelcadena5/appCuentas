import { createClient } from '@supabase/supabase-js';
import { envs } from '../config/env';
import { TransaccionExtraida } from '../types';

const supabase = createClient(envs.SUPABASE_URL, envs.SUPABASE_SERVICE_ROLE_KEY);

export const supabaseService = {
  // Crear movimientos temporales (borrando los anteriores unconfirmed del chat para evitar duplicados)
  async crearMovimientosTemporales(chatId: number, transacciones: Partial<TransaccionExtraida>[]): Promise<void> {
    await this.eliminarMovimientosPendientes(chatId);

    const rows = transacciones.map((t) => ({
      chat_id: chatId,
      monto: t.monto,
      concepto: t.concepto,
      tipo: t.tipo,
      metodo_pago: t.metodo_pago || 'Efectivo', // Default a Efectivo
      categoria: t.categoria || 'Otros',
      fecha: t.fecha ? new Date(t.fecha).toISOString() : new Date().toISOString(),
      confirmado: false
    }));

    const { error } = await supabase
      .from('movimientos')
      .insert(rows);

    if (error) throw error;
  },

  // Confirmar todos los movimientos pendientes de un chat
  async confirmarMovimientosPendientes(chatId: number): Promise<void> {
    const { error } = await supabase
      .from('movimientos')
      .update({ confirmado: true })
      .eq('chat_id', chatId)
      .eq('confirmado', false);

    if (error) throw error;
  },

  // Eliminar todos los movimientos pendientes de un chat
  async eliminarMovimientosPendientes(chatId: number): Promise<void> {
    const { error } = await supabase
      .from('movimientos')
      .delete()
      .eq('chat_id', chatId)
      .eq('confirmado', false);

    if (error) throw error;
  },

  // Gestión de Sesiones Conversacionales
  async obtenerSesion(chatId: number) {
    const { data, error } = await supabase
      .from('bot_sessions')
      .select('*')
      .eq('chat_id', chatId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async guardarSesion(chatId: number, estado: string, datosParciales: any): Promise<void> {
    const { error } = await supabase
      .from('bot_sessions')
      .upsert({
        chat_id: chatId,
        estado,
        datos_parciales: datosParciales,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  },

  async borrarSesion(chatId: number): Promise<void> {
    const { error } = await supabase
      .from('bot_sessions')
      .delete()
      .eq('chat_id', chatId);

    if (error) throw error;
  }
};
