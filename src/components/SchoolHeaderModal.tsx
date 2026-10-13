import React, { useState } from 'react';
import { School, SchoolHeaderConfig } from '../types';
import { OfficialSchoolHeaderA4 } from './OfficialSchoolHeaderA4';
import { 
  X, 
  Save, 
  Sparkles, 
  Building2, 
  Eye, 
  Check, 
  Printer, 
  RotateCcw,
  Shield,
  BookOpen,
  Flame,
  GraduationCap
} from 'lucide-react';

interface SchoolHeaderModalProps {
  isOpen: boolean;
  school: School | null;
  onClose: () => void;
  onSaveHeader: (updatedSchool: School) => void;
}

const TEMPLATES: Record<string, { label: string; republic: string; motto: string; ministry: string; flag: string }> = {
  cg: {
    label: 'Congo-Brazzaville',
    flag: '🇨🇬',
    republic: 'RÉPUBLIQUE DU CONGO',
    motto: 'Unité * Travail * Progrès',
    ministry: "MINISTÈRE DE L'ENSEIGNEMENT PRÉSCOLAIRE, PRIMAIRE, SECONDAIRE ET DE L'ALPHABÉTISATION",
  },
  cd: {
    label: 'RDC (Congo-Kinshasa)',
    flag: '🇨🇩',
    republic: 'RÉPUBLIQUE DÉMOCRATIQUE DU CONGO',
    motto: 'Justice - Paix - Travail',
    ministry: "MINISTÈRE DE L'ENSEIGNEMENT PRIMAIRE, SECONDAIRE ET TECHNIQUE (EPST)",
  },
  sn: {
    label: 'Sénégal',
    flag: '🇸🇳',
    republic: 'RÉPUBLIQUE DU SÉNÉGAL',
    motto: 'Un Peuple - Un But - Une Foi',
    ministry: "MINISTÈRE DE L'ÉDUCATION NATIONALE",
  },
  ci: {
    label: "Côte d'Ivoire",
    flag: '🇨🇮',
    republic: "RÉPUBLIQUE DE CÔTE D'IVOIRE",
    motto: 'Union - Discipline - Travail',
    ministry: "MINISTÈRE DE L'ÉDUCATION NATIONALE ET DE L'ALPHABÉTISATION",
  },
  cm: {
    label: 'Cameroun',
    flag: '🇨🇲',
    republic: 'RÉPUBLIQUE DU CAMEROUN',
    motto: 'Paix - Travail - Patrie',
    ministry: "MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES (MINESEC)",
  },
  ga: {
    label: 'Gabon',
    flag: '🇬🇦',
    republic: 'RÉPUBLIQUE GABONAISE',
    motto: 'Union - Travail - Justice',
    ministry: "MINISTÈRE DE L'ÉDUCATION NATIONALE ET DE LA FORMATION CIVIQUE",
  },
  fr: {
    label: 'France / Système Français',
    flag: '🇫🇷',
    republic: 'RÉPUBLIQUE FRANÇAISE',
    motto: 'Liberté - Égalité - Fraternité',
    ministry: "MINISTÈRE DE L'ÉDUCATION NATIONALE ET DE LA JEUNESSE",
  },
};

