import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

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
}

// Legacy interface for backward compatibility
interface CertificateData extends IDCardData {}

export class IDCardGenerator {
  private templatePath: string;
  private templateWidth = 3508;
  private templateHeight = 2481;

  constructor() {
    this.templatePath = path.join(process.cwd(), 'public', 'id-card-template.png');
  }

  async generateIDCard(data: IDCardData): Promise<Buffer> {
    // Verify template exists
    if (!fs.existsSync(this.templatePath)) {
      throw new Error(`Template not found at: ${this.templatePath}`);
    }

    // Load the template
    let compositeImage = sharp(this.templatePath);

    const composites: sharp.OverlayOptions[] = [];

    // Add vendor photo if available
    if (data.vendorPhotoBase64) {
      try {
        console.log('[ID Card] Processing vendor photo...');
        const photoBuffer = await this.processVendorPhoto(data.vendorPhotoBase64);
        composites.push({
          input: photoBuffer,
          // Photo box position based on template (left side white box)
          // At display scale 1.75x, the box starts around x=54, y=466
          // Original coordinates: 54*1.75=95, 466*1.75=815
          left: 97,
          top: 820,
        });
        console.log('[ID Card] Photo added to composite');
      } catch (error) {
        console.error('Error processing vendor photo:', error);
      }
    } else {
      console.log('[ID Card] No vendor photo provided');
    }

    // Create text overlay SVG
    const textOverlaySvg = this.createTextOverlaySvg(data);
    composites.push({
      input: Buffer.from(textOverlaySvg),
      left: 0,
      top: 0,
    });

    // Composite all layers
    if (composites.length > 0) {
      compositeImage = compositeImage.composite(composites);
    }

    // Return as PNG buffer
    return compositeImage.png().toBuffer();
  }

  private async processVendorPhoto(base64Data: string): Promise<Buffer> {
    // Extract base64 content (remove data URI prefix if present)
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Content, 'base64');

    // Photo area dimensions based on template
    // The white photo box on left is approximately 300x590 pixels at original scale
    const photoWidth = 300;
    const photoHeight = 590;

    return sharp(imageBuffer)
      .resize(photoWidth, photoHeight, {
        fit: 'cover',
        position: 'center',
      })
      .png()
      .toBuffer();
  }

  private createTextOverlaySvg(data: IDCardData): string {
    // Format dates
    const issueDateStr = this.formatDateHindi(data.issuedAt);
    const validUntilStr = this.formatDateHindi(data.validUntil);

    // Field values
    const name = data.vendorName || 'N/A';
    const occupation = this.translateBusinessType(data.businessType) || data.businessType || 'N/A';
    const shopName = data.businessName || 'N/A';
    const fullAddress = this.formatAddress(data);
    const idNumber = data.vendorId || data.certificateNumber || 'N/A';

    // Looking at the template image provided by user:
    // The image is 3508x2481 pixels (displayed at 2000x1414, scale factor 1.754)
    //
    // Template structure - each row has a Hindi label followed by ":" then value
    // The labels are on the LEFT (around x=455 in display = 798 original)
    // Values should START after the colon
    //
    // Based on displayed image analysis (multiply by 1.75 for original coords):
    // - "नाम" label at approximately y=310 display = 543 original, value after colon
    // - "व्यवसाय" at y=370 display = 648 original
    // - "दुकान का नाम" at y=430 display = 753 original
    // - "पता" at y=490 display = 858 original
    // - "आई. डी. क्रमांक" at y=550 display = 963 original
    // - "दिनांक" at y=610 display = 1068 original
    // - "वैद्यता" on same row as दिनांक, to the right
    //
    // The colon ":" appears around x=750 display = 1313 original
    // So values should start at x=780 display = 1365 original

    // Corrected coordinates for 3508x2481 template:
    const valueStartX = 1380;  // X position where values start (after the colon)
    const nameY = 895;         // नाम row (Name)
    const occupationY = 1095;  // व्यवसाय row (Occupation)
    const shopNameY = 1290;    // दुकान का नाम row (Shop/Outlet Name)
    const addressY = 1490;     // पता row (Address)
    const idNumberY = 1690;    // आई. डी. क्रमांक row (ID Number)
    const dateY = 1885;        // दिनांक row (Date)
    const validityX = 2500;    // वैद्यता (Validity) - right side of date row

    // SVG with embedded text
    const svg = `<svg width="${this.templateWidth}" height="${this.templateHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .field-value {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 52px;
        font-weight: 600;
        fill: #1a1a1a;
      }
      .field-value-small {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 42px;
        font-weight: 500;
        fill: #1a1a1a;
      }
      .date-value {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 48px;
        font-weight: 600;
        fill: #1a1a1a;
      }
    </style>
  </defs>

  <!-- नाम (Name) value -->
  <text x="${valueStartX}" y="${nameY}" class="field-value">${this.escapeXml(name)}</text>

  <!-- व्यवसाय (Occupation) value -->
  <text x="${valueStartX}" y="${occupationY}" class="field-value">${this.escapeXml(occupation)}</text>

  <!-- दुकान का नाम (Shop Name) value -->
  <text x="${valueStartX}" y="${shopNameY}" class="field-value">${this.escapeXml(shopName)}</text>

  <!-- पता (Address) value -->
  <text x="${valueStartX}" y="${addressY}" class="field-value-small">${this.escapeXml(fullAddress)}</text>

  <!-- आई. डी. क्रमांक (ID Number) value -->
  <text x="${valueStartX}" y="${idNumberY}" class="field-value">${this.escapeXml(idNumber)}</text>

  <!-- दिनांक (Issue Date) value -->
  <text x="${valueStartX}" y="${dateY}" class="date-value">${this.escapeXml(issueDateStr)}</text>

  <!-- वैद्यता (Validity) value -->
  <text x="${validityX}" y="${dateY}" class="date-value">${this.escapeXml(validUntilStr)}</text>
</svg>`;

    return svg;
  }

  private formatDateHindi(date: Date): string {
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
    const fullAddress = parts.join(', ') || 'N/A';
    // Truncate if too long
    return fullAddress.length > 55 ? fullAddress.substring(0, 52) + '...' : fullAddress;
  }

  private translateBusinessType(businessType: string): string {
    const translations: Record<string, string> = {
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
      'street_vendor': 'स्ट्रीट वेंडर',
      'Other': 'अन्य',
    };
    return translations[businessType] || businessType;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// Legacy class alias for backward compatibility
export class CertificateGenerator extends IDCardGenerator {
  async generateCertificate(data: CertificateData): Promise<ArrayBuffer> {
    const buffer = await this.generateIDCard(data);
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; i++) {
      view[i] = buffer[i];
    }
    return arrayBuffer;
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
    console.log('[ID Card] Image converted to base64, size:', base64.length);
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

// Export function to generate ID card (main export)
export async function generateIDCardPNG(data: IDCardData): Promise<Buffer> {
  const generator = new IDCardGenerator();
  return generator.generateIDCard(data);
}

// Legacy export for backward compatibility
export async function generateCertificatePDF(data: CertificateData): Promise<ArrayBuffer> {
  const generator = new CertificateGenerator();
  return generator.generateCertificate(data);
}
