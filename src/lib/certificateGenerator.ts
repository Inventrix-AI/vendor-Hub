import { PDFDocument } from 'pdf-lib';
import { readFileSync } from 'fs';
import { join } from 'path';
import { renderTextOverlay, type TextOverlayData } from './canvasTextRenderer';

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

// Photo position on the template
const PHOTO_POSITION = { x: 87, y: 91, width: 154, height: 190 };

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

    // Step 1: Load template PDF
    const templatePath = getTemplatePath(certificateType);
    const templateFilePath = join(process.cwd(), 'public', templatePath);
    console.log('[PDF Generator] Loading template PDF from:', templateFilePath);
    const templateBytes = new Uint8Array(readFileSync(templateFilePath));
    console.log('[PDF Generator] Template loaded, size:', templateBytes.length);

    const pdfDoc = await PDFDocument.load(templateBytes);

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

    // Step 2: Embed vendor photo (unchanged — pdf-lib handles images fine)
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

        console.log('[PDF Generator] Image type detection - JPEG:', isJpeg, 'PNG:', isPng);

        if (isPng) {
          image = await pdfDoc.embedPng(photoBytes);
        } else if (isJpeg) {
          image = await pdfDoc.embedJpg(photoBytes);
        } else {
          image = await pdfDoc.embedJpg(photoBytes);
        }

        // Get original image dimensions
        const imgDims = image.scale(1);

        // Calculate scale to fit in the photo box while maintaining aspect ratio
        const scale = Math.min(
          PHOTO_POSITION.width / imgDims.width,
          PHOTO_POSITION.height / imgDims.height
        );

        const scaledWidth = imgDims.width * scale;
        const scaledHeight = imgDims.height * scale;

        // Center the image in the photo box
        const xOffset = PHOTO_POSITION.x + (PHOTO_POSITION.width - scaledWidth) / 2;
        const yOffset = PHOTO_POSITION.y + (PHOTO_POSITION.height - scaledHeight) / 2;

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

    // Step 3: Render text overlay using @napi-rs/canvas (Skia + HarfBuzz)
    // This properly shapes Devanagari conjuncts that pdf-lib's fontkit cannot handle
    const textData: TextOverlayData = {
      name: data.vendorName || 'N/A',
      occupation: this.formatBusinessTypeEnglish(data.businessType) || data.businessType || 'N/A',
      outletName: data.businessName || 'N/A',
      fullAddress: this.formatAddress(data),
      idNumber: data.vendorId || data.certificateNumber || 'N/A',
      date: this.formatDate(data.issuedAt),
      validity: this.formatDate(data.validUntil),
    };

    try {
      console.log('[PDF Generator] Rendering text overlay via canvas...');
      const textOverlayPng = renderTextOverlay(textData);
      console.log('[PDF Generator] Text overlay PNG size:', textOverlayPng.length);

      const overlayImage = await pdfDoc.embedPng(textOverlayPng);
      page.drawImage(overlayImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });

      console.log('[PDF Generator] Text overlay applied successfully');
    } catch (canvasError) {
      console.error('[PDF Generator] Canvas text rendering failed, falling back to pdf-lib drawText:', canvasError);
      // Fallback: use pdf-lib drawText (broken Hindi conjuncts but at least generates)
      await this.drawTextFallback(pdfDoc, page, data);
    }

    // Step 4: Save and return
    console.log('[PDF Generator] Saving PDF...');
    const pdfBytes = await pdfDoc.save();
    console.log('[PDF Generator] PDF generated successfully, size:', pdfBytes.length);

    return pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
  }

  /**
   * Fallback text rendering using pdf-lib's built-in Helvetica font.
   * Hindi conjuncts will be broken, but the certificate will at least generate.
   */
  private async drawTextFallback(pdfDoc: PDFDocument, page: ReturnType<PDFDocument['getPages']>[0], data: IDCardData): Promise<void> {
    const { rgb } = await import('pdf-lib');
    const { StandardFonts } = await import('pdf-lib');
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const color = rgb(0.1, 0.1, 0.1);
    const fontSize = 14;
    const smallFontSize = 11;

    const fields = [
      { text: data.vendorName || 'N/A', x: 426, y: 284, size: fontSize },
      { text: this.formatBusinessTypeEnglish(data.businessType) || data.businessType || 'N/A', x: 426, y: 240, size: fontSize },
      { text: data.businessName || 'N/A', x: 426, y: 200, size: fontSize },
      { text: this.formatAddress(data), x: 426, y: 164, size: smallFontSize },
      { text: data.vendorId || data.certificateNumber || 'N/A', x: 426, y: 111, size: fontSize },
      { text: this.formatDate(data.issuedAt), x: 426, y: 68, size: fontSize },
      { text: this.formatDate(data.validUntil), x: 674, y: 68, size: fontSize },
    ];

    for (const field of fields) {
      try {
        page.drawText(field.text, { x: field.x, y: field.y, font, size: field.size, color });
      } catch {
        // Skip text that can't be drawn (e.g., Hindi characters with Helvetica)
        const ascii = field.text.replace(/[^\x20-\x7E]/g, '').trim() || 'N/A';
        try {
          page.drawText(ascii, { x: field.x, y: field.y, font, size: field.size, color });
        } catch { /* skip */ }
      }
    }
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

  private formatBusinessTypeEnglish(businessType: string): string {
    const englishFormats: Record<string, string> = {
      'retailer': 'Retailer',
      'grocery': 'Grocery Store',
      'pan_shop': 'Pan Shop',
      'street_vendor': 'Street Vendor',
      'wholesale': 'Wholesale Trader',
      'other': 'Other',
    };

    const key = Object.keys(englishFormats).find(
      k => k.toLowerCase() === businessType?.toLowerCase()
    );

    if (key) {
      return englishFormats[key];
    }

    return businessType
      ?.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ') || 'Other';
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
