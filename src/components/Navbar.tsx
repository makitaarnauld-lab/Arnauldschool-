import React from 'react';
import { School, User } from '../types';
import { COUNTRY_DATA } from '../lib/countryData';
import {
  Building2,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  Menu,
  GraduationCap
} from 'lucide-react';
import schoolLogo from '../assets/school_logo.jpg';

interface NavbarProps {
  user: User | null;
  schools: School[];
  activeSchool: School | null;
  onSelectSchool: (id: string) => void;
  activeModule: string;
  onNavigate: (module: string) => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  schools,
  activeSchool,
  onSelectSchool,
  activeModule,
  onNavigate,
  onLogout,
  darkMode,
  onToggleDarkMode,
  onToggleSidebar,
}) => {
  const country = user?.country ? COUNTRY_DATA[user.country] : null;
  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : 'AS';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-8 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      {/* Zone 1: Brand title, one line */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white">
            <img src={schoolLogo} alt="ArnauldSchool" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = 'https://lh3.googleusercontent.com/d/1UGE1bVKWHiBPPu8hAup4QoGYQqE64lkl'; }} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Arnauld<span className="text-cyan-500">School</span>
            </span>
            <span className="rounded bg-blue-50 px-1 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              AI
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Navigation Links, single-line, whitespace-nowrap */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className={`whitespace-nowrap transition-colors hover:text-blue-600 dark:hover:text-cyan-400 ${
            activeModule === 'dashboard' ? 'text-blue-600 dark:text-cyan-400 font-bold' : ''
          }`}
        >
          Tableau de bord
        </button>
        <button
          type="button"
          onClick={() => onNavigate('ai')}
          className={`flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-blue-600 dark:hover:text-cyan-400 ${
            activeModule === 'ai' ? 'text-blue-600 dark:text-cyan-400 font-bold' : ''
          }`}
        >
          <Sparkles className="h-4 w-4 text-cyan-500" />
          <span>Assistant IA</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('grades')}
          className={`whitespace-nowrap transition-colors hover:text-blue-600 dark:hover:text-cyan-400 ${
            activeModule === 'grades' ? 'text-blue-600 dark:text-cyan-400 font-bold' : ''
          }`}
        >
          Notes & Moyennes
        </button>
        <button
          type="button"
          onClick={() => onNavigate('exams')}
          className={`whitespace-nowrap transition-colors hover:text-blue-600 dark:hover:text-cyan-400 ${
            activeModule === 'exams' ? 'text-blue-600 dark:text-cyan-400 font-bold' : ''
          }`}
        >
          Calendrier Examens
        </button>
        <button
          type="button"
          onClick={() => onNavigate('students')}
          className={`whitespace-nowrap transition-colors hover:text-blue-600 dark:hover:text-cyan-400 ${
            activeModule === 'students' ? 'text-blue-600 dark:text-cyan-400 font-bold' : ''
          }`}
        >
          Élèves
        </button>
        <button
          type="button"
          onClick={() => onNavigate('classes')}
          className={`whitespace-nowrap transition-colors hover:text-blue-600 dark:hover:text-cyan-400 ${
            activeModule === 'classes' ? 'text-blue-600 dark:text-cyan-400 font-bold' : ''
          }`}
        >
          Classes
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action group / Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* School Selector */}
        {schools.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
            <select
              aria-label="Sélectionner l'établissement scolaire actif"
              value={activeSchool?.id || ''}
              onChange={(e) => onSelectSchool(e.target.value)}
              className="max-w-[150px] truncate bg-transparent font-semibold text-slate-800 outline-none dark:text-slate-100 cursor-pointer"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id} className="dark:bg-slate-800">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          title={darkMode ? 'Passer au mode clair' : 'Passer au mode sombre'}
          aria-label={darkMode ? 'Passer au mode clair' : 'Passer au mode sombre'}
        >
          {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Profile Chip */}
        {user && (
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-xs font-bold text-white">
              {initials}
            </div>
            <span className="hidden xl:inline text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
              {user.first_name} {user.last_name}
            </span>
            {country && <span className="text-xs" title={country.republic}>{country.flag}</span>}
          </div>
        )}

        {/* Logout */}
        {user && (
          <button
            type="button"
            onClick={onLogout}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
            title="Déconnexion"
            aria-label="Déconnexion"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
};
