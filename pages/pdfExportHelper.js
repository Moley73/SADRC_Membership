import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportMembersToPDF(members) {
  if (!members.length) return;
  const doc = new jsPDF();
  const columns = [
    { header: 'Name', dataKey: 'name' },
    { header: 'Email', dataKey: 'email' },
    { header: 'Signed At', dataKey: 'signed_at' },
    { header: 'Gender', dataKey: 'sex' },
    { header: 'Membership', dataKey: 'membership_type' },
    { header: 'Opt Out Competitions', dataKey: 'opt_out_competitions' },
    { header: 'Opt Out Photos', dataKey: 'opt_out_photos' },
  ];
  const rows = members.map(m => ({
    name: `${m.first_name} ${m.surname}`,
    email: m.email,
    signed_at: new Date(m.signed_at || m.created_at).toLocaleString(),
    sex: m.sex,
    membership_type: m.membership_type,
    opt_out_competitions: m.opt_out_competitions ? 'Yes' : 'No',
    opt_out_photos: m.opt_out_photos ? 'Yes' : 'No',
  }));

  doc.setFontSize(18);
  doc.text('Membership Export', 42, 24);
  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: rows.map(row => columns.map(col => row[col.dataKey])),
    startY: 30,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [255, 152, 0] },
  });
  doc.save('members_export.pdf');
}
