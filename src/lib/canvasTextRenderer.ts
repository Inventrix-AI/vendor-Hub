import { createCanvas, GlobalFonts, type SKRSContext2D } from '@napi-rs/canvas';
import { readFileSync } from 'fs';
import { join } from 'path';

// Register the Hindi font once at module load
// NotoSansDevanagari supports both Devanagari (Hindi) and Latin (English) characters
let fontRegistered = false;
function ensureFontRegistered(): void {
  if (fontRegistered) return;
  try {
    const fontPath = join(process.cwd(), 'public', 'fonts', 'NotoSansDevanagari-Medium.ttf');
    // Register as primary name
    GlobalFonts.registerFromPath(fontPath, 'NotoSansDevanagari');
    // Also register under common fallback names so Skia resolves Latin characters
    // to this font on Linux servers (like Vercel) that have no system fonts
    GlobalFonts.registerFromPath(fontPath, 'Helvetica');
    GlobalFonts.registerFromPath(fontPath, 'Arial');
    GlobalFonts.registerFromPath(fontPath, 'sans-serif');
    fontRegistered = true;
    console.log('[CanvasTextRenderer] Font registered: NotoSansDevanagari (+ Helvetica, Arial, sans-serif aliases)');
  } catch (error) {
    console.error('[CanvasTextRenderer] Failed to register font:', error);
    throw error;
  }
}

// Scale factor for high-DPI rendering (3x for print quality)
const SCALE = 3;
const PAGE_WIDTH = 842;   // PDF page width in points
const PAGE_HEIGHT = 595;  // PDF page height in points

// Field positions matching the PDF template (in PDF points, origin bottom-left)
const FIELD_POSITIONS = {
  name: { x: 426, y: 276 },
  occupation: { x: 426, y: 232 },
  outletName: { x: 426, y: 192 },
  address: { x: 426, y: 156 },
  idNumber: { x: 426, y: 103 },
  date: { x: 426, y: 60 },
  validity: { x: 674, y: 60 },
};

const TEXT_CONFIG = {
  fontSize: 14,
  smallFontSize: 11,
  baselineOffset: 8,
  addressLineHeight: 14,  // Vertical spacing between address lines
  maxAddressLines: 3,
};

export interface TextOverlayData {
  name: string;
  occupation: string;
  outletName: string;
  fullAddress: string;
  idNumber: string;
  date: string;
  validity: string;
}

/**
 * Converts a PDF Y coordinate (origin bottom-left) to a canvas Y coordinate (origin top-left).
 * Also applies the baselineOffset used in the original pdf-lib code.
 */
function pdfYToCanvasY(pdfY: number): number {
  return PAGE_HEIGHT - pdfY - TEXT_CONFIG.baselineOffset;
}

/**
 * Wraps text into multiple lines using actual font metrics.
 * Canvas measureText() uses HarfBuzz internally, so it correctly measures
 * Hindi conjuncts and mixed Hindi/English text.
 */
function wrapText(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!word) continue;

    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else if (currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines) break;
    } else {
      // Single word wider than maxWidth — use it as-is
      currentLine = word;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  // If there are remaining words, add ellipsis to last line
  if (lines.length >= maxLines && currentLine && !lines.includes(currentLine)) {
    const lastLine = lines[lines.length - 1];
    const ellipsis = lastLine + '…';
    if (ctx.measureText(ellipsis).width <= maxWidth) {
      lines[lines.length - 1] = ellipsis;
    }
  }

  return lines.length > 0 ? lines : ['N/A'];
}

/**
 * Renders all certificate text fields onto a transparent canvas and returns a PNG buffer.
 * Uses Skia's HarfBuzz text shaping engine for proper Hindi/Devanagari conjunct rendering.
 */
export function renderTextOverlay(data: TextOverlayData): Buffer {
  ensureFontRegistered();

  const canvas = createCanvas(PAGE_WIDTH * SCALE, PAGE_HEIGHT * SCALE);
  const ctx = canvas.getContext('2d');

  // Scale up for high-DPI — all coordinates remain in PDF points
  ctx.scale(SCALE, SCALE);

  // Text rendering properties
  ctx.fillStyle = 'rgba(26, 26, 26, 1)';  // Near-black, matches TEXT_CONFIG.color rgb(0.1, 0.1, 0.1)
  ctx.textBaseline = 'alphabetic';

  // Font string: "weight size family"
  const normalFont = `500 ${TEXT_CONFIG.fontSize}px NotoSansDevanagari, Helvetica, Arial, sans-serif`;
  const smallFont = `500 ${TEXT_CONFIG.smallFontSize}px NotoSansDevanagari, Helvetica, Arial, sans-serif`;

  // --- Draw each text field ---

  // Name
  ctx.font = normalFont;
  ctx.fillText(data.name, FIELD_POSITIONS.name.x, pdfYToCanvasY(FIELD_POSITIONS.name.y));

  // Occupation (typically English)
  ctx.fillText(data.occupation, FIELD_POSITIONS.occupation.x, pdfYToCanvasY(FIELD_POSITIONS.occupation.y));

  // Outlet/Shop Name
  ctx.fillText(data.outletName, FIELD_POSITIONS.outletName.x, pdfYToCanvasY(FIELD_POSITIONS.outletName.y));

  // Address (smaller font, multi-line with wrapping)
  ctx.font = smallFont;
  const maxAddressWidth = PAGE_WIDTH - FIELD_POSITIONS.address.x - 30; // 386pt right margin
  const addressLines = wrapText(ctx, data.fullAddress, maxAddressWidth, TEXT_CONFIG.maxAddressLines);

  addressLines.forEach((line, i) => {
    const y = pdfYToCanvasY(FIELD_POSITIONS.address.y) + (i * TEXT_CONFIG.addressLineHeight);
    ctx.fillText(line, FIELD_POSITIONS.address.x, y);
  });

  // ID Number
  ctx.font = normalFont;
  ctx.fillText(data.idNumber, FIELD_POSITIONS.idNumber.x, pdfYToCanvasY(FIELD_POSITIONS.idNumber.y));

  // Date (Issue Date)
  ctx.fillText(data.date, FIELD_POSITIONS.date.x, pdfYToCanvasY(FIELD_POSITIONS.date.y));

  // Validity (Valid Until)
  ctx.fillText(data.validity, FIELD_POSITIONS.validity.x, pdfYToCanvasY(FIELD_POSITIONS.validity.y));

  console.log('[CanvasTextRenderer] Text overlay rendered, canvas size:', canvas.width, 'x', canvas.height);

  return canvas.toBuffer('image/png');
}
