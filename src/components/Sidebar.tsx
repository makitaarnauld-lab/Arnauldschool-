import React from 'react';
import schoolLogo from '../assets/school_logo.jpg';
import {
  LayoutDashboard,
  Sparkles,
  Building2,
  FolderKanban,
  Users,
  BookOpen,
  FileSpreadsheet,
  CalendarCheck2,
  Settings,
  HelpCircle,
  X,
} from 'lucide-react';
import { School } from '../types';

interface SidebarProps {
  activeModule: string;
  onNavigate: (module: string) => void;
  activeSchool: School | null;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onNavigate,
  activeSchool,
  isOpen,
  onClose,
}) => {
  const navItems = [
    {
      section: "VUE D'ENSEMBLE",
      items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
        { id: 'ai', label: 'ArnauldSchool AI', icon: Sparkles, badge: 'Gemini 3.8', highlight: true },
      ],
    },
    {
      section: 'ORGANISATION ACADÉMIQUE',
      items: [
        { id: 'schools', label: 'Établissements', icon: Building2 },
        { id: 'classes', label: 'Classes & Séries', icon: FolderKanban },
        { id: 'students', label: 'Gestion des Élèves', icon: Users },
        { id: 'subjects', label: 'Matières & Coefs', icon: BookOpen },
      ],
    },
    {
      section: 'ÉVALUATIONS & RÉSULTATS',
      items: [
        { id: 'exams', label: 'Calendrier des Examens', icon: CalendarCheck2 },
        { id: 'grades', label: 'Saisie des Notes', icon: FileSpreadsheet },
      ],
    },
    {
      section: 'SYSTÈME',
      items: [
        { id: 'settings', label: 'Paramètres', icon: Settings },
        { id: 'help', label: 'Aide & Méthodologie', icon: HelpCircle },
      ],
    },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-slate-900 text-slate-300 transition-transform duration-300 dark:border-slate-800 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header with Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shadow border border-slate-700 bg-white">
              <img src={schoolLogo} alt="ArnauldSchool" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = 'https://lh3.googleusercontent.com/d/1UGE1bVKWHiBPPu8hAup4QoGYQqE64lkl'; }} />
            </div>
            <span className="font-display text-base font-extrabold text-white">ArnauldSchool</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white lg:hidden"
            aria-label="Fermer le menu de navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Active School Bar */}
        <div className="hidden lg:flex flex-col border-b border-slate-800/80 px-5 py-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Établissement actif
          </span>
          <span className="truncate text-sm font-bold text-white" title={activeSchool?.name}>
            {activeSchool?.name || 'Aucune école active'}
          </span>
          <span className="text-xs text-slate-400">
            {activeSchool?.year_label || '2025-2026'} • {activeSchool?.city || 'Afrique'}
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navItems.map((sec) => (
            <div key={sec.section}>
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {sec.section}
              </div>
              <div className="space-y-1">
                {sec.items.map((it) => {
                  const Icon = it.icon;
                  const isActive = activeModule === it.id;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => handleItemClick(it.id)}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-bold'
                          : it.highlight
                          ? 'text-cyan-300 hover:bg-slate-800 hover:text-cyan-200'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                            isActive
                              ? 'text-white'
                              : it.highlight
                              ? 'text-cyan-400'
                              : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span className="truncate">{it.label}</span>
                      </div>
                      {it.badge && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
                            isActive
                              ? 'bg-blue-700 text-white'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          }`}
                        >
                          {it.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer info */}
        <div className="border-t border-slate-800 p-4 text-[11px] text-slate-400">
          <div className="font-semibold text-slate-300">ArnauldSchool v2.5</div>
          <div>Propulsé par Google Gemini</div>
        </div>
      </aside>
    </>
  );
};
