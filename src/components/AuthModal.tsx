import React, { useState } from 'react';
import { User } from '../types';
import { COUNTRY_DATA } from '../lib/countryData';
import { genId, getLS, setLS, KEYS } from '../lib/storage';
import { ArrowRight, Lock, Mail, Sparkles } from 'lucide-react';
import schoolLogo from '../assets/school_logo.jpg';

interface AuthModalProps {
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isActif, setIsActif] = useState(false); // false = connexion, true = inscription
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('CG');
  const [city, setCity] = useState('Brazzaville');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('Professeur de Mathématiques & Sciences');

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedCountry = COUNTRY_DATA[country] || COUNTRY_DATA.CG;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const users = getLS<any[]>(KEYS.users, []);
      const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!user) {
        throw new Error('Aucun compte trouvé avec cet e-mail. Veuillez vous inscrire ou utiliser le mode Démo.');
      }
      const cleanUser: User = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: `${user.first_name} ${user.last_name}`.trim(),
        country: user.country,
        city: user.city,
        phone: user.phone,
        profession: user.profession,
        role: user.role || 'teacher',
        created_at: user.created_at || new Date().toISOString(),
      };
      setLS(KEYS.session, { userId: cleanUser.id, email: cleanUser.email });
      onSuccess(cleanUser);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (!email.trim() || !password || !firstName.trim() || !lastName.trim()) {
        throw new Error('Veuillez remplir tous les champs obligatoires.');
      }
      const users = getLS<any[]>(KEYS.users, []);
      if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
        throw new Error('Cette adresse e-mail est déjà associée à un compte.');
      }

      const newUser: User = {
        id: genId('u'),
        email: email.trim().toLowerCase(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        country,
        city: city.trim(),
        phone: `${selectedCountry.phoneCode} ${phone.trim()}`,
        profession: profession.trim(),
        role: 'teacher',
        created_at: new Date().toISOString(),
      };

      users.push({ ...newUser, passwordHash: password });
      setLS(KEYS.users, users);
      setLS(KEYS.session, { userId: newUser.id, email: newUser.email });
      onSuccess(newUser);
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = () => {
    const demoUser: User = {
      id: 'demo_teacher_01',
      email: 'arnauld.prof@ecole.edu',
      first_name: 'Arnauld',
      last_name: 'Makita',
      full_name: 'Prof. Arnauld Makita',
      country: 'CG',
      city: 'Brazzaville',
      phone: '+242 06 654 32 10',
      profession: 'Professeur Principal de Mathématiques & Physique',
      role: 'teacher',
      created_at: new Date().toISOString(),
    };
    const users = getLS<any[]>(KEYS.users, []);
    if (!users.some((u) => u.id === demoUser.id)) {
      users.push(demoUser);
      setLS(KEYS.users, users);
    }
    setLS(KEYS.session, { userId: demoUser.id, email: demoUser.email });
    onSuccess(demoUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <style>{`
        :root {
          --violet: #351477;
          --violet2: #5126a8;
          --blanc: #fff;
          --gris: #efeee9;
          --texte: #25232b;
        }
        .conteneur-auth {
          position: relative;
          width: 100%;
          max-width: 1050px;
          height: 640px;
          background: white;
          border-radius: 30px;
          overflow: hidden;
          box-shadow: 0 25px 55px #180c3038;
          animation: apparition .8s ease both;
        }
        @keyframes apparition {
          from { opacity: 0; transform: translateY(22px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .formulaire {
          position: absolute;
          top: 0;
          width: 50%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform .7s cubic-bezier(.68,-.05,.27,1.05), opacity .4s ease;
        }
        .connexion { left: 0; z-index: 2; }
        .inscription { left: 50%; z-index: 1; opacity: 0; pointer-events: none; transform: translateX(25px); }
        .conteneur-auth.actif .connexion { transform: translateX(25px); opacity: 0; pointer-events: none; }
        .conteneur-auth.actif .inscription { transform: translateX(0); opacity: 1; z-index: 3; pointer-events: auto; }
      `}</style>

      <div className={`conteneur-auth ${isActif ? 'actif' : ''} flex flex-col md:flex-row bg-white text-slate-900`}>
        {/* Formulaire Connexion */}
        <div className="formulaire connexion bg-white p-8 md:p-12 flex flex-col justify-center items-center text-center">
          <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden shadow-lg border border-indigo-100 bg-white">
              <img src={schoolLogo} alt="ArnauldSchool" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = 'https://lh3.googleusercontent.com/d/1UGE1bVKWHiBPPu8hAup4QoGYQqE64lkl'; }} />
            </div>
            <h1 className="text-3xl font-black text-[#351477] mb-2 tracking-tight">Connexion</h1>
            <p className="text-xs text-slate-500 mb-6">Accédez à votre espace enseignant ArnauldSchool</p>

            {errorMessage && (
              <div className="w-full mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 font-semibold">
                {errorMessage}
              </div>
            )}

            <div className="w-full space-y-3 mb-5 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adresse E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="professeur@ecole.edu"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#351477]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#351477]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#351477] hover:bg-[#5126a8] text-white font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="mt-4 w-full">
              <button
                type="button"
                onClick={handleQuickDemo}
                className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#351477] font-bold text-xs transition-all flex items-center justify-center gap-2 border border-indigo-200"
              >
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Mode Démo en 1 clic (Prof. Arnauld)
              </button>
            </div>

            <p className="mt-6 text-xs text-slate-600">
              Pas encore de compte ?{' '}
              <button
                type="button"
                onClick={() => setIsActif(true)}
                className="text-[#351477] font-extrabold underline cursor-pointer"
              >
                S'inscrire
              </button>
            </p>
          </form>
        </div>

        {/* Formulaire Inscription */}
        <div className="formulaire inscription bg-white p-6 md:p-10 flex flex-col justify-start items-center text-center overflow-y-auto">
          <form onSubmit={handleRegister} className="w-full max-w-md flex flex-col items-center py-2">
            <h1 className="text-2xl font-black text-[#351477] mb-1 tracking-tight">Créer un Compte</h1>
            <p className="text-xs text-slate-500 mb-4">Rejoignez la première plateforme pédagogique francophone</p>

            <div className="w-full space-y-3 mb-4 text-left">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Arnauld"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-[#351477]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nom</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Makita"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-[#351477]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Pays</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-[#351477]"
                  >
                    {Object.entries(COUNTRY_DATA).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.flag} {info.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Brazzaville"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-[#351477]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Téléphone ({selectedCountry.phoneCode})</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06 500 00 00"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-[#351477]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="professeur@ecole.edu"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-[#351477]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-[#351477]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#351477] hover:bg-[#5126a8] text-white font-bold text-xs shadow-xl transition-all flex items-center justify-center gap-2 mb-3"
            >
              {isLoading ? 'Inscription...' : "S'inscrire"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-xs text-slate-600">
              Déjà un compte ?{' '}
              <button
                type="button"
                onClick={() => setIsActif(false)}
                className="text-[#351477] font-extrabold underline cursor-pointer"
              >
                Se connecter
              </button>
            </p>
          </form>
        </div>

        {/* Panneau Latéral Visuel */}
        <div className={`absolute top-0 w-1/2 h-full bg-gradient-to-br from-[#351477] via-[#5126a8] to-[#180c30] text-white flex flex-col items-center justify-center p-10 text-center transition-all duration-700 ease-in-out z-20 ${isActif ? 'left-0 rounded-r-[30px]' : 'left-1/2 rounded-l-[30px]'}`}>
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-white">
            <img src={schoolLogo} alt="ArnauldSchool" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = 'https://lh3.googleusercontent.com/d/1UGE1bVKWHiBPPu8hAup4QoGYQqE64lkl'; }} />
          </div>
          <h2 className="text-2xl font-black mb-3">
            {isActif ? 'Bon retour parmi nous !' : 'ArnauldSchool AI'}
          </h2>
          <p className="text-xs text-indigo-100 leading-relaxed mb-6">
            {isActif
              ? 'Connectez-vous pour retrouver vos classes, vos notes et votre assistant pédagogique intelligent.'
              : "Créez votre compte et profitez d'une plateforme unifiée conçue pour l'excellence et la réussite des élèves."}
          </p>
          <button
            type="button"
            onClick={() => setIsActif(!isActif)}
            className="px-6 py-3 rounded-xl border border-white/40 hover:bg-white/10 font-bold text-xs transition-all tracking-wide uppercase"
          >
            {isActif ? 'Se connecter' : "S'inscrire"}
          </button>
        </div>
      </div>
    </div>
  );
};
