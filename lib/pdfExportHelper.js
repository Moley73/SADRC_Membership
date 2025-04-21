// PDF Export Helper
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exports the given members array to a styled PDF file.
 * @param {Array} members - Array of member objects to export.
 * @param {String} exportType - Type of export ('full', 'competitions', 'aaga', or 'summary')
 */
export function exportMembersToPDF(members, exportType = 'summary') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const currentDate = new Date().toLocaleDateString();

  // Set document properties
  doc.setProperties({
    title: 'SADRC Membership Export',
    subject: 'Membership Data',
    author: 'SADRC Admin System',
    creator: 'SADRC Membership App'
  });

  // Header: Title and divider
  doc.setFontSize(24);
  doc.setTextColor(255, 102, 0); // Orange color for header
  doc.setFont('helvetica', 'bold');
  doc.text('SADRC Membership', pageWidth / 2, margin, { align: 'center' });
  doc.setDrawColor(255, 102, 0);
  doc.setLineWidth(0.7);
  doc.line(margin, margin + 4, pageWidth - margin, margin + 4);

  // Subtitle (date)
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`Export Date: ${currentDate}`, pageWidth / 2, margin + 10, { align: 'center' });

  let columns = [];
  let rows = [];
  let startY = margin + 22;
  let title = '';

  // Configure columns and data based on export type
  switch (exportType) {
    case 'full':
      title = 'Full Membership Export';
      columns = [
        { header: 'First Name', dataKey: 'first_name' },
        { header: 'Surname', dataKey: 'surname' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Date of Birth', dataKey: 'date_of_birth' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Payment', dataKey: 'payment_status' },
        { header: 'Competitions', dataKey: 'opt_in_competitions' },
        { header: 'AaGA Challenge', dataKey: 'opt_in_aaga_challenge' },
        { header: 'Photos Opt-out', dataKey: 'opt_out_photos' }
      ];
      rows = members.map(m => ({
        first_name: m.first_name || '',
        surname: m.surname || '',
        email: m.email || '',
        date_of_birth: m.date_of_birth || '',
        status: m.status || 'pending',
        payment_status: m.payment_status === 'paid' ? 'Paid' : 'Unpaid',
        opt_in_competitions: m.opt_in_competitions ? 'Yes' : 'No',
        opt_in_aaga_challenge: m.opt_in_aaga_challenge ? 'Yes' : 'No',
        opt_out_photos: m.opt_out_photos ? 'Yes' : 'No'
      }));
      break;
    case 'competitions':
      title = 'Club Competitions Participants';
      const competitionMembers = members.filter(m => m.opt_in_competitions);
      columns = [
        { header: 'First Name', dataKey: 'first_name' },
        { header: 'Surname', dataKey: 'surname' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Date of Birth', dataKey: 'date_of_birth' },
        { header: 'Payment Status', dataKey: 'payment_status' }
      ];
      rows = competitionMembers.map(m => ({
        first_name: m.first_name || '',
        surname: m.surname || '',
        email: m.email || '',
        date_of_birth: m.date_of_birth || '',
        payment_status: m.payment_status === 'paid' ? 'Paid' : 'Unpaid'
      }));
      break;
    case 'aaga':
      title = 'AaGA Challenge Participants';
      const aagaMembers = members.filter(m => m.opt_in_aaga_challenge);
      columns = [
        { header: 'First Name', dataKey: 'first_name' },
        { header: 'Surname', dataKey: 'surname' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Date of Birth', dataKey: 'date_of_birth' },
        { header: 'Payment Status', dataKey: 'payment_status' }
      ];
      rows = aagaMembers.map(m => ({
        first_name: m.first_name || '',
        surname: m.surname || '',
        email: m.email || '',
        date_of_birth: m.date_of_birth || '',
        payment_status: m.payment_status === 'paid' ? 'Paid' : 'Unpaid'
      }));
      break;
    case 'summary':
    default:
      title = 'Membership Summary';
      columns = [
        { header: 'First Name', dataKey: 'first_name' },
        { header: 'Surname', dataKey: 'surname' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Payment', dataKey: 'payment_status' }
      ];
      rows = members.map(m => ({
        first_name: m.first_name || '',
        surname: m.surname || '',
        email: m.email || '',
        status: m.status || 'pending',
        payment_status: m.payment_status === 'paid' ? 'Paid' : 'Unpaid'
      }));
      break;
  }

  // Section title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(title, margin, startY);

  // Stats summary
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const approvedCount = members.filter(m => m.status === 'approved').length;
  const pendingCount = members.filter(m => !m.status || m.status === 'pending').length;
  const paidCount = members.filter(m => m.payment_status === 'paid').length;
  const competitionsCount = members.filter(m => m.opt_in_competitions).length;
  const aagaCount = members.filter(m => m.opt_in_aaga_challenge).length;
  doc.setTextColor(80, 80, 80);
  doc.text(`Total Members: ${members.length} | Approved: ${approvedCount} | Pending: ${pendingCount} | Paid: ${paidCount}`,
    margin, startY + 7);
  doc.text(`Competition Participants: ${competitionsCount} | AaGA Challenge Participants: ${aagaCount}`,
    margin, startY + 13);

  // Table
  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: rows.map(row => columns.map(col => row[col.dataKey])),
    startY: startY + 19,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 10,
      cellPadding: 3,
      valign: 'middle',
      overflow: 'linebreak',
      textColor: [30, 30, 30],
      halign: 'left',
      minCellHeight: 8,
    },
    headStyles: {
      fillColor: [255, 152, 0],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 11,
      halign: 'center',
      cellPadding: 4,
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 28 }, // First Name
      1: { cellWidth: 28 }, // Surname
      2: { cellWidth: 52 }, // Email
      3: { cellWidth: 25 }, // Date of Birth or Status
      4: { cellWidth: 22 }, // Status or Payment
      5: { cellWidth: 22 }, // Payment or Competitions
      6: { cellWidth: 22 }, // Competitions or AaGA
      7: { cellWidth: 22 }, // AaGA Challenge or Photos
      8: { cellWidth: 22 }, // Photos Opt-out
    },
    didDrawPage: (data) => {
      // Add header to each page
      if (data.pageNumber > 1) {
        doc.setFontSize(14);
        doc.setTextColor(255, 102, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('SADRC Membership', pageWidth / 2, margin, { align: 'center' });
        doc.setDrawColor(255, 102, 0);
        doc.setLineWidth(0.7);
        doc.line(margin, margin + 4, pageWidth - margin, margin + 4);
      }
    },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Skegness & District Running Club - Confidential - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 8,
      { align: 'center' }
    );
  }

  // Save the PDF
  const filename = `sadrc_members_${exportType}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
  return filename;
}
