import React, { useState, useEffect } from 'react';
import { 
  User, School, ClassRoom, Serie, Student, Subject, GradeRecord, AIMode, ExamEvent 
} from './types';
import { 
  getLS, setLS, KEYS, seedDefaultDataIfEmpty 
} from './lib/storage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AIView } from './components/AIView';
import { GradesView } from './components/GradesView';
import { ExamCalendarView } from './components/ExamCalendarView';
import { StudentsView } from './components/StudentsView';
import { ClassesView } from './components/ClassesView';
import { SchoolsView } from './components/SchoolsView';
import { SubjectsView } from './components/SubjectsView';
import { AuthModal } from './components/AuthModal';
import { CinematicIntro } from './components/CinematicIntro';
import { BottomNav } from './components/BottomNav';

export default function App() {
  // Session / User State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const session = getLS<{ userId: string; email: string } | null>(KEYS.session, null);
    if (!session) return null;
    const users = getLS<User[]>(KEYS.users, []);
    return users.find((u) => u.id === session.userId) || null;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return getLS<string>(KEYS.theme, 'light') === 'dark';
  });

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    return getLS<string>(KEYS.introSeen, '0') !== '1';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<string>('dashboard');

  // Academic Data State
  const [schools, setSchools] = useState<School[]>(() => getLS<School[]>(KEYS.schools, []));
  const [activeSchoolId, setActiveSchoolId] = useState<string>(() => getLS<string>(KEYS.activeSchool, ''));
  const [classes, setClasses] = useState<ClassRoom[]>(() => getLS<ClassRoom[]>(KEYS.classes, []));
  const [series, setSeries] = useState<Serie[]>(() => getLS<Serie[]>(KEYS.series, []));
  const [students, setStudents] = useState<Student[]>(() => getLS<Student[]>(KEYS.students, []));
  const [subjects, setSubjects] = useState<Subject[]>(() => getLS<Subject[]>(KEYS.subjects, []));
  const [grades, setGrades] = useState<GradeRecord[]>(() => getLS<GradeRecord[]>(KEYS.grades, []));
  const [exams, setExams] = useState<ExamEvent[]>(() => getLS<ExamEvent[]>(KEYS.exams, []));

  // Context passing for AI remediation shortcuts
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string>('');
  const [aiInitialMode, setAiInitialMode] = useState<AIMode>('general');

  // Cleanup legacy or oversized localStorage items on boot
  useEffect(() => {
    try {
      localStorage.removeItem('arnauldschool.ai.v1');
      localStorage.removeItem('arnauldschool.ai');
      const existing = localStorage.getItem(KEYS.aiState);
      if (existing && existing.length > 1000000) {
        const parsed = JSON.parse(existing);
        setLS(KEYS.aiState, parsed);
      }
    } catch (e) {
      console.warn('Storage cleanup notice:', e);
    }
  }, []);

  // Sync dark mode class on document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      setLS(KEYS.theme, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      setLS(KEYS.theme, 'light');
    }
  }, [darkMode]);

  // Seed default academic records if empty and user is logged in
  useEffect(() => {
    if (currentUser) {
      const { schoolId } = seedDefaultDataIfEmpty(currentUser.id);
      setSchools(getLS<School[]>(KEYS.schools, []));
      setClasses(getLS<ClassRoom[]>(KEYS.classes, []));
      setSeries(getLS<Serie[]>(KEYS.series, []));
      setStudents(getLS<Student[]>(KEYS.students, []));
      setSubjects(getLS<Subject[]>(KEYS.subjects, []));
      setGrades(getLS<GradeRecord[]>(KEYS.grades, []));
      setExams(getLS<ExamEvent[]>(KEYS.exams, []));
      if (!activeSchoolId) {
        setActiveSchoolId(schoolId);
        setLS(KEYS.activeSchool, schoolId);
      }
    }
  }, [currentUser]);

  // Sync active school to localStorage
  useEffect(() => {
    if (activeSchoolId) {
      setLS(KEYS.activeSchool, activeSchoolId);
    }
  }, [activeSchoolId]);

  // Handlers for state updates and localStorage sync
  const handleUpdateSchools = (newSchools: School[]) => {
    setSchools(newSchools);
    setLS(KEYS.schools, newSchools);
  };

  const handleUpdateClasses = (newClasses: ClassRoom[]) => {
    setClasses(newClasses);
    setLS(KEYS.classes, newClasses);
  };

  const handleUpdateSeries = (newSeries: Serie[]) => {
    setSeries(newSeries);
    setLS(KEYS.series, newSeries);
  };

  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    setLS(KEYS.students, newStudents);
  };

  const handleUpdateSubjects = (newSubjects: Subject[]) => {
    setSubjects(newSubjects);
    setLS(KEYS.subjects, newSubjects);
  };

  const handleUpdateGrades = (newGrades: GradeRecord[]) => {
    setGrades(newGrades);
    setLS(KEYS.grades, newGrades);
  };

  const handleUpdateExams = (newExams: ExamEvent[]) => {
    setExams(newExams);
    setLS(KEYS.exams, newExams);
  };

  const handleLogout = () => {
    localStorage.removeItem(KEYS.session);
    setCurrentUser(null);
  };

  const handleLaunchAIRemediation = (studentName: string, subjectName: string, average: number) => {
    const prompt = `Je souhaite un plan de remédiation personnalisé pour l'élève **${studentName}** qui a actuellement une moyenne de **${average}/20** en **${subjectName}**.\n\n1. Identifie les difficultés méthodologiques typiques à ce niveau.\n2. Donne 3 exercices progressifs de déblocage avec astuces.\n3. Rédige un message d'encouragement motivant pour redonner confiance à l'élève.`;
    setAiInitialPrompt(prompt);
    setAiInitialMode('remedial');
    setActiveModule('ai');
  };

  const handleLaunchAIExam = (exam: ExamEvent) => {
    const cls = classes.find((c) => c.id === exam.class_id);
    const sub = subjects.find((s) => s.id === exam.subject_id);
    const prompt = `Je prépare l'évaluation suivante pour ma classe :\n- Titre : ${exam.title}\n- Classe : ${cls?.name || 'Classe'} (${cls?.niveau || 'Niveau'})\n- Matière : ${sub?.name || 'Matière'}\n- Type : ${exam.type} (${exam.period})\n- Durée prévue : ${exam.duration_minutes || 120} minutes\n- Barème total : sur 20 points\n${exam.instructions ? `- Consignes : ${exam.instructions}` : ''}\n\nRédige :\n1. Le sujet d'examen complet prêt pour les élèves, équilibré et progressif (Partie 1: Connaissances, Partie 2: Application, Partie 3: Problème).\n2. Le barème chiffré par question.\n3. Le corrigé modèle intégral et détaillé étape par étape pour l'enseignant.`;
    setAiInitialPrompt(prompt);
    setAiInitialMode('exam');
    setActiveModule('ai');
  };

  const activeSchool = schools.find((s) => s.id === activeSchoolId) || schools[0] || null;

  // Not logged in: Show Auth
  if (!currentUser) {
    return <AuthModal onSuccess={(u) => setCurrentUser(u)} />;
  }

  // First-time onboarding walkthrough
  if (showIntro) {
    return (
      <CinematicIntro
        user={currentUser}
        onFinish={() => {
          setShowIntro(false);
          setLS(KEYS.introSeen, '1');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navbar - Hidden in AI mode for immersive design */}
      {activeModule !== 'ai' && (
        <Navbar
          user={currentUser}
          schools={schools}
          activeSchool={activeSchool}
          onSelectSchool={(id) => setActiveSchoolId(id)}
          activeModule={activeModule}
          onNavigate={(mod) => setActiveModule(mod)}
          onLogout={handleLogout}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      )}

      <div className="flex flex-1 overflow-hidden pb-20">
        {/* Navigation Sidebar - Hidden in AI mode */}
        {activeModule !== 'ai' && (
          <Sidebar
            activeModule={activeModule}
            onNavigate={(mod) => setActiveModule(mod)}
            activeSchool={activeSchool}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all duration-300 animate-fadeIn">
          {activeModule === 'dashboard' && (
            <DashboardView
              user={currentUser}
              activeSchool={activeSchool}
              classes={classes}
              students={students}
              subjects={subjects}
              grades={grades}
              exams={exams}
              onNavigate={(mod) => setActiveModule(mod)}
              onLaunchAIRemediation={handleLaunchAIRemediation}
              onLaunchAIExam={handleLaunchAIExam}
            />
          )}

          {activeModule === 'ai' && (
            <AIView
              activeSchool={activeSchool}
              classes={classes}
              students={students}
              initialPrompt={aiInitialPrompt}
              initialMode={aiInitialMode}
              onNavigate={(mod) => setActiveModule(mod)}
            />
          )}

          {activeModule === 'exams' && (
            <ExamCalendarView
              activeSchool={activeSchool}
              classes={classes}
              subjects={subjects}
              exams={exams}
              onUpdateExams={handleUpdateExams}
              onNavigateToAI={(prompt) => {
                setAiInitialPrompt(prompt);
                setAiInitialMode('exam');
                setActiveModule('ai');
              }}
              onNavigateToGrades={(_classId, _subjectId) => {
                setActiveModule('grades');
              }}
            />
          )}

          {activeModule === 'grades' && (
            <GradesView
              activeSchool={activeSchool}
              classes={classes}
              subjects={subjects}
              students={students}
              grades={grades}
              onUpdateGrades={handleUpdateGrades}
              onNavigateToAI={(prompt) => {
                setAiInitialPrompt(prompt);
                setAiInitialMode('general');
                setActiveModule('ai');
              }}
            />
          )}

          {activeModule === 'students' && (
            <StudentsView
              activeSchool={activeSchool}
              classes={classes}
              students={students}
              subjects={subjects}
              grades={grades}
              onUpdateStudents={handleUpdateStudents}
              onNavigateToAI={(prompt) => {
                setAiInitialPrompt(prompt);
                setAiInitialMode('remedial');
                setActiveModule('ai');
              }}
            />
          )}

          {activeModule === 'classes' && (
            <ClassesView
              activeSchool={activeSchool}
              classes={classes}
              series={series}
              students={students}
              onUpdateClasses={handleUpdateClasses}
              onUpdateSeries={handleUpdateSeries}
            />
          )}

          {activeModule === 'schools' && (
            <SchoolsView
              user={currentUser}
              schools={schools}
              activeSchool={activeSchool}
              classes={classes}
              students={students}
              onSelectSchool={(id) => setActiveSchoolId(id)}
              onUpdateSchools={handleUpdateSchools}
            />
          )}

          {activeModule === 'subjects' && (
            <SubjectsView
              activeSchool={activeSchool}
              subjects={subjects}
              onUpdateSubjects={handleUpdateSubjects}
            />
          )}

          {activeModule === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h1 className="font-display text-lg font-black text-slate-900 dark:text-white">
                  Profil & Paramètres de l'Enseignant
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Gérez vos préférences et vos coordonnées professionnelles.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Nom complet</span>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {currentUser.first_name} {currentUser.last_name}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">E-mail</span>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Ville & Pays</span>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {currentUser.city || 'Brazzaville'}, {currentUser.country || 'CG'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Discipline</span>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {currentUser.profession || 'Enseignant'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Apparence & Affichage
                </h2>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Mode Sombre
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Adapter les contrastes pour le travail en soirée
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDarkMode(!darkMode)}
                    className={`h-6 w-11 rounded-full transition-colors relative cursor-pointer ${
                      darkMode ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform ${
                        darkMode ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'help' && (
            <div className="space-y-6 max-w-3xl">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h1 className="font-display text-lg font-black text-slate-900 dark:text-white">
                  Guide Pédagogique & Méthodologie
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  ArnauldSchool applique les standards de l'Approche Par Compétences (APC).
                </p>
                <div className="mt-6 space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <div className="rounded-xl bg-blue-50/70 p-4 dark:bg-slate-850 border border-blue-100 dark:border-slate-800">
                    <h3 className="font-bold text-blue-900 dark:text-cyan-300">
                      Formule de Calcul des Moyennes
                    </h3>
                    <p className="mt-1">
                      Moyenne = (Devoir 1 + Devoir 2 + Devoir 3 + 2×Devoir Départemental + 2×Composition) / 7.
                      Les appréciations sont automatiquement assignées selon le barème officiel (Excellent ≥ 18, Très Bien ≥ 16, Bien ≥ 14, Assez Bien ≥ 12, Passable ≥ 10, Insuffisant &lt;10).
                    </p>
                  </div>
                  <div className="rounded-xl bg-cyan-50/70 p-4 dark:bg-slate-850 border border-cyan-100 dark:border-slate-800">
                    <h3 className="font-bold text-cyan-900 dark:text-cyan-300">
                      Utiliser le Microphone et ArnauldSchool AI efficacement
                    </h3>
                    <p className="mt-1">
                      Vous pouvez dicter vos devoirs ou consignes directement au micro en appuyant sur l'icône microphone dans la barre de saisie : vos paroles s'écrivent mot à mot dans la barre de saisie. Vous pouvez également joindre des photos de copies d'élèves ou des documents PDF avec l'icône trombone (+).
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowIntro(true)}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                  >
                    Revoir la visite guidée d'introduction
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {activeModule !== 'ai' && (
        <BottomNav activeModule={activeModule} onNavigate={(mod) => setActiveModule(mod)} />
      )}
    </div>
  );
}
