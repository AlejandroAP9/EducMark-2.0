/**
 * ═══════════════════════════════════════════════════════════════════
 *  HOJA DE RESPUESTAS OMR v2 — EducMark
 *  
 *  TODAS las dimensiones en mm para garantizar compatibilidad
 *  1:1 con el motor OMR v2 independiente de la impresora.
 * 
 *  Contrato con omr_engine.py:
 *    - Anchors: 7mm cuadrados en esquinas con 3mm quiet zone
 *    - Burbujas: 5.5mm diámetro, centro calculable desde blueprint
 *    - Geometría fija exportada como OMR_BLUEPRINT
 * ═══════════════════════════════════════════════════════════════════
 */

// ── GEOMETRIC CONSTANTS (mm) — CONTRACT WITH OMR ENGINE ──
// ¡NO cambiar sin actualizar omr_engine.py!

export const OMR_GEOMETRY = {
  // Page
  page_width: 215.9,       // Legal width (8.5")
  page_height: 355.6,      // Legal height (14")
  page_padding: 10,      // mm from page edge to content

  // Anchor Squares (Fiducials)
  anchor_size: 7,        // 7mm × 7mm solid black squares
  anchor_margin: 18,     // mm from page edge to anchor outer edge
  quiet_zone: 3,         // mm of white space around each anchor (no ink)

  // Bubble geometry
  bubble_diameter: 5.5,  // mm
  bubble_stroke: 0.4,    // mm border width

  // TF Section
  tf_origin_x: 36,       // mm from left edge
  tf_origin_y: 116,      // mm from top edge (below header)
  tf_row_height: 7,      // mm between row centers
  tf_col_width: 10,      // mm between V and F centers
  tf_label_offset: 10,   // mm left of first bubble for "1." label

  // MC Section — Column 1
  mc1_origin_x: 104,     // mm from left edge
  mc1_origin_y: 116,     // mm from top edge
  mc_row_height: 7,      // mm between row centers
  mc_col_width: 8,       // mm between A B C D E centers

  // MC Section — Column 2
  mc2_origin_x: 156,     // mm from left
  mc2_origin_y: 116,     // mm from top

  // Section headers
  header_y: 106,         // mm from top — section title baseline
} as const;

export interface AnswerSheetData {
  institutionLogo?: string;
  qrCodeDataUrl: string;
  evaluationInfo: {
    id: string;
    subject: string;
    grade: string;
    unit: string;
    oa: string;
  };
  totalQuestions: {
    trueFalse: number;
    multipleChoice: number;
  };
  idealScore?: number;
  studentName?: string;
  studentRut?: string;
  mcOptions?: 4 | 5;
}

// ── BLUEPRINT GENERATOR ──
// Produces exact pixel/mm coordinates for every bubble on the sheet.
// The OMR engine uses this to know EXACTLY where to look.

export interface BubbleCoord {
  question: number;
  type: 'tf' | 'mc';
  option: string;
  x_mm: number;     // Center X in mm from left edge
  y_mm: number;     // Center Y in mm from top edge
}

export interface OMRBlueprint {
  version: 2;
  page_size: { width: number; height: number };
  anchors: {
    top_left: { x: number; y: number; size: number };
    top_right: { x: number; y: number; size: number };
    bottom_left: { x: number; y: number; size: number };
    bottom_right: { x: number; y: number; size: number };
  };
  quiet_zone: number;
  bubble_diameter: number;
  sections: {
    tf: { origin_x: number; origin_y: number; row_height: number; col_width: number; rows: number; labels: string[] };
    mc1: { origin_x: number; origin_y: number; row_height: number; col_width: number; rows: number; labels: string[] };
    mc2: { origin_x: number; origin_y: number; row_height: number; col_width: number; rows: number; labels: string[] };
  };
  bubbles: BubbleCoord[];
}

