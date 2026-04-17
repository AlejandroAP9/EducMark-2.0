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

  // MC Section — Column 1 (2-col layout, legacy)
  mc1_origin_x: 104,     // mm from left edge
  mc1_origin_y: 116,     // mm from top edge
  mc_row_height: 7,      // mm between row centers
  mc_col_width: 8,       // mm between A B C D E centers

  // MC Section — Column 2 (2-col layout, legacy)
  mc2_origin_x: 156,     // mm from left
  mc2_origin_y: 116,     // mm from top

  // ── 3-COL LAYOUT (nuevo, fijo 15 TF + 45 MC × 5 opts) ──
  // Se activa automáticamente cuando mc_count > 40.
  // Geometría calculada para aprovechar los 180mm usables entre anchors
  // (18mm de margin cada lado en hoja legal 216mm).
  //
  // Distribución horizontal:
  //   TF bubbles:  x=36 (V), x=46 (F)                  [labels 24-34]
  //   MC col1:     A=68, B=75, C=82, D=89, E=96        [labels 56-64]
  //   MC col2:     A=111, B=118, C=125, D=132, E=139   [labels 99-107]
  //   MC col3:     A=154, B=161, C=168, D=175, E=182   [labels 142-150]
  //
  // E col3 right edge = 182+2.75 = 184.75mm → clear del quiet zone
  // del anchor derecho (bottom-right) que empieza en x=188mm (191-3).
  //
  // Las hojas antiguas (mc_count ≤ 40) siguen usando mc1/mc2 de arriba.
  mc1_3col_origin_x: 68,
  mc2_3col_origin_x: 111,
  mc3_3col_origin_x: 154,
  mc_3col_col_width: 7,

  // Section headers
  header_y: 106,         // mm from top — section title baseline
} as const;

// Umbral para activar el layout de 3 columnas
export const MC_3COL_THRESHOLD = 40;

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
  layout: '2col' | '3col';
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
    mc3?: { origin_x: number; origin_y: number; row_height: number; col_width: number; rows: number; labels: string[] };
  };
  bubbles: BubbleCoord[];
}

