import React, { useState } from 'react';
import { School, ClassRoom, Subject, Student, GradeRecord } from '../types';
import { 
  computeGradeAverage, 
  computeGradeTotal, 
  getAppreciation, 
  AcademicYears,
  genId
} from '../lib/storage';
import { exportClassGradebookPDF } from '../lib/pdfExport';
import { 
  FileSpreadsheet, 
  Download, 
  Sparkles, 
  CheckCircle2, 
} from 'lucide-react';

interface GradesViewProps {
  activeSchool: School | null;
  classes: ClassRoom[];
  subjects: Subject[];
  students: Student[];
  grades: GradeRecord[];
  onUpdateGrades: (updatedGrades: GradeRecord[]) => void;
  onNavigateToAI: (prompt: string) => void;
}

export const GradesView: React.FC<GradesViewProps> = ({
  activeSchool,
  classes,
  subjects,
  students,
  grades,
  onUpdateGrades,
  onNavigateToAI,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(() => classes[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => subjects[0]?.id || '');
  const [selectedPeriod, setSelectedPeriod] = useState<'T1' | 'T2' | 'T3'>('T1');
  const [selectedYear, setSelectedYear] = useState<string>(() => AcademicYears.current());
  const [hasSavedFeedback, setHasSavedFeedback] = useState<boolean>(false);

  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const classStudents = students.filter(
    (st) => st.class_id === (activeClass?.id || '') && st.status === 'active'
  );

  const handleGradeChange = (
    studentId: string,
    field: 'devoir1' | 'devoir2' | 'devoir3' | 'devoir_dept' | 'composition',
    valueStr: string
  ) => {
    let numVal: number | null = null;
    if (valueStr.trim() !== '') {
      const parsed = parseFloat(valueStr);
      if (!isNaN(parsed)) {
        numVal = Math.max(0, Math.min(20, parsed));
      }
    }

    const existingIndex = grades.findIndex(
      (g) =>
        g.student_id === studentId &&
        g.subject_id === activeSubject?.id &&
        g.period === selectedPeriod &&
        g.year === selectedYear
    );

    let nextGrades = [...grades];
    if (existingIndex >= 0) {
      nextGrades[existingIndex] = {
        ...nextGrades[existingIndex],
        [field]: numVal,
      };
    } else {
      const newGrade: GradeRecord = {
        id: genId('grd'),
        establishment_id: activeSchool?.id || '',
        student_id: studentId,
        class_id: activeClass?.id || '',
        subject_id: activeSubject?.id || '',
        period: selectedPeriod,
        year: selectedYear,
        [field]: numVal,
      };
      nextGrades.push(newGrade);
    }
    onUpdateGrades(nextGrades);
    setHasSavedFeedback(true);
    setTimeout(() => setHasSavedFeedback(false), 2000);
  };

  const handleExportPDF = () => {
    if (!activeSchool || !activeClass || !activeSubject) return;
    exportClassGradebookPDF(
      activeSchool,
      activeClass,
      activeSubject,
      classStudents,
      grades,
      selectedPeriod
    );
  };

  const handleGenerateClassAIReport = () => {
    const studentAvgs = classStudents.map((st) => {
      const g = grades.find(
        (x) => x.student_id === st.id && x.subject_id === activeSubject?.id && x.period === selectedPeriod
      );
      const avg = computeGradeAverage(g);
      return `${st.last_name} ${st.first_name} : ${avg !== null ? `${avg}/20` : 'Non noté'}`;
    });

    const prompt = `Voici les résultats de ma classe de ${activeClass?.name} en ${activeSubject?.name} pour le ${selectedPeriod} :\n${studentAvgs.join('\n')}\n\nFais une analyse pédagogique globale : points forts, difficultés majeures identifiées et préconisations didactiques pour la classe.`;
    onNavigateToAI(prompt);
  };

  if (!activeSchool || classes.length === 0 || subjects.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-400" />
        <h2 className="mt-3 font-display text-lg font-bold text-slate-800 dark:text-slate-100">
          Configuration requise
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Veuillez créer au moins un établissement, une classe et une matière pour accéder au tableur de notes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-xl font-black text-slate-900 dark:text-white">
              Saisie des Notes & Calcul des Moyennes
            </h1>
            <p className="text-xs text-slate-500">
              {activeSchool.name} • Les moyennes et appréciations sont recalculées instantanément.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateClassAIReport}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Bilan Pédagogique IA</span>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Exporter PDF</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase">Année Académique</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {AcademicYears.ALL.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase">Classe</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.niveau})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase">Matière</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} (Coef. {s.default_coefficient})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase">Période</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="T1">1er Trimestre (T1)</option>
              <option value="T2">2e Trimestre (T2)</option>
              <option value="T3">3e Trimestre (T3)</option>
            </select>
          </div>
        </div>

        {hasSavedFeedback && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Note enregistrée automatiquement dans votre base locale.</span>
          </div>
        )}
      </div>

      {/* Spreadsheet Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
              <th className="py-3.5 px-4">Élève</th>
              <th className="py-3.5 px-3 text-center">Devoir 1 <span className="text-[10px] opacity-75">(×1)</span></th>
              <th className="py-3.5 px-3 text-center">Devoir 2 <span className="text-[10px] opacity-75">(×1)</span></th>
              <th className="py-3.5 px-3 text-center">Devoir 3 <span className="text-[10px] opacity-75">(×1)</span></th>
              <th className="py-3.5 px-3 text-center">Dept. <span className="text-[10px] opacity-75">(×2)</span></th>
              <th className="py-3.5 px-3 text-center">Total</th>
              <th className="py-3.5 px-3 text-center">Comp. <span className="text-[10px] opacity-75">(×2)</span></th>
              <th className="py-3.5 px-4 text-center font-black text-blue-600 dark:text-cyan-400">Moyenne</th>
              <th className="py-3.5 px-4 text-right">Appréciation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {classStudents.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  Aucun élève enregistré dans la classe <strong>{activeClass?.name}</strong>.
                </td>
              </tr>
            ) : (
              classStudents.map((st) => {
                const grade = grades.find(
                  (g) =>
                    g.student_id === st.id &&
                    g.subject_id === activeSubject?.id &&
                    g.period === selectedPeriod &&
                    g.year === selectedYear
                );
                const avg = computeGradeAverage(grade);
                const tot = computeGradeTotal(grade);
                const app = getAppreciation(avg);

                return (
                  <tr
                    key={st.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-850/50"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {st.last_name} {st.first_name}
                      </div>
                      <div className="text-[11px] text-slate-400">{st.matricule}</div>
                    </td>

                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.25"
                        placeholder="—"
                        value={grade?.devoir1 !== undefined && grade?.devoir1 !== null ? grade.devoir1 : ''}
                        onChange={(e) => handleGradeChange(st.id, 'devoir1', e.target.value)}
                        className="h-9 w-16 rounded-lg border border-slate-200 bg-slate-50 text-center font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 tabular-nums"
                      />
                    </td>

                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.25"
                        placeholder="—"
                        value={grade?.devoir2 !== undefined && grade?.devoir2 !== null ? grade.devoir2 : ''}
                        onChange={(e) => handleGradeChange(st.id, 'devoir2', e.target.value)}
                        className="h-9 w-16 rounded-lg border border-slate-200 bg-slate-50 text-center font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 tabular-nums"
                      />
                    </td>

                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.25"
                        placeholder="—"
                        value={grade?.devoir3 !== undefined && grade?.devoir3 !== null ? grade.devoir3 : ''}
                        onChange={(e) => handleGradeChange(st.id, 'devoir3', e.target.value)}
                        className="h-9 w-16 rounded-lg border border-slate-200 bg-slate-50 text-center font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 tabular-nums"
                      />
                    </td>

                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.25"
                        placeholder="—"
                        value={grade?.devoir_dept !== undefined && grade?.devoir_dept !== null ? grade.devoir_dept : ''}
                        onChange={(e) => handleGradeChange(st.id, 'devoir_dept', e.target.value)}
                        className="h-9 w-16 rounded-lg border border-slate-200 bg-slate-50 text-center font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 tabular-nums"
                      />
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                      {tot !== null ? tot.toFixed(2) : '—'}
                    </td>

                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.25"
                        placeholder="—"
                        value={grade?.composition !== undefined && grade?.composition !== null ? grade.composition : ''}
                        onChange={(e) => handleGradeChange(st.id, 'composition', e.target.value)}
                        className="h-9 w-16 rounded-lg border border-slate-200 bg-slate-50 text-center font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 tabular-nums"
                      />
                    </td>

                    <td className="py-3 px-4 text-center font-display text-sm font-black tabular-nums">
                      {avg !== null ? (
                        <span className={avg >= 10 ? 'text-blue-600 dark:text-cyan-400' : 'text-rose-600 dark:text-rose-400'}>
                          {avg.toFixed(2)} / 20
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${app.badgeClass}`}>
                        {app.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
