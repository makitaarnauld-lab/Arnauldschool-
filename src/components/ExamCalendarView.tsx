import React, { useState, useMemo } from 'react';
import { School, ClassRoom, Subject, ExamEvent, ExamType } from '../types';
import { genId, EXAM_TYPES_CONFIG } from '../lib/storage';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2, 
  Sparkles, 
  FileSpreadsheet, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  X, 
  DoorOpen, 
  CalendarCheck2 
} from 'lucide-react';

interface ExamCalendarViewProps {
  activeSchool: School | null;
  classes: ClassRoom[];
  subjects: Subject[];
  exams: ExamEvent[];
  onUpdateExams: (exams: ExamEvent[]) => void;
  onNavigateToAI: (prompt: string) => void;
  onNavigateToGrades?: (classId: string, subjectId: string) => void;
}

export const ExamCalendarView: React.FC<ExamCalendarViewProps> = ({
  activeSchool,
  classes,
  subjects,
  exams,
  onUpdateExams,
  onNavigateToAI,
  onNavigateToGrades,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExam, setEditingExam] = useState<ExamEvent | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formClassId, setFormClassId] = useState(classes[0]?.id || '');
  const [formSubjectId, setFormSubjectId] = useState(subjects[0]?.id || '');
  const [formType, setFormType] = useState<ExamType>('devoir');
  const [formPeriod, setFormPeriod] = useState<'T1' | 'T2' | 'T3'>('T1');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formDuration, setFormDuration] = useState('120');
  const [formCoefficient, setFormCoefficient] = useState('1');
  const [formRoom, setFormRoom] = useState('Salle A01');
  const [formInstructions, setFormInstructions] = useState('');

  const filteredExams = useMemo(() => {
    return exams.filter((ex) => {
      if (ex.establishment_id !== activeSchool?.id) return false;
      if (selectedClassId !== 'all' && ex.class_id !== selectedClassId) return false;
      if (selectedPeriod !== 'all' && ex.period !== selectedPeriod) return false;
      if (selectedType !== 'all' && ex.type !== selectedType) return false;
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date) || (a.start_time || '').localeCompare(b.start_time || ''));
  }, [exams, activeSchool, selectedClassId, selectedPeriod, selectedType]);

  const handleOpenNewExam = (initialDate?: string) => {
    setEditingExam(null);
    setFormTitle('');
    setFormClassId(selectedClassId !== 'all' ? selectedClassId : classes[0]?.id || '');
    setFormSubjectId(subjects[0]?.id || '');
    setFormType('devoir');
    setFormPeriod('T1');
    setFormDate(initialDate || new Date().toISOString().split('T')[0]);
    setFormStartTime('08:00');
    setFormDuration('120');
    setFormCoefficient('1');
    setFormRoom('Salle A01');
    setFormInstructions('');
    setIsModalOpen(true);
  };

  const handleOpenEditExam = (ex: ExamEvent) => {
    setEditingExam(ex);
    setFormTitle(ex.title);
    setFormClassId(ex.class_id);
    setFormSubjectId(ex.subject_id);
    setFormType(ex.type);
    setFormPeriod(ex.period);
    setFormDate(ex.date);
    setFormStartTime(ex.start_time || '08:00');
    setFormDuration(String(ex.duration_minutes || 120));
    setFormCoefficient(String(ex.coefficient || 1));
    setFormRoom(ex.room || '');
    setFormInstructions(ex.instructions || '');
    setIsModalOpen(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate || !formClassId || !formSubjectId) {
      alert('Veuillez remplir le titre, la date, la classe et la matière.');
      return;
    }
    if (editingExam) {
      const updated = exams.map((ex) =>
        ex.id === editingExam.id
          ? {
              ...ex,
              title: formTitle.trim(),
              class_id: formClassId,
              subject_id: formSubjectId,
              type: formType,
              period: formPeriod,
              date: formDate,
              start_time: formStartTime,
              duration_minutes: parseInt(formDuration, 10) || 120,
              coefficient: parseFloat(formCoefficient) || 1,
              room: formRoom.trim() || undefined,
              instructions: formInstructions.trim() || undefined,
            }
          : ex
      );
      onUpdateExams(updated);
    } else {
      const newExam: ExamEvent = {
        id: genId('exam'),
        establishment_id: activeSchool?.id || '',
        title: formTitle.trim(),
        class_id: formClassId,
        subject_id: formSubjectId,
        type: formType,
        period: formPeriod,
        date: formDate,
        start_time: formStartTime,
        duration_minutes: parseInt(formDuration, 10) || 120,
        coefficient: parseFloat(formCoefficient) || 1,
        room: formRoom.trim() || undefined,
        instructions: formInstructions.trim() || undefined,
        status: 'planned',
        created_at: new Date().toISOString(),
      };
      onUpdateExams([...exams, newExam]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteExam = (id: string) => {
    if (confirm('Voulez-vous supprimer cette évaluation du planning ?')) {
      onUpdateExams(exams.filter((ex) => ex.id !== id));
    }
  };

  const handleToggleStatus = (ex: ExamEvent) => {
    const nextStatus = ex.status === 'planned' ? 'completed' : 'planned';
    const updated = exams.map((item) =>
      item.id === ex.id ? { ...item, status: nextStatus as any } : item
    );
    onUpdateExams(updated);
  };

  const handleGenerateExamAI = (ex: ExamEvent) => {
    const cls = classes.find((c) => c.id === ex.class_id);
    const sub = subjects.find((s) => s.id === ex.subject_id);
    const typeLabel = EXAM_TYPES_CONFIG[ex.type]?.label || 'Épreuve';
    const prompt = `Je planifie un(e) **${typeLabel}** en **${sub?.name || 'Matière'}** pour la classe de **${cls?.name || 'Classe'}** (${cls?.niveau || 'Niveau'}). Titre de l'évaluation : "${ex.title}". Durée de l'épreuve : ${ex.duration_minutes || 120} minutes. Barème total : sur 20 points. Consignes spécifiques : ${ex.instructions || 'Aucune consigne particulière'}.\n\nRédige :\n1. Le sujet d'examen complet prêt à distribuer aux élèves, structuré en 3 parties progressives.\n2. Le barème chiffré très précis (points attribués par sous-question).\n3. Le corrigé intégral et détaillé étape par étape pour l'enseignant.`;
    onNavigateToAI(prompt);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayIndex = (firstDayOfMonth + 6) % 7;

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-cyan-400">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-black text-slate-900 dark:text-white">
                Calendrier des Examens & Évaluations
              </h1>
              <p className="text-xs text-slate-500">
                Planification des devoirs surveillés, départements et compositions par classe.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-cyan-300'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Vue Calendrier
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-cyan-300'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Vue Liste par Classe
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleOpenNewExam()}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Planifier un examen</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          <Filter className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
          <span>Filtres par classe & trimestre :</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Classe :</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="all">Toutes les classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.niveau})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Période :</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="all">Tous les trimestres</option>
              <option value="T1">1er Trimestre (T1)</option>
              <option value="T2">2e Trimestre (T2)</option>
              <option value="T3">3e Trimestre (T3)</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Type :</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="all">Tous les types</option>
              <option value="devoir">Devoirs Surveillés</option>
              <option value="devoir_dept">Devoirs Départementaux</option>
              <option value="composition">Compositions</option>
              <option value="interrogation">Interrogations</option>
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-lg font-black text-slate-900 dark:text-white">
                {monthNames[month]} {year}
              </h2>
              <button
                type="button"
                onClick={handleToday}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Aujourd'hui
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                aria-label="Mois précédent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                aria-label="Mois suivant"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400 py-2.5">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mer</span>
              <span>Jeu</span>
              <span>Ven</span>
              <span>Sam</span>
              <span>Dim</span>
            </div>
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
              {Array.from({ length: startingDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-24 bg-slate-50/50 dark:bg-slate-950/20 p-2" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayExams = filteredExams.filter((ex) => ex.date === dateStr);
                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                return (
                  <div
                    key={dayNum}
                    className={`min-h-28 p-2 transition-colors hover:bg-white dark:hover:bg-slate-850 ${
                      isToday ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          isToday
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {dayNum}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenNewExam(dateStr)}
                        className="text-slate-300 hover:text-blue-600 dark:text-slate-600 dark:hover:text-cyan-400 cursor-pointer"
                        title="Ajouter un examen ce jour"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {dayExams.map((ex) => {
                        const cls = classes.find((c) => c.id === ex.class_id);
                        const sub = subjects.find((s) => s.id === ex.subject_id);
                        const typeCfg = EXAM_TYPES_CONFIG[ex.type];
                        return (
                          <div
                            key={ex.id}
                            onClick={() => handleOpenEditExam(ex)}
                            className="group cursor-pointer rounded-lg border border-slate-200/80 bg-white p-1.5 text-[11px] shadow-2xs hover:border-blue-500 hover:shadow-xs dark:border-slate-700 dark:bg-slate-800 transition-all"
                            title={`${ex.title} (${cls?.name} - ${sub?.name})`}
                          >
                            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100 truncate">
                              <span className="truncate">{sub?.name || 'Matière'}</span>
                              <span className="text-[9px] text-slate-400 font-mono shrink-0">
                                {ex.start_time || '08:00'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate mt-0.5">
                              <span className="font-semibold text-blue-600 dark:text-cyan-400">{cls?.name}</span>
                              <span>•</span>
                              <span className="truncate">{typeCfg?.label.slice(0, 10)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExams.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <CalendarIcon className="mx-auto h-12 w-12 text-slate-400" />
              <h2 className="mt-3 font-display text-base font-bold text-slate-800 dark:text-slate-100">
                Aucune évaluation planifiée
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Utilisez le bouton "Planifier un examen" pour ajouter vos devoirs surveillés ou compositions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredExams.map((ex) => {
                const cls = classes.find((c) => c.id === ex.class_id);
                const sub = subjects.find((s) => s.id === ex.subject_id);
                const typeCfg = EXAM_TYPES_CONFIG[ex.type];
                const isCompleted = ex.status === 'completed';
                return (
                  <div
                    key={ex.id}
                    className={`relative rounded-2xl border bg-white p-5 shadow-xs transition-all dark:bg-slate-900 ${
                      isCompleted
                        ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/30 dark:bg-emerald-950/10'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${typeCfg?.badgeClass}`}>
                            {typeCfg?.label}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            Classe : {cls?.name}
                          </span>
                          <span className="text-[11px] font-bold text-blue-600 dark:text-cyan-400">
                            {ex.period}
                          </span>
                        </div>
                        <h3 className="mt-2 font-display text-base font-black text-slate-900 dark:text-white">
                          {ex.title}
                        </h3>
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                          {sub?.name} • Coef. ×{ex.coefficient || sub?.default_coefficient}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditExam(ex)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExam(ex.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                        <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
                        {new Date(ex.date).toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3.5 w-3.5 text-cyan-500" />
                        {ex.start_time || '08:00'} ({ex.duration_minutes || 120} min)
                      </span>
                      {ex.room && (
                        <span className="flex items-center gap-1">
                          <DoorOpen className="h-3.5 w-3.5 text-purple-500" />
                          {ex.room}
                        </span>
                      )}
                    </div>

                    {ex.instructions && (
                      <p className="mt-2 text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg dark:bg-slate-850">
                        "{ex.instructions}"
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(ex)}
                        className={`flex items-center gap-1 text-xs font-bold cursor-pointer ${
                          isCompleted ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{isCompleted ? 'Évaluation notée' : 'Marquer comme noté'}</span>
                      </button>
                      <div className="flex items-center gap-2">
                        {onNavigateToGrades && (
                          <button
                            type="button"
                            onClick={() => onNavigateToGrades(ex.class_id, ex.subject_id)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                            title="Ouvrir le tableur pour saisir les notes de cette épreuve"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            <span>Notes</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleGenerateExamAI(ex)}
                          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                          title="Générer automatiquement le sujet et le corrigé complet avec barème via Gemini"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Générer Sujet & Corrigé IA</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {editingExam ? "Modifier l'évaluation" : "Planifier une nouvelle évaluation"}
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

            <form onSubmit={handleSaveExam} className="mt-4 space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Intitulé de l'épreuve *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Devoir Surveillé 1 : Équations & Trigonométrie"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Classe cible *</label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Matière *</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Type d'évaluation</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ExamType)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="devoir">Devoir Surveillé (×1)</option>
                    <option value="devoir_dept">Devoir Départemental (×2)</option>
                    <option value="composition">Composition Trimestrielle (×2)</option>
                    <option value="interrogation">Interrogation Écrite (×1)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Période académique</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="T1">1er Trimestre (T1)</option>
                    <option value="T2">2e Trimestre (T2)</option>
                    <option value="T3">3e Trimestre (T3)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Heure de début</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Durée (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="360"
                    step="15"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Salle d'examen</label>
                  <input
                    type="text"
                    placeholder="Ex: Salle B12, Amphithéâtre..."
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Coefficient</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="20"
                    value={formCoefficient}
                    onChange={(e) => setFormCoefficient(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Consignes & Matériel autorisé</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Calculatrice autorisée, table de logarithmes fournie..."
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 resize-none"
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
