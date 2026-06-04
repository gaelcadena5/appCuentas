import React, { useState } from 'react';
import { Calendar, CreditCard, Tag, Pencil, Trash2, X } from 'lucide-react';

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

interface MovementTableProps {
  movimientos: Movimiento[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, updatedData: Partial<Movimiento>) => Promise<void>;
}

export function MovementTable({ movimientos, onDelete, onEdit }: MovementTableProps) {
  const [editingMov, setEditingMov] = useState<Movimiento | null>(null);
  const [editForm, setEditForm] = useState<Partial<Movimiento>>({});
  const [submitting, setSubmitting] = useState(false);

  // Abrir modal de edición y cargar datos actuales
  const handleStartEdit = (m: Movimiento) => {
    setEditingMov(m);
    // Formatear la fecha a YYYY-MM-DD para el input type="date"
    const dateFormatted = new Date(m.fecha).toISOString().split('T')[0];
    setEditForm({
      ...m,
      fecha: dateFormatted
    });
  };

  const handleCloseEdit = () => {
    setEditingMov(null);
    setEditForm({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === 'monto' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMov) return;
    setSubmitting(true);
    try {
      await onEdit(editingMov.id, editForm);
      handleCloseEdit();
    } catch (err) {
      console.error('Error al editar:', err);
      alert('Ocurrió un error al intentar actualizar el movimiento.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (id: string, concepto: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la transacción de "${concepto}"?`)) {
      try {
        await onDelete(id);
      } catch (err) {
        console.error('Error al eliminar:', err);
        alert('Ocurrió un error al intentar eliminar el movimiento.');
      }
    }
  };

  return (
    <div className="relative">
      <div className="glass-card overflow-hidden transition-all duration-300 hover:shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/40 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4.5">Concepto</th>
                <th className="px-6 py-4.5">Categoría</th>
                <th className="px-6 py-4.5">Método</th>
                <th className="px-6 py-4.5">Fecha</th>
                <th className="px-6 py-4.5 text-right">Monto</th>
                <th className="px-6 py-4.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {movimientos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No se encontraron movimientos para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                movimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/20 transition-all duration-200 group">
                    <td className="px-6 py-4.5">
                      <span className="font-semibold text-slate-200 block group-hover:text-white transition-colors duration-200">
                        {m.concepto}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-850 border border-slate-800/65 text-slate-300">
                        <Tag className="w-3 h-3 text-indigo-400" />
                        {m.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="inline-flex items-center gap-1.5 text-slate-400 text-sm">
                        <CreditCard className="w-3.5 h-3.5 text-slate-505" />
                        {m.metodo_pago}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-sm text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-550" />
                        {new Date(m.fecha).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className={`px-6 py-4.5 text-right font-extrabold text-base tracking-tight ${
                      m.tipo === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {m.tipo === 'ingreso' ? '+' : '-'}${Number(m.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleStartEdit(m)}
                          className="p-1.5 text-slate-450 hover:text-indigo-450 hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(m.id, m.concepto)}
                          className="p-1.5 text-slate-450 hover:text-rose-455 hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición (Glassmorphism overlay) */}
      {editingMov && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card w-full max-w-md p-6 relative border border-slate-700 bg-slate-900/90 shadow-2xl">
            <button
              onClick={handleCloseEdit}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">Editar Transacción</h3>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Concepto */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Concepto</label>
                <input
                  type="text"
                  name="concepto"
                  value={editForm.concepto || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Monto */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Monto ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="monto"
                    value={editForm.monto || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo</label>
                  <select
                    name="tipo"
                    value={editForm.tipo || 'gasto'}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="gasto">🔴 Gasto</option>
                    <option value="ingreso">🟢 Ingreso</option>
                  </select>
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoría</label>
                <select
                  name="categoria"
                  value={editForm.categoria || 'Gasto Necesario'}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Gasto Necesario">Gasto Necesario</option>
                  <option value="Gasto Innecesario">Gasto Innecesario</option>
                  <option value="Ingreso">Ingreso</option>
                </select>
              </div>

              {/* Método de Pago */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Método de Pago</label>
                <input
                  type="text"
                  name="metodo_pago"
                  value={editForm.metodo_pago || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={editForm.fecha || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={submitting}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-350 py-3 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-650 hover:bg-indigo-550 text-white py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-indigo-500/20 cursor-pointer"
                >
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
