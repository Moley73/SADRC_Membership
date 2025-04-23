// PDF Export Helper
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exports the given members array to a styled PDF file.
 * @param {Array} members - Array of member objects to export.
 * @param {String} exportType - Type of export ('full', 'competitions', 'aaga', or 'summary')
 */
export function exportMembersToPDF(members, exportType = 'summary') {
  try {
    // Create new document with landscape orientation for better table display
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const currentDate = new Date().toLocaleDateString('en-GB'); // Format as DD/MM/YYYY
    
    // Add club logo/branding
    addBranding(doc, pageWidth, margin);

    // Set document properties
    doc.setProperties({
      title: 'SADRC Membership Export',
      subject: 'Membership Data',
      author: 'SADRC Admin System',
      creator: 'SADRC Membership App'
    });

    // Add title and subtitle
    let title = '';
    let startY = margin + 30; // Adjusted for logo

    // Configure columns and data based on export type
    switch (exportType) {
      case 'active':
        title = 'Active Members';
        break;
      case 'pending':
        title = 'Pending Members';
        break;
      case 'expired':
        title = 'Expired Members';
        break;
      case 'competitions':
        title = 'Club Competitions Participants';
        break;
      case 'aaga':
        title = 'AaGA Challenge Participants';
        break;
      case 'summary':
      default:
        title = 'Membership Summary';
        break;
    }

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(title, pageWidth / 2, startY, { align: 'center' });

    // Stats summary
    startY += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Make sure we have valid data before trying to filter
    const safeMembers = Array.isArray(members) ? members : [];
    
    const approvedCount = safeMembers.filter(m => m && m.status === 'approved').length;
    const pendingCount = safeMembers.filter(m => m && (!m.status || m.status === 'pending')).length;
    const paidCount = safeMembers.filter(m => m && m.payment_status === 'paid').length;
    const competitionsCount = safeMembers.filter(m => m && m.opt_in_competitions === true).length;
    const aagaCount = safeMembers.filter(m => m && m.opt_in_aaga_challenge === true).length;
    const activeCount = safeMembers.filter(m => m && m.membership_status === 'active').length;
    
    // Create a stats box
    const statsBoxY = startY;
    const statsBoxHeight = 20;
    
    // Draw stats box background
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, statsBoxY, pageWidth - (margin * 2), statsBoxHeight, 3, 3, 'F');
    
    // Add stats text
    doc.setTextColor(80, 80, 80);
    doc.text(`Total Members: ${safeMembers.length} | Approved: ${approvedCount} | Pending: ${pendingCount} | Paid: ${paidCount}`,
      margin + 5, statsBoxY + 8);
    doc.text(`Active: ${activeCount} | Competition Participants: ${competitionsCount} | AaGA Challenge Participants: ${aagaCount}`,
      margin + 5, statsBoxY + 16);

    startY += statsBoxHeight + 10;

    // Determine columns based on export type
    let columns = [];
    let rows = [];

    // Configure columns and data based on export type
    switch (exportType) {
      case 'active':
      case 'pending':
      case 'expired':
        columns = [
          { header: 'First Name', dataKey: 'first_name' },
          { header: 'Surname', dataKey: 'surname' },
          { header: 'Email', dataKey: 'email' },
          { header: 'Date of Birth', dataKey: 'date_of_birth' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Payment', dataKey: 'payment_status' },
          { header: 'EA Number', dataKey: 'ea_number' },
          { header: 'Expiry Date', dataKey: 'membership_expiry' }
        ];
        rows = safeMembers.map(m => ({
          first_name: m.first_name || '',
          surname: m.surname || '',
          email: m.email || '',
          date_of_birth: formatDate(m.date_of_birth),
          status: formatStatus(m.status || 'pending'),
          payment_status: m.payment_status === 'paid' ? 'Paid' : 'Unpaid',
          ea_number: m.ea_number || 'Not registered',
          membership_expiry: formatDate(m.membership_expiry)
        }));
        break;
      case 'competitions':
        const competitionMembers = safeMembers.filter(m => m && m.opt_in_competitions);
        columns = [
          { header: 'First Name', dataKey: 'first_name' },
          { header: 'Surname', dataKey: 'surname' },
          { header: 'Email', dataKey: 'email' },
          { header: 'Date of Birth', dataKey: 'date_of_birth' },
          { header: 'Membership Status', dataKey: 'membership_status' },
          { header: 'Payment Status', dataKey: 'payment_status' },
          { header: 'EA Number', dataKey: 'ea_number' }
        ];
        rows = competitionMembers.map(m => ({
          first_name: m.first_name || '',
          surname: m.surname || '',
          email: m.email || '',
          date_of_birth: formatDate(m.date_of_birth),
          membership_status: formatStatus(m.membership_status || 'pending'),
          payment_status: m.payment_status === 'paid' ? 'Paid' : 'Unpaid',
          ea_number: m.ea_number || 'Not registered'
        }));
        break;
      case 'aaga':
        const aagaMembers = safeMembers.filter(m => m && m.opt_in_aaga_challenge);
        columns = [
          { header: 'First Name', dataKey: 'first_name' },
          { header: 'Surname', dataKey: 'surname' },
          { header: 'Email', dataKey: 'email' },
          { header: 'Date of Birth', dataKey: 'date_of_birth' },
          { header: 'Membership Status', dataKey: 'membership_status' },
          { header: 'Payment Status', dataKey: 'payment_status' }
        ];
        rows = aagaMembers.map(m => ({
          first_name: m.first_name || '',
          surname: m.surname || '',
          email: m.email || '',
          date_of_birth: formatDate(m.date_of_birth),
          membership_status: formatStatus(m.membership_status || 'pending'),
          payment_status: m.payment_status === 'paid' ? 'Paid' : 'Unpaid'
        }));
        break;
      case 'summary':
      default:
        columns = [
          { header: 'First Name', dataKey: 'first_name' },
          { header: 'Surname', dataKey: 'surname' },
          { header: 'Email', dataKey: 'email' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Payment', dataKey: 'payment_status' }
        ];
        rows = safeMembers.map(m => ({
          first_name: m.first_name || '',
          surname: m.surname || '',
          email: m.email || '',
          status: formatStatus(m.status || 'pending'),
          payment_status: m.payment_status === 'paid' ? 'Paid' : 'Unpaid'
        }));
        break;
    }

    // Table
    autoTable(doc, {
      head: [columns.map(col => col.header)],
      body: rows.map(row => columns.map(col => row[col.dataKey])),
      startY: startY,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9, // Slightly smaller font to fit more content
        cellPadding: 3, // Reduced padding to fit more content
        valign: 'middle',
        overflow: 'ellipsize', // Changed from 'linebreak' to 'ellipsize' to prevent wrapping
        textColor: [30, 30, 30],
        halign: 'left',
        minCellHeight: 10,
        lineWidth: 0.1,
        cellWidth: 'wrap', // Set default cell width behavior
      },
      headStyles: {
        fillColor: [255, 102, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10, // Slightly smaller font for headers
        halign: 'left',
        cellPadding: 4,
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: getColumnStyles(columns),
      didDrawPage: (data) => {
        // Add header to each page
        if (data.pageNumber > 1) {
          addBranding(doc, pageWidth, margin);
        }
        
        // Add footer to each page
        addFooter(doc, pageWidth, pageHeight, data.pageNumber, doc.getNumberOfPages(), margin);
      },
    });

    // Save the PDF
    const filename = `sadrc_members_${exportType}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    return filename;
  } catch (error) {
    console.error('PDF Export Error Details:', { 
      message: error.message || 'Unknown error',
      stack: error.stack || 'No stack trace',
      exportType: exportType || 'unknown'
    });
    throw error; // Re-throw to allow the calling function to handle it
  }
}

/**
 * Adds branding elements to the PDF
 */
function addBranding(doc, pageWidth, margin) {
  try {
    // Header background
    doc.setFillColor(255, 102, 0);
    doc.rect(0, 0, pageWidth, margin + 10, 'F');
    
    // Title
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('SADRC Membership', pageWidth / 2, margin, { align: 'center' });
    
    // Date line
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 4, pageWidth - margin, margin + 4);
    
    // Export date
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.text(`Export Date: ${new Date().toLocaleDateString('en-GB')}`, pageWidth / 2, margin + 10, { align: 'center' });
  } catch (error) {
    console.error('Error in addBranding:', error);
    // Continue execution even if branding fails
  }
}

/**
 * Adds a footer to each page
 */
function addFooter(doc, pageWidth, pageHeight, pageNumber, totalPages, margin) {
  try {
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Page numbers and confidentiality notice
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Skegness & District Running Club - Confidential - Page ${pageNumber} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  } catch (error) {
    console.error('Error in addFooter:', error);
    // Continue execution even if footer fails
  }
}

/**
 * Returns appropriate column styles based on the columns array
 */
function getColumnStyles(columns) {
  try {
    const styles = {};
    
    // Set width for each column type - adjusted to prevent wrapping
    columns.forEach((col, index) => {
      switch(col.dataKey) {
        case 'first_name':
          styles[index] = { cellWidth: 30, overflow: 'ellipsize' };
          break;
        case 'surname':
          styles[index] = { cellWidth: 30, overflow: 'ellipsize' };
          break;
        case 'email':
          styles[index] = { cellWidth: 60, overflow: 'ellipsize' };
          break;
        case 'date_of_birth':
        case 'membership_expiry':
          styles[index] = { cellWidth: 22, halign: 'center', overflow: 'ellipsize' };
          break;
        case 'status':
        case 'membership_status':
          styles[index] = { cellWidth: 22, halign: 'center', overflow: 'ellipsize' };
          break;
        case 'payment_status':
          styles[index] = { cellWidth: 18, halign: 'center', overflow: 'ellipsize' };
          break;
        case 'ea_number':
          styles[index] = { cellWidth: 25, halign: 'center', overflow: 'ellipsize' };
          break;
        default:
          styles[index] = { cellWidth: 'auto', overflow: 'ellipsize' };
      }
    });
    
    return styles;
  } catch (error) {
    console.error('Error in getColumnStyles:', error);
    return {}; // Return empty object as fallback
  }
}

/**
 * Formats a date string to DD/MM/YYYY
 */
function formatDate(dateString) {
  if (!dateString) return 'Not set';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-GB');
  } catch (e) {
    console.error('Date formatting error:', e);
    return dateString || 'Not set';
  }
}

/**
 * Formats status with proper capitalization
 */
function formatStatus(status) {
  if (!status) return 'Pending';
  
  try {
    return status.charAt(0).toUpperCase() + status.slice(1);
  } catch (e) {
    console.error('Status formatting error:', e);
    return status || 'Pending';
  }
}
