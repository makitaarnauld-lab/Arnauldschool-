import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Save,
  Download,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Table as TableIcon,
  Sparkles,
  Printer,
  Undo2,
  Redo2,
  Eye,
  Edit3
} from 'lucide-react';
import { downloadWordDoc, exportAIPedagogyPDFEnhanced } from '../lib/documentExport';

interface WordEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  title: string;
  onSave?: (updatedContent: string) => void;
  schoolName?: string;
}

export const WordEditorModal: React.FC<WordEditorModalProps> = ({
  isOpen,
  onClose,
  initialContent,
  title,
  onSave,
  schoolName,
}) => {
  const [docContent, setDocContent] = useState<string>(initialContent);
  const [docTitle, setDocTitle] = useState<string>(title);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDocContent(initialContent);
    setDocTitle(title);
    setHistory([initialContent]);
    setHistoryIndex(0);
  }, [initialContent, title]);

  const updateContentWithHistory = (newText: string) => {
    setDocContent(newText);
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newText);
    if (updatedHistory.length > 30) updatedHistory.shift();
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setDocContent(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setDocContent(next);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = docContent.substring(start, end);
    const newText =
      docContent.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      docContent.substring(end);

    updateContentWithHistory(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const beforeCursor = docContent.substring(0, start);
    const lastNewline = beforeCursor.lastIndexOf('\n');
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

    const newText =
      docContent.substring(0, lineStart) +
      prefix +
      docContent.substring(lineStart);

    updateContentWithHistory(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  const handleInsertTable = () => {
    const tableTemplate = `\n\n| N° | Rubrique / Compétence | Objectif Pédagogique | Évaluation / Note |\n|---|---|---|---|\n| 1 | Notion clé | Maîtrise des concepts de base | Conforme |\n| 2 | Application pratique | Résolution d'exercices guidés | Très bien |\n| 3 | Synthèse | Évaluation sommative | 18 / 20 |\n\n`;
    insertFormatting(tableTemplate);
  };

  const handleInsertCallout = () => {
    const callout = `\n\n> 💡 **NOTE PÉDAGOGIQUE (Approche APC) :**\n> Consigne pour les apprenants : veuillez justifier chacune de vos réponses.\n\n`;
    insertFormatting(callout);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(docContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(docContent);
    }
    onClose();
  };

  const handleDownloadDoc = () => {
    downloadWordDoc(docTitle, docContent, schoolName);
  };

  const handleDownloadPdf = () => {
    exportAIPedagogyPDFEnhanced(docTitle, docContent, 'Fiche Pédagogique Officielle', schoolName);
  };

  const wordCount = docContent.trim() ? docContent.trim().split(/\s+/).length : 0;
  const charCount = docContent.length;
  const lineCount = docContent.split('\n').length;
  const estimatedPages = Math.max(1, Math.ceil(wordCount / 400));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 animate-fadeIn">
      <div
        className={`flex flex-col rounded-2xl bg-slate-100 dark:bg-slate-900 shadow-2xl border border-slate-300 dark:border-slate-800 overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? 'fixed inset-0 w-screen h-screen rounded-none z-50'
            : 'h-[94vh] w-[96vw] max-w-7xl'
        }`}
      >
        {/* Top Word Ribbon Header */}
        <div className="flex items-center justify-between border-b border-blue-800 bg-[#2b579a] px-4 sm:px-6 py-2.5 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#2b579a] font-black shadow-md">
              <FileText className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="bg-blue-800/60 hover:bg-blue-800/90 focus:bg-blue-900 font-display text-sm sm:text-base font-bold text-white outline-none border border-blue-400/30 focus:border-white px-2.5 py-0.5 rounded-lg transition-colors min-w-[200px] sm:min-w-[320px]"
                  title="Cliquez pour renommer le document"
                />
                <span className="hidden sm:inline-flex rounded bg-blue-900/60 border border-blue-400/40 px-2 py-0.5 text-[11px] font-bold text-blue-200">
                  Microsoft Word (.doc)
                </span>
              </div>
              <p className="text-[11px] text-blue-100 flex items-center gap-2 mt-0.5">
                <span>Grande interface de rédaction & mise en page</span>
                <span>•</span>
                <span>Format A4</span>
              </p>
            </div>
          </div>

          {/* Action and Download Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleDownloadDoc}
              className="flex items-center gap-1.5 rounded-xl bg-white px-3 sm:px-4 py-1.5 text-xs font-bold text-[#2b579a] hover:bg-blue-50 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Télécharger immédiatement en document Word (.doc)"
            >
              <Download className="h-4 w-4 text-blue-700" />
              <span className="hidden sm:inline">Télécharger</span>
              <span className="font-extrabold">.DOC</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 sm:px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Télécharger immédiatement en document PDF officiel"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Télécharger</span>
              <span className="font-extrabold">.PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 sm:px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Sauvegarder et appliquer au message dans la conversation"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Enregistrer</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-800/80 text-white hover:bg-blue-700 transition-colors cursor-pointer"
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-800/80 text-white hover:bg-rose-600 transition-colors cursor-pointer"
              title="Fermer la fenêtre"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Word Ribbon Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2 shadow-xs dark:border-slate-800 dark:bg-slate-850">
          <div className="flex flex-wrap items-center gap-1">
            {/* Undo / Redo */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              title="Annuler (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              title="Rétablir (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </button>

            <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

            {/* Headings */}
            <button
              type="button"
              onClick={() => insertLinePrefix('# ')}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Titre Principal H1"
            >
              <Heading1 className="h-4 w-4 text-blue-700" />
              <span>Titre 1</span>
            </button>
            <button
              type="button"
              onClick={() => insertLinePrefix('## ')}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Sous-Titre H2"
            >
              <Heading2 className="h-4 w-4 text-blue-600" />
              <span>Titre 2</span>
            </button>
            <button
              type="button"
              onClick={() => insertLinePrefix('### ')}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Section H3"
            >
              <Heading3 className="h-4 w-4 text-cyan-600" />
              <span>Titre 3</span>
            </button>

            <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

            {/* Typography */}
            <button
              type="button"
              onClick={() => insertFormatting('**', '**')}
              className="rounded-lg p-1.5 font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Gras (**texte**)"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*')}
              className="rounded-lg p-1.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Italique (*texte*)"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('<u>', '</u>')}
              className="rounded-lg p-1.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Souligné (<u>texte</u>)"
            >
              <Underline className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('~~', '~~')}
              className="rounded-lg p-1.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Barré"
            >
              <Strikethrough className="h-4 w-4" />
            </button>

            <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

            {/* Lists */}
            <button
              type="button"
              onClick={() => insertLinePrefix('- ')}
              className="rounded-lg p-1.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Liste à puces"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertLinePrefix('1. ')}
              className="rounded-lg p-1.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Liste numérotée"
            >
              <ListOrdered className="h-4 w-4" />
            </button>

            <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

            {/* Insert Elements */}
            <button
              type="button"
              onClick={handleInsertTable}
              className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 cursor-pointer"
              title="Insérer un tableau structuré"
            >
              <TableIcon className="h-4 w-4 text-emerald-600" />
              <span>Insérer Tableau</span>
            </button>
            <button
              type="button"
              onClick={handleInsertCallout}
              className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 cursor-pointer"
              title="Insérer un encadré pédagogique"
            >
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>Encadré APC</span>
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </button>

            <div className="flex items-center rounded-xl bg-slate-200 p-0.5 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'editor'
                    ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Page A4 (Édition)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Rendu Imprimable</span>
              </button>
            </div>
          </div>
        </div>

        {/* Word Document Canvas (Page A4 representation) */}
        <div className="flex-1 overflow-y-auto bg-slate-200/80 p-4 sm:p-8 dark:bg-slate-950 flex justify-center">
          <div className="w-full max-w-4xl min-h-[900px] bg-white dark:bg-slate-900 shadow-2xl rounded-sm border border-slate-300 dark:border-slate-800 flex flex-col p-6 sm:p-14">
            
            {/* Document Official Header */}
            <div className="border-b-2 border-blue-600 pb-4 mb-6">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold tracking-wider text-blue-800 dark:text-blue-400 uppercase">
                  {schoolName || 'ARNAULD SCHOOL & ACADÉMIE'}
                </span>
                <span>Fiche d'Évaluation & Préparation</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Date : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            {viewMode === 'editor' ? (
              /* Editable Textarea formatted like a real document */
              <textarea
                ref={textareaRef}
                value={docContent}
                onChange={(e) => updateContentWithHistory(e.target.value)}
                placeholder="Rédigez ou modifiez votre document pédagogique ici..."
                className="w-full flex-1 resize-none bg-transparent font-sans text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-relaxed outline-none border-none focus:ring-0 p-0"
                style={{
                  minHeight: '700px',
                  lineHeight: '1.75'
                }}
              />
            ) : (
              /* High-fidelity Visual Preview */
              <div className="prose prose-blue dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 leading-relaxed text-sm sm:text-base">
                <div
                  dangerouslySetInnerHTML={{
                    __html: docContent
                      .split('\n')
                      .map((line) => {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('# ')) {
                          return `<h1 class="text-2xl font-bold text-blue-900 dark:text-blue-300 border-b pb-2 mt-6 mb-3">${trimmed.slice(2)}</h1>`;
                        }
                        if (trimmed.startsWith('## ')) {
                          return `<h2 class="text-xl font-bold text-blue-800 dark:text-blue-400 mt-5 mb-2">${trimmed.slice(3)}</h2>`;
                        }
                        if (trimmed.startsWith('### ')) {
                          return `<h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mt-4 mb-2">${trimmed.slice(4)}</h3>`;
                        }
                        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                          return `<li class="ml-6 list-disc my-1">${trimmed.slice(2)}</li>`;
                        }
                        if (/^\d+\.\s/.test(trimmed)) {
                          return `<li class="ml-6 list-decimal my-1">${trimmed.replace(/^\d+\.\s/, '')}</li>`;
                        }
                        if (trimmed.startsWith('> ')) {
                          return `<blockquote class="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/40 p-3 my-3 rounded-r text-sm text-blue-900 dark:text-blue-200">${trimmed.slice(2)}</blockquote>`;
                        }
                        if (!trimmed) {
                          return '<div class="h-3"></div>';
                        }
                        return `<p class="my-2">${trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}</p>`;
                      })
                      .join('')
                  }}
                />
              </div>
            )}

            {/* Document Official Footer */}
            <div className="mt-auto pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>ArnauldSchool — Conçu pour l'Enseignement et les Évaluations Pédagogiques</span>
              <span>Page 1 / {estimatedPages}</span>
            </div>
          </div>
        </div>

        {/* Word Status Bar */}
        <div className="flex items-center justify-between border-t border-slate-300 bg-white px-4 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span>Mots : <strong className="text-slate-800 dark:text-slate-200">{wordCount}</strong></span>
            <span>Caractères : <strong className="text-slate-800 dark:text-slate-200">{charCount}</strong></span>
            <span>Lignes : <strong className="text-slate-800 dark:text-slate-200">{lineCount}</strong></span>
            <span className="hidden sm:inline">Pages estimées : <strong className="text-slate-800 dark:text-slate-200">{estimatedPages}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Raccourcis : Utilisez <strong>#</strong> pour un titre, <strong>**texte**</strong> pour du gras
            </span>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1 font-bold text-white hover:bg-blue-500 transition-colors shadow-xs cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Enregistrer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
