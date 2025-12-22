import { BorderStyle, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { saveAs } from "file-saver";
import { Project, Subtask, Ticket, TicketProgram } from "../types";

export const documentService = {

  async generateProductionPass(ticket: Ticket, subtasks: Subtask[], programs: TicketProgram[], project: Project | null) {
    // Brand Colors
    const PRIMARY_COLOR = "4F46E5"; // Indigo 600
    const TEXT_COLOR = "1F2937"; // Gray 800
    const HEADER_TEXT_COLOR = "FFFFFF";

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // --- Header Section ---
            new Paragraph({
              text: "PASE A PRODUCCIÓN",
              heading: HeadingLevel.HEADING_1,
              alignment: "center",
              spacing: { after: 400 },
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY_COLOR, space: 10 }
              }
            }),

            // --- Metadata Grid ---
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                   // Column 1
                    new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "PROYECTO", bold: true, size: 20, color: "6B7280" }),
                                ]
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: project?.name || "N/A", bold: true, size: 28, color: TEXT_COLOR }),
                                ],
                                spacing: { after: 200 }
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "FECHA", bold: true, size: 20, color: "6B7280" }),
                                ]
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: new Date().toLocaleDateString(), size: 24, color: TEXT_COLOR }),
                                ]
                            }),
                        ]
                    }),
                    // Column 2
                    new TableCell({
                         width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                             new Paragraph({
                                children: [
                                    new TextRun({ text: "TICKET ID", bold: true, size: 20, color: "6B7280" }),
                                ],
                                alignment: "right"
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: String(ticket.ticket_number || ticket.id.slice(0, 8).toUpperCase()), bold: true, size: 28, color: PRIMARY_COLOR }),
                                ],
                                alignment: "right",
                                spacing: { after: 200 }
                            }),
                             new Paragraph({
                                children: [
                                    new TextRun({ text: "PRIORIDAD", bold: true, size: 20, color: "6B7280" }),
                                ],
                                alignment: "right"
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: ticket.urgency.toUpperCase(), bold: true, size: 24, color: ticket.urgency === 'critical' || ticket.urgency === 'high' ? "EF4444" : TEXT_COLOR }),
                                ],
                                alignment: "right"
                            }),
                        ]
                    })
                  ]
                }),
              ]
            }),

            new Paragraph({ text: "", spacing: { after: 400 } }), // Spacer

            // --- Details Section ---
            createSectionHeader("Detalles del Requerimiento", PRIMARY_COLOR),

            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.SINGLE, color: "E5E7EB", size: 4 }, // Left border accent
                    right: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.NONE },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: "Asunto: ", bold: true, color: TEXT_COLOR }),
                                            new TextRun({ text: ticket.subject || "Sin Asunto", color: TEXT_COLOR })
                                        ],
                                        spacing: { after: 120 }
                                    }),
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: "Descripción:", bold: true, color: TEXT_COLOR })
                                        ],
                                    }),
                                    new Paragraph({
                                        text: ticket.description || "No se ha proporcionado una descripción detallada.",
                                        style: "Description",
                                        spacing: { before: 80 }
                                    })
                                ],
                                margins: { left: 200 }
                            })
                        ]
                    })
                ]
            }),

            new Paragraph({ text: "", spacing: { after: 300 } }), 

            // --- Subtasks Section ---
            createSectionHeader("Checklist de Tareas", PRIMARY_COLOR),

            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    // Header Row
                    new TableRow({
                        tableHeader: true,
                        children: [
                            new TableCell({ 
                                children: [new Paragraph({ 
                                    children: [new TextRun({ text: "TAREA", bold: true, color: HEADER_TEXT_COLOR })]
                                })],
                                shading: { fill: PRIMARY_COLOR },
                                verticalAlign: "center",
                                margins: { top: 100, bottom: 100, left: 100, right: 100 }
                            }),
                            new TableCell({ 
                                children: [new Paragraph({ 
                                    children: [new TextRun({ text: "ESTADO", bold: true, color: HEADER_TEXT_COLOR })],
                                    alignment: "center" 
                                })],
                                width: { size: 25, type: WidthType.PERCENTAGE },
                                shading: { fill: PRIMARY_COLOR },
                                verticalAlign: "center",
                                margins: { top: 100, bottom: 100, left: 100, right: 100 }
                            }),
                        ]
                    }),
                    // Check if subtasks exist
                    ...(subtasks.length > 0 ? subtasks.map((task) => 
                        new TableRow({
                            children: [
                                new TableCell({ 
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: task.title, color: TEXT_COLOR })]
                                    })],
                                    borders: { bottom: { style: BorderStyle.SINGLE, color: "E5E7EB", size: 2 } },
                                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                                }),
                                new TableCell({ 
                                    children: [new Paragraph({ 
                                        alignment: "center",
                                        children: [new TextRun({ 
                                            text: task.is_completed ? "COMPLETADO" : "PENDIENTE", 
                                            color: task.is_completed ? "059669" : "D97706", // Green or Amber
                                            size: 18,
                                            bold: true
                                        })]
                                    })],
                                    borders: { bottom: { style: BorderStyle.SINGLE, color: "E5E7EB", size: 2 } },
                                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                    verticalAlign: "center"
                                }),
                            ]
                        })
                    ) : [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No hay tareas registradas.", italics: true, color: "6B7280" })] })], columnSpan: 2, margins: { top: 100, bottom: 100, left: 100 } }),
                            ]
                        })
                    ])
                ]
            }),

            new Paragraph({ text: "", spacing: { after: 300 } }),

            // --- Programs Section ---
            createSectionHeader("Objetos Técnicos", PRIMARY_COLOR),

            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        tableHeader: true,
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "OBJETO", bold: true, color: HEADER_TEXT_COLOR })] })], shading: { fill: PRIMARY_COLOR }, margins: { top: 100, bottom: 100, left: 100 } }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TIPO", bold: true, color: HEADER_TEXT_COLOR })] })], shading: { fill: PRIMARY_COLOR }, margins: { top: 100, bottom: 100, left: 100 } }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "DESCRIPCIÓN", bold: true, color: HEADER_TEXT_COLOR })] })], shading: { fill: PRIMARY_COLOR }, margins: { top: 100, bottom: 100, left: 100 } }),
                        ]
                    }),
                    ...(programs.length > 0 ? programs.map(prog => 
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: prog.object_name, bold: true, color: TEXT_COLOR })] })], borders: { bottom: { style: BorderStyle.SINGLE, color: "E5E7EB" } }, margins: { top: 100, bottom: 100, left: 100 } }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: prog.object_type, color: "6B7280", size: 20 })] })], borders: { bottom: { style: BorderStyle.SINGLE, color: "E5E7EB" } }, margins: { top: 100, bottom: 100, left: 100 } }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: prog.description || "-", color: TEXT_COLOR })] })], borders: { bottom: { style: BorderStyle.SINGLE, color: "E5E7EB" } }, margins: { top: 100, bottom: 100, left: 100 } }),
                            ]
                        })
                    ) : [
                         new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No hay objetos técnicos modificados.", italics: true, color: "6B7280" })] })], columnSpan: 3, margins: { top: 100, bottom: 100, left: 100 } }),
                            ]
                        })
                    ])
                ]
            }),

            new Paragraph({ text: "", spacing: { after: 300 } }),

            // --- QA Section ---
            createSectionHeader("Control de Calidad (QA)", PRIMARY_COLOR),
            
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                 borders: {
                    top: { style: BorderStyle.SINGLE, color: "E5E7EB", size: 4 },
                    bottom: { style: BorderStyle.SINGLE, color: "E5E7EB", size: 4 },
                    left: { style: BorderStyle.SINGLE, color: "E5E7EB", size: 4 },
                    right: { style: BorderStyle.SINGLE, color: "E5E7EB", size: 4 },
                    insideHorizontal: { style: BorderStyle.SINGLE, color: "E5E7EB", size: 4 },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "ESTADO FINAL", bold: true, size: 20, color: "6B7280" })] })],
                                shading: { fill: "F3F4F6" }, width: { size: 25, type: WidthType.PERCENTAGE }, margins: { top: 100, bottom: 100, left: 100 }
                            }),
                            new TableCell({
                                children: [new Paragraph({ 
                                    text: ticket.qa_status === 'verified' ? "VERIFICADO EN STAGING" : 
                                          ticket.qa_status === 'failed' ? "FALLIDO" : "PENDIENTE / EN PROCESO", 
                                    bold: true,
                                    color: ticket.qa_status === 'verified' ? "059669" : TEXT_COLOR 
                                })],
                                 margins: { top: 100, bottom: 100, left: 100 }
                            }),
                        ]
                    }),
                    new TableRow({
                         children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "OBSERVACIONES", bold: true, size: 20, color: "6B7280" })] })],
                                shading: { fill: "F3F4F6" }, margins: { top: 100, bottom: 100, left: 100 }
                            }),
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: ticket.qa_notes || "Sin observaciones adicionales.", color: TEXT_COLOR })] })],
                                margins: { top: 100, bottom: 100, left: 100 }
                            }),
                        ]
                    })
                ]
            }),

            new Paragraph({ text: "", spacing: { after: 600 } }),

            // --- Signatures ---
            new Paragraph({
                text: "AUTORIZACIÓN DE DESPLIEGUE",
                heading: HeadingLevel.HEADING_3,
                spacing: { after: 400 },
                alignment: "center",
                children: [
                    new TextRun({
                        text: "AUTORIZACIÓN DE DESPLIEGUE",
                        color: "6B7280"
                    })
                ]
            }),

            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.NONE },
                },
                rows: [
                    new TableRow({
                        children: [
                            createSignatureCell("Desarrollador"),
                            createSignatureCell("QA Lead"),
                            createSignatureCell("Product Owner / Cliente"),
                        ]
                    })
                ]
            })

          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Pase_Produccion_${ticket.ticket_number || ticket.id.slice(0, 8)}.docx`);
  }
};

// Helper Functions
function createSectionHeader(text: string, color: string): Paragraph {
    return new Paragraph({
        children: [
            new TextRun({
                text: text.toUpperCase(),
                bold: true,
                color: color,
                size: 24
            })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 },
        border: {
            bottom: { style: BorderStyle.SINGLE, color: "E5E7EB", size: 4, space: 4 }
        }
    });
}

function createSignatureCell(role: string): TableCell {
    return new TableCell({
        children: [
            new Paragraph({
                alignment: "center",
                children: [new TextRun({ text: "________________________________", color: "9CA3AF" })]
            }),
            new Paragraph({
                alignment: "center",
                spacing: { before: 100 },
                children: [new TextRun({ text: role, bold: true, color: "374151" })]
            }),
            new Paragraph({
                alignment: "center",
                children: [new TextRun({ text: "Firma y Fecha", size: 16, color: "9CA3AF" })]
            })
        ],
        width: { size: 33, type: WidthType.PERCENTAGE }
    });
}
