// PDF Export Helper (moved from pages/)
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportMembersToPDF(members) {
  const doc = new jsPDF();
  const columns = [
    { header: 'Name', dataKey: 'name' },
    { header: 'Email', dataKey: 'email' },
    { header: 'Membership Type', dataKey: 'membership_type' },
    { header: 'Medical Conditions', dataKey: 'medical_conditions' },
    { header: 'Emergency Contact', dataKey: 'emergency_contact' },
    { header: 'Opt Out Policies', dataKey: 'opt_out_policies' },
    { header: 'Opt Out Photos', dataKey: 'opt_out_photos' },
  ];
  const rows = members.map((m) => ({
    name: m.name,
    email: m.email,
    membership_type: m.membership_type,
    medical_conditions: m.medical_conditions,
    emergency_contact: m.emergency_contact,
    opt_out_policies: m.opt_out_policies ? 'Yes' : 'No',
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
