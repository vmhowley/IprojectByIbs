import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardData {
  projectsCount: number;
  activeProjectsCount: number;
  ticketsCount: number;
  completedTicketsCount: number;
  statusStats: Record<string, number>;
  clientStats: { name: string; count: number }[];
  earningsByCurrency: Record<string, number>;
  earningsByClient: { name: string; display: string }[];
  clientNames: Record<string, string>;
}

// The app's inks in RGB: the PDF is printed on the same letterhead.
const INK: [number, number, number] = [24, 28, 38];
const INK_3: [number, number, number] = [110, 116, 128];
const BRAND: [number, number, number] = [210, 23, 25];
const RULE: [number, number, number] = [220, 224, 230];
const WELL: [number, number, number] = [245, 246, 248];

// Tables are ruled forms: grey head, ink text, thin rules.
const TABLE_STYLE = {
  theme: 'grid' as const,
  styles: { textColor: INK, lineColor: RULE, lineWidth: 0.2, fontSize: 10, cellPadding: 2.5 },
  headStyles: { fillColor: WELL, textColor: INK, fontStyle: 'bold' as const },
};

export async function exportDashboardToPDF(data: DashboardData, filename: string = 'dashboard-report.pdf') {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const lastY = () => (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  // Header
  pdf.setTextColor(...INK);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.text('ibPulse', 15, 22);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(...INK_3);
  pdf.text('Reporte del tablero', 15, 29);

  // Info Section
  pdf.setFontSize(9);
  pdf.text(`Fecha: ${new Date().toLocaleString('es-DO')}`, pageWidth - 15, 22, { align: 'right' });
  pdf.text('BY IBSYSTEMS.SRL', pageWidth - 15, 29, { align: 'right' });

  // The red rule of the letterhead.
  pdf.setDrawColor(...BRAND);
  pdf.setLineWidth(0.8);
  pdf.line(15, 34, pageWidth - 15, 34);

  let currentY = 46;
  const heading = (text: string) => {
    pdf.setTextColor(...INK);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text(text, 15, currentY);
    pdf.setFont('helvetica', 'normal');
    currentY += 5;
  };

  // Key Metrics
  heading('Indicadores');

  autoTable(pdf, {
    startY: currentY,
    head: [['Indicador', 'Valor']],
    body: [
      ['Proyectos', data.projectsCount],
      ['Proyectos activos', data.activeProjectsCount],
      ['Tickets', data.ticketsCount],
      ['Tickets completados', data.completedTicketsCount],
    ],
    ...TABLE_STYLE,
    columnStyles: { 1: { halign: 'right' } },
  });

  currentY = lastY() + 14;

  // Earnings Section (Admin only)
  if (Object.keys(data.earningsByCurrency).length > 0) {
    if (currentY > 250) { pdf.addPage(); currentY = 20; }
    heading('Cotizado por moneda');

    const earningsBody = Object.entries(data.earningsByCurrency).map(([curr, amount]) => [
      curr,
      new Intl.NumberFormat('es-DO', { style: 'currency', currency: curr }).format(amount)
    ]);

    autoTable(pdf, {
      startY: currentY,
      head: [['Moneda', 'Total']],
      body: earningsBody,
      ...TABLE_STYLE,
      columnStyles: { 1: { halign: 'right' } },
    });

    currentY = lastY() + 14;
  }

  // Earnings by Client
  if (data.earningsByClient.length > 0) {
    if (currentY > 250) { pdf.addPage(); currentY = 20; }
    heading('Cotizado por cliente');

    autoTable(pdf, {
      startY: currentY,
      head: [['Cliente', 'Cotizado']],
      body: data.earningsByClient.map(e => [e.name, e.display]),
      ...TABLE_STYLE,
      columnStyles: { 1: { halign: 'right' } },
    });

    currentY = lastY() + 14;
  }

  // Tickets by Status
  if (currentY > 220) { pdf.addPage(); currentY = 20; }
  heading('Tickets por estado');

  autoTable(pdf, {
    startY: currentY,
    head: [['Estado', 'Cantidad']],
    body: [
      ['Análisis', data.statusStats.pending_analysis || 0],
      ['Aprobación del cliente', data.statusStats.pending_approval || 0],
      ['Aprobado', data.statusStats.approved || 0],
      ['En desarrollo', data.statusStats.ongoing || 0],
      ['Completado', (data.statusStats.completed || 0) + (data.statusStats.done || 0)],
    ],
    ...TABLE_STYLE,
    columnStyles: { 1: { halign: 'right' } },
  });

  pdf.save(filename);
}
