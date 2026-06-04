'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { SummaryCards } from '../components/SummaryCards';
import { Filters } from '../components/Filters';
import { MovementTable } from '../components/MovementTable';
import { LoginScreen } from '../components/LoginScreen';
import { RefreshCw } from 'lucide-react';

interface Movimiento {
  id: string;
  fecha: string;
  tipo: 'gasto' | 'ingreso';
  monto: number;
  concepto: string;
  categoria: string;
  metodo_pago: string;
  confirmado: boolean;
}

const CATEGORIAS = ['Gasto Necesario', 'Gasto Innecesario'];

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [filtrados, setFiltrados] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de filtros
  const [mesSeleccionado, setMesSeleccionado] = useState('all');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('all');

  useEffect(() => {
    const auth = localStorage.getItem('dashboard_authenticated');
    setIsAuthenticated(auth === 'true');
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Traer todos los movimientos CONFIRMADOS ordenados del más reciente al más antiguo
      const { data, error } = await supabase
        .from('movimientos')
        .select('*')
        .eq('confirmado', true)
        .order('fecha', { ascending: false });

      if (error) throw error;

      if (data) {
        setMovimientos(data);
        setFiltrados(data);
      }
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Efecto para aplicar los filtros del cliente
  useEffect(() => {
    let result = [...movimientos];

    // Filtrar por Mes
    if (mesSeleccionado !== 'all') {
      result = result.filter((m) => {
        const mesMov = new Date(m.fecha).toISOString().split('-')[1]; // ej. '06'
        return mesMov === mesSeleccionado;
      });
    }

    // Filtrar por Categoría
    if (categoriaSeleccionada !== 'all') {
      result = result.filter((m) => m.categoria === categoriaSeleccionada);
    }

    setFiltrados(result);
  }, [mesSeleccionado, categoriaSeleccionada, movimientos]);

  // Handler para eliminar un movimiento
  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('movimientos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Recargar datos tras eliminar
    await fetchData();
  };

  // Handler para editar un movimiento
  const handleEdit = async (id: string, updatedData: Partial<Movimiento>) => {
    const { error } = await supabase
      .from('movimientos')
      .update({
        concepto: updatedData.concepto,
        monto: updatedData.monto,
        tipo: updatedData.tipo,
        categoria: updatedData.categoria,
        metodo_pago: updatedData.metodo_pago,
        // Convertir la fecha local YYYY-MM-DD a formato timestamptz para Supabase
        fecha: updatedData.fecha ? new Date(updatedData.fecha).toISOString() : undefined
      })
      .eq('id', id);

    if (error) throw error;

    // Recargar datos tras editar
    await fetchData();
  };

  // Cálculos de Resumen Financiero (Filtrados)
  const totalIngresos = filtrados
    .filter((m) => m.tipo === 'ingreso')
    .reduce((acc, curr) => acc + Number(curr.monto), 0);

  const totalGastos = filtrados
    .filter((m) => m.tipo === 'gasto')
    .reduce((acc, curr) => acc + Number(curr.monto), 0);

  // Cálculos de Resumen Financiero (Generales/Histórico Completo)
  const totalIngresosGeneral = movimientos
    .filter((m) => m.tipo === 'ingreso')
    .reduce((acc, curr) => acc + Number(curr.monto), 0);

  const totalGastosGeneral = movimientos
    .filter((m) => m.tipo === 'gasto')
    .reduce((acc, curr) => acc + Number(curr.monto), 0);

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-slate-950"></div>;
  }

  if (!isAuthenticated) {
    return <LoginScreen onAccessGranted={() => setIsAuthenticated(true)} />;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-grow">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 bg-clip-text text-transparent pb-1">
            Control de Gastos
          </h1>
          <p className="text-slate-400 mt-2.5 text-sm sm:text-base font-medium">
            Monitoreo en tiempo real de transacciones ingresadas mediante tu bot de Telegram.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start sm:self-center bg-slate-900 border border-slate-800 hover:border-slate-700 active:bg-slate-950 px-5 py-3 rounded-xl text-sm font-bold text-slate-200 shadow-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          <RefreshCw className={`h-4.5 w-4.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      </div>

      {/* Grid de Resumen */}
      <div className="mb-10">
        <SummaryCards 
          ingresos={totalIngresos} 
          gastos={totalGastos} 
          ingresosGeneral={totalIngresosGeneral} 
          gastosGeneral={totalGastosGeneral} 
        />
      </div>

      {/* Controles de Filtrado */}
      <div className="glass-card p-6.5 mb-10">
        <h2 className="text-lg font-bold text-slate-200 mb-5 tracking-wide">Panel de Filtros</h2>
        <Filters
          mesSeleccionado={mesSeleccionado}
          setMesSeleccionado={setMesSeleccionado}
          categoriaSeleccionada={categoriaSeleccionada}
          setCategoriaSeleccionada={setCategoriaSeleccionada}
          categorias={CATEGORIAS}
        />
      </div>

      {/* Listado de Movimientos */}
      <div>
        <h2 className="text-xl font-bold text-slate-200 mb-5 tracking-wide">Últimos Movimientos</h2>
        {loading && movimientos.length === 0 ? (
          <div className="glass-card p-16 text-center text-slate-400 font-semibold animate-pulse">
            Sincronizando con Supabase...
          </div>
        ) : (
          <MovementTable
            movimientos={filtrados}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}
      </div>
    </main>
  );
}