export function generateOMRBlueprint(tfCount: number, mcCount: number, mcOptionCount: 4 | 5 = 5): OMRBlueprint {
  const G = OMR_GEOMETRY;
  const halfMC = Math.ceil(mcCount / 2);
  const mc2Count = mcCount - halfMC;

  const bubbles: BubbleCoord[] = [];

  // TF bubbles
  const tfLabels = ['V', 'F'];
  for (let row = 0; row < tfCount; row++) {
    for (let col = 0; col < tfLabels.length; col++) {
      bubbles.push({
        question: row + 1,
        type: 'tf',
        option: tfLabels[col],
        x_mm: G.tf_origin_x + col * G.tf_col_width,
        y_mm: G.tf_origin_y + row * G.tf_row_height,
      });
    }
  }

  // MC Col 1
  const mcLabels = ['A', 'B', 'C', 'D', 'E'].slice(0, mcOptionCount);
  for (let row = 0; row < halfMC; row++) {
    for (let col = 0; col < mcLabels.length; col++) {
      bubbles.push({
        question: row + 1,
        type: 'mc',
        option: mcLabels[col],
        x_mm: G.mc1_origin_x + col * G.mc_col_width,
        y_mm: G.mc1_origin_y + row * G.mc_row_height,
      });
    }
  }

  // MC Col 2
  for (let row = 0; row < mc2Count; row++) {
    for (let col = 0; col < mcLabels.length; col++) {
      bubbles.push({
        question: halfMC + row + 1,
        type: 'mc',
        option: mcLabels[col],
        x_mm: G.mc2_origin_x + col * G.mc_col_width,
        y_mm: G.mc2_origin_y + row * G.mc_row_height,
      });
    }
  }

  return {
    version: 2,
    page_size: { width: G.page_width, height: G.page_height },
    anchors: {
      top_left: { x: G.anchor_margin, y: G.anchor_margin, size: G.anchor_size },
      top_right: { x: G.page_width - G.anchor_margin - G.anchor_size, y: G.anchor_margin, size: G.anchor_size },
      bottom_left: { x: G.anchor_margin, y: G.page_height - G.anchor_margin - G.anchor_size, size: G.anchor_size },
      bottom_right: { x: G.page_width - G.anchor_margin - G.anchor_size, y: G.page_height - G.anchor_margin - G.anchor_size, size: G.anchor_size },
    },
    quiet_zone: G.quiet_zone,
    bubble_diameter: G.bubble_diameter,
    sections: {
      tf: {
        origin_x: G.tf_origin_x,
        origin_y: G.tf_origin_y,
        row_height: G.tf_row_height,
        col_width: G.tf_col_width,
        rows: tfCount,
        labels: tfLabels,
      },
      mc1: {
        origin_x: G.mc1_origin_x,
        origin_y: G.mc1_origin_y,
        row_height: G.mc_row_height,
        col_width: G.mc_col_width,
        rows: halfMC,
        labels: mcLabels,
      },
      mc2: {
        origin_x: G.mc2_origin_x,
        origin_y: G.mc2_origin_y,
        row_height: G.mc_row_height,
        col_width: G.mc_col_width,
        rows: mc2Count,
        labels: mcLabels,
      },
    },
    bubbles,
  };
}

// ── HTML GENERATOR ──

