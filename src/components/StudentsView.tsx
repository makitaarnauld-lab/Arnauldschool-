import React, { useState, useRef, useEffect } from 'react';
import { School, ClassRoom, Student, GradeRecord, Subject } from '../types';
import { genId, computeGradeAverage, getAppreciation } from '../lib/storage';
import { 
  Search, 
  UserPlus, 
  Upload, 
  Trash2, 
  Edit2, 
  ArrowLeft, 
  Sparkles, 
  FileText,
  X
} from 'lucide-react';
import Chart from 'chart.js/auto';

interface StudentsViewProps {
  activeSchool: School | null;
  classes: ClassRoom[];
  students: Student[];
  subjects: Subject[];
  grades: GradeRecord[];
  onUpdateStudents: (students: Student[]) => void;
  onNavigateToAI: (prompt: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  activeSchool,
  classes,
  students,
  subjects,
  grades,
  onUpdateStudents,
  onNavigateToAI,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingStudentDetail, setViewingStudentDetail] = useState<Student | null>(null);

  // Form State
  const [formMatricule, setFormMatricule] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formGender, setFormGender] = useState<'M' | 'F'>('M');
  const [formClassId, setFormClassId] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formNationality, setFormNationality] = useState('');
  const [formGuardianName, setFormGuardianName] = useState('');
  const [formGuardianPhone, setFormGuardianPhone] = useState('');

  const studentChartRef = useRef<HTMLCanvasElement | null>(null);

  const filteredStudents = students.filter((s) => {
    if (s.establishment_id !== activeSchool?.id) return false;
    if (selectedStatusFilter !== 'all' && s.status !== selectedStatusFilter) return false;
    if (selectedClassFilter !== 'all' && s.class_id !== selectedClassFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        s.matricule.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        s.first_name.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleOpenNewStudent = () => {
    setEditingStudent(null);
    setFormMatricule(`2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormLastName('');
    setFormFirstName('');
    setFormGender('M');
    setFormClassId(classes[0]?.id || '');
    setFormBirthDate('');
    setFormNationality('Congolaise');
    setFormGuardianName('');
    setFormGuardianPhone('');
    setIsFormOpen(true);
  };

  const handleOpenEditStudent = (st: Student) => {
    setEditingStudent(st);
    setFormMatricule(st.matricule);
    setFormLastName(st.last_name);
    setFormFirstName(st.first_name);
    setFormGender(st.gender || 'M');
    setFormClassId(st.class_id || classes[0]?.id || '');
    setFormBirthDate(st.birth_date || '');
    setFormNationality(st.nationality || '');
    setFormGuardianName(st.guardian_name || '');
    setFormGuardianPhone(st.guardian_phone || '');
    setIsFormOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLastName.trim() || !formFirstName.trim() || !formMatricule.trim()) {
      alert('Veuillez renseigner le nom, le prénom et le matricule.');
      return;
    }
    if (editingStudent) {
      const updated = students.map((s) =>
        s.id === editingStudent.id
          ? {
              ...s,
              matricule: formMatricule.trim(),
              last_name: formLastName.trim(),
              first_name: formFirstName.trim(),
              gender: formGender,
              class_id: formClassId,
              birth_date: formBirthDate || null,
              nationality: formNationality.trim() || null,
              guardian_name: formGuardianName.trim(),
              guardian_phone: formGuardianPhone.trim(),
            }
          : s
      );
      onUpdateStudents(updated);
    } else {
      const newStudent: Student = {
        id: genId('stu'),
        establishment_id: activeSchool?.id || '',
        matricule: formMatricule.trim(),
        last_name: formLastName.trim(),
        first_name: formFirstName.trim(),
        gender: formGender,
        class_id: formClassId,
        birth_date: formBirthDate || null,
        nationality: formNationality.trim() || null,
        guardian_name: formGuardianName.trim(),
        guardian_phone: formGuardianPhone.trim(),
        status: 'active',
        created_at: new Date().toISOString(),
      };
      onUpdateStudents([...students, newStudent]);
    }
    setIsFormOpen(false);
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm('Voulez-vous supprimer définitivement cet élève ?')) {
      onUpdateStudents(students.filter((s) => s.id !== id));
      if (viewingStudentDetail?.id === id) {
        setViewingStudentDetail(null);
      }
    }
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          alert('Fichier CSV vide ou format invalide.');
          return;
        }
        const newImported: Student[] = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(/[,;]/).map((p) => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 3) {
            const matricule = parts[0] || `IMP-${Date.now().toString(36).slice(2, 6)}`;
            const lastName = parts[1];
            const firstName = parts[2];
            const gender = parts[3]?.toUpperCase() === 'F' ? 'F' : 'M';
            if (lastName && firstName) {
              newImported.push({
                id: genId('stu'),
                establishment_id: activeSchool?.id || '',
                matricule,
                last_name: lastName,
                first_name: firstName,
                gender,
                class_id: classes[0]?.id || null,
                status: 'active',
                created_at: new Date().toISOString(),
              });
            }
          }
        }
        if (newImported.length > 0) {
          onUpdateStudents([...students, ...newImported]);
          alert(`${newImported.length} élève(s) importé(s) avec succès !`);
        }
      } catch (err) {
        alert("Erreur lors de l'analyse du fichier CSV.");
      }
    };
    reader.readAsText(file);
  };

  // Student dossier chart
  useEffect(() => {
    if (viewingStudentDetail && studentChartRef.current) {
      const periods: ('T1' | 'T2' | 'T3')[] = ['T1', 'T2', 'T3'];
      const trendData = periods.map((p) => {
        let sum = 0;
        let coef = 0;
        subjects.forEach((sub) => {
          const g = grades.find(
            (x) => x.student_id === viewingStudentDetail.id && x.subject_id === sub.id && x.period === p
          );
          const avg = computeGradeAverage(g);
          if (avg !== null) {
            sum += avg * sub.default_coefficient;
            coef += sub.default_coefficient;
          }
        });
        return coef > 0 ? Number((sum / coef).toFixed(2)) : null;
      });

      const chart = new Chart(studentChartRef.current, {
        type: 'line',
        data: {
          labels: ['1er Trimestre (T1)', '2e Trimestre (T2)', '3e Trimestre (T3)'],
          datasets: [
            {
              label: 'Moyenne Trimestrielle',
              data: trendData,
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 6,
              pointBackgroundColor: '#2563eb',
              spanGaps: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { min: 0, max: 20, ticks: { stepSize: 4 } },
          },
        },
      });
      return () => chart.destroy();
    }
  }, [viewingStudentDetail, subjects, grades]);

  if (viewingStudentDetail) {
    const st = viewingStudentDetail;
    const cls = classes.find((c) => c.id === st.class_id);
    const subjectStats = subjects.map((sub) => {
      const g = grades.find((x) => x.student_id === st.id && x.subject_id === sub.id && x.period === 'T1');
      const avg = computeGradeAverage(g);
      return {
        subject: sub,
        average: avg,
        appreciation: getAppreciation(avg),
      };
    });
    const evaluated = subjectStats.filter((s) => s.average !== null);
    const generalAvg =
      evaluated.length > 0
        ? Number(
            (
              evaluated.reduce((acc, curr) => acc + (curr.average || 0) * curr.subject.default_coefficient, 0) /
              evaluated.reduce((acc, curr) => acc + curr.subject.default_coefficient, 0)
            ).toFixed(2)
          )
        : null;
    const weakSubjects = subjectStats.filter((s) => s.average !== null && (s.average || 0) < 10);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewingStudentDetail(null)}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour à la liste des élèves</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const weakStr = weakSubjects.map((w) => `${w.subject.name} (${w.average}/20)`).join(', ');
              const prompt = `Voici le dossier de l'élève ${st.last_name} ${st.first_name} (${cls?.name || 'Classe'}).\nMoyenne générale T1 : ${generalAvg || '—'}/20.\nDifficultés détectées en : ${weakStr || 'Général'}.\n\nPropose une stratégie pédagogique personnalisée de remédiation, 3 exercices adaptés pour combler ses lacunes et une appréciation encourageante.`;
              onNavigateToAI(prompt);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-sm cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Plan d'Accompagnement IA</span>
          </button>
        </div>

        {/* Identity Card */}
        <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-cyan-500 font-display text-2xl font-black text-white">
            {st.last_name[0]}{st.first_name[0]}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-xl font-black text-slate-900 dark:text-white">
                {st.last_name} {st.first_name}
              </h1>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                st.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {st.status === 'active' ? 'Inscrit actif' : 'Archivé'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Matricule : <strong>{st.matricule}</strong> • Classe : <strong>{cls?.name || 'Non assignée'}</strong> • Genre : {st.gender === 'F' ? 'Féminin' : 'Masculin'}
            </p>
            <div className="pt-2 text-xs text-slate-600 dark:text-slate-300">
              Tuteur légal : <strong>{st.guardian_name || 'Non renseigné'}</strong> ({st.guardian_phone || 'Pas de numéro'})
            </div>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-center dark:border-blue-900/40 dark:bg-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Moyenne Globale T1</span>
            <div className="font-display text-3xl font-black text-blue-600 dark:text-cyan-400 tabular-nums">
              {generalAvg !== null ? `${generalAvg.toFixed(2)}` : '—'}
            </div>
            <span className="text-xs text-slate-500">/ 20</span>
          </div>
        </div>

        {/* Progression Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-display text-base font-bold text-slate-900 dark:text-white">
            Courbe d'Évolution Académique (T1 → T2 → T3)
          </h2>
          <div className="h-64 w-full">
            <canvas ref={studentChartRef} />
          </div>
        </div>

        {/* Subjects Performance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-display text-base font-bold text-slate-900 dark:text-white">
            Détail des Matières (1er Trimestre)
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjectStats.map((item) => (
              <div
                key={item.subject.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-850"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {item.subject.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Coefficient : ×{item.subject.default_coefficient}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-sm font-black tabular-nums">
                    {item.average !== null ? `${item.average.toFixed(2)}/20` : '—'}
                  </div>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${item.appreciation.badgeClass}`}>
                    {item.appreciation.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-black text-slate-900 dark:text-white">
            Gestion & Registre des Élèves
          </h1>
          <p className="text-xs text-slate-500">
            {filteredStudents.length} apprenant(s) répertorié(s) dans l'établissement actif.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Upload className="h-4 w-4" />
            <span>Importer CSV</span>
            <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
          </label>
          <button
            type="button"
            onClick={handleOpenNewStudent}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Nouvel Élève</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou matricule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <select
          value={selectedClassFilter}
          onChange={(e) => setSelectedClassFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 cursor-pointer"
        >
          <option value="all">Toutes les classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={selectedStatusFilter}
          onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 cursor-pointer"
        >
          <option value="active">Actifs seulement</option>
          <option value="archived">Archivés</option>
          <option value="all">Tous les statuts</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400">
              <th className="py-3 px-4">Matricule</th>
              <th className="py-3 px-4">Nom & Prénom</th>
              <th className="py-3 px-3">Genre</th>
              <th className="py-3 px-4">Classe</th>
              <th className="py-3 px-4">Tuteur</th>
              <th className="py-3 px-3 text-center">Statut</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  Aucun élève ne correspond à votre recherche.
                </td>
              </tr>
            ) : (
              filteredStudents.map((st) => {
                const cls = classes.find((c) => c.id === st.class_id);
                return (
                  <tr
                    key={st.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-850/50"
                  >
                    <td className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">
                      {st.matricule}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setViewingStudentDetail(st)}
                        className="text-left font-bold text-blue-600 hover:underline dark:text-cyan-400 cursor-pointer"
                      >
                        {st.last_name} {st.first_name}
                      </button>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-500">
                      {st.gender === 'F' ? 'Fille' : 'Garçon'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-200">
                      {cls ? cls.name : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {st.guardian_name || '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        st.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {st.status === 'active' ? 'Actif' : 'Archivé'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => setViewingStudentDetail(st)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 cursor-pointer"
                        title="Consulter le dossier académique"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditStudent(st)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 cursor-pointer"
                        title="Modifier les coordonnées"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStudent(st.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {editingStudent ? "Modifier les informations de l'élève" : 'Nouvelle Inscription'}
              </h2>
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Fermer la boîte de dialogue"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Nom de famille *</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Prénom(s) *</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Matricule *</label>
                  <input
                    type="text"
                    required
                    value={formMatricule}
                    onChange={(e) => setFormMatricule(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Genre</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="M">Masculin (Garçon)</option>
                    <option value="F">Féminin (Fille)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Classe *</label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Nationalité</label>
                  <input
                    type="text"
                    value={formNationality}
                    onChange={(e) => setFormNationality(e.target.value)}
                    placeholder="Ex: Congolaise, Sénégalaise..."
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Tuteur / Parent</label>
                  <input
                    type="text"
                    value={formGuardianName}
                    onChange={(e) => setFormGuardianName(e.target.value)}
                    placeholder="Nom complet"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Téléphone Tuteur</label>
                  <input
                    type="tel"
                    value={formGuardianPhone}
                    onChange={(e) => setFormGuardianPhone(e.target.value)}
                    placeholder="+242..."
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 cursor-pointer"
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
