import React from 'react';
import { Home, Building2, Award, GraduationCap, Bot, UserCheck } from 'lucide-react';

interface BottomNavProps {
  activeModule: string;
  onNavigate: (module: string) => void;
}

export function BottomNav({ activeModule, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'dashboard', label: 'Accueil', icon: Home },
    { id: 'schools', label: 'Établissement', icon: Building2 },
    { id: 'grades', label: 'Notes', icon: Award },
    { id: 'students', label: 'Élèves', icon: GraduationCap },
    { id: 'ai', label: 'Assistant IA', icon: Bot },
    { id: 'settings', label: 'Profil', icon: UserCheck },
  ];

  return (
    <nav aria-label="Navigation principale" className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-2xl dark:bg-slate-900/95 dark:border-slate-800/80 transition-all duration-300">
      <div className="max-w-4xl mx-auto px-2 py-2 flex items-center justify-around sm:justify-center sm:gap-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id || (item.id === 'schools' && activeModule === 'classes');
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                if (window.navigator && window.navigator.vibrate) {
                  try { window.navigator.vibrate(30); } catch (e) {}
                }
              }}
              className={`relative group flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 transform active:scale-95 ${
                isActive
                  ? 'text-violet-700 dark:text-cyan-400 font-bold scale-105 bg-violet-50/90 dark:bg-violet-950/50 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-6 h-1 bg-violet-600 dark:bg-cyan-400 rounded-full animate-pulse shadow-sm shadow-violet-500/50" />
              )}
              <div className={`p-1 rounded-xl transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'}`}>
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-violet-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-cyan-300'}`} />
              </div>
              <span className={`text-[10px] sm:text-xs tracking-tight transition-all duration-200 ${isActive ? 'font-black opacity-100' : 'font-medium opacity-80 group-hover:opacity-100'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
