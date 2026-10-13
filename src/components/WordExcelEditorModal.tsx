import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Table as TableIcon,
  Save,
  Download,
  Plus,
  Trash2,
  Bold,
  Italic,
  List,
  Heading1,
  Heading2,
  Check,
  Copy,
  Sparkles,
  Columns,
  Printer
} from 'lucide-react';
import { downloadWordDoc, downloadExcelCSV, exportAIPedagogyPDFEnhanced } from '../lib/documentExport';

interface WordExcelEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  title: string;
  onSave?: (updatedContent: string) => void;
}

interface TableRow {
  [key: string]: string;
}

export const WordExcelEditorModal: React.FC<WordExcelEditorModalProps> = ({
  isOpen,
  onClose,
  initialContent,
  title,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'word' | 'excel'>('word');
  const [docContent, setDocContent] = useState<string>(initialContent);
  const [docTitle, setDocTitle] = useState<string>(title);
  const [copied, setCopied] = useState<boolean>(false);

  // Excel Table state parsed or default
  const [tableColumns, setTableColumns] = useState<string[]>(['Élève / Rubrique', 'Note / 20', 'Compétence APC', 'Appréciation']);
  const [tableRows, setTableRows] = useState<TableRow[]>([
    { 'Élève / Rubrique': 'Kouassi Jean', 'Note / 20': '15.5', 'Compétence APC': 'Acquise', 'Appréciation': 'Très bon travail rigoureux' },
    { 'Élève / Rubrique': 'Aminata Diallo', 'Note / 20': '17.0', 'Compétence APC': 'Expert', 'Appréciation': 'Excellente participation' },
    { 'Élève / Rubrique': 'Mamadou Koné', 'Note / 20': '12.0', 'Compétence APC': 'En cours', 'Appréciation': 'Efforts constants à poursuivre' },
    { 'Élève / Rubrique': 'Sarah Nguessan', 'Note / 20': '14.0', 'Compétence APC': 'Acquise', 'Appréciation': "Bonne maîtrise d'ensemble" },
  ]);

  // Parse markdown tables from initialContent if present
  useEffect(() => {
    setDocContent(initialContent);
    setDocTitle(title);

    const lines = initialContent.split('\n');
    const tableLineIndices: number[] = [];
    lines.forEach((l, idx) => {
      if (l.trim().startsWith('|') && l.trim().endsWith('|')) {
        tableLineIndices.push(idx);
      }
    });

    if (tableLineIndices.length >= 2) {
      const headerLine = lines[tableLineIndices[0]];
      const cols = headerLine.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.length > 0) {
        setTableColumns(cols);
      }

      const rows: TableRow[] = [];
      for (let i = 2; i < tableLineIndices.length; i++) {
        const rowLine = lines[tableLineIndices[i]];
        const cells = rowLine.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length > 0) {
          const rowObj: TableRow = {};
          cols.forEach((colName, cIdx) => {
            rowObj[colName] = cells[cIdx] || '';
          });
          rows.push(rowObj);
        }
      }
      if (rows.length > 0) {
        setTableRows(rows);
      }
    }
  }, [initialContent, title]);

  // Formatting helpers for Word mode
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('word-editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = docContent.substring(start, end);
    const newText = docContent.substring(0, start) + prefix + selectedText + suffix + docContent.substring(end);
    setDocContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleAddExcelRow = () => {
    const newRow: TableRow = {};
    tableColumns.forEach(col => {
      newRow[col] = '';
    });
    setTableRows(prev => [...prev, newRow]);
  };

  const handleDeleteExcelRow = (index: number) => {
    setTableRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddExcelCol = () => {
    const colName = prompt('Nom de la nouvelle colonne :');
    if (!colName || !colName.trim()) return;
    const trimmed = colName.trim();
    if (tableColumns.includes(trimmed)) {
      alert('Cette colonne existe déjà.');
      return;
    }
    setTableColumns(prev => [...prev, trimmed]);
    setTableRows(prev => prev.map(row => ({ ...row, [trimmed]: '' })));
  };

  const handleCellChange = (rowIndex: number, colName: string, value: string) => {
    setTableRows(prev => prev.map((row, idx) => idx === rowIndex ? { ...row, [colName]: value } : row));
  };

  const handleSaveAll = () => {
    let finalContent = docContent;
    if (tableRows.length > 0 && tableColumns.length > 0) {
      let tableMd = '\n\n### Tableau de Données & Notes (Éditeur Excel)\n';
      tableMd += '| ' + tableColumns.join(' | ') + ' |\n';
      tableMd += '| ' + tableColumns.map(() => '---').join(' | ') + ' |\n';
      tableRows.forEach(row => {
        tableMd += '| ' + tableColumns.map(col => row[col] || '').join(' | ') + ' |\n';
      });
      finalContent += tableMd;
    }
    if (onSave) {
      onSave(finalContent);
    }
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(docContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWordDoc = () => {
    downloadWordDoc(docTitle, docContent);
  };

  const handleDownloadPDFDoc = () => {
    exportAIPedagogyPDFEnhanced(docTitle, docContent, 'Office Pro');
  };

  const handleDownloadExcelCSV = () => {
    if (tableRows.length === 0) {
      alert('Aucune donnée de tableau à exporter.');
      return;
    }
    downloadExcelCSV(docTitle, tableColumns, tableRows);
  };

  const wordCount = docContent.trim() ? docContent.trim().split(/\s+/).length : 0;
  const charCount = docContent.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="flex flex-col h-[90vh] w-full max-w-5xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Top Ribbon Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-3 text-white dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="bg-transparent font-display text-sm font-bold text-white outline-none border-b border-transparent hover:border-slate-500 focus:border-cyan-400 px-1 py-0.5 rounded transition-colors"
                />
                <span className="rounded bg-blue-500/35 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                  Éditeur Office Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Modification intégrale style Word & Tableur Excel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadWordDoc}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-xs cursor-pointer"
              title="Télécharger en document Word (.doc)"
            >
              <Download className="h-3.5 w-3.5" />
              <span>.DOC (Word)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDFDoc}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition-colors shadow-xs cursor-pointer"
              title="Télécharger en document PDF (.pdf)"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>.PDF</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Enregistrer</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-6 py-2 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('word')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'word'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Traitement de Texte (Word)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('excel')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'excel'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <TableIcon className="h-4 w-4" />
              <span>Tableur Données (Excel)</span>
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {activeTab === 'word' ? (
              <span>Mots : <strong className="text-slate-700 dark:text-slate-200">{wordCount}</strong> • Caractères : <strong className="text-slate-700 dark:text-slate-200">{charCount}</strong></span>
            ) : (
              <span>Lignes : <strong className="text-slate-700 dark:text-slate-200">{tableRows.length}</strong> • Colonnes : <strong className="text-slate-700 dark:text-slate-200">{tableColumns.length}</strong></span>
            )}
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
          {activeTab === 'word' ? (
            /* Word Document Editor */
            <div className="flex flex-1 flex-col h-full p-4 overflow-hidden">
              {/* Word Ribbon Toolbar */}
              <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-xs dark:border-slate-800 dark:bg-slate-850">
                <button
                  type="button"
                  onClick={() => insertFormatting('# ')}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  title="Titre 1"
                >
                  <Heading1 className="h-3.5 w-3.5 text-blue-600" />
                  <span>T1</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('## ')}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  title="Titre 2"
                >
                  <Heading2 className="h-3.5 w-3.5 text-cyan-600" />
                  <span>T2</span>
                </button>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  className="flex items-center gap-1 rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  title="Gras"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*')}
                  className="flex items-center gap-1 rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  title="Italique"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('- ')}
                  className="flex items-center gap-1 rounded-lg p-1.5 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  title="Liste à puces"
                >
                  <List className="h-4 w-4" />
                </button>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                <button
                  type="button"
                  onClick={handleDownloadWordDoc}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-cyan-300"
                  title="Télécharger au format Word .doc"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Télécharger .doc</span>
                </button>
              </div>

              {/* Textarea Editor */}
              <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner dark:border-slate-800 dark:bg-slate-950">
                <textarea
                  id="word-editor-textarea"
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  placeholder="Rédigez ou modifiez tout le contenu ici (style Word)..."
                  className="h-full w-full resize-none p-6 text-sm leading-relaxed text-slate-800 outline-none dark:text-slate-100 font-sans"
                />
              </div>
            </div>
          ) : (
            /* Excel Spreadsheet Editor */
            <div className="flex flex-1 flex-col h-full p-4 overflow-hidden">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Tableur Interactif (Style Excel)</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Édition en direct
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddExcelRow}
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Ajouter une ligne</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddExcelCol}
                    className="flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700"
                  >
                    <Columns className="h-3.5 w-3.5" />
                    <span>Ajouter une colonne</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadExcelCSV}
                    className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Exporter Excel (.csv)</span>
                  </button>
                </div>
              </div>

              {/* Excel Table Grid */}
              <div className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-inner dark:border-slate-800 dark:bg-slate-950">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-10">
                    <tr>
                      <th className="w-12 border-b border-r border-slate-200 p-2 text-center text-slate-400 font-bold dark:border-slate-800">
                        #
                      </th>
                      {tableColumns.map((col, cIdx) => (
                        <th key={cIdx} className="border-b border-r border-slate-200 p-2.5 font-bold text-slate-800 dark:border-slate-800 dark:text-slate-200">
                          {col}
                        </th>
                      ))}
                      <th className="w-16 border-b border-slate-200 p-2 text-center text-slate-400 font-bold dark:border-slate-800">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="border-b border-r border-slate-200 bg-slate-50/50 p-2 text-center text-slate-400 font-mono text-[11px] dark:border-slate-800 dark:bg-slate-900/30">
                          {rIdx + 1}
                        </td>
                        {tableColumns.map((col, cIdx) => (
                          <td key={cIdx} className="border-b border-r border-slate-200 p-1.5 dark:border-slate-800">
                            <input
                              type="text"
                              value={row[col] || ''}
                              onChange={(e) => handleCellChange(rIdx, col, e.target.value)}
                              className="w-full rounded-md bg-transparent px-2 py-1 text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 dark:text-slate-100 dark:focus:bg-slate-800"
                            />
                          </td>
                        ))}
                        <td className="border-b border-slate-200 p-1.5 text-center dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleDeleteExcelRow(rIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Supprimer la ligne"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