export const generateAnswerSheetPageHTML = (data: AnswerSheetData): string => {
  const { institutionLogo, qrCodeDataUrl, evaluationInfo, totalQuestions, idealScore, studentName, studentRut, mcOptions: mcOptionCount = 5 } = data;
  const G = OMR_GEOMETRY;
  const displayIdealScore = idealScore ?? (totalQuestions.trueFalse + totalQuestions.multipleChoice);
  const blueprint = generateOMRBlueprint(totalQuestions.trueFalse, totalQuestions.multipleChoice, mcOptionCount);

  const anchors = [
    blueprint.anchors.top_left,
    blueprint.anchors.top_right,
    blueprint.anchors.bottom_left,
    blueprint.anchors.bottom_right,
  ];

  const quietZoneHTML = anchors.map(a => `
        <div style="
            position: absolute;
            left: ${a.x - G.quiet_zone}mm;
            top: ${a.y - G.quiet_zone}mm;
            width: ${a.size + G.quiet_zone * 2}mm;
            height: ${a.size + G.quiet_zone * 2}mm;
            background: #fff;
            z-index: 0;
        "></div>
        <div style="
            position: absolute;
            left: ${a.x}mm;
            top: ${a.y}mm;
            width: ${a.size}mm;
            height: ${a.size}mm;
            background: #000;
            z-index: 1;
        "></div>
    `).join('');

  const tfRowsHTML = Array.from({ length: totalQuestions.trueFalse }, (_, i) => {
    const rowY = G.tf_origin_y + i * G.tf_row_height;
    return `
        <div style="position: absolute; left: ${G.tf_origin_x - 13}mm; top: ${rowY - 2.35}mm; width: 7.5mm; text-align: right;">
            <span style="font-size: 11pt; font-weight: 700;">${i + 1}.</span>
        </div>
        <div style="
            position: absolute;
            left: ${G.tf_origin_x - G.bubble_diameter / 2}mm;
            top: ${rowY - G.bubble_diameter / 2}mm;
            width: ${G.bubble_diameter}mm; height: ${G.bubble_diameter}mm;
            border: ${G.bubble_stroke}mm solid #000; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 10pt; font-weight: 700;
        ">V</div>
        <div style="
            position: absolute;
            left: ${G.tf_origin_x + G.tf_col_width - G.bubble_diameter / 2}mm;
            top: ${rowY - G.bubble_diameter / 2}mm;
            width: ${G.bubble_diameter}mm; height: ${G.bubble_diameter}mm;
            border: ${G.bubble_stroke}mm solid #000; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 10pt; font-weight: 700;
        ">F</div>
        `;
  }).join('');

  const mcLabels = ['A', 'B', 'C', 'D', 'E'].slice(0, mcOptionCount);
  const halfMC = Math.ceil(totalQuestions.multipleChoice / 2);
  const mc2Count = totalQuestions.multipleChoice - halfMC;

  const generateMCColumn = (startQ: number, count: number, originX: number, originY: number) => {
    let html = '';
    for (let i = 0; i < count; i++) {
      const rowY = originY + i * G.mc_row_height;
      html += `<div style="position: absolute; left: ${originX - 10.8}mm; top: ${rowY - 2.35}mm; width: 7.2mm; text-align: right;">
                <span style="font-size: 11pt; font-weight: 700;">${startQ + i}.</span>
            </div>`;
      for (let j = 0; j < mcLabels.length; j++) {
        const bubbleX = originX + j * G.mc_col_width;
        html += `<div style="
                    position: absolute;
                    left: ${bubbleX - G.bubble_diameter / 2}mm;
                    top: ${rowY - G.bubble_diameter / 2}mm;
                    width: ${G.bubble_diameter}mm; height: ${G.bubble_diameter}mm;
                    border: ${G.bubble_stroke}mm solid #000; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 10pt; font-weight: 700;
                ">${mcLabels[j]}</div>`;
      }
    }
    return html;
  };

  const mc1HTML = generateMCColumn(1, halfMC, G.mc1_origin_x, G.mc1_origin_y);
  const mc2HTML = generateMCColumn(halfMC + 1, mc2Count, G.mc2_origin_x, G.mc2_origin_y);

  const tfHeaderHTML = `<div style="position: absolute; left: ${G.tf_origin_x - G.tf_label_offset}mm; top: ${G.header_y - 7}mm;">
        <div style="font-size: 11pt; font-weight: 800; text-transform: uppercase; border-bottom: 0.75mm solid #000; padding-bottom: 1.5mm; width: 58mm;">I. VERDADERO O FALSO</div>
    </div>`;

  const mc1HeaderHTML = `<div style="position: absolute; left: ${G.mc1_origin_x - 7}mm; top: ${G.header_y - 7}mm;">
        <div style="font-size: 11pt; font-weight: 800; text-transform: uppercase; border-bottom: 0.75mm solid #000; padding-bottom: 1.5mm; width: 106mm;">II. SELECCIÓN MÚLTIPLE</div>
    </div>`;

  const logoSection = institutionLogo
    ? `<div style="width: 22mm; height: 22mm; display: flex; align-items: center; justify-content: center;">
               <img src="${institutionLogo}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
           </div>`
    : `<div style="width: 22mm; height: 22mm; border: 0.4mm dashed #999; display: flex; align-items: center; justify-content: center;">
               <span style="font-size: 6pt; color: #999; text-align: center; font-weight: 700;">LOGO</span>
           </div>`;

  const blueprintJSON = JSON.stringify(blueprint);

  return `<div class="legal-page" data-omr-blueprint='${blueprintJSON.replace(/'/g, "&#39;")}'>

        ${quietZoneHTML}

        <div style="position: absolute; left: 20mm; top: 32mm; right: 20mm;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                ${logoSection}

                <div style="text-align: center; flex: 1; padding: 1mm 8mm 0 8mm;">
                    <div style="font-size: 20pt; font-weight: 900; letter-spacing: 0.8mm; text-transform: uppercase; color: #000;">
                        HOJA DE RESPUESTAS
                    </div>
                    <div style="font-size: 14pt; color: #111; margin-top: 1.2mm;">
                        ${evaluationInfo.subject} - ${evaluationInfo.grade}
                    </div>
                    <div style="font-size: 13pt; color: #333; margin-top: 0.6mm;">
                        ${evaluationInfo.oa} | ${evaluationInfo.unit}
                    </div>
                </div>

                <div style="width: 24mm; height: 24mm; border: 0.8mm solid #000; padding: 0.8mm; background: #fff;">
                    <img src="${qrCodeDataUrl}" alt="QR" style="width: 100%; height: 100%; object-fit: contain;" />
                </div>
            </div>
        </div>

        <div style="position: absolute; left: 22mm; top: 60mm; width: 112mm; border: 0.5mm solid #000;">
            <div style="height: 14mm; border-bottom: 0.4mm solid #000; display: flex; align-items: center; padding: 0 3mm; gap: 2mm;">
                <span style="font-size: 10.5pt; font-weight: 800; letter-spacing: 0.1mm;">NOMBRE:</span>
                ${studentName
      ? `<span style="flex: 1; font-size: 10.5pt; border-bottom: 0.35mm dotted #000; line-height: 1.3;">${studentName}</span>`
      : `<div style="flex: 1; border-bottom: 0.35mm dotted #000; height: 3.8mm;"></div>`
    }
            </div>
            <div style="height: 14mm; display: grid; grid-template-columns: 1fr 1fr;">
                <div style="border-right: 0.4mm solid #000; display: flex; align-items: center; padding: 0 3mm; gap: 2mm;">
                    <span style="font-size: 10.5pt; font-weight: 800; letter-spacing: 0.1mm;">CURSO:</span>
                    <span style="font-size: 10.5pt; line-height: 1.3;">${evaluationInfo.grade}</span>
                </div>
                <div style="display: flex; align-items: center; padding: 0 3mm; gap: 2mm;">
                    ${studentRut
      ? `<span style="font-size: 10.5pt; font-weight: 800;">RUT:</span><span style="font-size: 10.5pt;">${studentRut}</span>`
      : `<span style="font-size: 10.5pt; font-weight: 800;">FECHA:</span><span style="font-size: 10.5pt;">___ / ___ / 202_</span>`
    }
                </div>
            </div>
        </div>

        <div style="position: absolute; left: 139mm; top: 60mm; width: 55mm; height: 28mm; border: 0.5mm solid #000;">
            <div style="display: grid; grid-template-columns: 1fr 1.2fr 0.9fr;">
                <div style="height: 8mm; border-right: 0.4mm solid #000; border-bottom: 0.4mm solid #000; display: flex; align-items: center; justify-content: center; padding: 0 1mm; font-size: 8.4pt; line-height: 1.05; font-weight: 800; text-align: center;">P. IDEAL</div>
                <div style="height: 8mm; border-right: 0.4mm solid #000; border-bottom: 0.4mm solid #000; display: flex; align-items: center; justify-content: center; padding: 0 1mm; font-size: 8.2pt; line-height: 1.0; font-weight: 800; text-align: center;">P. OBTENIDO</div>
                <div style="height: 8mm; border-bottom: 0.4mm solid #000; display: flex; align-items: center; justify-content: center; padding: 0 1mm; font-size: 8.4pt; line-height: 1.05; font-weight: 800; text-align: center;">NOTA</div>
                <div style="height: 20mm; border-right: 0.4mm solid #000; display: flex; align-items: center; justify-content: center; font-size: 16pt; font-weight: 900;">/ ${displayIdealScore}</div>
                <div style="height: 20mm; border-right: 0.4mm solid #000;"></div>
                <div style="height: 20mm; border: 0.6mm solid #000;"></div>
            </div>
        </div>

        <div style="position: absolute; left: 22mm; right: 22mm; top: 103mm; height: 0.75mm; background: #000;"></div>

        ${tfHeaderHTML}
        ${mc1HeaderHTML}
        ${tfRowsHTML}
        ${mc1HTML}
        ${mc2HTML}

        <div style="position: absolute; bottom: 22mm; left: 22mm; right: 22mm;">
            <div style="border-top: 0.55mm dashed #000; padding-top: 4mm; margin-bottom: 1.5mm;"></div>
            <p style="font-size: 10.2pt; text-align: center; line-height: 1.28; color: #111;">
                <span style="font-weight: 800;">INSTRUCCIONES:</span>
                Use lápiz pasta negro o mina oscuro. Rellene el óvalo completamente sin salirse de los bordes. Evite arrugar o manchar la hoja fuera de los espacios asignados.
            </p>
            <div style="display: flex; gap: 10mm; justify-content: center; margin-top: 3.5mm;">
                <div style="display: flex; align-items: center; gap: 1.5mm;">
                    <div style="width: 4.5mm; height: 4.5mm; border-radius: 50%; background: #000;"></div>
                    <span style="font-size: 9pt; font-weight: 800; text-transform: uppercase;">CORRECTO</span>
                </div>
                <div style="display: flex; align-items: center; gap: 1.5mm;">
                    <div style="width: 4.5mm; height: 4.5mm; border-radius: 50%; border: 0.35mm solid #000; display: flex; align-items: center; justify-content: center; font-size: 8pt; font-weight: 700;">✕</div>
                    <span style="font-size: 9pt; text-transform: uppercase;">INCORRECTO</span>
                </div>
            </div>
        </div>
    </div>`;
};