export function generateOMRBlueprint(tfCount: number, mcCount: number, mcOptionCount: 4 | 5 = 5): OMRBlueprint {
  const G = OMR_GEOMETRY;
  const use3Col = mcCount > MC_3COL_THRESHOLD;

  // Column distribution
  let mc1Count: number, mc2Count: number, mc3Count: number;
  if (use3Col) {
    mc1Count = Math.ceil(mcCount / 3);
    mc2Count = Math.ceil((mcCount - mc1Count) / 2);
    mc3Count = mcCount - mc1Count - mc2Count;
  } else {
    mc1Count = Math.ceil(mcCount / 2);
    mc2Count = mcCount - mc1Count;
    mc3Count = 0;
  }

  // Per-layout MC column origins + col width
  const mc1X = use3Col ? G.mc1_3col_origin_x : G.mc1_origin_x;
  const mc2X = use3Col ? G.mc2_3col_origin_x : G.mc2_origin_x;
  const mc3X = G.mc3_3col_origin_x;
  const mcColW = use3Col ? G.mc_3col_col_width : G.mc_col_width;

  const bubbles: BubbleCoord[] = [];
  const tfLabels = ['V', 'F'];
  const mcLabels = ['A', 'B', 'C', 'D', 'E'].slice(0, mcOptionCount);

  // TF bubbles
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
  for (let row = 0; row < mc1Count; row++) {
    for (let col = 0; col < mcLabels.length; col++) {
      bubbles.push({
        question: row + 1,
        type: 'mc',
        option: mcLabels[col],
        x_mm: mc1X + col * mcColW,
        y_mm: G.mc1_origin_y + row * G.mc_row_height,
      });
    }
  }

  // MC Col 2
  for (let row = 0; row < mc2Count; row++) {
    for (let col = 0; col < mcLabels.length; col++) {
      bubbles.push({
        question: mc1Count + row + 1,
        type: 'mc',
        option: mcLabels[col],
        x_mm: mc2X + col * mcColW,
        y_mm: G.mc2_origin_y + row * G.mc_row_height,
      });
    }
  }

  // MC Col 3 (solo en 3-col mode)
  if (use3Col) {
    for (let row = 0; row < mc3Count; row++) {
      for (let col = 0; col < mcLabels.length; col++) {
        bubbles.push({
          question: mc1Count + mc2Count + row + 1,
          type: 'mc',
          option: mcLabels[col],
          x_mm: mc3X + col * mcColW,
          y_mm: G.mc2_origin_y + row * G.mc_row_height,
        });
      }
    }
  }

  const sections: OMRBlueprint['sections'] = {
    tf: {
      origin_x: G.tf_origin_x,
      origin_y: G.tf_origin_y,
      row_height: G.tf_row_height,
      col_width: G.tf_col_width,
      rows: tfCount,
      labels: tfLabels,
    },
    mc1: {
      origin_x: mc1X,
      origin_y: G.mc1_origin_y,
      row_height: G.mc_row_height,
      col_width: mcColW,
      rows: mc1Count,
      labels: mcLabels,
    },
    mc2: {
      origin_x: mc2X,
      origin_y: G.mc2_origin_y,
      row_height: G.mc_row_height,
      col_width: mcColW,
      rows: mc2Count,
      labels: mcLabels,
    },
  };
  if (use3Col) {
    sections.mc3 = {
      origin_x: mc3X,
      origin_y: G.mc2_origin_y,
      row_height: G.mc_row_height,
      col_width: mcColW,
      rows: mc3Count,
      labels: mcLabels,
    };
  }

  return {
    version: 2,
    layout: use3Col ? '3col' : '2col',
    page_size: { width: G.page_width, height: G.page_height },
    anchors: {
      top_left: { x: G.anchor_margin, y: G.anchor_margin, size: G.anchor_size },
      top_right: { x: G.page_width - G.anchor_margin - G.anchor_size, y: G.anchor_margin, size: G.anchor_size },
      bottom_left: { x: G.anchor_margin, y: G.page_height - G.anchor_margin - G.anchor_size, size: G.anchor_size },
      bottom_right: { x: G.page_width - G.anchor_margin - G.anchor_size, y: G.page_height - G.anchor_margin - G.anchor_size, size: G.anchor_size },
    },
    quiet_zone: G.quiet_zone,
    bubble_diameter: G.bubble_diameter,
    sections,
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
  const mcTotal = totalQuestions.multipleChoice;
  const use3Col = mcTotal > MC_3COL_THRESHOLD;
  let mc1Count: number, mc2Count: number, mc3Count: number;
  if (use3Col) {
    mc1Count = Math.ceil(mcTotal / 3);
    mc2Count = Math.ceil((mcTotal - mc1Count) / 2);
    mc3Count = mcTotal - mc1Count - mc2Count;
  } else {
    mc1Count = Math.ceil(mcTotal / 2);
    mc2Count = mcTotal - mc1Count;
    mc3Count = 0;
  }

  // Layout-aware column origins
  const mc1X = use3Col ? G.mc1_3col_origin_x : G.mc1_origin_x;
  const mc2X = use3Col ? G.mc2_3col_origin_x : G.mc2_origin_x;
  const mc3X = G.mc3_3col_origin_x;
  const mcColW = use3Col ? G.mc_3col_col_width : G.mc_col_width;
  // mcLabelOffset: distancia entre el borde izq del label box y el centro
  // de la columna A. Para 3-col subimos a 12mm porque los números 2 dígitos
  // ("45.") pisaban la burbuja A con el valor anterior (9mm).
  const mcLabelOffset = use3Col ? 12 : 10.8;
  const mcLabelBoxWidth = use3Col ? 8 : 7.2;

  const generateMCColumn = (startQ: number, count: number, originX: number, originY: number) => {
    let html = '';
    for (let i = 0; i < count; i++) {
      const rowY = originY + i * G.mc_row_height;
      html += `<div style="position: absolute; left: ${originX - mcLabelOffset}mm; top: ${rowY - 2.35}mm; width: ${mcLabelBoxWidth}mm; text-align: right;">
                <span style="font-size: ${use3Col ? '9pt' : '10pt'}; font-weight: 700;">${startQ + i}.</span>
            </div>`;
      for (let j = 0; j < mcLabels.length; j++) {
        const bubbleX = originX + j * mcColW;
        html += `<div style="
                    position: absolute;
                    left: ${bubbleX - G.bubble_diameter / 2}mm;
                    top: ${rowY - G.bubble_diameter / 2}mm;
                    width: ${G.bubble_diameter}mm; height: ${G.bubble_diameter}mm;
                    border: ${G.bubble_stroke}mm solid #000; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: ${use3Col ? '8.5pt' : '10pt'}; font-weight: 700;
                ">${mcLabels[j]}</div>`;
      }
    }
    return html;
  };

  const mc1HTML = generateMCColumn(1, mc1Count, mc1X, G.mc1_origin_y);
  const mc2HTML = generateMCColumn(mc1Count + 1, mc2Count, mc2X, G.mc2_origin_y);
  const mc3HTML = use3Col
    ? generateMCColumn(mc1Count + mc2Count + 1, mc3Count, mc3X, G.mc2_origin_y)
    : '';

  // Headers: en 3-col el TF header es más corto (32mm) porque el MC header
  // empieza en x=56mm (col1 label a 56) y no puede pisar al TF header que
  // arranca en x=22mm. En 2-col hay más espacio libre y los headers pueden
  // ser más anchos como antes.
  const tfHeaderLeft = use3Col ? 22 : G.tf_origin_x - G.tf_label_offset;
  const tfHeaderWidth = use3Col ? 32 : 58;
  const tfHeaderHTML = `<div style="position: absolute; left: ${tfHeaderLeft}mm; top: ${G.header_y - 7}mm;">
        <div style="font-size: ${use3Col ? '8.5pt' : '11pt'}; font-weight: 800; text-transform: uppercase; border-bottom: 0.75mm solid #000; padding-bottom: 1.5mm; width: ${tfHeaderWidth}mm;">I. VERDADERO O FALSO</div>
    </div>`;

  const mc1HeaderLeft = use3Col ? 56 : G.mc1_origin_x - 7;
  const mc1HeaderWidth = use3Col ? 130 : 106;
  const mc1HeaderHTML = `<div style="position: absolute; left: ${mc1HeaderLeft}mm; top: ${G.header_y - 7}mm;">
        <div style="font-size: ${use3Col ? '8.5pt' : '11pt'}; font-weight: 800; text-transform: uppercase; border-bottom: 0.75mm solid #000; padding-bottom: 1.5mm; width: ${mc1HeaderWidth}mm;">II. SELECCIÓN MÚLTIPLE</div>
    </div>`;

  const logoSection = institutionLogo
    ? `<div style="width: 26mm; height: 26mm; display: flex; align-items: center; justify-content: center;">
               <img src="${institutionLogo}" alt="Logo" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
           </div>`
    : `<div style="width: 26mm; height: 26mm; border: 0.4mm dashed #999; display: flex; align-items: center; justify-content: center;">
               <span style="font-size: 6pt; color: #999; text-align: center; font-weight: 700;">LOGO</span>
           </div>`;

  // Build subtitle parts conditionally — sin guiones huérfanos ni pipes vacíos
  const subtitleLine1Parts = [evaluationInfo.subject, evaluationInfo.grade].filter(p => p && p.trim());
  const subtitleLine1 = subtitleLine1Parts.join(' · ');
  const subtitleLine2Parts = [evaluationInfo.unit, evaluationInfo.oa].filter(p => p && p.trim());
  const subtitleLine2 = subtitleLine2Parts.join(' · ');

  const blueprintJSON = JSON.stringify(blueprint);

  return `<div class="legal-page" data-omr-blueprint='${blueprintJSON.replace(/'/g, "&#39;")}'>

        ${quietZoneHTML}

        <div style="position: absolute; left: 20mm; top: 32mm; right: 20mm;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                ${logoSection}

                <div style="text-align: center; flex: 1; padding: 2mm 8mm 0 8mm;">
                    <div style="font-size: 20pt; font-weight: 900; letter-spacing: 0.8mm; text-transform: uppercase; color: #0F0F1A;">
                        HOJA DE RESPUESTAS
                    </div>
                    <div style="width: 38mm; height: 0.9mm; background: #8B5CF6; margin: 1.6mm auto 1.4mm auto; border-radius: 0.5mm;"></div>
                    ${subtitleLine1 ? `<div style="font-size: 13pt; font-weight: 700; color: #1a1a2e; margin-top: 0.3mm;">${subtitleLine1}</div>` : ''}
                    ${subtitleLine2 ? `<div style="font-size: 11pt; color: #4a4a5e; margin-top: 0.6mm;">${subtitleLine2}</div>` : ''}
                </div>

                <div style="width: 24mm; height: 24mm; border: 0.8mm solid #000; padding: 0.8mm; background: #fff;"
                     title="Este QR se usa cuando escaneas con la app móvil en modo offline. En el escaneo web se ignora.">
                    <img src="${qrCodeDataUrl}" alt="QR (solo app móvil offline)" style="width: 100%; height: 100%; object-fit: contain;" />
                </div>
            </div>
        </div>

        <div style="position: absolute; left: 22mm; top: 64mm; width: 112mm; height: 24mm; border: 0.3mm solid #c0c0d0; border-radius: 1mm; background: #fff;">
            <div style="height: 12mm; border-bottom: 0.3mm solid #e0e0ea; display: flex; align-items: center; padding: 0 3.5mm; gap: 2.5mm;">
                <span style="font-size: 9.5pt; font-weight: 800; letter-spacing: 0.15mm; color: #4a4a5e; text-transform: uppercase;">Nombre</span>
                ${studentName
      ? `<span style="flex: 1; font-size: 11pt; font-weight: 600; line-height: 1.3; color: #0F0F1A;">${studentName}</span>`
      : `<div style="flex: 1; border-bottom: 0.3mm dotted #8a8a9a; height: 3.8mm;"></div>`
    }
            </div>
            <div style="height: 12mm; display: grid; grid-template-columns: 1fr 1fr;">
                <div style="border-right: 0.3mm solid #e0e0ea; display: flex; align-items: center; padding: 0 3.5mm; gap: 2.5mm;">
                    <span style="font-size: 9.5pt; font-weight: 800; letter-spacing: 0.15mm; color: #4a4a5e; text-transform: uppercase;">Curso</span>
                    <span style="flex: 1; font-size: 11pt; font-weight: 600; line-height: 1.3; color: #0F0F1A; border-bottom: 0.3mm dotted #8a8a9a; height: 3.8mm; display: flex; align-items: center;">${evaluationInfo.grade || ''}</span>
                </div>
                <div style="display: flex; align-items: center; padding: 0 3.5mm; gap: 2.5mm;">
                    ${studentRut
      ? `<span style="font-size: 9.5pt; font-weight: 800; color: #4a4a5e; text-transform: uppercase;">RUT</span><span style="flex: 1; font-size: 11pt; font-weight: 600; color: #0F0F1A; border-bottom: 0.3mm dotted #8a8a9a; height: 3.8mm; display: flex; align-items: center;">${studentRut}</span>`
      : `<span style="font-size: 9.5pt; font-weight: 800; color: #4a4a5e; text-transform: uppercase;">Fecha</span><span style="flex: 1; font-size: 11pt; font-weight: 600; color: #0F0F1A; border-bottom: 0.3mm dotted #8a8a9a; height: 3.8mm; display: flex; align-items: center;">___ / ___ / 202_</span>`
    }
                </div>
            </div>
        </div>

        <div style="position: absolute; left: 139mm; top: 64mm; width: 55mm; height: 24mm; border: 0.3mm solid #c0c0d0; border-radius: 1mm; overflow: hidden; background: #fff;">
            <div style="display: grid; grid-template-columns: 1fr 1.2fr 0.9fr;">
                <div style="height: 6.5mm; border-right: 0.3mm solid #e0e0ea; border-bottom: 0.3mm solid #c0c0d0; background: #f3eefe; display: flex; align-items: center; justify-content: center; padding: 0 1mm; font-size: 7.6pt; line-height: 1.05; font-weight: 800; text-align: center; color: #5b21b6; letter-spacing: 0.05mm;">P. IDEAL</div>
                <div style="height: 6.5mm; border-right: 0.3mm solid #e0e0ea; border-bottom: 0.3mm solid #c0c0d0; background: #f3eefe; display: flex; align-items: center; justify-content: center; padding: 0 1mm; font-size: 7.6pt; line-height: 1.0; font-weight: 800; text-align: center; color: #5b21b6; letter-spacing: 0.05mm;">P. OBTENIDO</div>
                <div style="height: 6.5mm; border-bottom: 0.3mm solid #c0c0d0; background: #f3eefe; display: flex; align-items: center; justify-content: center; padding: 0 1mm; font-size: 7.6pt; line-height: 1.05; font-weight: 800; text-align: center; color: #5b21b6; letter-spacing: 0.05mm;">NOTA</div>
                <div style="height: 17.5mm; border-right: 0.3mm solid #e0e0ea; display: flex; align-items: center; justify-content: center; font-size: 17pt; font-weight: 900; color: #8B5CF6;">/ ${displayIdealScore}</div>
                <div style="height: 17.5mm; border-right: 0.3mm solid #e0e0ea;"></div>
                <div style="height: 17.5mm;"></div>
            </div>
        </div>

        <div style="position: absolute; left: 22mm; right: 22mm; top: 94mm; height: 0.6mm; background: linear-gradient(90deg, #8B5CF6 0%, #06B6D4 100%);"></div>

        ${tfHeaderHTML}
        ${mc1HeaderHTML}
        ${tfRowsHTML}
        ${mc1HTML}
        ${mc2HTML}
        ${mc3HTML}

        <!-- Footer subido: antes estaba a bottom:14-30mm y se cortaba en
             algunas impresoras. Ahora a bottom:50-80mm para garantizar
             zona segura de impresión en A4/Legal en cualquier printer. -->
        <div style="position: absolute; bottom: 80mm; left: 22mm; right: 22mm;">
            <div style="border-top: 0.45mm dashed #8a8a9a; height: 0;"></div>
        </div>
        <div style="position: absolute; bottom: 50mm; left: 22mm; right: 22mm;">
            <p style="font-size: 9.6pt; text-align: center; line-height: 1.32; color: #2a2a3e;">
                <span style="font-weight: 800; color: #5b21b6;">INSTRUCCIONES:</span>
                Use lápiz pasta negro o mina oscuro. Rellene el óvalo completamente sin salirse de los bordes. Responda solo hasta la pregunta que su profesor indique.
            </p>
            <div style="display: flex; gap: 12mm; justify-content: center; margin-top: 3mm; align-items: center;">
                <div style="display: flex; align-items: center; gap: 1.8mm;">
                    <div style="width: 4.5mm; height: 4.5mm; border-radius: 50%; background: #000;"></div>
                    <span style="font-size: 8.6pt; font-weight: 800; text-transform: uppercase; color: #2a2a3e;">Correcto</span>
                </div>
                <div style="display: flex; align-items: center; gap: 1.8mm;">
                    <div style="width: 4.5mm; height: 4.5mm; border-radius: 50%; border: 0.35mm solid #000; display: flex; align-items: center; justify-content: center; font-size: 8pt; font-weight: 700;">✕</div>
                    <span style="font-size: 8.6pt; text-transform: uppercase; color: #2a2a3e;">Incorrecto</span>
                </div>
                <div style="width: 0.3mm; height: 5mm; background: #c0c0d0;"></div>
                <span style="font-size: 8pt; font-weight: 700; color: #8B5CF6; letter-spacing: 0.15mm; text-transform: uppercase;">EducMark</span>
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
