// Polyfill for regeneratorRuntime required by @pdf-lib/fontkit
import 'regenerator-runtime/runtime';

import { PDFDocument, rgb, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFileSync } from 'fs';
import { join } from 'path';

// Certificate type definitions
export type CertificateType = 'mp' | 'mahila_ekta' | 'bhopal' | 'jabalpur' | 'gwalior' | 'indore' | 'mandsour' | 'rewa' | 'ujjain';

interface IDCardData {
  certificateNumber: string;
  vendorId: string;
  vendorName: string;
  businessName: string;
  businessType: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  registrationNumber?: string;
  issuedAt: Date;
  validUntil: Date;
  vendorPhotoBase64?: string;
  certificateType?: CertificateType; // Type of certificate to generate
}

// Legacy interface for backward compatibility
interface CertificateData extends IDCardData {}

// PDF template dimensions: 842 x 595 points
// Coordinate Origin: Bottom-left (0,0) - PDF standard

// User-provided exact coordinates
const FIELD_POSITIONS = {
  // Passport photo - exact coordinates from user
  photo: { x: 87, y: 91, width: 154, height: 190 },

  // Text fields - exact coordinates from user
  name: { x: 426, y: 276 },
  occupation: { x: 426, y: 232 },
  outletName: { x: 426, y: 192 },
  address: { x: 426, y: 156 }, // Moved up by 10pt to center in field
  idNumber: { x: 426, y: 103 },
  date: { x: 426, y: 60 },
  validity: { x: 674, y: 60 },
};

const TEXT_CONFIG = {
  fontSize: 14,
  smallFontSize: 11,
  color: rgb(0.1, 0.1, 0.1), // Near black
  // Baseline offset to vertically center text in 32pt field boxes
  baselineOffset: 8,
};

// Get template path based on certificate type
function getTemplatePath(certificateType: CertificateType = 'mp'): string {
  const templates: Record<CertificateType, string> = {
    'mp': '/id-card-template.pdf',
    'mahila_ekta': '/mahila-ekta-template.pdf',
    'bhopal': '/bhopal-certificate-template.pdf',
    'jabalpur': '/jabalpur-certificate-template.pdf',
    'gwalior': '/gwalior-certificate-template.pdf',
    'indore': '/indore-certificate-template.pdf',
    'mandsour': '/mandsour-certificate-template.pdf',
    'rewa': '/rewa-certificate-template.pdf',
    'ujjain': '/ujjain-certificate-template.pdf',
  };
  return templates[certificateType];
}

// Determine which certificate types to generate based on gender and city
export function determineCertificateTypes(gender: string, city: string): CertificateType[] {
  const certificates: CertificateType[] = ['mp']; // MP certificate is common for all

  // Normalize inputs
  const normalizedGender = gender?.toLowerCase().trim();
  const normalizedCity = city?.toLowerCase().trim();

  // Cities that get location-specific certificates
  const citySpecificCerts = ['bhopal', 'jabalpur', 'gwalior', 'indore', 'mandsour', 'rewa', 'ujjain'];

  // Female vendors get Mahila Ekta certificate (no location-specific)
  if (normalizedGender === 'female') {
    certificates.push('mahila_ekta');
  }
  // Male vendors from specific cities get location-specific certificate
  else if (citySpecificCerts.includes(normalizedCity)) {
    certificates.push(normalizedCity as CertificateType);
  }

  return certificates;
}

