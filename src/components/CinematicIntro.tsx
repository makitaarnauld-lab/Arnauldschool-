import React, { useState } from 'react';
import { User } from '../types';
import { COUNTRY_DATA } from '../lib/countryData';
import { GraduationCap, Sparkles, Building2, ArrowRight } from 'lucide-react';

interface CinematicIntroProps {
  user: User | null;
  onFinish: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ user, onFinish }) => {
  const [slide, setSlide] = useState(0);
  const country = user?.country ? COUNTRY_DATA[user.country] : null;

  const slides = [
    {
      title: "Bienvenue sur ArnauldSchool",
      subtitle: "L'intelligence pédagogique au service de vos élèves",
      desc: "Une plateforme intégrée pour gérer vos établissements, centraliser vos notes et concevoir vos enseignements avec l'aide de l'intelligence artificielle.",
      icon: GraduationCap,
      badge: "Système Éducatif Africain",
    },
    {
      title: "Assistant Pédagogique Intelligent",
      subtitle: "Préparez vos cours et évaluations en quelques secondes",
      desc: "Fiches de cours APC, sujets d'examens avec corrigé et barème complet sur 20 points, remédiation pour élèves en difficulté et dictée vocale instantanée.",
      icon: Sparkles,
      badge: "ArnauldSchool AI",
    },
    {
      title: `${country ? country.republic : "Votre Établissement Scolaire"}`,
      subtitle: country?.motto || "Excellence • Rigueur • Progrès",
      desc: "Suivez en temps réel les moyennes pondérées, le taux de réussite global et la répartition des mentions grâce à votre nouveau tableau de bord analytique.",
      icon: Building2,
      badge: country?.flag || "🏫",
    },
  ];

  const current = slides[slide];
  const Icon = current.icon;

  const handleNext = () => {
    if (slide < slides.length - 1) {
      setSlide(slide + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 text-white">
      {/* Background glow */}
      <div className="absolute inset-0 bg-radial from-blue-900/30 via-slate-950 to-slate-950" />
      <div className="relative z-10 w-full max-w-xl text-center space-y-8">
        <button
          type="button"
          onClick={onFinish}
          className="absolute -top-12 right-0 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300 hover:bg-white/20"
        >
          Passer l'introduction ✕
        </button>

        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-2xl shadow-blue-500/30">
          <Icon className="h-12 w-12" />
        </div>

        <div className="space-y-3">
          <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-cyan-300">
            {current.badge}
          </span>
          <h1 className="font-display text-2xl font-black tracking-tight sm:text-3xl text-white">
            {current.title}
          </h1>
          <p className="font-semibold text-cyan-300 text-sm">
            {current.subtitle}
          </p>
          <p className="mx-auto max-w-md text-xs leading-relaxed text-slate-400">
            {current.desc}
          </p>
        </div>

        {/* Step dots & CTA */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === slide ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/30 hover:opacity-95 active:scale-95"
          >
            <span>{slide === slides.length - 1 ? 'Accéder à mon espace' : 'Suivant'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
