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
    // In production (Vercel), use the public folder path
    if (process.env.VERCEL) {
      this.templatePath = path.join(process.cwd(), 'public', 'id-card-template.png');
    } else {
      this.templatePath = path.join(process.cwd(), 'public', 'id-card-template.png');
    }
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
        const photoBuffer = await this.processVendorPhoto(data.vendorPhotoBase64);
        composites.push({
          input: photoBuffer,
          // Photo box is on the left side of the card
          // Based on template: approximately x=95, y=815 (with some padding)
          left: 110,
          top: 850,
        });
      } catch (error) {
        console.error('Error processing vendor photo:', error);
        // Continue without photo
      }
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

    // Photo area dimensions based on template analysis
    // The photo box on the left is approximately 280x560 pixels
    const photoWidth = 280;
    const photoHeight = 560;

    return sharp(imageBuffer)
      .resize(photoWidth, photoHeight, {
        fit: 'cover',
        position: 'center',
      })
      .png()
      .toBuffer();
  }

  private createTextOverlaySvg(data: IDCardData): string {
    // Format dates in Hindi/Indian format
    const issueDateStr = this.formatDateHindi(data.issuedAt);
    const validUntilStr = this.formatDateHindi(data.validUntil);

    // Field values
    const name = data.vendorName || 'N/A';
    const occupation = this.translateBusinessType(data.businessType) || data.businessType || 'N/A';
    const shopName = data.businessName || 'N/A';
    const fullAddress = this.formatAddress(data);
    const idNumber = data.vendorId || data.certificateNumber || 'N/A';

    // Based on template image analysis:
    // The template has labels on the left with colons, values go after the colon
    // Looking at the generated image, we need to place text AFTER the ":" character
    //
    // Template structure (approximate pixel positions at 3508x2481):
    // - "नाम :" label ends around x=720, value starts at x=750
    // - Each row is spaced about 190-200 pixels apart
    // - First field (नाम/Name) starts around y=875

    // Corrected coordinates based on template layout:
    const valueStartX = 750;  // X position where values should start (after the colon)
    const nameY = 890;        // नाम row
    const occupationY = 1085; // व्यवसाय row
    const shopNameY = 1280;   // दुकान का नाम row
    const addressY = 1475;    // पता row
    const idNumberY = 1670;   // आई. डी. क्रमांक row
    const dateY = 1865;       // दिनांक row
    const validityX = 2100;   // वैद्यता is on the right side of date row

    // SVG with embedded text at specific coordinates
    const svg = `
      <svg width="${this.templateWidth}" height="${this.templateHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .field-value {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 56px;
              font-weight: 600;
              fill: #2d2d2d;
            }
            .field-value-small {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 44px;
              font-weight: 500;
              fill: #2d2d2d;
            }
            .date-value {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 50px;
              font-weight: 600;
              fill: #2d2d2d;
            }
          </style>
        </defs>

        <!-- नाम (Name) value -->
        <text x="${valueStartX}" y="${nameY}" class="field-value">${this.escapeXml(name)}</text>

        <!-- व्यवसाय (Occupation) value -->
        <text x="${valueStartX}" y="${occupationY}" class="field-value">${this.escapeXml(occupation)}</text>

        <!-- दुकान का नाम (Shop Name) value -->
        <text x="${valueStartX}" y="${shopNameY}" class="field-value">${this.escapeXml(shopName)}</text>

        <!-- पता (Address) value - smaller font for longer text -->
        <text x="${valueStartX}" y="${addressY}" class="field-value-small">${this.escapeXml(fullAddress)}</text>

        <!-- आई. डी. क्रमांक (ID Number) value -->
        <text x="${valueStartX}" y="${idNumberY}" class="field-value">${this.escapeXml(idNumber)}</text>

        <!-- दिनांक (Issue Date) value -->
        <text x="${valueStartX}" y="${dateY}" class="date-value">${this.escapeXml(issueDateStr)}</text>

        <!-- वैद्यता (Validity) value - positioned to the right -->
        <text x="${validityX}" y="${dateY}" class="date-value">${this.escapeXml(validUntilStr)}</text>
      </svg>
    `;

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
    // Keep it concise for the ID card
    const fullAddress = parts.join(', ') || 'N/A';
    // Truncate if too long to fit on the card
    return fullAddress.length > 60 ? fullAddress.substring(0, 57) + '...' : fullAddress;
  }

  private translateBusinessType(businessType: string): string {
    // Common business type translations to Hindi
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
    // Convert Node.js Buffer to ArrayBuffer
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
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
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