export const generateBatchAnswerSheetHTML = (pages: AnswerSheetData[]): string => {
  if (pages.length === 0) return '';

  const subject = pages[0].evaluationInfo.subject;
  const G = OMR_GEOMETRY;

  const pagesHTML = pages.map(pageData => generateAnswerSheetPageHTML(pageData)).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Hoja de Respuestas OMR - ${subject}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, Helvetica, sans-serif;
            background: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 0;
            padding: 0;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        @media print {
            @page { size: 8.5in 14in; margin: 0; }
            html, body { width: 8.5in; height: 14in; overflow: visible; }
            body { background: white; padding: 0; margin: 0; display: block; gap: 0; }
            .legal-page {
                width: 8.5in !important;
                height: 14in !important;
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                page-break-after: always;
                break-inside: avoid;
                page-break-inside: avoid;
            }
            .legal-page:last-child { page-break-after: auto; }
            .no-print { display: none !important; }
        }
        .legal-page {
            width: ${G.page_width}mm;
            height: ${G.page_height}mm;
            background: white;
            position: relative;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            overflow: hidden;
            flex-shrink: 0;
        }
        /* All children positioned absolutely in mm */
        .legal-page div {
            box-sizing: border-box;
        }
    </style>
</head>
<body>
    ${pagesHTML}
</body>
</html>`;
};
