import React, { useState, useEffect } from 'react';
import {
  X,
  Table as TableIcon,
  Save,
  Download,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Search,
  Calculator,
  Columns,
  Printer,
  FileText,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { downloadExcelCSV, downloadTablePDF, downloadWordDoc } from '../lib/documentExport';

interface ExcelEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  title: string;
  onSave?: (updatedContent: string) => void;
  schoolName?: string;
}

interface TableRow {
  [key: string]: string;
}

export const ExcelEditorModal: React.FC<ExcelEditorModalProps> = ({
  isOpen,
  onClose,
  initialContent,
  title,
  onSave,
  schoolName,
}) => {
  const [docTitle, setDocTitle] = useState<string>(title);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Table state
  const [tableColumns, setTableColumns] = useState<string[]>([
    'Élève / Rubrique',
    'Note / 20',
    'Coefficient',
    'Compétence APC',
    'Appréciation'
  ]);
  const [tableRows, setTableRows] = useState<TableRow[]>([
    { 'Élève / Rubrique': 'Kouassi Jean', 'Note / 20': '15.5', 'Coefficient': '2', 'Compétence APC': 'Acquise', 'Appréciation': 'Très bon travail rigoureux' },
    { 'Élève / Rubrique': 'Aminata Diallo', 'Note / 20': '17.0', 'Coefficient': '2', 'Compétence APC': 'Expert', 'Appréciation': 'Excellente participation' },
    { 'Élève / Rubrique': 'Mamadou Koné', 'Note / 20': '12.0', 'Coefficient': '2', 'Compétence APC': 'En cours', 'Appréciation': 'Efforts constants à poursuivre' },
    { 'Élève / Rubrique': 'Sarah Nguessan', 'Note / 20': '14.0', 'Coefficient': '2', 'Compétence APC': 'Acquise', 'Appréciation': "Bonne maîtrise d'ensemble" },
    { 'Élève / Rubrique': 'Bakary Traoré', 'Note / 20': '16.5', 'Coefficient': '2', 'Compétence APC': 'Expert', 'Appréciation': 'Devoir modèle et soigné' },
  ]);

  const [activeCell, setActiveCell] = useState<{ row: number; col: string } | null>(null);
  const [formulaValue, setFormulaValue] = useState<string>('');
  const [preambleText, setPreambleText] = useState<string>('');

  // Parse markdown tables from initialContent
  useEffect(() => {
    setDocTitle(title);

    const lines = initialContent.split('\n');
    const tableLineIndices: number[] = [];
    const textLinesBefore: string[] = [];

    let foundFirstTableLine = false;
    lines.forEach((l, idx) => {
      const trimmed = l.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        foundFirstTableLine = true;
        tableLineIndices.push(idx);
      } else if (!foundFirstTableLine) {
        textLinesBefore.push(l);
      }
    });

    if (textLinesBefore.length > 0) {
      setPreambleText(textLinesBefore.join('\n').trim());
    }

    if (tableLineIndices.length >= 2) {
      const headerLine = lines[tableLineIndices[0]];
      const cols = headerLine.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.length > 0) {
        setTableColumns(cols);
      }

      const rows: TableRow[] = [];
      for (let i = 1; i < tableLineIndices.length; i++) {
        const rowLine = lines[tableLineIndices[i]];
        const cells = rowLine.split('|').map(c => c.trim()).filter(Boolean);
        // Skip separator row like |---|---|
        if (cells.every(c => /^[-:\s]+$/.test(c))) {
          continue;
        }
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

  const handleCellSelect = (rowIndex: number, colName: string) => {
    setActiveCell({ row: rowIndex, col: colName });
    setFormulaValue(tableRows[rowIndex]?.[colName] || '');
  };

  const handleCellChange = (rowIndex: number, colName: string, value: string) => {
    setTableRows(prev => prev.map((row, idx) => (idx === rowIndex ? { ...row, [colName]: value } : row)));
    if (activeCell?.row === rowIndex && activeCell?.col === colName) {
      setFormulaValue(value);
    }
  };

  const handleFormulaBarChange = (val: string) => {
    setFormulaValue(val);
    if (activeCell) {
      handleCellChange(activeCell.row, activeCell.col, val);
    }
  };

  const handleAddRow = () => {
    const newRow: TableRow = {};
    tableColumns.forEach(col => {
      newRow[col] = '';
    });
    setTableRows(prev => [...prev, newRow]);
    const nextIdx = tableRows.length;
    setActiveCell({ row: nextIdx, col: tableColumns[0] });
    setFormulaValue('');
  };

  const handleDeleteRow = (index: number) => {
    setTableRows(prev => prev.filter((_, i) => i !== index));
    if (activeCell?.row === index) {
      setActiveCell(null);
      setFormulaValue('');
    }
  };

  const handleAddCol = () => {
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

  const handleDeleteCol = (colToDelete: string) => {
    if (tableColumns.length <= 1) {
      alert('Le tableau doit contenir au moins une colonne.');
      return;
    }
    if (!confirm(`Supprimer la colonne "${colToDelete}" ?`)) return;
    setTableColumns(prev => prev.filter(c => c !== colToDelete));
    setTableRows(prev =>
      prev.map(row => {
        const copy = { ...row };
        delete copy[colToDelete];
        return copy;
      })
    );
    if (activeCell?.col === colToDelete) {
      setActiveCell(null);
      setFormulaValue('');
    }
  };

  const handleRenameCol = (oldCol: string) => {
    const newName = prompt(`Renommer la colonne "${oldCol}" en :`, oldCol);
    if (!newName || !newName.trim() || newName.trim() === oldCol) return;
    const trimmed = newName.trim();
    if (tableColumns.includes(trimmed)) {
      alert('Une colonne porte déjà ce nom.');
      return;
    }
    setTableColumns(prev => prev.map(c => (c === oldCol ? trimmed : c)));
    setTableRows(prev =>
      prev.map(row => {
        const copy = { ...row };
        copy[trimmed] = copy[oldCol];
        delete copy[oldCol];
        return copy;
      })
    );
  };

  // Convert table state back to Markdown for saving
  const generateMarkdownTable = () => {
    let md = '';
    if (preambleText) {
      md += preambleText + '\n\n';
    }
    md += '### ' + docTitle + '\n\n';
    md += '| ' + tableColumns.join(' | ') + ' |\n';
    md += '| ' + tableColumns.map(() => '---').join(' | ') + ' |\n';
    tableRows.forEach(row => {
      md += '| ' + tableColumns.map(col => row[col] || '').join(' | ') + ' |\n';
    });
    return md;
  };

  const handleSave = () => {
    const md = generateMarkdownTable();
    if (onSave) {
      onSave(md);
    }
    onClose();
  };

  const handleCopyTable = () => {
    const md = generateMarkdownTable();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadExcel = () => {
    downloadExcelCSV(docTitle, tableColumns, tableRows);
  };

  const handleDownloadPdf = () => {
    downloadTablePDF(docTitle, tableColumns, tableRows, schoolName);
  };

  const handleDownloadWordDoc = () => {
    const md = generateMarkdownTable();
    downloadWordDoc(docTitle, md, schoolName);
  };

  // Compute stats for numeric columns (grades/coefficients)
  const numericStats = React.useMemo(() => {
    const stats: Record<string, { sum: number; count: number; avg: number }> = {};
    tableColumns.forEach(col => {
      let sum = 0;
      let count = 0;
      tableRows.forEach(row => {
        const raw = row[col]?.replace(',', '.');
        const num = parseFloat(raw);
        if (!isNaN(num)) {
          sum += num;
          count++;
        }
      });
      if (count > 0) {
        stats[col] = { sum, count, avg: sum / count };
      }
    });
    return stats;
  }, [tableColumns, tableRows]);

  // Filtered rows for search
  const filteredRows = React.useMemo(() => {
    if (!searchQuery.trim()) return tableRows;
    const q = searchQuery.toLowerCase();
    return tableRows.filter(row =>
      tableColumns.some(col => (row[col] || '').toLowerCase().includes(q))
    );
  }, [tableRows, tableColumns, searchQuery]);

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
        {/* Top Excel Ribbon Header */}
        <div className="flex items-center justify-between border-b border-emerald-800 bg-[#107c41] px-4 sm:px-6 py-2.5 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#107c41] font-black shadow-md">
              <TableIcon className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="bg-emerald-800/60 hover:bg-emerald-800/90 focus:bg-emerald-900 font-display text-sm sm:text-base font-bold text-white outline-none border border-emerald-400/30 focus:border-white px-2.5 py-0.5 rounded-lg transition-colors min-w-[200px] sm:min-w-[320px]"
                  title="Cliquez pour renommer le tableur"
                />
                <span className="hidden sm:inline-flex rounded bg-emerald-900/60 border border-emerald-400/40 px-2 py-0.5 text-[11px] font-bold text-emerald-200">
                  Microsoft Excel (.xlsx / .csv)
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 flex items-center gap-2 mt-0.5">
                <span>Grande interface Tableur de Calculs & Notes</span>
                <span>•</span>
                <span>{tableRows.length} lignes • {tableColumns.length} colonnes</span>
              </p>
            </div>
          </div>

          {/* Action and Download Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 rounded-xl bg-white px-3 sm:px-4 py-1.5 text-xs font-bold text-[#107c41] hover:bg-emerald-50 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Télécharger en tableur Excel (.csv / .xlsx)"
            >
              <Download className="h-4 w-4 text-emerald-700" />
              <span className="hidden sm:inline">Télécharger</span>
              <span className="font-extrabold">.CSV / Excel</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 sm:px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Télécharger le tableau en PDF imprimable avec quadrillage"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Tableau</span>
              <span className="font-extrabold">.PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadWordDoc}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 sm:px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Télécharger le tableau formaté dans un document Word (.doc)"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Tableau</span>
              <span className="font-extrabold">.DOC</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-950/80 border border-emerald-400 px-3 sm:px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-900 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Sauvegarder le tableau dans la conversation"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Enregistrer</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-800/80 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-800/80 text-white hover:bg-rose-600 transition-colors cursor-pointer"
              title="Fermer la fenêtre"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Excel Formula & Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2 shadow-xs dark:border-slate-800 dark:bg-slate-850">
          <div className="flex flex-1 items-center gap-2 min-w-[280px]">
            {/* Active Cell Coordinates */}
            <div className="flex items-center rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400 min-w-[65px] justify-center">
              {activeCell
                ? `${String.fromCharCode(65 + Math.max(0, tableColumns.indexOf(activeCell.col)))}${activeCell.row + 1}`
                : 'A1'}
            </div>

            {/* Formula fx bar */}
            <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-0.5 dark:border-slate-700 dark:bg-slate-900 focus-within:ring-2 focus-within:ring-emerald-500">
              <span className="font-serif italic font-bold text-emerald-700 text-xs px-1">fx</span>
              <input
                type="text"
                value={formulaValue}
                onChange={(e) => handleFormulaBarChange(e.target.value)}
                placeholder="Cliquez sur une cellule pour voir ou éditer sa valeur..."
                className="w-full text-xs text-slate-800 outline-none bg-transparent dark:text-slate-100 py-1"
              />
            </div>
          </div>

          {/* Action Buttons: Add Row, Add Col, Search */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-xs cursor-pointer active:scale-95"
              title="Ajouter une nouvelle ligne"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Ligne</span>
            </button>

            <button
              type="button"
              onClick={handleAddCol}
              className="flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer active:scale-95"
              title="Ajouter une nouvelle colonne"
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Colonne</span>
            </button>

            {/* Search Input */}
            <div className="flex items-center rounded-xl border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
              <Search className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer..."
                className="w-24 text-xs bg-transparent outline-none dark:text-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={handleCopyTable}
              className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              title="Copier le tableau en markdown"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copié' : 'Copier'}</span>
            </button>
          </div>
        </div>

        {/* Interactive Spreadsheet Grid */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-2 sm:p-4">
          <div className="rounded-xl border border-slate-300 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-850 sticky top-0 z-10 border-b-2 border-emerald-600">
                {/* Column Letters Row (A, B, C...) */}
                <tr className="bg-slate-200/60 dark:bg-slate-900/80 text-[11px] text-slate-500 font-mono">
                  <th className="w-12 border-r border-b border-slate-300 p-1 text-center font-bold dark:border-slate-800">
                    
                  </th>
                  {tableColumns.map((_, cIdx) => (
                    <th key={cIdx} className="border-r border-b border-slate-300 p-1 text-center font-bold dark:border-slate-800">
                      {String.fromCharCode(65 + cIdx)}
                    </th>
                  ))}
                  <th className="w-20 border-b border-slate-300 p-1 text-center dark:border-slate-800">
                    
                  </th>
                </tr>

                {/* Column Headers with Edit/Delete */}
                <tr>
                  <th className="w-12 border-r border-b border-slate-300 bg-slate-100 p-2.5 text-center text-slate-500 font-bold dark:border-slate-800 dark:bg-slate-850">
                    #
                  </th>
                  {tableColumns.map((col, cIdx) => (
                    <th
                      key={cIdx}
                      className="border-r border-b border-slate-300 p-2.5 font-bold text-slate-800 dark:border-slate-800 dark:text-slate-100 group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          onClick={() => handleRenameCol(col)}
                          className="cursor-pointer hover:text-emerald-600 transition-colors truncate max-w-[160px]"
                          title="Cliquez pour renommer cette colonne"
                        >
                          {col}
                        </span>
                        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleRenameCol(col)}
                            className="p-1 hover:text-blue-600 rounded text-slate-400 cursor-pointer"
                            title="Renommer la colonne"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCol(col)}
                            className="p-1 hover:text-rose-600 rounded text-slate-400 cursor-pointer"
                            title="Supprimer la colonne"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="w-20 border-b border-slate-300 p-2.5 text-center text-slate-500 font-bold dark:border-slate-800">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row, rIdx) => {
                  const isSelectedRow = activeCell?.row === rIdx;
                  return (
                    <tr
                      key={rIdx}
                      className={`transition-colors ${
                        isSelectedRow
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                          : rIdx % 2 === 0
                          ? 'bg-white dark:bg-slate-900'
                          : 'bg-slate-50/70 dark:bg-slate-900/50'
                      } hover:bg-emerald-50/40 dark:hover:bg-slate-800/60`}
                    >
                      {/* Row Number */}
                      <td className="border-r border-b border-slate-200 bg-slate-100/70 p-2 text-center text-slate-400 font-mono text-[11px] font-bold dark:border-slate-800 dark:bg-slate-850">
                        {rIdx + 1}
                      </td>

                      {/* Cell inputs */}
                      {tableColumns.map((col, cIdx) => {
                        const isSelectedCell = activeCell?.row === rIdx && activeCell?.col === col;
                        return (
                          <td
                            key={cIdx}
                            className={`border-r border-b border-slate-200 p-0 relative dark:border-slate-800 ${
                              isSelectedCell ? 'ring-2 ring-emerald-600 z-10' : ''
                            }`}
                          >
                            <input
                              type="text"
                              value={row[col] || ''}
                              onFocus={() => handleCellSelect(rIdx, col)}
                              onChange={(e) => handleCellChange(rIdx, col, e.target.value)}
                              className="w-full h-full min-h-[34px] px-3 py-1.5 text-slate-800 outline-none bg-transparent dark:text-slate-100 font-sans text-xs focus:bg-white dark:focus:bg-slate-850"
                            />
                          </td>
                        );
                      })}

                      {/* Row Delete Button */}
                      <td className="border-b border-slate-200 p-1 text-center dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(rIdx)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Supprimer cette ligne"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Auto Calculated Statistics Row */}
                {Object.keys(numericStats).length > 0 && (
                  <tr className="bg-emerald-100/60 dark:bg-emerald-950/40 font-bold border-t-2 border-emerald-600">
                    <td className="border-r border-slate-300 p-2 text-center text-emerald-800 dark:text-emerald-400 font-bold text-[11px]">
                      ∑ / µ
                    </td>
                    {tableColumns.map((col, cIdx) => {
                      const stat = numericStats[col];
                      return (
                        <td key={cIdx} className="border-r border-slate-300 p-2 text-xs text-emerald-900 dark:text-emerald-300">
                          {stat ? (
                            <div className="flex flex-col">
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                                Moyenne : <strong>{stat.avg.toFixed(2)}</strong>
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Total : {stat.sum.toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-2 text-center text-[10px] font-bold text-emerald-800 dark:text-emerald-400">
                      Calcul auto
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Excel Status Bar with Stats */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-300 bg-white px-4 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span>Total Lignes : <strong className="text-slate-800 dark:text-slate-200">{tableRows.length}</strong></span>
            <span>Total Colonnes : <strong className="text-slate-800 dark:text-slate-200">{tableColumns.length}</strong></span>
            {activeCell && (
              <span className="hidden sm:inline bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded-md font-mono text-[11px]">
                Cellule active : {activeCell.col} (Ligne {activeCell.row + 1})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              <span>+ Ligne</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1 font-bold text-white hover:bg-emerald-500 transition-colors shadow-xs cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Enregistrer dans la conversation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
