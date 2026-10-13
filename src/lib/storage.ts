import { 
  User, School, ClassRoom, Serie, Student, Subject, GradeRecord, 
  AIConversation, AIMessage, AIMode, CycleKey, ExamEvent, ExamType 
} from '../types';

export const KEYS = {
  users: 'arnauldschool.users',
  session: 'arnauldschool.session',
  schools: 'arnauldschool.schools',
  activeSchool: 'arnauldschool.activeSchool',
  classes: 'arnauldschool.classes',
  series: 'arnauldschool.series',
  students: 'arnauldschool.students',
  subjects: 'arnauldschool.subjects',
  grades: 'arnauldschool.grades',
  exams: 'arnauldschool.exams',
  theme: 'arnauldschool.theme',
  introSeen: 'arnauldschool.introSeen',
  aiState: 'arnauldschool.ai.v2'
};

export function getLS<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

export function sanitizeAIConversations(convs: AIConversation[]): AIConversation[] {
  if (!Array.isArray(convs)) return [];
  return convs.slice(0, 10).map((c) => ({
    ...c,
    messages: (c.messages || []).slice(-30).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content || '',
      loading: false,
      error: m.error,
      timestamp: m.timestamp,
      attachments: (m.attachments || []).map((a) => ({
        id: a.id,
        name: a.name,
        size: a.size,
        type: a.type,
      })),
    })),
  }));
}

export function setLS<T>(key: string, value: T): void {
  try {
    let payload = value;
    if (key === KEYS.aiState && Array.isArray(value)) {
      payload = sanitizeAIConversations(value as any) as any;
    }
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err: any) {
    console.warn(`LocalStorage write warning for ${key}:`, err);
    if (
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014
    ) {
      try {
        localStorage.removeItem('arnauldschool.ai.v1');
        localStorage.removeItem('arnauldschool.ai');
        if (key === KEYS.aiState && Array.isArray(value)) {
          const minimal = (value as any[]).slice(0, 3).map((c: any) => ({
            id: c.id,
            title: c.title,
            mode: c.mode,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            messages: (c.messages || []).slice(-10).map((m: any) => ({
              id: m.id,
              role: m.role,
              content: typeof m.content === 'string' ? m.content.slice(0, 3000) : '',
              timestamp: m.timestamp,
            })),
          }));
          localStorage.setItem(key, JSON.stringify(minimal));
          return;
        }
        localStorage.setItem(key, JSON.stringify(value));
      } catch (innerErr) {
        console.warn('LocalStorage quota recovery failed:', innerErr);
      }
    }
  }
}

