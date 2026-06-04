import React from 'react';

interface FiltersProps {
  mesSeleccionado: string;
  setMesSeleccionado: (mes: string) => void;
  categoriaSeleccionada: string;
  setCategoriaSeleccionada: (cat: string) => void;
  categorias: string[];
}

export function Filters({
  mesSeleccionado,
  setMesSeleccionado,
  categoriaSeleccionada,
  setCategoriaSeleccionada,
  categorias,
}: FiltersProps) {
  
  const meses = [
    { value: 'all', label: 'Todos los meses' },
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Selector de Mes */}
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">
          Filtrar por Mes
        </label>
        <select
          value={mesSeleccionado}
          onChange={(e) => setMesSeleccionado(e.target.value)}
          className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
        >
          {meses.map((m) => (
            <option key={m.value} value={m.value} className="bg-slate-900 text-slate-200">
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Categoría */}
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">
          Filtrar por Categoría
        </label>
        <select
          value={categoriaSeleccionada}
          onChange={(e) => setCategoriaSeleccionada(e.target.value)}
          className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
        >
          <option value="all" className="bg-slate-900 text-slate-200">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat} className="bg-slate-900 text-slate-200">
              {cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
