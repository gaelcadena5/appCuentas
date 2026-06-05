import OpenAI from 'openai';
import { envs } from '../config/env';
import { TransaccionExtraida } from '../types';

const openai = new OpenAI({ apiKey: envs.OPENAI_API_KEY });

// Función para calcular de forma determinista las fechas de la semana actual y pasada
function obtenerMapaFechas(hoy: Date = new Date()): Record<string, string> {
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const sinAcentos = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Establecer la hora a mediodía para evitar desfases de zona horaria al restar días
  const hoyMediodia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12, 0, 0);
  
  const mapa: Record<string, string> = {
    'hoy': hoyMediodia.toISOString().split('T')[0],
    'ayer': new Date(hoyMediodia.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    'antier': new Date(hoyMediodia.getTime() - 48 * 60 * 60 * 1000).toISOString().split('T')[0],
    'antes de ayer': new Date(hoyMediodia.getTime() - 48 * 60 * 60 * 1000).toISOString().split('T')[0],
  };

  const diaSemanaHoy = hoyMediodia.getDay(); // 0: Domingo, 1: Lunes, etc.

  for (let i = 0; i < 7; i++) {
    const nombreDia = diasSemana[i];
    const nombreDiaSinAcento = sinAcentos(nombreDia);
    
    // Calcular el día correspondiente en el pasado más cercano (o hoy)
    let diffNormal = (diaSemanaHoy - i + 7) % 7;
    const fechaNormal = new Date(hoyMediodia.getTime() - diffNormal * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Calcular la ocurrencia forzada en el pasado (si es hoy, retrocede 7 días)
    let diffPasado = diffNormal;
    if (diffPasado === 0) {
      diffPasado = 7;
    }
    const fechaPasado = new Date(hoyMediodia.getTime() - diffPasado * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    mapa[nombreDia] = fechaNormal;
    mapa[nombreDiaSinAcento] = fechaNormal;
    mapa[`el ${nombreDia}`] = fechaNormal;
    mapa[`el ${nombreDiaSinAcento}`] = fechaNormal;
    
    mapa[`${nombreDia} pasado`] = fechaPasado;
    mapa[`${nombreDiaSinAcento} pasado`] = fechaPasado;
    mapa[`el ${nombreDia} pasado`] = fechaPasado;
    mapa[`el ${nombreDiaSinAcento} pasado`] = fechaPasado;
  }
  
  return mapa;
}

export const openaiService = {
  async extraerDatosTransaccion(texto: string): Promise<TransaccionExtraida[]> {
    const mapaFechas = obtenerMapaFechas(new Date());
    const fechaActual = mapaFechas['hoy'];
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaActual = diasSemana[new Date().getDay()];

    const promptSistema = `
      Eres un asistente experto en finanzas personales. Tu tarea es extraer la información de gastos o ingresos a partir de textos libres.
      Puedes extraer una o MULTIPLES transacciones a partir de un solo mensaje (por ejemplo, si vienen en diferentes líneas o descritas juntas).
      
      Mapeo exacto de días y referencias temporales a fechas YYYY-MM-DD:
      ${JSON.stringify(mapaFechas, null, 2)}
      
      Reglas críticas para fechas:
      - Utiliza el mapeo anterior para deducir la fecha correcta del movimiento según las palabras temporales que use el usuario.
      - Si el usuario menciona un día de la semana sin más contexto (ej. "viernes"), busca la fecha correspondiente a ese día en el mapeo anterior (ej. "viernes": "${mapaFechas['viernes']}").
      - Si no se menciona fecha, día de la semana ni referencia temporal, usa la fecha de hoy: ${fechaActual}.
      - ¡PROHIBIDO GENERAR FECHAS EN EL FUTURO! Ningún registro puede guardarse con fecha posterior a hoy (${fechaActual}).

      Reglas de clasificación de categoría:
      - categoria: Si la transacción es un "gasto", clasifica estrictamente como "Gasto Necesario" (gastos esenciales, vitales e inevitables como gasolina, supermercado, despensa, ejercicio, crossfit, renta, servicios públicos, internet, seguros, etc.) o "Gasto Innecesario" (gastos discrecionales, de ocio o entretenimiento como cine, cenas fuera, salidas, café, compras no esenciales, etc.). Si es un "ingreso", la categoría debe ser "Ingreso". No uses ninguna otra categoría.
      
      Reglas de extracción para cada transacción:
      - monto: Debe ser un número positivo. Si no se especifica o no se puede deducir, pon null.
      - concepto: Descripción breve del gasto/ingreso (ej. "gasolina", "desayuno Allison", "OpenAI").
      - tipo: Clasifica estrictamente como "gasto" (salidas de dinero, compras) o "ingreso" (entradas de dinero, salario, transferencias recibidas).
      - metodo_pago: 
        - Si es tarjeta (crédito, débito, etc.), transferencia o pago bancario (ej. BBVA, Santander, Rappi, etc.), usa estrictamente "Tarjeta".
        - Si es efectivo o no se especifica el método de pago en el texto, usa "Efectivo".
        - Los únicos valores permitidos son "Efectivo" y "Tarjeta". No incluyas nombres de bancos, marcas ni dueños de tarjeta.
      - fecha: Devuelve la fecha en formato YYYY-MM-DD según las reglas anteriores.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: promptSistema },
        { role: 'user', content: texto }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extraer_transacciones',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              transacciones: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    monto: { type: ['number', 'null'] },
                    concepto: { type: ['string', 'null'] },
                    tipo: { type: ['string', 'null'], enum: ['gasto', 'ingreso', null] },
                    metodo_pago: { type: 'string', enum: ['Efectivo', 'Tarjeta'] },
                    categoria: { type: ['string', 'null'] },
                    fecha: { type: ['string', 'null'] }
                  },
                  required: ['monto', 'concepto', 'tipo', 'metodo_pago', 'categoria', 'fecha'],
                  additionalProperties: false
                }
              }
            },
            required: ['transacciones'],
            additionalProperties: false
          }
        }
      }
    });

    const parsedData = JSON.parse(completion.choices[0].message.content || '{"transacciones":[]}');
    return parsedData.transacciones as TransaccionExtraida[];
  },

  async corregirTransaccion(datosActuales: TransaccionExtraida[], correccion: string): Promise<TransaccionExtraida[]> {
    const mapaFechas = obtenerMapaFechas(new Date());
    const fechaActual = mapaFechas['hoy'];
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaActual = diasSemana[new Date().getDay()];

    const promptSistema = `
      El usuario tiene la(s) siguiente(s) transacción(es) financiera(s) pendiente(s) de confirmar:
      ${JSON.stringify(datosActuales, null, 2)}

      El usuario te ha enviado una corrección por mensaje de texto libre: "${correccion}"
      Aplica esta corrección de forma inteligente sobre la lista de transacciones actuales.
      Por ejemplo, si dice "el primero era ingreso", cambia el tipo de la primera transacción. Si dice "todos fueron con tarjeta", cambia el método de pago de todos a "Tarjeta". Si dice "en realidad gasté 250 en el super", actualiza el monto del super a 250.
      
      Mapeo exacto de días y referencias temporales a fechas YYYY-MM-DD:
      ${JSON.stringify(mapaFechas, null, 2)}
      
      Reglas críticas para fechas en correcciones:
      - Utiliza el mapeo anterior para deducir la fecha correcta del movimiento según las palabras temporales que use el usuario (ej. "lunes", "viernes", "ayer", "hoy").
      - Si el usuario corrige la fecha mencionando un día de la semana (ej. "fue el lunes"), calcula la fecha en el pasado más cercano a hoy usando el mapeo anterior.
      - ¡PROHIBIDO GENERAR FECHAS EN EL FUTURO!
      
      Reglas de clasificación de categoría:
      - categoria: Si la transacción corregida/modificada es un "gasto", clasifica estrictamente como "Gasto Necesario" (gastos esenciales, vitales e inevitables como gasolina, supermercado, despensa, ejercicio, crossfit, renta, servicios públicos, internet, seguros, etc.) o "Gasto Innecesario" (gastos discrecionales, de ocio o entretenimiento como cine, cenas fuera, salidas, café, compras no esenciales, etc.). Si es un "ingreso", la categoría debe ser "Ingreso". No uses ninguna otra categoría.
      
      Reglas de método de pago:
      - metodo_pago: 
        - Si es tarjeta (crédito, débito, etc.), transferencia o pago bancario, usa estrictamente "Tarjeta".
        - Si es efectivo o no se especifica el método de pago, usa "Efectivo".
        - Los únicos valores permitidos son "Efectivo" y "Tarjeta". No incluyas nombres de bancos, marcas ni dueños de tarjeta.
      
      Mantén los campos y transacciones que no se mencionen o no se alteren tal como están.
      Debes devolver la lista completa de transacciones corregidas.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: promptSistema }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'corregir_transacciones',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              transacciones: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    monto: { type: ['number', 'null'] },
                    concepto: { type: ['string', 'null'] },
                    tipo: { type: ['string', 'null'], enum: ['gasto', 'ingreso', null] },
                    metodo_pago: { type: 'string', enum: ['Efectivo', 'Tarjeta'] },
                    categoria: { type: ['string', 'null'] },
                    fecha: { type: ['string', 'null'] }
                  },
                  required: ['monto', 'concepto', 'tipo', 'metodo_pago', 'categoria', 'fecha'],
                  additionalProperties: false
                }
              }
            },
            required: ['transacciones'],
            additionalProperties: false
          }
        }
      }
    });

    const parsedData = JSON.parse(completion.choices[0].message.content || '{"transacciones":[]}');
    return parsedData.transacciones as TransaccionExtraida[];
  }
};
