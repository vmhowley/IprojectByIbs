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

export async function exportDashboardToPDF(data: DashboardData, filename: string = 'dashboard-report.pdf') {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Header
  pdf.setFillColor(79, 70, 229); // Indigo 600
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text('IBS Project Tracker', 15, 25);
  
  pdf.setFontSize(12);
  pdf.text('Reporte Ejecutivo de Dashboard', 15, 33);

  // Info Section
  pdf.setTextColor(100);
  pdf.setFontSize(10);
  pdf.text(`Fecha: ${new Date().toLocaleString()}`, pageWidth - 70, 25);
  
  let currentY = 50;

  // Key Metrics
  pdf.setTextColor(40);
  pdf.setFontSize(14);
  pdf.text('Indicadores Clave', 15, currentY);
  currentY += 10;

  autoTable(pdf, {
    startY: currentY,
    head: [['Métrica', 'Valor']],
    body: [
      ['Total Proyectos', data.projectsCount],
      ['Proyectos Activos', data.activeProjectsCount],
      ['Total Solicitudes', data.ticketsCount],
      ['Solicitudes Completadas', data.completedTicketsCount],
    ],
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
  });

  currentY = (pdf as any).lastAutoTable.finalY + 15;

  // Earnings Section (Admin only)
  if (Object.keys(data.earningsByCurrency).length > 0) {
    if (currentY > 250) { pdf.addPage(); currentY = 20; }
    pdf.setFontSize(14);
    pdf.text('Resumen de Ganancias', 15, currentY);
    currentY += 10;

    const earningsBody = Object.entries(data.earningsByCurrency).map(([curr, amount]) => [
      curr,
      new Intl.NumberFormat('es-DO', { style: 'currency', currency: curr }).format(amount)
    ]);

    autoTable(pdf, {
      startY: currentY,
      head: [['Moneda', 'Total']],
      body: earningsBody,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }, // Emerald 500
    });

    currentY = (pdf as any).lastAutoTable.finalY + 15;
  }

  // Earnings by Client
  if (data.earningsByClient.length > 0) {
    if (currentY > 250) { pdf.addPage(); currentY = 20; }
    pdf.setFontSize(14);
    pdf.text('Ganancias por Cliente', 15, currentY);
    currentY += 10;

    autoTable(pdf, {
      startY: currentY,
      head: [['Cliente', 'Monto Acumulado']],
      body: data.earningsByClient.map(e => [e.name, e.display]),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
    });

    currentY = (pdf as any).lastAutoTable.finalY + 15;
  }

  // Tickets by Status
  if (currentY > 220) { pdf.addPage(); currentY = 20; }
  pdf.setFontSize(14);
  pdf.text('Tickets por Estado', 15, currentY);
  currentY += 10;

  autoTable(pdf, {
    startY: currentY,
    head: [['Estado', 'Cantidad']],
    body: [
      ['Pendiente de Analizar', data.statusStats.pending_analysis],
      ['Pendiente de Aprobación', data.statusStats.pending_approval],
      ['Aprobado', data.statusStats.approved],
      ['En Progreso', data.statusStats.ongoing],
      ['Completado', data.statusStats.completed + data.statusStats.done],
    ],
    theme: 'grid',
    headStyles: { fillColor: [147, 51, 234] }, // Purple 600
  });

  pdf.save(filename);
}
