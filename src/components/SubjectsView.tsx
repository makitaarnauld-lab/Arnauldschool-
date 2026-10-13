import React, { useState } from 'react';
import { School, Subject } from '../types';
import { genId } from '../lib/storage';
import { Plus, Trash2, Edit2, X } from 'lucide-react';

interface SubjectsViewProps {
  activeSchool: School | null;
  subjects: Subject[];
  onUpdateSubjects: (subjects: Subject[]) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  activeSchool,
  subjects,
  onUpdateSubjects,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [coefficient, setCoefficient] = useState('4');

  const schoolSubjects = subjects.filter((s) => s.establishment_id === activeSchool?.id);

  const handleOpenNew = () => {
    setEditingSubject(null);
    setName('');
    setCode('');
    setCoefficient('4');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Subject) => {
    setEditingSubject(s);
    setName(s.name);
    setCode(s.code || '');
    setCoefficient(String(s.default_coefficient));
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const coefNum = parseFloat(coefficient);
    if (!name.trim() || isNaN(coefNum) || coefNum <= 0) {
      alert('Veuillez spécifier un nom et un coefficient valide (> 0).');
      return;
    }
    if (editingSubject) {
      const updated = subjects.map((s) =>
        s.id === editingSubject.id
          ? {
              ...s,
              name: name.trim(),
              code: code.trim().toUpperCase() || undefined,
              default_coefficient: coefNum,
            }
          : s
      );
      onUpdateSubjects(updated);
    } else {
      const newSub: Subject = {
        id: genId('sub'),
        establishment_id: activeSchool?.id || '',
        name: name.trim(),
        code: code.trim().toUpperCase() || undefined,
        default_coefficient: coefNum,
        created_at: new Date().toISOString(),
      };
      onUpdateSubjects([...subjects, newSub]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Voulez-vous supprimer cette matière ?')) {
      onUpdateSubjects(subjects.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-black text-slate-900 dark:text-white">
            Matières & Coefficients Pédagogiques
          </h1>
          <p className="text-xs text-slate-500">
            {schoolSubjects.length} discipline(s) configurée(s) pour le calcul des moyennes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter une Matière</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schoolSubjects.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {s.code || 'MAT'}
              </span>
              <h3 className="mt-1 font-display text-sm font-bold text-slate-900 dark:text-white">
                {s.name}
              </h3>
              <div className="text-xs font-semibold text-blue-600 dark:text-cyan-400">
                Coefficient : ×{s.default_coefficient}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleOpenEdit(s)}
                className="p-1.5 text-slate-400 hover:text-blue-600 cursor-pointer"
                title="Modifier"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(s.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {editingSubject ? 'Modifier la matière' : 'Ajouter une matière'}
              </h2>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Fermer la boîte de dialogue"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Intitulé de la matière *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mathématiques, SVT, Philosophie..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Code abrégé (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: MATH, PC, PHI..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold uppercase text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Coefficient de pondération *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="20"
                  required
                  value={coefficient}
                  onChange={(e) => setCoefficient(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
