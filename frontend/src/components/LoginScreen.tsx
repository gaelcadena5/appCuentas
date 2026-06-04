'use client';

import React, { useState, useEffect } from 'react';
import { LockKeyhole, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onAccessGranted: () => void;
}

export function LoginScreen({ onAccessGranted }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    // Obtener la contraseña de las variables de entorno
    // Si no está configurada, usar una por defecto para desarrollo ("1234")
    const correctPassword = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || '1234';

    setTimeout(() => {
      if (password === correctPassword) {
        localStorage.setItem('dashboard_authenticated', 'true');
        onAccessGranted();
      } else {
        setError(true);
        setLoading(false);
      }
    }, 600); // Pequeño delay para dar sensación premium de validación
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Círculos de gradiente de fondo */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="glass-card p-8 md:p-10 border border-slate-800 bg-slate-900/60 shadow-2xl flex flex-col items-center">
          
          {/* Icono animado */}
          <div className="bg-indigo-500/10 p-5 rounded-2xl text-indigo-400 mb-6 border border-indigo-500/20 shadow-lg shadow-indigo-500/5 transition-all duration-300 hover:scale-105">
            <LockKeyhole className="h-8 w-8 animate-pulse text-indigo-400" />
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight text-center bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 bg-clip-text text-transparent pb-1">
            Panel Privado
          </h2>
          
          <p className="text-slate-400 text-sm font-medium text-center mt-2.5 mb-8 max-w-xs leading-relaxed">
            Introduce el código de seguridad para acceder al gestor de finanzas.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <div className="relative">
              <input
                type="password"
                placeholder="Código de acceso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-5 py-4 text-center text-lg tracking-widest text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 placeholder:text-slate-600 placeholder:tracking-normal"
              />
            </div>

            {error && (
              <p className="text-rose-400 text-xs font-bold text-center animate-bounce">
                ⚠️ Código incorrecto. Intenta de nuevo.
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-550 active:bg-indigo-700 text-white py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-sm tracking-wide"
            >
              {loading ? 'Verificando...' : 'Acceder'}
              {!loading && <ArrowRight className="h-4.5 w-4.5 text-indigo-200" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
