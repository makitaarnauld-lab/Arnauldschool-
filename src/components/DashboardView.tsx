import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  School, ClassRoom, Student, Subject, GradeRecord, User, ExamEvent 
} from '../types';
import { 
  computeGradeAverage, 
  getAppreciation, 
  AcademicYears,
  EXAM_TYPES_CONFIG
} from '../lib/storage';
import { COUNTRY_DATA } from '../lib/countryData';
import { 
  Users, 
  Award, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  FileSpreadsheet, 
  UserPlus, 
  BookOpen, 
  BarChart3, 
  Calendar, 
  ArrowUpRight,
  ShieldAlert,
  GraduationCap,
  CalendarCheck2,
  Clock
} from 'lucide-react';
import Chart from 'chart.js/auto';

interface DashboardViewProps {
  user: User | null;
  activeSchool: School | null;
  classes: ClassRoom[];
  students: Student[];
  subjects: Subject[];
  grades: GradeRecord[];
  exams?: ExamEvent[];
  onNavigate: (module: string) => void;
  onLaunchAIRemediation?: (studentName: string, subjectName: string, average: number) => void;
  onLaunchAIExam?: (exam: ExamEvent) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  activeSchool,
  classes,
  students,
  subjects,
  grades,
  exams = [],
  onNavigate,
  onLaunchAIRemediation,
  onLaunchAIExam,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'T1' | 'T2' | 'T3'>('T1');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  const chartClassesRef = useRef<HTMLCanvasElement | null>(null);
  const chartHonorsRef = useRef<HTMLCanvasElement | null>(null);
  const chartEvolutionRef = useRef<HTMLCanvasElement | null>(null);
  const chartSubjectsRef = useRef<HTMLCanvasElement | null>(null);

  const country = user?.country ? COUNTRY_DATA[user.country] : null;