export function genId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const CYCLES: Record<CycleKey, { key: CycleKey; label: string; niveaux: string[]; hasSeries: boolean; desc: string }> = {
  primaire: { key: 'primaire', label: 'Primaire', niveaux: ['SIL', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'], hasSeries: false, desc: 'Enseignement fondamental' },
  college: { key: 'college', label: 'Collège', niveaux: ['6ème', '5ème', '4ème', '3ème'], hasSeries: false, desc: 'Premier cycle secondaire' },
  lycee: { key: 'lycee', label: 'Lycée Général', niveaux: ['2nde', '1ère', 'Terminale'], hasSeries: true, desc: 'Second cycle scientifique & littéraire' },
  technique: { key: 'technique', label: 'Lycée Technique', niveaux: ['2nde', '1ère', 'Terminale'], hasSeries: true, desc: 'Filières industrielles & tertiaires' }
};

export const AcademicYears = {
  ALL: ['2023-2024', '2024-2025', '2025-2026', '2026-2027', '2027-2028'],
  current(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth();
    const start = m >= 8 ? y : y - 1;
    return `${start}-${start + 1}`;
  }
};

export const GRADE_COEFFICIENTS = {
  devoir1: 1,
  devoir2: 1,
  devoir3: 1,
  devoir_dept: 2,
  composition: 2
};

export function computeGradeAverage(g: GradeRecord | null | undefined): number | null {
  if (!g) return null;
  let sum = 0;
  let totalCoef = 0;
  const fields: (keyof typeof GRADE_COEFFICIENTS)[] = ['devoir1', 'devoir2', 'devoir3', 'devoir_dept', 'composition'];
  for (const f of fields) {
    const val = g[f];
    if (val !== undefined && val !== null && !isNaN(val)) {
      const coef = GRADE_COEFFICIENTS[f] || 1;
      sum += val * coef;
      totalCoef += coef;
    }
  }
  if (totalCoef === 0) return null;
  return Number((sum / totalCoef).toFixed(2));
}

export function computeGradeTotal(g: GradeRecord | null | undefined): number | null {
  if (!g) return null;
  const fields: (keyof typeof GRADE_COEFFICIENTS)[] = ['devoir1', 'devoir2', 'devoir3', 'devoir_dept', 'composition'];
  const values = fields.map(f => g[f]).filter((v): v is number => v !== undefined && v !== null && !isNaN(v));
  if (values.length === 0) return null;
  return Number(values.reduce((a, b) => a + b, 0).toFixed(2));
}

export function getAppreciation(moy: number | null | undefined): { label: string; badgeClass: string; color: string } {
  if (moy === null || moy === undefined || isNaN(moy)) {
    return { label: 'Non évalué', badgeClass: 'bg-slate-100 text-slate-500', color: '#64748b' };
  }
  if (moy >= 18) return { label: 'Excellent', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300', color: '#059669' };
  if (moy >= 16) return { label: 'Très Bien', badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300', color: '#2563eb' };
  if (moy >= 14) return { label: 'Bien', badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300', color: '#0891b2' };
  if (moy >= 12) return { label: 'Assez Bien', badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300', color: '#7c3aed' };
  if (moy >= 10) return { label: 'Passable', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300', color: '#d97706' };
  if (moy >= 8) return { label: 'Insuffisant', badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300', color: '#ea580c' };
  return { label: 'Très Faible', badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300', color: '#dc2626' };
}

export function seedDefaultDataIfEmpty(userId: string): { schoolId: string } {
  let schools = getLS<School[]>(KEYS.schools, []);
  if (schools.length === 0) {
    const sampleSchool: School = {
      id: genId('school'),
      owner_id: userId,
      name: "Complexe Scolaire International de l'Excellence",
      short_name: 'CSIE',
      type: 'Lycée & Collège',
      address: "Avenue de l'Indépendance",
      city: 'Brazzaville',
      country: 'CG',
      phone: '+242 06 500 00 00',
      email: 'contact@csie-excellence.edu',
      director: 'Prof. Thomas Mampouya',
      year_label: AcademicYears.current(),
      created_at: new Date().toISOString()
    };
    schools = [sampleSchool];
    setLS(KEYS.schools, schools);
    setLS(KEYS.activeSchool, sampleSchool.id);

    // Classes
    const c1: ClassRoom = {
      id: genId('cls'),
      establishment_id: sampleSchool.id,
      name: 'Terminale C',
      cycle: 'lycee',
      niveau: 'Terminale',
      capacity: 35,
      academic_year: AcademicYears.current(),
      created_at: new Date().toISOString()
    };
    const c2: ClassRoom = {
      id: genId('cls'),
      establishment_id: sampleSchool.id,
      name: 'Terminale D',
      cycle: 'lycee',
      niveau: 'Terminale',
      capacity: 40,
      academic_year: AcademicYears.current(),
      created_at: new Date().toISOString()
    };
    const c3: ClassRoom = {
      id: genId('cls'),
      establishment_id: sampleSchool.id,
      name: '3ème A',
      cycle: 'college',
      niveau: '3ème',
      capacity: 45,
      academic_year: AcademicYears.current(),
      created_at: new Date().toISOString()
    };
    setLS(KEYS.classes, [c1, c2, c3]);

    // Series
    const seriesList: Serie[] = [
      { id: genId('ser'), establishment_id: sampleSchool.id, code: 'C' },
      { id: genId('ser'), establishment_id: sampleSchool.id, code: 'D' },
      { id: genId('ser'), establishment_id: sampleSchool.id, code: 'A4' }
    ];
    setLS(KEYS.series, seriesList);

    // Subjects
    const sMaths: Subject = { id: genId('sub'), establishment_id: sampleSchool.id, name: 'Mathématiques', code: 'MATH', default_coefficient: 6, created_at: new Date().toISOString() };
    const sPC: Subject = { id: genId('sub'), establishment_id: sampleSchool.id, name: 'Physique-Chimie', code: 'PC', default_coefficient: 5, created_at: new Date().toISOString() };
    const sSVT: Subject = { id: genId('sub'), establishment_id: sampleSchool.id, name: 'Sciences de la Vie et de la Terre', code: 'SVT', default_coefficient: 4, created_at: new Date().toISOString() };
    const sFR: Subject = { id: genId('sub'), establishment_id: sampleSchool.id, name: 'Français & Philosophie', code: 'FR', default_coefficient: 4, created_at: new Date().toISOString() };
    const sENG: Subject = { id: genId('sub'), establishment_id: sampleSchool.id, name: 'Anglais', code: 'ANG', default_coefficient: 2, created_at: new Date().toISOString() };
    setLS(KEYS.subjects, [sMaths, sPC, sSVT, sFR, sENG]);

    // Sample Students in Terminale C
    const sampleStudents: Student[] = [
      { id: genId('stu'), establishment_id: sampleSchool.id, class_id: c1.id, matricule: '2026-TC-001', last_name: 'MOUKOKO', first_name: 'Audrey Bénédicte', gender: 'F', nationality: 'Congolaise', guardian_name: 'Dr. Moukoko', guardian_phone: '+242 06 123 45 67', status: 'active', created_at: new Date().toISOString() },
      { id: genId('stu'), establishment_id: sampleSchool.id, class_id: c1.id, matricule: '2026-TC-002', last_name: 'NGUEMBO', first_name: 'Christian Arnauld', gender: 'M', nationality: 'Congolais', guardian_name: 'Mme Nguembo', guardian_phone: '+242 05 987 65 43', status: 'active', created_at: new Date().toISOString() },
      { id: genId('stu'), establishment_id: sampleSchool.id, class_id: c1.id, matricule: '2026-TC-003', last_name: 'BAKALA', first_name: 'Flora Priscille', gender: 'F', nationality: 'Congolaise', guardian_name: 'M. Bakala', guardian_phone: '+242 06 444 33 22', status: 'active', created_at: new Date().toISOString() },
      { id: genId('stu'), establishment_id: sampleSchool.id, class_id: c1.id, matricule: '2026-TC-004', last_name: 'OKIEMY', first_name: 'Serge Junior', gender: 'M', nationality: 'Congolais', guardian_name: 'Colonel Okiemy', guardian_phone: '+242 06 777 88 99', status: 'active', created_at: new Date().toISOString() },
      { id: genId('stu'), establishment_id: sampleSchool.id, class_id: c1.id, matricule: '2026-TC-005', last_name: 'DIALLO', first_name: 'Amadou Chérif', gender: 'M', nationality: 'Sénégalaise', guardian_name: 'M. Diallo', guardian_phone: '+221 77 123 45 67', status: 'active', created_at: new Date().toISOString() },
      { id: genId('stu'), establishment_id: sampleSchool.id, class_id: c1.id, matricule: '2026-TC-006', last_name: 'KOUASSI', first_name: 'Grace Manuella', gender: 'F', nationality: 'Ivoirienne', guardian_name: 'Mme Kouassi', guardian_phone: '+225 07 88 99 00', status: 'active', created_at: new Date().toISOString() },
    ];
    setLS(KEYS.students, sampleStudents);

    // Sample Grades for T1
    const grades: GradeRecord[] = [
      { id: genId('grd'), establishment_id: sampleSchool.id, student_id: sampleStudents[0].id, class_id: c1.id, subject_id: sMaths.id, period: 'T1', year: AcademicYears.current(), devoir1: 17.5, devoir2: 18.0, devoir3: 16.5, devoir_dept: 17.0, composition: 18.5 },
      { id: genId('grd'), establishment_id: sampleSchool.id, student_id: sampleStudents[1].id, class_id: c1.id, subject_id: sMaths.id, period: 'T1', year: AcademicYears.current(), devoir1: 15.0, devoir2: 16.5, devoir3: 14.0, devoir_dept: 15.5, composition: 16.0 },
      { id: genId('grd'), establishment_id: sampleSchool.id, student_id: sampleStudents[2].id, class_id: c1.id, subject_id: sMaths.id, period: 'T1', year: AcademicYears.current(), devoir1: 12.0, devoir2: 11.5, devoir3: 13.0, devoir_dept: 12.0, composition: 13.5 },
      { id: genId('grd'), establishment_id: sampleSchool.id, student_id: sampleStudents[3].id, class_id: c1.id, subject_id: sMaths.id, period: 'T1', year: AcademicYears.current(), devoir1: 8.5, devoir2: 7.0, devoir3: 9.0, devoir_dept: 8.0, composition: 7.5 },
      { id: genId('grd'), establishment_id: sampleSchool.id, student_id: sampleStudents[4].id, class_id: c1.id, subject_id: sMaths.id, period: 'T1', year: AcademicYears.current(), devoir1: 14.5, devoir2: 15.0, devoir3: 13.5, devoir_dept: 14.0, composition: 15.0 },
      { id: genId('grd'), establishment_id: sampleSchool.id, student_id: sampleStudents[5].id, class_id: c1.id, subject_id: sMaths.id, period: 'T1', year: AcademicYears.current(), devoir1: 10.5, devoir2: 11.0, devoir3: 9.5, devoir_dept: 10.0, composition: 11.5 },
      // Physics
      { id: genId('grd'), establishment_id: sampleSchool.id, student_id: sampleStudents[0].id, class_id: c1.id, subject_id: sPC.id, period: 'T1', year: AcademicYears.current(), devoir1: 16.5, devoir2: 17.0, devoir3: 18.0, devoir_dept: 17.5, composition: 18.0 },
      { id: genId('grd'), establishment_id: sampleSchool.id, student_id: sampleStudents[1].id, class_id: c1.id, subject_id: sPC.id, period: 'T1', year: AcademicYears.current(), devoir1: 14.0, devoir2: 15.5, devoir3: 15.0, devoir_dept: 16.0, composition: 15.5 },
      { id: genId('grd'), establishment_id: sampleSchool.id, student_id: sampleStudents[3].id, class_id: c1.id, subject_id: sPC.id, period: 'T1', year: AcademicYears.current(), devoir1: 9.0, devoir2: 8.5, devoir3: 8.0, devoir_dept: 9.5, composition: 8.5 },
    ];
    setLS(KEYS.grades, grades);

    // Sample Scheduled Exams
    const sampleExams: ExamEvent[] = [
      {
        id: genId('exam'),
        establishment_id: sampleSchool.id,
        class_id: c1.id,
        subject_id: sMaths.id,
        title: 'Devoir Surveillé 1 : Fonctions & Dérivation',
        type: 'devoir',
        period: 'T1',
        date: '2026-10-16',
        start_time: '08:00',
        duration_minutes: 120,
        coefficient: 6,
        room: 'Salle B12',
        status: 'planned',
        instructions: 'Calculatrice non autorisée. Tracer les courbes sur papier millimétré.',
        created_at: new Date().toISOString()
      },
      {
        id: genId('exam'),
        establishment_id: sampleSchool.id,
        class_id: c1.id,
        subject_id: sPC.id,
        title: 'Devoir Surveillé 1 : Électrostatique & Acides-Bases',
        type: 'devoir',
        period: 'T1',
        date: '2026-10-21',
        start_time: '10:00',
        duration_minutes: 120,
        coefficient: 5,
        room: 'Labo Sciences 2',
        status: 'planned',
        instructions: 'Formulaire de constantes fourni avec le sujet.',
        created_at: new Date().toISOString()
      },
      {
        id: genId('exam'),
        establishment_id: sampleSchool.id,
        class_id: c2.id,
        subject_id: sSVT.id,
        title: 'Interrogation Écrite : Génétique & Hérédité',
        type: 'interrogation',
        period: 'T1',
        date: '2026-10-24',
        start_time: '14:00',
        duration_minutes: 60,
        coefficient: 4,
        room: 'Salle A04',
        status: 'planned',
        instructions: 'Schémas en couleur exigés.',
        created_at: new Date().toISOString()
      },
      {
        id: genId('exam'),
        establishment_id: sampleSchool.id,
        class_id: c1.id,
        subject_id: sMaths.id,
        title: 'Composition Trimestrielle T1 de Mathématiques',
        type: 'composition',
        period: 'T1',
        date: '2026-11-20',
        start_time: '08:00',
        duration_minutes: 180,
        coefficient: 6,
        room: 'Amphithéâtre Central',
        status: 'planned',
        instructions: 'Épreuve officielle coef 6. Table de log & matériel de géométrie.',
        created_at: new Date().toISOString()
      }
    ];
    setLS(KEYS.exams, sampleExams);

    return { schoolId: sampleSchool.id };
  }
  return { schoolId: schools[0].id };
}

export const EXAM_TYPES_CONFIG: Record<
  ExamType,
  { label: string; badgeClass: string; defaultCoef: number; defaultDuration: number }
> = {
  devoir: {
    label: 'Devoir Surveillé',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300',
    defaultCoef: 1,
    defaultDuration: 120
  },
  devoir_dept: {
    label: 'Devoir Départemental',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300',
    defaultCoef: 2,
    defaultDuration: 180
  },
  composition: {
    label: 'Composition Trimestrielle',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300',
    defaultCoef: 2,
    defaultDuration: 180
  },
  interrogation: {
    label: 'Interrogation Écrite',
    badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300',
    defaultCoef: 1,
    defaultDuration: 45
  }
};