export const SchoolHeaderModal: React.FC<SchoolHeaderModalProps> = ({
  isOpen,
  school,
  onClose,
  onSaveHeader,
}) => {
  if (!isOpen || !school) return null;

  const currentConfig: SchoolHeaderConfig = school.header_config || {};

  const [republicTitle, setRepublicTitle] = useState(
    currentConfig.republicTitle || 'RÉPUBLIQUE DU CONGO'
  );
  const [motto, setMotto] = useState(currentConfig.motto || 'Unité * Travail * Progrès');
  const [ministry, setMinistry] = useState(
    currentConfig.ministry ||
      "MINISTÈRE DE L'ENSEIGNEMENT PRÉSCOLAIRE, PRIMAIRE, SECONDAIRE ET DE L'ALPHABÉTISATION"
  );
  const [direction, setDirection] = useState(
    currentConfig.direction || `DIRECTION DÉPARTEMENTALE DE L'ENSEIGNEMENT (${school.city || 'BRAZZAVILLE'})`
  );
  const [inspection, setInspection] = useState(
    currentConfig.inspection || "INSPECTION DE L'ENSEIGNEMENT SECONDAIRE GÉNÉRAL"
  );
  const [schoolName, setSchoolName] = useState(currentConfig.schoolName || school.name);
  const [subTitle, setSubTitle] = useState(
    currentConfig.subTitle || school.type || 'Discipline - Travail - Succès'
  );
  const [postalBox, setPostalBox] = useState(
    currentConfig.postalBox || (school.address ? `B.P. : ${school.address}` : 'B.P. 1420')
  );
  const [phone, setPhone] = useState(currentConfig.phone || school.phone || '+242 06 123 45 67');
  const [email, setEmail] = useState(
    currentConfig.email || school.email || 'contact@etablissement.edu'
  );
  const [city, setCity] = useState(currentConfig.city || school.city || 'Brazzaville');
  const [academicYear, setAcademicYear] = useState(
    currentConfig.academicYear || school.year_label || '2024 - 2025'
  );
  const [logoIcon, setLogoIcon] = useState<string>(currentConfig.logoIcon || 'shield');
  const [style, setStyle] = useState<'classic' | 'modern' | 'centered'>(
    currentConfig.style || 'classic'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const applyTemplate = (key: string) => {
    const t = TEMPLATES[key];
    if (!t) return;
    setRepublicTitle(t.republic);
    setMotto(t.motto);
    setMinistry(t.ministry);
  };

  const handleSave = () => {
    const updatedConfig: SchoolHeaderConfig = {
      republicTitle: republicTitle.trim(),
      motto: motto.trim(),
      ministry: ministry.trim(),
      direction: direction.trim(),
      inspection: inspection.trim(),
      schoolName: schoolName.trim(),
      subTitle: subTitle.trim(),
      postalBox: postalBox.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim(),
      academicYear: academicYear.trim(),
      logoIcon,
      style,
    };

    const updatedSchool: School = {
      ...school,
      name: schoolName.trim() || school.name,
      header_config: updatedConfig,
    };

    onSaveHeader(updatedSchool);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const liveConfig: SchoolHeaderConfig = {
    republicTitle,
    motto,
    ministry,
    direction,
    inspection,
    schoolName,
    subTitle,
    postalBox,
    phone,
    email,
    city,
    academicYear,
    logoIcon,
    style,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-5 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[94vh] rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs text-white shadow-xs">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-lg font-black text-white">
                Configuration de l'En-tête Officiel A4
              </h2>
              <p className="text-xs text-white/80">
                Établissement : <strong className="text-white">{school.name}</strong> • Affiché sur toutes les feuilles A4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Enregistré !</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Sauvegarder l'En-tête</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Form + Live A4 Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Form Settings (7 cols) */}
          <div className="lg:col-span-6 space-y-5">
            {/* Template Quick Selection */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-slate-850">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:text-cyan-300">
                  Modèles Officiels Pré-configurés
                </span>
                <span className="text-[10px] text-slate-500">1-clic pour remplir</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(TEMPLATES).map(([k, t]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => applyTemplate(k)}
                    className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-blue-600 transition-colors cursor-pointer"
                  >
                    <span>{t.flag}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Left Block: State / Tutelle */}
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 space-y-3">
              <div className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-[10px] font-black text-white">1</span>
                Bloc État & Tutelle (Colonne Gauche)
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Titre République / Pays</label>
                <input
                  type="text"
                  value={republicTitle}
                  onChange={(e) => setRepublicTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="ex: RÉPUBLIQUE DU CONGO"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Devise Nationale</label>
                  <input
                    type="text"
                    value={motto}
                    onChange={(e) => setMotto(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="Unité * Travail * Progrès"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Année Scolaire</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="2024 - 2025"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Ministère de Tutelle</label>
                <input
                  type="text"
                  value={ministry}
                  onChange={(e) => setMinistry(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Direction Départementale</label>
                  <input
                    type="text"
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Inspection Pédagogique</label>
                  <input
                    type="text"
                    value={inspection}
                    onChange={(e) => setInspection(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Right Block: School Establishment */}
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 space-y-3">
              <div className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-600 text-[10px] font-black text-white">2</span>
                Bloc Établissement (Colonne Droite)
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Nom de l'Établissement</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="ex: COMPLEXE SCOLAIRE LES ÉLITES"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Slogan / Devise Établissement</label>
                  <input
                    type="text"
                    value={subTitle}
                    onChange={(e) => setSubTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="Discipline - Travail - Succès"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Boîte Postale / Adresse</label>
                  <input
                    type="text"
                    value={postalBox}
                    onChange={(e) => setPostalBox(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="B.P. 1420"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Téléphone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Email</label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Ville</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Emblem & Style */}
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 space-y-3">
              <div className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-cyan-600 text-[10px] font-black text-white">3</span>
                Emblème & Disposition
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Emblème Central</label>
                  <div className="mt-1.5 flex items-center gap-2">
                    {[
                      { id: 'shield', icon: <Shield className="h-4 w-4" />, label: 'Blason' },
                      { id: 'book', icon: <BookOpen className="h-4 w-4" />, label: 'Livre' },
                      { id: 'flame', icon: <Flame className="h-4 w-4" />, label: 'Flambeau' },
                      { id: 'cap', icon: <GraduationCap className="h-4 w-4" />, label: 'Diplôme' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLogoIcon(item.id)}
                        className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          logoIcon === item.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Mise en page</label>
                  <div className="mt-1.5 flex items-center gap-2">
                    {[
                      { id: 'classic', label: 'Bicolonne Officiel' },
                      { id: 'centered', label: 'Centré Ministère' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setStyle(item.id as any)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          style === item.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Live A4 Preview Sheet (6 cols) */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2 px-1">
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <Eye className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                Aperçu Direct sur Feuille Blanche A4
              </span>
              <span className="text-[11px] text-slate-400">Format 210 × 297 mm</span>
            </div>

            {/* A4 Sheet Container */}
            <div className="w-full rounded-2xl bg-slate-200/80 p-4 dark:bg-slate-950/80 shadow-inner flex justify-center">
              <div className="w-full max-w-[480px] bg-white text-slate-900 rounded-lg shadow-xl border border-slate-300 p-6 min-h-[560px] flex flex-col justify-between">
                {/* A4 Top Header */}
                <div>
                  <OfficialSchoolHeaderA4
                    school={school}
                    configOverride={liveConfig}
                    documentTitle="FICHE PÉDAGOGIQUE OFFICIELLE APC"
                    documentSubtitle={`Classe : Terminale Scientifique • Discipline : Mathématiques & Sciences`}
                    dateStr={new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  />

                  {/* Sample A4 Document Content Simulation */}
                  <div className="mt-6 space-y-3 text-[11px] text-slate-700">
                    <div className="rounded-lg border border-slate-300 bg-slate-50 p-2.5">
                      <div className="font-bold text-slate-900">I. INFORMATIONS GÉNÉRALES</div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] mt-1 text-slate-600">
                        <div>Enseignant : <strong>Arnauld M.</strong></div>
                        <div>Effectif : <strong>42 élèves</strong></div>
                        <div>Trimestre : <strong>1er Trimestre</strong></div>
                        <div>Durée : <strong>2 Heures</strong></div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-300 bg-slate-50 p-2.5">
                      <div className="font-bold text-slate-900">II. OBJECTIFS & COMPÉTENCES VISÉES</div>
                      <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                        L'apprenant sera capable de mobiliser ses connaissances théoriques pour résoudre une situation d'intégration complexe conformément aux programmes nationaux en vigueur.
                      </p>
                    </div>

                    <div className="text-[9.5px] text-slate-400 italic text-center pt-2">
                      [... Suite du document pédagogique / tableau de notes / sujet d'évaluation ...]
                    </div>
                  </div>
                </div>

                {/* A4 Bottom Signature Block Simulation */}
                <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 text-center text-[10px] text-slate-700">
                  <div>
                    <div className="font-bold">L'Enseignant</div>
                    <div className="h-10"></div>
                    <div className="text-[9px] text-slate-400">Signature & Date</div>
                  </div>
                  <div>
                    <div className="font-bold">Le Chef d'Établissement</div>
                    <div className="h-10"></div>
                    <div className="text-[9px] text-slate-400">Sceau & Visa</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 text-center text-[11px] text-slate-500">
              💡 Cet en-tête officiel est automatiquement injecté lors des téléchargements <strong>.PDF</strong>, <strong>.DOC (Word)</strong>, des impressions A4 et des bilans de notes.
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-850 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => applyTemplate('cg')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Réinitialiser aux valeurs par défaut</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Appliquer à l'établissement</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
