export interface TransaccionExtraida {
  monto: number | null;
  concepto: string | null;
  tipo: 'gasto' | 'ingreso' | null;
  metodo_pago: string | null;
  categoria: string | null;
  fecha: string | null;
}

export interface MovimientoDb {
  id: string;
  fecha: string;
  tipo: 'gasto' | 'ingreso';
  monto: number;
  concepto: string;
  categoria: string;
  metodo_pago: string;
  confirmado: boolean;
  chat_id: number;
}