  // Filter students by selected class
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.status === 'archived') return false;
      if (selectedClassId === 'all') return true;
      return s.class_id === selectedClassId;
    });
  }, [students, selectedClassId]);

  // Compute stats per student for the selected period
  const studentStats = useMemo(() => {
    return filteredStudents.map((st) => {
      const studentGrades = grades.filter(
        (g) => g.student_id === st.id && g.period === selectedPeriod
      );
      let weightedSum = 0;
      let totalCoeff = 0;

      subjects.forEach((sub) => {
        const g = studentGrades.find((x) => x.subject_id === sub.id);
        const avg = computeGradeAverage(g);
        if (avg !== null) {
          weightedSum += avg * sub.default_coefficient;
          totalCoeff += sub.default_coefficient;
        }
      });

      const generalAverage = totalCoeff > 0 ? Number((weightedSum / totalCoeff).toFixed(2)) : null;
      const classObj = classes.find((c) => c.id === st.class_id);

      return {
        student: st,
        classRoom: classObj,
        generalAverage,
        appreciation: getAppreciation(generalAverage),
      };
    });
  }, [filteredStudents, grades, selectedPeriod, subjects, classes]);

  // Aggregate KPIs
  const kpis = useMemo(() => {
    const evaluated = studentStats.filter((s) => s.generalAverage !== null);
    const totalCount = filteredStudents.length;
    const boysCount = filteredStudents.filter((s) => s.gender === 'M').length;
    const girlsCount = filteredStudents.filter((s) => s.gender === 'F').length;

    if (evaluated.length === 0) {
      return {
        totalStudents: totalCount,
        boysCount,
        girlsCount,
        schoolAverage: null,
        passRate: 0,
        excellenceCount: 0,
        remedialCount: 0,
      };
    }

    const sumAvgs = evaluated.reduce((acc, curr) => acc + (curr.generalAverage || 0), 0);
    const schoolAverage = Number((sumAvgs / evaluated.length).toFixed(2));
    const passCount = evaluated.filter((s) => (s.generalAverage || 0) >= 10).length;
    const passRate = Number(((passCount / evaluated.length) * 100).toFixed(1));
    const excellenceCount = evaluated.filter((s) => (s.generalAverage || 0) >= 14).length;
    const remedialCount = evaluated.filter((s) => (s.generalAverage || 0) < 10).length;

    return {
      totalStudents: totalCount,
      boysCount,
      girlsCount,
      schoolAverage,
      passRate,
      excellenceCount,
      remedialCount,
    };
  }, [studentStats, filteredStudents]);

  // Top 5 Honor Roll
  const honorRoll = useMemo(() => {
    return [...studentStats]
      .filter((s) => s.generalAverage !== null)
      .sort((a, b) => (b.generalAverage || 0) - (a.generalAverage || 0))
      .slice(0, 5);
  }, [studentStats]);

  // Students Needing Remediation
  const remedialStudents = useMemo(() => {
    return [...studentStats]
      .filter((s) => s.generalAverage !== null && (s.generalAverage || 0) < 10)
      .sort((a, b) => (a.generalAverage || 0) - (b.generalAverage || 0))
      .slice(0, 5);
  }, [studentStats]);

  // Upcoming Scheduled Exams
  const upcomingExams = useMemo(() => {
    return exams
      .filter((ex) => {
        if (ex.establishment_id !== activeSchool?.id) return false;
        if (selectedClassId !== 'all' && ex.class_id !== selectedClassId) return false;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || (a.start_time || '').localeCompare(b.start_time || ''))
      .slice(0, 4);
  }, [exams, activeSchool, selectedClassId]);

  // Chart Rendering
  useEffect(() => {
    const chartInstances: Chart[] = [];

    // Chart 1: Average per Class
    if (chartClassesRef.current && classes.length > 0) {
      const classLabels: string[] = [];
      const classAverages: number[] = [];

      classes.forEach((c) => {
        const clsStudents = studentStats.filter((s) => s.student.class_id === c.id && s.generalAverage !== null);
        if (clsStudents.length > 0) {
          const avg = clsStudents.reduce((acc, curr) => acc + (curr.generalAverage || 0), 0) / clsStudents.length;
          classLabels.push(c.name);
          classAverages.push(Number(avg.toFixed(2)));
        } else {
          classLabels.push(c.name);
          classAverages.push(0);
        }
      });

      const chart1 = new Chart(chartClassesRef.current, {
        type: 'bar',
        data: {
          labels: classLabels,
          datasets: [
            {
              label: 'Moyenne / 20',
              data: classAverages,
              backgroundColor: classAverages.map((v) => (v >= 10 ? '#2563eb' : '#ef4444')),
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `Moyenne : ${ctx.raw} / 20`,
              },
            },
          },
          scales: {
            y: {
              min: 0,
              max: 20,
              ticks: { stepSize: 4 },
              grid: { color: 'rgba(148, 163, 184, 0.15)' },
            },
            x: {
              grid: { display: false },
            },
          },
        },
      });
      chartInstances.push(chart1);
    }

    // Chart 2: Distribution of Mentions
    if (chartHonorsRef.current) {
      const evaluated = studentStats.filter((s) => s.generalAverage !== null);
      const excellent = evaluated.filter((s) => (s.generalAverage || 0) >= 16).length;
      const bien = evaluated.filter((s) => (s.generalAverage || 0) >= 14 && (s.generalAverage || 0) < 16).length;
      const assezBien = evaluated.filter((s) => (s.generalAverage || 0) >= 12 && (s.generalAverage || 0) < 14).length;
      const passable = evaluated.filter((s) => (s.generalAverage || 0) >= 10 && (s.generalAverage || 0) < 12).length;
      const sousMoyenne = evaluated.filter((s) => (s.generalAverage || 0) < 10).length;

      const chart2 = new Chart(chartHonorsRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Très Bien & Exc. (≥ 16)', 'Bien (14-16)', 'Assez Bien (12-14)', 'Passable (10-12)', 'À soutenir (<10)'],
          datasets: [
            {
              data: [excellent, bien, assezBien, passable, sousMoyenne],
              backgroundColor: ['#059669', '#2563eb', '#7c3aed', '#d97706', '#dc2626'],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, font: { size: 11 } },
            },
          },
        },
      });
      chartInstances.push(chart2);
    }

    // Chart 3: Trimester Progression
    if (chartEvolutionRef.current) {
      const periods: ('T1' | 'T2' | 'T3')[] = ['T1', 'T2', 'T3'];
      const trendData = periods.map((p) => {
        const periodGrades = grades.filter((g) => g.period === p);
        const avgs: number[] = [];
        periodGrades.forEach((g) => {
          const avg = computeGradeAverage(g);
          if (avg !== null) avgs.push(avg);
        });
        return avgs.length > 0 ? Number((avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(2)) : null;
      });

      const chart3 = new Chart(chartEvolutionRef.current, {
        type: 'line',
        data: {
          labels: ['1er Trimestre (T1)', '2e Trimestre (T2)', '3e Trimestre (T3)'],
          datasets: [
            {
              label: 'Moyenne Globale',
              data: trendData,
              borderColor: '#0284c7',
              backgroundColor: 'rgba(2, 132, 199, 0.12)',
              fill: true,
              tension: 0.35,
              pointRadius: 5,
              pointBackgroundColor: '#0284c7',
              spanGaps: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              min: 0,
              max: 20,
              ticks: { stepSize: 4 },
              grid: { color: 'rgba(148, 163, 184, 0.15)' },
            },
            x: {
              grid: { display: false },
            },
          },
        },
      });
      chartInstances.push(chart3);
    }

    // Chart 4: Average per Subject
    if (chartSubjectsRef.current && subjects.length > 0) {
      const subLabels = subjects.map((s) => s.name);
      const subAverages = subjects.map((s) => {
        const subGrades = grades.filter((g) => g.subject_id === s.id && g.period === selectedPeriod);
        const avgs = subGrades.map((g) => computeGradeAverage(g)).filter((v): v is number => v !== null);
        return avgs.length > 0 ? Number((avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(2)) : 0;
      });

      const chart4 = new Chart(chartSubjectsRef.current, {
        type: 'bar',
        data: {
          labels: subLabels,
          datasets: [
            {
              label: 'Moyenne de la discipline',
              data: subAverages,
              backgroundColor: '#6366f1',
              borderRadius: 6,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              min: 0,
              max: 20,
              ticks: { stepSize: 5 },
              grid: { color: 'rgba(148, 163, 184, 0.15)' },
            },
            y: {
              grid: { display: false },
            },
          },
        },
      });
      chartInstances.push(chart4);
    }

    return () => {
      chartInstances.forEach((c) => c.destroy());
    };
  }, [classes, subjects, studentStats, grades, selectedPeriod]);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <span className="text-sm">{country?.flag || '🏫'}</span>
              <span>{country?.republic || 'Espace Pédagogique Enseignant'}</span>
              {country?.motto && (
                <>
                  <span aria-hidden="true" className="opacity-50">•</span>
                  <span className="italic opacity-90">{country.motto}</span>
                </>
              )}
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              Bonjour, {user?.first_name || 'Professeur'} 👋
            </h1>
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              Voici le tableau de bord analytique de{' '}
              <strong className="text-white">{activeSchool?.name || "votre établissement"}</strong>. Suivez les
              performances des élèves, repérez les axes d'amélioration et activez les remédiations pédagogiques avec l'IA.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-cyan-400" />
                Année scolaire : <strong className="text-white">{activeSchool?.year_label || AcademicYears.current()}</strong>
              </span>
              <span aria-hidden="true" className="opacity-30">•</span>
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-cyan-400" />
                Direction : <strong className="text-white">{activeSchool?.director || 'Direction des études'}</strong>
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2.5 lg:flex-col lg:items-end">
            <button
              type="button"
              onClick={() => onNavigate('ai')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-transform hover:-translate-y-0.5 active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>ArnauldSchool AI</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('grades')}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Saisir des notes</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('students')}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <UserPlus className="h-4 w-4" />
              <span>Inscrire un élève</span>
            </button>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          <BarChart3 className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
          <span>Filtres de consultation :</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Trimester Tabs */}
          <div className="flex items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {(['T1', 'T2', 'T3'] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedPeriod(period)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedPeriod === period
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-cyan-300'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {period === 'T1' ? '1er Trimestre' : period === 'T2' ? '2e Trimestre' : '3e Trimestre'}
              </button>
            ))}
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="dashboard-class-filter" className="text-xs text-slate-500 dark:text-slate-400 font-medium">Classe :</label>
            <select
              id="dashboard-class-filter"
              aria-label="Filtrer par classe"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="all">Toutes les classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.niveau})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Effectif Actif
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {kpis.totalStudents}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">élèves</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{kpis.boysCount} Garçons</span>
            <span aria-hidden="true">•</span>
            <span>{kpis.girlsCount} Filles</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Moyenne Générale
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-blue-600 dark:text-cyan-400 tabular-nums">
              {kpis.schoolAverage !== null ? `${kpis.schoolAverage.toFixed(2)}` : '—'}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/ 20</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            {kpis.schoolAverage !== null
              ? getAppreciation(kpis.schoolAverage).label
              : 'En attente de saisie des notes'}
          </div>
        </div>

        {/* KPI 3 */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Taux de Réussite
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {kpis.schoolAverage !== null ? `${kpis.passRate}%` : '—'}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Moyenne ≥ 10/20</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {kpis.excellenceCount} élève(s) avec Mention (≥ 14)
          </div>
        </div>

        {/* KPI 4 */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Cellule de Remédiation
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
              {kpis.remedialCount}
            </span>
            <span className="text-xs font-medium text-rose-700/80 dark:text-rose-300">élève(s) &lt; 10/20</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-rose-700 dark:text-rose-300">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Accompagnement IA recommandé</span>
          </div>
        </div>
      </section>

      {/* Analytical Charts */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Moyennes Comparées par Classe
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Performance globale sur le {selectedPeriod}
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-cyan-400">Sur 20</span>
          </div>
          <div className="h-64 w-full">
            <canvas ref={chartClassesRef} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Répartition des Mentions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ventilation des apprenants selon la grille officielle
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <canvas ref={chartHonorsRef} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Évolution Trimestrielle Globale
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tendance des moyennes du 1er au 3e trimestre
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <canvas ref={chartEvolutionRef} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Performance par Discipline
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Moyennes calculées par matière pour {selectedPeriod}
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <canvas ref={chartSubjectsRef} />
          </div>
        </div>
      </section>

      {/* Honor Roll & Remediation Section */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Table 1: Honor Roll */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Tableau d'Honneur ({selectedPeriod})
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">Major de promotion</span>
          </div>
          {honorRoll.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Aucune note saisie pour ce trimestre.
            </div>
          ) : (
            <div className="space-y-3">
              {honorRoll.map((item, idx) => (
                <div
                  key={item.student.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                      idx === 0 ? 'bg-amber-400 text-amber-950' : idx === 1 ? 'bg-slate-300 text-slate-800' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.student.last_name} {item.student.first_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.classRoom?.name || 'Classe non assignée'} • {item.student.matricule}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-sm font-black text-blue-600 dark:text-cyan-400 tabular-nums">
                      {item.generalAverage?.toFixed(2)} / 20
                    </div>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${item.appreciation.badgeClass}`}>
                      {item.appreciation.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Table 2: Remediation & AI Action */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/20 p-6 shadow-xs dark:border-rose-950 dark:bg-rose-950/10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Élèves à Soutenir en Priorité
              </h2>
            </div>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Moyenne &lt; 10/20</span>
          </div>
          {remedialStudents.length === 0 ? (
            <div className="py-8 text-center text-xs text-emerald-600 dark:text-emerald-400">
              Félicitations ! Aucun élève sous la moyenne pour ce trimestre dans cette sélection.
            </div>
          ) : (
            <div className="space-y-3">
              {remedialStudents.map((item) => (
                <div
                  key={item.student.id}
                  className="flex items-center justify-between rounded-xl border border-rose-100 bg-white p-3 shadow-xs dark:border-rose-900/40 dark:bg-slate-900"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.student.last_name} {item.student.first_name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {item.classRoom?.name} • Moyenne :{' '}
                      <strong className="text-rose-600 dark:text-rose-400 tabular-nums">
                        {item.generalAverage?.toFixed(2)}/20
                      </strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onLaunchAIRemediation) {
                        onLaunchAIRemediation(
                          `${item.student.first_name} ${item.student.last_name}`,
                          item.classRoom?.name || 'Général',
                          item.generalAverage || 8
                        );
                      } else {
                        onNavigate('ai');
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Plan Remédiation IA</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Exams Calendar Strip */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-cyan-400">
              <CalendarCheck2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Calendrier des Examens & Devoirs à Venir
              </h2>
              <p className="text-xs text-slate-500">
                {selectedClassId !== 'all'
                  ? `Planning ciblé pour la classe : ${classes.find((c) => c.id === selectedClassId)?.name || 'Classe'}`
                  : 'Prochaines épreuves programmées pour toutes vos classes'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('exams')}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-cyan-400"
          >
            <span>Voir tout le calendrier</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {upcomingExams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
            <CalendarCheck2 className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-xs text-slate-500">
              Aucune évaluation programmée pour cette sélection.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('exams')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Planifier une épreuve</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingExams.map((ex) => {
              const cls = classes.find((c) => c.id === ex.class_id);
              const sub = subjects.find((s) => s.id === ex.subject_id);
              const typeCfg = EXAM_TYPES_CONFIG[ex.type];
              return (
                <div
                  key={ex.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-all hover:border-blue-400 hover:bg-white hover:shadow-xs dark:border-slate-800 dark:bg-slate-850 dark:hover:border-cyan-500"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${typeCfg?.badgeClass}`}>
                        {typeCfg?.label}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-cyan-400 font-mono">
                        {ex.period}
                      </span>
                    </div>
                    <div className="font-display text-xs font-black text-slate-900 dark:text-white line-clamp-2">
                      {ex.title}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {sub?.name} • <span className="text-blue-600 dark:text-cyan-400">{cls?.name}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-750 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                        <Calendar className="h-3 w-3 text-blue-500" />
                        {new Date(ex.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Clock className="h-3 w-3 text-cyan-500" />
                        {ex.start_time || '08:00'} ({ex.duration_minutes || 120}m)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onLaunchAIExam) {
                          onLaunchAIExam(ex);
                        } else {
                          onNavigate('ai');
                        }
                      }}
                      className="flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 py-1.5 text-[10px] font-bold text-white shadow-2xs hover:opacity-95"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Sujet & Corrigé IA</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
