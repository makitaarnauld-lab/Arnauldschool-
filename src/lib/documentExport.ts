import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Convert Markdown text to clean HTML formatted for Microsoft Word (.doc)
export function markdownToWordHtml(markdown: string, title: string, schoolName?: string): string {
  const lines = markdown.split('\n');
  let bodyHtml = '';
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (!inTable) return;
    if (tableHeaders.length > 0 || tableRows.length > 0) {
      bodyHtml += '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;margin:16px 0;border:1px solid #94a3b8;font-size:10pt;">';
      if (tableHeaders.length > 0) {
        bodyHtml += '<thead style="background-color:#f1f5f9;color:#0f172a;font-weight:bold;"><tr>';
        tableHeaders.forEach(th => {
          bodyHtml += `<th style="border:1px solid #94a3b8;padding:8px 12px;text-align:left;background-color:#e2e8f0;">${th}</th>`;
        });
        bodyHtml += '</tr></thead>';
      }
      bodyHtml += '<tbody>';
      tableRows.forEach((r, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        bodyHtml += `<tr style="background-color:${bg};">`;
        r.forEach(cell => {
          bodyHtml += `<td style="border:1px solid #cbd5e1;padding:6px 12px;">${cell}</td>`;
        });
        bodyHtml += '</tr>';
      });
      bodyHtml += '</tbody></table>';
    }
    inTable = false;
    tableHeaders = [];
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Markdown Table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .split('|')
        .slice(1, -1)
        .map(c => c.trim().replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'));

      // Check if separator row (e.g. |---|---|)
      const isSep = cells.every(c => /^[-:\s]+$/.test(c));
      if (isSep) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    if (!trimmed) {
      bodyHtml += '<p style="margin:4px 0;">&nbsp;</p>';
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      const heading = trimmed.slice(4).replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
      bodyHtml += `<h3 style="font-size:13pt;color:#1e3a8a;margin-top:14px;margin-bottom:6px;font-family:Calibri,Arial,sans-serif;">${heading}</h3>`;
    } else if (trimmed.startsWith('## ')) {
      const heading = trimmed.slice(3).replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
      bodyHtml += `<h2 style="font-size:15pt;color:#1e40af;border-bottom:1px solid #93c5fd;padding-bottom:4px;margin-top:18px;margin-bottom:8px;font-family:Calibri,Arial,sans-serif;">${heading}</h2>`;
    } else if (trimmed.startsWith('# ')) {
      const heading = trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
      bodyHtml += `<h1 style="font-size:18pt;color:#1e3a8a;border-bottom:2px solid #2563eb;padding-bottom:6px;margin-top:22px;margin-bottom:12px;font-family:Calibri,Arial,sans-serif;">${heading}</h1>`;
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const item = trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>');
      bodyHtml += `<ul style="margin:4px 0 4px 20px;padding:0;"><li style="margin-bottom:3px;font-size:11pt;">${item}</li></ul>`;
    } else if (/^\d+\.\s/.test(trimmed)) {
      const item = trimmed.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>');
      bodyHtml += `<ol style="margin:4px 0 4px 20px;padding:0;"><li style="margin-bottom:3px;font-size:11pt;">${item}</li></ol>`;
    } else {
      const formatted = trimmed
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>');
      bodyHtml += `<p style="margin:6px 0;font-size:11pt;line-height:1.6;font-family:Calibri,Arial,sans-serif;">${formatted}</p>`;
    }
  }

  flushTable();

  const formattedDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' lang="fr">
<head>
<meta charset="utf-8">
<title>${title}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page Section1 {
  size: 21.0cm 29.7cm;
  margin: 2.0cm 2.0cm 2.0cm 2.0cm;
  mso-header-margin: 35.4pt;
  mso-footer-margin: 35.4pt;
  mso-paper-source: 0;
}
div.Section1 { page: Section1; }
body {
  font-family: 'Calibri', 'Arial', sans-serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #1e293b;
  background-color: #ffffff;
}
.header-banner {
  border-bottom: 2.5pt solid #2563eb;
  padding-bottom: 12pt;
  margin-bottom: 20pt;
}
.school-header {
  font-size: 13pt;
  font-weight: bold;
  color: #1e3a8a;
  text-transform: uppercase;
}
.sub-header {
  font-size: 9.5pt;
  color: #64748b;
}
.doc-main-title {
  font-size: 19pt;
  font-weight: bold;
  color: #1e3a8a;
  margin: 12pt 0 6pt 0;
}
table {
  border-collapse: collapse;
  width: 100%;
}
th {
  background-color: #f1f5f9;
  font-weight: bold;
}
</style>
</head>
<body>
<div class="Section1">
  <div class="header-banner">
    <div class="school-header">${schoolName ? schoolName.toUpperCase() : "ARNAULD SCHOOL & ACADÉMIE"}</div>
    <div class="sub-header">Plateforme Pédagogique Enseignante Intelligente • Document Officiel APC</div>
    <div class="sub-header">Édité le ${formattedDate}</div>
  </div>

  <h1 class="doc-main-title">${title}</h1>

  <div class="content-body">
    ${bodyHtml}
  </div>

  <div style="margin-top:30pt;border-top:1pt solid #cbd5e1;padding-top:10pt;font-size:9pt;color:#94a3b8;text-align:center;">
    Document généré et édité via l'Assistant Pédagogique Intelligent Arnauld School — Conforme aux programmes éducatifs
  </div>
</div>
</body>
</html>`;
}

// Download .doc file (Word format)
export function downloadWordDoc(title: string, content: string, schoolName?: string) {
  const html = markdownToWordHtml(content, title, schoolName);
  const blob = new Blob(['\uFEFF' + html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = title.replace(/[^\w-]/gi, '_').slice(0, 35) || 'document_pedagogique';
  a.download = `${safeName}_Word.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

// Download Excel CSV format with BOM for perfect French accents in Excel
export function downloadExcelCSV(title: string, columns: string[], rows: Record<string, string>[]) {
  if (columns.length === 0) return;
  let csv = columns.join(';') + '\r\n';
  rows.forEach(row => {
    const rowValues = columns.map(col => {
      const val = row[col] || '';
      return `"${val.replace(/"/g, '""')}"`;
    });
    csv += rowValues.join(';') + '\r\n';
  });

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = title.replace(/[^\w-]/gi, '_').slice(0, 35) || 'tableau_donnees';
  a.download = `${safeName}_Excel.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Export a table to PDF
export function downloadTablePDF(title: string, columns: string[], rows: Record<string, string>[], schoolName?: string) {
  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });

  // Banner
  doc.setFillColor(16, 124, 65); // Excel green
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 22, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("ArnauldSchool — Tableur Pédagogique Officiel", 14, 11);
  doc.setFontSize(9);
  doc.text(schoolName ? `Établissement : ${schoolName}` : "Grille d'Évaluation & Notes", 14, 17);
  doc.text(new Date().toLocaleDateString('fr-FR'), doc.internal.pageSize.getWidth() - 35, 17);

  // Title
  doc.setFontSize(13);
  doc.setTextColor(26, 34, 51);
  doc.text(title.toUpperCase(), 14, 32);

  const head = [columns];
  const body = rows.map((r, idx) => columns.map(c => r[c] || ''));

  autoTable(doc, {
    startY: 38,
    head: head,
    body: body,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [16, 124, 65], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const safeName = title.replace(/[^\w-]/gi, '_').slice(0, 35) || 'tableau_excel';
  doc.save(`${safeName}.pdf`);
}

// Enhanced PDF Export for full pedagogy documents (with automatic Table detection!)
export function exportAIPedagogyPDFEnhanced(
  title: string,
  markdownContent: string,
  modeTitle: string,
  schoolName?: string
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(30, 77, 143);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("ArnauldSchool AI — Fiche Pédagogique Officielle", 14, 12);
  doc.setFontSize(9);
  doc.text(schoolName ? `Établissement : ${schoolName}` : "Plateforme Pédagogique Enseignante", 14, 18);
  doc.text(new Date().toLocaleDateString('fr-FR'), pageWidth - 35, 18);

  // Title
  doc.setFontSize(14);
  doc.setTextColor(26, 34, 51);
  doc.text(title.toUpperCase().slice(0, 75), 14, 34);

  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235);
  doc.text(`Module : ${modeTitle || 'Pédagogie Générale'}`, 14, 40);

  // Parse lines, extract markdown tables vs text
  const lines = markdownContent.split('\n');
  let y = 48;

  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const renderCurrentTable = () => {
    if (!inTable) return;
    if (tableHeaders.length > 0 || tableRows.length > 0) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      autoTable(doc, {
        startY: y,
        head: [tableHeaders],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        headStyles: { fillColor: [30, 77, 143], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      y = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : y + 30;
    }
    inTable = false;
    tableHeaders = [];
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Table row detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .split('|')
        .slice(1, -1)
        .map(c => c.trim().replace(/\*\*(.*?)\*\*/g, '$1'));

      const isSep = cells.every(c => /^[-:\s]+$/.test(c));
      if (isSep) continue;

      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      renderCurrentTable();
    }

    if (!trimmed) {
      y += 3;
      continue;
    }

    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      doc.setFontSize(11);
      doc.setTextColor(30, 77, 143);
      doc.setFont('helvetica', 'bold');
      const txt = trimmed.slice(4).replace(/\*\*(.*?)\*\*/g, '$1');
      doc.text(txt, 14, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
    } else if (trimmed.startsWith('## ')) {
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      const txt = trimmed.slice(3).replace(/\*\*(.*?)\*\*/g, '$1');
      doc.text(txt, 14, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
    } else if (trimmed.startsWith('# ')) {
      doc.setFontSize(13.5);
      doc.setTextColor(30, 77, 143);
      doc.setFont('helvetica', 'bold');
      const txt = trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, '$1');
      doc.text(txt, 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
    } else {
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      const cleanLine = trimmed
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/```[a-z]*\n/gi, '')
        .replace(/```/g, '');

      const wrappedLines = doc.splitTextToSize(cleanLine, pageWidth - 28);
      for (const wLine of wrappedLines) {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(wLine, 14, y);
        y += 5.2;
      }
    }
  }

  renderCurrentTable();

  const safeName = title.replace(/[^\w-]/gi, '_').slice(0, 30) || 'document_pedagogique';
  doc.save(`ArnauldSchool_${safeName}.pdf`);
}
