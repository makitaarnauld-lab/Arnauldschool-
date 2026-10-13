import React, { useState } from 'react';
import { School, User, ClassRoom, Student } from '../types';
import { genId, AcademicYears } from '../lib/storage';
import { Building2, Plus, Edit2, Trash2, CheckCircle2, X, FileText, Sparkles } from 'lucide-react';
import { SchoolHeaderModal } from './SchoolHeaderModal';

interface SchoolsViewProps {
  user: User | null;
  schools: School[];
  activeSchool: School | null;
  classes: ClassRoom[];
  students: Student[];
  onSelectSchool: (id: string) => void;
  onUpdateSchools: (schools: School[]) => void;
}

export const SchoolsView: React.FC<SchoolsViewProps> = ({
  user,
  schools,
  activeSchool,
  classes,
  students,
  onSelectSchool,
  onUpdateSchools,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [headerModalSchool, setHeaderModalSchool] = useState<School | null>(null);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [type, setType] = useState('Lycée');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [director, setDirector] = useState('');
  const [yearLabel, setYearLabel] = useState(AcademicYears.current());

  const handleOpenNew = () => {
    setEditingSchool(null);
    setName('');
    setShortName('');
    setType('Lycée & Collège');
    setAddress('');
    setCity(user?.city || '');
    setDirector('');
    setYearLabel(AcademicYears.current());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: School) => {
    setEditingSchool(s);
    setName(s.name);
    setShortName(s.short_name || '');
    setType(s.type);
    setAddress(s.address || '');
    setCity(s.city || '');
    setDirector(s.director || '');
    setYearLabel(s.year_label || AcademicYears.current());
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Le nom de l'établissement est obligatoire.");
      return;
    }
    if (editingSchool) {
      const updated = schools.map((s) =>
        s.id === editingSchool.id
          ? {
              ...s,
              name: name.trim(),
              short_name: shortName.trim() || undefined,
              type,
              address: address.trim() || undefined,
              city: city.trim() || undefined,
              director: director.trim() || undefined,
              year_label: yearLabel,
            }
          : s
      );
      onUpdateSchools(updated);
    } else {
      const newSchool: School = {
        id: genId('school'),
        owner_id: user?.id || 'default_user',
        name: name.trim(),
        short_name: shortName.trim() || undefined,
        type,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        country: user?.country || 'CG',
        director: director.trim() || undefined,
        year_label: yearLabel,
        created_at: new Date().toISOString(),
      };
      onUpdateSchools([...schools, newSchool]);
      if (schools.length === 0) {
        onSelectSchool(newSchool.id);
      }
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Voulez-vous supprimer cet établissement ?')) {
      const remaining = schools.filter((s) => s.id !== id);
      onUpdateSchools(remaining);
      if (activeSchool?.id === id && remaining.length > 0) {
        onSelectSchool(remaining[0].id);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-black text-slate-900 dark:text-white">
            Mes Établissements Scolaires
          </h1>
          <p className="text-xs text-slate-500">
            Gérez vos écoles et personnalisez les en-têtes officiels A4 pour les documents et bulletins.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeSchool && (
            <button
              type="button"
              onClick={() => setHeaderModalSchool(activeSchool)}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-cyan-300 transition-transform active:scale-95 cursor-pointer shadow-2xs"
            >
              <FileText className="h-4 w-4" />
              <span>Configurer l'En-tête A4</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvel Établissement</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((s) => {
          const isActive = s.id === activeSchool?.id;
          const schoolClassesCount = classes.filter((c) => c.establishment_id === s.id).length;
          const schoolStudentsCount = students.filter(
            (st) => st.establishment_id === s.id && st.status === 'active'
          ).length;

          return (
            <div
              key={s.id}
              className={`relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all dark:bg-slate-900 ${
                isActive
                  ? 'border-blue-600 ring-2 ring-blue-600/20 dark:border-cyan-400'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
              }`}
            >
              {isActive && (
                <div className="absolute -top-3 right-4 flex items-center gap-1 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-black uppercase text-white shadow-xs">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Actif</span>
                </div>
              )}
              <div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-cyan-500 text-white shadow-sm">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </h3>
                    <div className="text-xs text-slate-500">
                      {s.type} • {s.city || 'Congo'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-y border-slate-100 py-3 dark:border-slate-800 text-center">
                  <div>
                    <div className="font-display text-lg font-bold text-slate-900 dark:text-white">
                      {schoolClassesCount}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Classes</div>
                  </div>
                  <div>
                    <div className="font-display text-lg font-bold text-slate-900 dark:text-white">
                      {schoolStudentsCount}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Élèves</div>
                  </div>
                </div>

                {/* Official A4 Header quick preview badge */}
                <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-850/50 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="font-bold flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
                      En-tête Officiel A4
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      {s.header_config ? 'Configuré' : 'Par défaut'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {s.header_config?.republicTitle || 'RÉPUBLIQUE DU CONGO'} • {s.header_config?.ministry || 'Ministère Enseignement'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setHeaderModalSchool(s)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 py-1.5 text-[11px] font-bold text-white shadow-2xs transition-all cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Créer / Modifier l'En-tête A4</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                {!isActive ? (
                  <button
                    type="button"
                    onClick={() => onSelectSchool(s.id)}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    Activer
                  </button>
                ) : (
                  <span className="text-xs font-bold text-blue-600 dark:text-cyan-400">
                    Sélectionné
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(s)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 cursor-pointer"
                    title="Modifier les coordonnées"
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
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {editingSchool ? "Modifier l'établissement" : 'Nouvel Établissement'}
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
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Nom officiel de l'école *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lycée de la Révolution, Collège Chaminade..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Sigle / Sigle abrégé</label>
                  <input
                    type="text"
                    placeholder="Ex: LR, CSIE..."
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Type d'établissement</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="Lycée">Lycée Général</option>
                    <option value="Collège">Collège d'Enseignement Général</option>
                    <option value="Lycée & Collège">Lycée & Collège</option>
                    <option value="Lycée Technique">Lycée Technique & Professionnel</option>
                    <option value="École Primaire">École Primaire</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Chef d'établissement / Directeur</label>
                  <input
                    type="text"
                    placeholder="Ex: M. Jean-Paul Mbemba"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Ville</label>
                  <input
                    type="text"
                    placeholder="Ex: Brazzaville, Dakar, Douala..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Année Scolaire</label>
                <select
                  value={yearLabel}
                  onChange={(e) => setYearLabel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {AcademicYears.ALL.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
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

      {/* School Header Modal */}
      <SchoolHeaderModal
        isOpen={!!headerModalSchool}
        school={headerModalSchool}
        onClose={() => setHeaderModalSchool(null)}
        onSaveHeader={(updatedSchool) => {
          const next = schools.map((s) => (s.id === updatedSchool.id ? updatedSchool : s));
          onUpdateSchools(next);
        }}
      />
    </div>
  );
};