export class IDCardGenerator {
  async generateIDCard(data: IDCardData): Promise<ArrayBuffer> {
    const certificateType = data.certificateType || 'mp';
    console.log('[PDF Generator] Certificate type:', certificateType);

    // Read template PDF from filesystem (avoids self-referential HTTP fetch that fails on production)
    const templatePath = getTemplatePath(certificateType);
    const templateFilePath = join(process.cwd(), 'public', templatePath);
    console.log('[PDF Generator] Loading template PDF from:', templateFilePath);
    const templateBytes = new Uint8Array(readFileSync(templateFilePath));
    console.log('[PDF Generator] Template loaded, size:', templateBytes.length);

    const pdfDoc = await PDFDocument.load(templateBytes);

    // Register fontkit for custom font embedding
    pdfDoc.registerFontkit(fontkit);

    // Load standard Helvetica font for Latin text (English names, addresses, etc.)
    const { StandardFonts } = await import('pdf-lib');
    const latinFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    console.log('[PDF Generator] Latin font (Helvetica) embedded');

    // Load and embed Hindi font for Devanagari text
    let hindiFont: PDFFont;
    try {
      console.log('[PDF Generator] Loading Hindi font...');
      const fontFilePath = join(process.cwd(), 'public', 'fonts', 'NotoSansDevanagari-Medium.ttf');
      const fontBytes = new Uint8Array(readFileSync(fontFilePath));
      console.log('[PDF Generator] Font loaded, size:', fontBytes.length);

      // Embed font with subset: true for proper Hindi conjunct rendering
      hindiFont = await pdfDoc.embedFont(fontBytes, { subset: true });
      console.log('[PDF Generator] Hindi font embedded successfully');
    } catch (error) {
      console.error('[PDF Generator] Failed to load Hindi font, using Helvetica fallback:', error);
      hindiFont = latinFont; // Fallback to Helvetica
    }

    // Helper function to detect if text contains Devanagari characters
    const containsDevanagari = (text: string): boolean => {
      // Devanagari Unicode range: \u0900-\u097F
      return /[\u0900-\u097F]/.test(text);
    };

    // Helper function to normalize Unicode text (NFC form helps with conjuncts)
    const normalizeText = (text: string): string => {
      return text.normalize('NFC');
    };

    // Helper function to select appropriate font based on text content
    const getFontForText = (text: string): PDFFont => {
      return containsDevanagari(text) ? hindiFont : latinFont;
    };

    // Get the first page
    const pages = pdfDoc.getPages();
    const page = pages[0];
    const { width, height } = page.getSize();

    console.log(`[PDF Generator] Page size: ${width} x ${height}`);
    console.log(`[PDF Generator] Vendor data:`, {
      name: data.vendorName,
      businessType: data.businessType,
      businessName: data.businessName,
      hasPhoto: !!data.vendorPhotoBase64,
      photoLength: data.vendorPhotoBase64?.length || 0
    });

    // Add vendor photo if available
    if (data.vendorPhotoBase64) {
      try {
        console.log('[PDF Generator] Processing vendor photo...');
        const photoBytes = this.base64ToUint8Array(data.vendorPhotoBase64);
        console.log('[PDF Generator] Photo bytes length:', photoBytes.length);

        // Detect image type and embed accordingly
        let image;
        const header = photoBytes.slice(0, 4);
        const isJpeg = header[0] === 0xFF && header[1] === 0xD8;
        const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;

        console.log('[PDF Generator] Image header:', Array.from(header).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
        console.log('[PDF Generator] Image type detection - JPEG:', isJpeg, 'PNG:', isPng);

        if (isPng) {
          console.log('[PDF Generator] Embedding as PNG...');
          image = await pdfDoc.embedPng(photoBytes);
        } else if (isJpeg) {
          console.log('[PDF Generator] Embedding as JPEG...');
          image = await pdfDoc.embedJpg(photoBytes);
        } else {
          // Try JPEG as default
          console.log('[PDF Generator] Unknown format, trying JPEG...');
          image = await pdfDoc.embedJpg(photoBytes);
        }

        // Get original image dimensions
        const imgDims = image.scale(1);
        console.log('[PDF Generator] Original image dimensions:', imgDims.width, 'x', imgDims.height);

        // Calculate scale to fit in the photo box while maintaining aspect ratio
        const photoConfig = FIELD_POSITIONS.photo;
        const scale = Math.min(
          photoConfig.width / imgDims.width,
          photoConfig.height / imgDims.height
        );

        const scaledWidth = imgDims.width * scale;
        const scaledHeight = imgDims.height * scale;

        // Center the image in the photo box
        const xOffset = photoConfig.x + (photoConfig.width - scaledWidth) / 2;
        const yOffset = photoConfig.y + (photoConfig.height - scaledHeight) / 2;

        console.log('[PDF Generator] Drawing photo at:', {
          x: xOffset,
          y: yOffset,
          width: scaledWidth,
          height: scaledHeight,
          scale: scale
        });

        page.drawImage(image, {
          x: xOffset,
          y: yOffset,
          width: scaledWidth,
          height: scaledHeight,
        });

        console.log('[PDF Generator] Photo added successfully');
      } catch (error) {
        console.error('[PDF Generator] Error adding photo:', error);
      }
    } else {
      console.log('[PDF Generator] No vendor photo provided');
    }

    // Draw text fields with baseline offset for vertical centering
    const { fontSize, smallFontSize, color, baselineOffset } = TEXT_CONFIG;

    // Name - use appropriate font based on content (Hindi or English)
    const nameValue = data.vendorName || 'N/A';
    const nameFont = getFontForText(nameValue);
    console.log('[PDF Generator] Drawing name:', nameValue, 'font:', containsDevanagari(nameValue) ? 'Hindi' : 'Latin');
    page.drawText(nameValue, {
      x: FIELD_POSITIONS.name.x,
      y: FIELD_POSITIONS.name.y + baselineOffset,
      font: nameFont,
      size: fontSize,
      color,
    });

    // Occupation/Business Type - keep in English
    const occupation = this.formatBusinessTypeEnglish(data.businessType) || data.businessType || 'N/A';
    const occupationFont = latinFont; // Always use Latin font for English
    console.log('[PDF Generator] Drawing occupation (English):', occupation);
    page.drawText(occupation, {
      x: FIELD_POSITIONS.occupation.x,
      y: FIELD_POSITIONS.occupation.y + baselineOffset,
      font: occupationFont,
      size: fontSize,
      color,
    });

    // Outlet/Shop Name - use appropriate font
    const outletName = data.businessName || 'N/A';
    const outletFont = getFontForText(outletName);
    console.log('[PDF Generator] Drawing outlet name:', outletName, 'font:', containsDevanagari(outletName) ? 'Hindi' : 'Latin');
    page.drawText(outletName, {
      x: FIELD_POSITIONS.outletName.x,
      y: FIELD_POSITIONS.outletName.y + baselineOffset,
      font: outletFont,
      size: fontSize,
      color,
    });

    // Address - word-wrap into up to 3 lines using actual font width measurement
    const fullAddress = this.formatAddress(data);
    const addressFont = getFontForText(fullAddress);
    const maxAddressWidth = width - FIELD_POSITIONS.address.x - 30; // 30pt right margin
    const addressLines = this.wrapText(fullAddress, addressFont, smallFontSize, maxAddressWidth, 3);
    console.log('[PDF Generator] Address wrapped into', addressLines.length, 'line(s):', addressLines);
    addressLines.forEach((line, i) => {
      page.drawText(line, {
        x: FIELD_POSITIONS.address.x,
        y: FIELD_POSITIONS.address.y + baselineOffset - (i * 14),
        font: addressFont,
        size: smallFontSize,
        color,
      });
    });

    // ID Number - always Latin characters
    const idNumber = data.vendorId || data.certificateNumber || 'N/A';
    console.log('[PDF Generator] Drawing ID number:', idNumber);
    page.drawText(idNumber, {
      x: FIELD_POSITIONS.idNumber.x,
      y: FIELD_POSITIONS.idNumber.y + baselineOffset,
      font: latinFont, // ID numbers are always Latin
      size: fontSize,
      color,
    });

    // Date (Issue Date) - always Latin characters
    const dateStr = this.formatDate(data.issuedAt);
    console.log('[PDF Generator] Drawing date:', dateStr);
    page.drawText(dateStr, {
      x: FIELD_POSITIONS.date.x,
      y: FIELD_POSITIONS.date.y + baselineOffset,
      font: latinFont, // Dates are always Latin
      size: fontSize,
      color,
    });

    // Validity (Valid Until) - always Latin characters
    const validityStr = this.formatDate(data.validUntil);
    console.log('[PDF Generator] Drawing validity:', validityStr);
    page.drawText(validityStr, {
      x: FIELD_POSITIONS.validity.x,
      y: FIELD_POSITIONS.validity.y + baselineOffset,
      font: latinFont, // Dates are always Latin
      size: fontSize,
      color,
    });

    // Save and return the PDF
    console.log('[PDF Generator] Saving PDF...');
    const pdfBytes = await pdfDoc.save();
    console.log('[PDF Generator] PDF generated successfully, size:', pdfBytes.length);

    // Convert Uint8Array to ArrayBuffer
    return pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    // Remove data URI prefix if present
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = Buffer.from(base64Data, 'base64');
    return new Uint8Array(binaryString);
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatAddress(data: IDCardData): string {
    const parts = [];
    if (data.address) parts.push(data.address);
    if (data.city) parts.push(data.city);
    if (data.state) parts.push(data.state);
    if (data.postalCode) parts.push(data.postalCode);
    return parts.join(', ') || 'N/A';
  }

  private wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number, maxLines: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    let i = 0;

    while (i < words.length) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      if (font.widthOfTextAtSize(testLine, fontSize) <= maxWidth) {
        currentLine = testLine;
        i++;
      } else if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
        if (lines.length >= maxLines) break;
      } else {
        // Single word wider than maxWidth — use it as-is (unavoidable)
        currentLine = words[i];
        i++;
      }
    }

    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
      i = words.length;
    }

    // If not all words were consumed, add … to the last line
    if (i < words.length && lines.length > 0) {
      const lastLine = lines[lines.length - 1];
      if (font.widthOfTextAtSize(lastLine + '…', fontSize) <= maxWidth) {
        lines[lines.length - 1] = lastLine + '…';
      } else {
        const parts = lastLine.split(' ');
        while (parts.length > 0) {
          parts.pop();
          const candidate = (parts.length > 0 ? parts.join(' ') : '') + '…';
          if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
            lines[lines.length - 1] = candidate;
            break;
          }
        }
      }
    }

    return lines.length > 0 ? lines : ['N/A'];
  }

  private formatBusinessTypeEnglish(businessType: string): string {
    const englishFormats: Record<string, string> = {
      // Convert snake_case to proper English titles
      'retailer': 'Retailer',
      'grocery': 'Grocery Store',
      'pan_shop': 'Pan Shop',
      'street_vendor': 'Street Vendor',
      'wholesale': 'Wholesale Trader',
      'other': 'Other',
    };

    // Case-insensitive lookup
    const key = Object.keys(englishFormats).find(
      k => k.toLowerCase() === businessType?.toLowerCase()
    );

    if (key) {
      return englishFormats[key];
    }

    // If not in map, format the string nicely
    // Convert snake_case to Title Case
    return businessType
      ?.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ') || 'Other';
  }

  private translateBusinessType(businessType: string): string {
    const translations: Record<string, string> = {
      // Current form values (snake_case) - PRIMARY
      'retailer': 'खुदरा व्यापारी',
      'grocery': 'किराना स्टोर',
      'pan_shop': 'पान दुकान',
      'street_vendor': 'पथ विक्रेता',
      'wholesale': 'होलेसेल व्यापारी',
      'other': 'अन्य',
      // Legacy values (for backward compatibility with old data)
      'Vegetable Vendor': 'सब्जी विक्रेता',
      'Fruit Vendor': 'फल विक्रेता',
      'Food Vendor': 'खाद्य विक्रेता',
      'Street Food': 'स्ट्रीट फूड विक्रेता',
      'Grocery': 'किराना विक्रेता',
      'Clothing': 'कपड़े विक्रेता',
      'General Store': 'जनरल स्टोर',
      'Tea Stall': 'चाय विक्रेता',
      'Snacks': 'नाश्ता विक्रेता',
      'Flowers': 'फूल विक्रेता',
      'Other': 'अन्य',
      'Retailer': 'खुदरा व्यापारी',
      'Pan Shop': 'पान दुकान',
      'Street Vendor': 'पथ विक्रेता',
      'Wholesale': 'होलेसेल व्यापारी',
      'Wholesale Trader': 'होलेसेल व्यापारी',
      'Grocery Store': 'किराना स्टोर',
    };
    // Case-insensitive lookup
    const key = Object.keys(translations).find(
      k => k.toLowerCase() === businessType?.toLowerCase()
    );
    return key ? translations[key] : (businessType || 'अन्य');
  }
}

// Legacy class alias for backward compatibility
export class CertificateGenerator extends IDCardGenerator {
  async generateCertificate(data: CertificateData): Promise<ArrayBuffer> {
    return this.generateIDCard(data);
  }
}

// Helper function to convert image URL to base64
export async function imageUrlToBase64(url: string): Promise<string> {
  try {
    console.log('[ID Card] Fetching image from URL:', url.substring(0, 100) + '...');
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    console.log('[ID Card] Image converted to base64, size:', base64.length, 'mimeType:', mimeType);
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

// Export function to generate ID card PDF
export async function generateIDCardPDF(data: IDCardData): Promise<ArrayBuffer> {
  const generator = new IDCardGenerator();
  return generator.generateIDCard(data);
}

// Legacy export for backward compatibility
export async function generateCertificatePDF(data: CertificateData): Promise<ArrayBuffer> {
  const generator = new CertificateGenerator();
  return generator.generateCertificate(data);
}
