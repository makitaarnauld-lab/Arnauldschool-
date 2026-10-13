import React, { useState } from 'react';
import { School, ClassRoom, Serie, Student, CycleKey } from '../types';
import { CYCLES, genId } from '../lib/storage';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  X
} from 'lucide-react';

interface ClassesViewProps {
  activeSchool: School | null;
  classes: ClassRoom[];
  series: Serie[];
  students: Student[];
  onUpdateClasses: (classes: ClassRoom[]) => void;
  onUpdateSeries: (series: Serie[]) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  activeSchool,
  classes,
  series,
  students,
  onUpdateClasses,
  onUpdateSeries,
}) => {
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  // Class Form
  const [className, setClassName] = useState('');
  const [classCycle, setClassCycle] = useState<CycleKey>('lycee');
  const [classNiveau, setClassNiveau] = useState('');
  const [classCapacity, setClassCapacity] = useState('40');

  // Series Input
  const [newSeriesCode, setNewSeriesCode] = useState('');

  const schoolClasses = classes.filter((c) => c.establishment_id === activeSchool?.id);
  const schoolSeries = series.filter((s) => s.establishment_id === activeSchool?.id);

  const handleOpenNewClass = () => {
    setEditingClass(null);
    setClassName('');
    setClassCycle('lycee');
    setClassNiveau(CYCLES.lycee.niveaux[0] || '2nde');
    setClassCapacity('40');
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (c: ClassRoom) => {
    setEditingClass(c);
    setClassName(c.name);
    setClassCycle(c.cycle);
    setClassNiveau(c.niveau);
    setClassCapacity(c.capacity ? String(c.capacity) : '');
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !classNiveau) {
      alert('Veuillez spécifier le nom et le niveau de la classe.');
      return;
    }
    const capNum = classCapacity.trim() ? parseInt(classCapacity, 10) : null;
    if (editingClass) {
      const updated = classes.map((c) =>
        c.id === editingClass.id
          ? {
              ...c,
              name: className.trim(),
              cycle: classCycle,
              niveau: classNiveau,
              capacity: capNum,
            }
          : c
      );
      onUpdateClasses(updated);
    } else {
      const newClass: ClassRoom = {
        id: genId('cls'),
        establishment_id: activeSchool?.id || '',
        name: className.trim(),
        cycle: classCycle,
        niveau: classNiveau,
        capacity: capNum,
        academic_year: activeSchool?.year_label || '2025-2026',
        created_at: new Date().toISOString(),
      };
      onUpdateClasses([...classes, newClass]);
    }
    setIsClassModalOpen(false);
  };

  const handleDeleteClass = (id: string) => {
    if (confirm('Voulez-vous supprimer cette classe ?')) {
      onUpdateClasses(classes.filter((c) => c.id !== id));
    }
  };

  const handleAddSeries = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newSeriesCode.trim().toUpperCase();
    if (!code) return;
    if (schoolSeries.some((s) => s.code === code)) {
      alert('Cette série existe déjà.');
      return;
    }
    const newSer: Serie = {
      id: genId('ser'),
      establishment_id: activeSchool?.id || '',
      code,
    };
    onUpdateSeries([...series, newSer]);
    setNewSeriesCode('');
  };

  const handleDeleteSeries = (id: string) => {
    onUpdateSeries(series.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-black text-slate-900 dark:text-white">
            Gestion des Classes & Filières
          </h1>
          <p className="text-xs text-slate-500">
            {schoolClasses.length} classe(s) configurée(s) pour {activeSchool?.name}.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenNewClass}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Créer une Classe</span>
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schoolClasses.map((c) => {
          const studentCount = students.filter(
            (s) => s.class_id === c.id && s.status === 'active'
          ).length;
          const cap = c.capacity || 40;
          const fillPercent = Math.min(100, Math.round((studentCount / cap) * 100));

          return (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {CYCLES[c.cycle]?.label || c.cycle}
                  </span>
                  <h3 className="mt-1 font-display text-lg font-black text-slate-900 dark:text-white">
                    {c.name}
                  </h3>
                  <div className="text-xs text-slate-500">Niveau : {c.niveau}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditClass(c)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 cursor-pointer"
                    title="Modifier"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClass(c.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="mt-5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Effectif inscrit :</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {studentCount} / {cap} ({fillPercent}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      fillPercent >= 90
                        ? 'bg-rose-500'
                        : fillPercent >= 75
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Series Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Séries & Spécialités (Lycée & Technique)
            </h2>
            <p className="text-xs text-slate-500">
              Codes de séries (ex: A4, C, D, E, F3...) associés aux classes.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {schoolSeries.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <span>Série {s.code}</span>
              <button
                type="button"
                onClick={() => handleDeleteSeries(s.id)}
                className="text-slate-400 hover:text-rose-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddSeries} className="flex max-w-sm items-center gap-2 pt-2">
          <input
            type="text"
            placeholder="Nouvelle série (ex: TI, F2)..."
            value={newSeriesCode}
            onChange={(e) => setNewSeriesCode(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
          >
            Ajouter
          </button>
        </form>
      </div>

      {/* Create / Edit Class Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {editingClass ? 'Modifier la classe' : 'Nouvelle classe'}
              </h2>
              <button 
                type="button" 
                onClick={() => setIsClassModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Fermer la boîte de dialogue"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="mt-4 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Cycle scolaire</label>
                <select
                  value={classCycle}
                  onChange={(e) => {
                    const nextC = e.target.value as CycleKey;
                    setClassCycle(nextC);
                    setClassNiveau(CYCLES[nextC]?.niveaux[0] || '');
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {Object.values(CYCLES).map((c) => (
                    <option key={c.key} value={c.key}>{c.label} ({c.desc})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Niveau</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {CYCLES[classCycle]?.niveaux.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setClassNiveau(n)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer ${
                        classNiveau === n
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Nom de la classe (ex: Terminale C, 3ème B) *</label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ex: Terminale C"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Capacité maximale d'accueil</label>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={classCapacity}
                  onChange={(e) => setClassCapacity(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
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
