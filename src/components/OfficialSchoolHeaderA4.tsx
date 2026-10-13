import React from 'react';
import { School, SchoolHeaderConfig } from '../types';
import { Award, BookOpen, GraduationCap, Flame, Sparkles } from 'lucide-react';

interface OfficialSchoolHeaderA4Props {
  school: School | null;
  configOverride?: SchoolHeaderConfig;
  documentTitle?: string;
  documentSubtitle?: string;
  academicYear?: string;
  dateStr?: string;
  compact?: boolean;
  className?: string;
}

export const OfficialSchoolHeaderA4: React.FC<OfficialSchoolHeaderA4Props> = ({
  school,
  configOverride,
  documentTitle,
  documentSubtitle,
  academicYear,
  dateStr,
  compact = false,
  className = '',
}) => {
  const cfg = configOverride || school?.header_config || {};

  const republicTitle = cfg.republicTitle || 'RÉPUBLIQUE DU CONGO';
  const motto = cfg.motto || 'Unité * Travail * Progrès';
  const ministry =
    cfg.ministry ||
    "MINISTÈRE DE L'ENSEIGNEMENT PRÉSCOLAIRE, PRIMAIRE, SECONDAIRE ET DE L'ALPHABÉTISATION";
  const direction = cfg.direction || `DIRECTION DÉPARTEMENTALE DE L'ENSEIGNEMENT (${school?.city || 'BRAZZAVILLE'})`;
  const inspection = cfg.inspection || "INSPECTION DE L'ENSEIGNEMENT SECONDAIRE GÉNÉRAL";

  const schoolName = cfg.schoolName || school?.name || 'ÉTABLISSEMENT SCOLAIRE';
  const schoolSub = cfg.subTitle || school?.type || 'Enseignement Général & Technique';
  const postalBox = cfg.postalBox || (school?.address ? `B.P. : ${school.address}` : 'B.P. 1420');
  const phone = cfg.phone || school?.phone || '+242 06 000 00 00';
  const email = cfg.email || school?.email || 'contact@etablissement.edu';
  const city = cfg.city || school?.city || 'Brazzaville';
  const year = academicYear || cfg.academicYear || school?.year_label || '2024 - 2025';
  const style = cfg.style || 'classic';
  const logoIcon = cfg.logoIcon || 'shield';

  const renderLogoEmblem = () => {
    if (cfg.logoUrl) {
      return (
        <img
          src={cfg.logoUrl}
          alt="Logo Établissement"
          className={`${compact ? 'h-10 w-10' : 'h-14 w-14'} object-contain mx-auto rounded-lg shadow-xs`}
        />
      );
    }

    return (
      <div
        className={`mx-auto flex ${
          compact ? 'h-9 w-9' : 'h-12 w-12'
        } items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 text-white shadow-sm ring-2 ring-blue-600/20`}
      >
        {logoIcon === 'book' && <BookOpen className={compact ? 'h-4 w-4' : 'h-6 w-6'} />}
        {logoIcon === 'flame' && <Flame className={compact ? 'h-4 w-4' : 'h-6 w-6'} />}
        {logoIcon === 'cap' && <GraduationCap className={compact ? 'h-4 w-4' : 'h-6 w-6'} />}
        {logoIcon === 'sparkles' && <Sparkles className={compact ? 'h-4 w-4' : 'h-6 w-6'} />}
        {logoIcon !== 'book' && logoIcon !== 'flame' && logoIcon !== 'cap' && logoIcon !== 'sparkles' && (
          <Award className={compact ? 'h-4 w-4' : 'h-6 w-6'} />
        )}
      </div>
    );
  };

  if (style === 'centered') {
    return (
      <div className={`border-b-2 border-slate-900 pb-3 text-slate-900 font-serif ${className}`}>
        <div className="text-center space-y-1">
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-900">
            {republicTitle}
          </div>
          <div className="text-[9px] italic text-slate-600">{motto}</div>
          <div className="text-[9px] uppercase font-bold text-slate-800">{ministry}</div>
          <div className="my-1.5 flex justify-center">{renderLogoEmblem()}</div>
          <div className="text-sm font-black uppercase tracking-wide text-blue-900">
            {schoolName}
          </div>
          <div className="text-[10px] text-slate-600 font-sans">
            {schoolSub} • {postalBox} • Tél: {phone} • {city}
          </div>
          <div className="text-[10px] font-bold text-slate-700">Année Scolaire : {year}</div>
        </div>

        {documentTitle && (
          <div className="mt-3 text-center">
            <div className="inline-block border-2 border-slate-900 bg-slate-100 px-6 py-1.5 font-sans text-xs font-black uppercase tracking-wider text-slate-950 shadow-xs">
              {documentTitle}
            </div>
            {documentSubtitle && (
              <div className="mt-1 font-sans text-[11px] font-semibold text-slate-600">
                {documentSubtitle}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Classic Dual-Column Official Layout (Standard Francophone Republics)
  return (
    <div className={`border-b-2 border-slate-800 pb-3 text-slate-900 font-serif ${className}`}>
      <div className="flex items-start justify-between gap-3 text-left">
        {/* Left Column: Republic & Ministry */}
        <div className="w-[42%] text-center space-y-0.5">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-900">
            {republicTitle}
          </div>
          <div className="text-[8.5px] italic text-slate-600 font-medium">
            « {motto} »
          </div>
          <div className="w-10 h-0.5 bg-slate-400 mx-auto my-0.5" />
          <div className="text-[8.5px] uppercase font-bold text-slate-800 leading-tight">
            {ministry}
          </div>
          <div className="text-[8px] uppercase text-slate-600 leading-tight">
            {direction}
          </div>
          <div className="text-[7.5px] uppercase text-slate-500 leading-tight">
            {inspection}
          </div>
        </div>

        {/* Center: Official Emblem */}
        <div className="w-[16%] text-center shrink-0 flex flex-col items-center justify-center pt-1">
          {renderLogoEmblem()}
          <span className="mt-1 font-sans text-[8px] font-black uppercase text-slate-500 tracking-tighter">
            SCE • OFFICIEL
          </span>
        </div>

        {/* Right Column: School & Coordinates */}
        <div className="w-[42%] text-center space-y-0.5">
          <div className="text-[11px] font-black uppercase tracking-wide text-blue-950 leading-tight">
            {schoolName}
          </div>
          <div className="text-[8.5px] font-semibold text-slate-700 italic">
            « {schoolSub} »
          </div>
          <div className="w-10 h-0.5 bg-slate-400 mx-auto my-0.5" />
          <div className="text-[8px] text-slate-600 font-sans leading-tight">
            {postalBox} • {city}
          </div>
          <div className="text-[8px] text-slate-600 font-sans leading-tight">
            Tél : {phone}
          </div>
          <div className="text-[8px] text-slate-600 font-sans leading-tight">
            Email : {email}
          </div>
          <div className="font-sans text-[9px] font-bold text-slate-900 pt-0.5">
            Année Académique : <span className="underline">{year}</span>
          </div>
        </div>
      </div>

      {/* Decorative official separation lines */}
      <div className="mt-2.5 flex flex-col gap-0.5">
        <div className="h-0.5 w-full bg-slate-900" />
        <div className="h-px w-full bg-slate-400" />
      </div>

      {/* Optional Document Title Banner */}
      {documentTitle && (
        <div className="mt-3 text-center">
          <div className="inline-block border border-slate-900 bg-slate-50 px-5 py-1 font-sans text-xs font-black uppercase tracking-widest text-slate-900 shadow-xs">
            {documentTitle}
          </div>
          {documentSubtitle && (
            <div className="mt-1 font-sans text-[10.5px] font-bold text-slate-700">
              {documentSubtitle}
            </div>
          )}
          {dateStr && (
            <div className="mt-0.5 font-sans text-[9.5px] text-slate-500">
              Édité le {dateStr}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
