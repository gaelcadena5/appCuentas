import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, Scale } from 'lucide-react';

interface SummaryCardsProps {
  ingresos: number;
  gastos: number;
  ingresosGeneral: number;
  gastosGeneral: number;
}

export function SummaryCards({ ingresos, gastos, ingresosGeneral, gastosGeneral }: SummaryCardsProps) {
  const balance = ingresos - gastos;
  const balanceGeneral = ingresosGeneral - gastosGeneral;
  const balanceAjustadoGeneral = balanceGeneral - (ingresosGeneral * 0.3);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Tarjeta Ingresos */}
      <div className="glass-card p-6 flex items-center justify-between transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl hover:border-emerald-500/30 group">
        <div>
          <p className="text-sm font-medium text-slate-400">Ingresos</p>
          <h3 className="text-3xl font-extrabold text-emerald-400 mt-2 tracking-tight">
            ${ingresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="bg-emerald-500/10 p-3.5 rounded-xl text-emerald-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500/20">
          <ArrowUpRight className="h-6 w-6" />
        </div>
      </div>

      {/* Tarjeta Gastos */}
      <div className="glass-card p-6 flex items-center justify-between transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl hover:border-rose-500/30 group">
        <div>
          <p className="text-sm font-medium text-slate-400">Gastos</p>
          <h3 className="text-3xl font-extrabold text-rose-400 mt-2 tracking-tight">
            ${gastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="bg-rose-500/10 p-3.5 rounded-xl text-rose-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-rose-500/20">
          <ArrowDownRight className="h-6 w-6" />
        </div>
      </div>

      {/* Tarjeta Balance */}
      <div className="glass-card p-6 flex items-center justify-between transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl hover:border-indigo-500/30 group">
        <div>
          <p className="text-sm font-medium text-slate-400">Balance Neto</p>
          <h3 className={`text-3xl font-extrabold mt-2 tracking-tight ${balance >= 0 ? 'text-indigo-400' : 'text-amber-500'}`}>
            ${balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className={`p-3.5 rounded-xl transition-all duration-300 group-hover:scale-110 ${
          balance >= 0 
            ? 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20' 
            : 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20'
        }`}>
          <Wallet className="h-6 w-6" />
        </div>
      </div>

      {/* Tarjeta Balance Ajustado */}
      <div className="glass-card p-6 flex items-center justify-between transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl hover:border-violet-500/30 group">
        <div>
          <p className="text-sm font-medium text-slate-400">Total Extra</p>
          <h3 className={`text-3xl font-extrabold mt-2 tracking-tight ${balanceAjustadoGeneral >= 0 ? 'text-violet-400' : 'text-rose-500'}`}>
            ${balanceAjustadoGeneral.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className={`p-3.5 rounded-xl transition-all duration-300 group-hover:scale-110 ${
          balanceAjustadoGeneral >= 0 
            ? 'bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20' 
            : 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20'
        }`}>
          <Scale className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
