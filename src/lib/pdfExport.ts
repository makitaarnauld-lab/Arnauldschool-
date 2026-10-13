import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { School, Student, ClassRoom, Subject, GradeRecord } from '../types';
import { computeGradeAverage, computeGradeTotal, getAppreciation } from './storage';

export function exportClassGradebookPDF(
  school: School,
  classRoom: ClassRoom,
  subject: Subject,
  students: Student[],
  grades: GradeRecord[],
  period: string
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header
  doc.setFontSize(16);
  doc.setTextColor(30, 77, 143);
  doc.text(school.name.toUpperCase(), 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`${school.type} — Année Scolaire : ${school.year_label || '2025-2026'}`, 14, 22);

  doc.setFontSize(14);
  doc.setTextColor(26, 34, 51);
  doc.text(`RELEVÉ DE NOTES — ${period.toUpperCase()}`, 14, 30);

  doc.setFontSize(11);
  doc.text(`Classe : ${classRoom.name}  |  Matière : ${subject.name} (Coef : ${subject.default_coefficient})`, 14, 36);

  // Table Data
  const tableRows = students.map((st, idx) => {
    const g = grades.find(x => x.student_id === st.id && x.subject_id === subject.id && x.period === period);
    const moy = computeGradeAverage(g);
    const tot = computeGradeTotal(g);
    const app = getAppreciation(moy);

    return [
      idx + 1,
      st.matricule,
      `${st.last_name} ${st.first_name}`,
      g?.devoir1 != null ? g.devoir1.toFixed(2) : '—',
      g?.devoir2 != null ? g.devoir2.toFixed(2) : '—',
      g?.devoir3 != null ? g.devoir3.toFixed(2) : '—',
      g?.devoir_dept != null ? g.devoir_dept.toFixed(2) : '—',
      tot != null ? tot.toFixed(2) : '—',
      g?.composition != null ? g.composition.toFixed(2) : '—',
      moy != null ? `${moy.toFixed(2)} / 20` : '—',
      app.label
    ];
  });

  autoTable(doc, {
    startY: 42,
    head: [['N°', 'Matricule', 'Nom & Prénom', 'D1 (×1)', 'D2 (×1)', 'D3 (×1)', 'Dept. (×2)', 'Total', 'Comp. (×2)', 'Moyenne', 'Appréciation']],
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 77, 143], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 55 },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'center', fontStyle: 'bold' },
      8: { halign: 'center' },
      9: { halign: 'center', fontStyle: 'bold', textColor: [37, 99, 235] },
      10: { cellWidth: 30 }
    }
  });

  // Footer / Signatures
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`Fait le ${new Date().toLocaleDateString('fr-FR')}`, 14, finalY + 15);
  doc.text("Signature du Professeur :", 14, finalY + 22);
  doc.text("Le Chef d'Établissement :", 200, finalY + 22);

  doc.save(`Releve_Notes_${classRoom.name}_${subject.name}_${period}.pdf`);
}

export function exportAIPedagogyPDF(title: string, markdownContent: string, modeTitle: string, schoolName?: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Banner
  doc.setFillColor(30, 77, 143);
  doc.rect(0, 0, 210, 24, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("ArnauldSchool AI — Fiche Pédagogique Officielle", 14, 12);
  doc.setFontSize(9);
  doc.text(schoolName ? `Établissement : ${schoolName}` : "Plateforme Pédagogique Enseignante", 14, 18);
  doc.text(new Date().toLocaleDateString('fr-FR'), 175, 18);

  // Document Title
  doc.setFontSize(14);
  doc.setTextColor(26, 34, 51);
  doc.text(title.toUpperCase(), 14, 34);

  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235);
  doc.text(`Module : ${modeTitle}`, 14, 40);

  // Clean markdown plain text conversion
  const cleanText = markdownContent
    .replace(/###\s+/g, '\n[ ')
    .replace(/##\s+/g, '\n\n■ ')
    .replace(/#\s+/g, '\n\n=== ')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/```[a-z]*\n/gi, '')
    .replace(/```/g, '');

  const lines = doc.splitTextToSize(cleanText, 182);
  let y = 48;
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);

  for (let i = 0; i < lines.length; i++) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines[i], 14, y);
    y += 5.2;
  }

  const safeName = title.replace(/[^\w-]/gi, '_').slice(0, 30) || 'document_pedagogique';
  doc.save(`ArnauldSchool_${safeName}.pdf`);
}
