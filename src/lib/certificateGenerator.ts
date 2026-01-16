import { jsPDF } from 'jspdf';

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
  private cardWidth = 85.6; // Standard ID card width in mm
  private cardHeight = 54; // Standard ID card height in mm

  async generateIDCard(data: IDCardData): Promise<ArrayBuffer> {
    // Create landscape PDF with ID card dimensions
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [this.cardWidth, this.cardHeight]
    });

    // Colors
    const primaryColor: [number, number, number] = [180, 90, 40]; // Brown/maroon color
    const headerBg: [number, number, number] = [139, 69, 19]; // Saddle brown
    const textColor: [number, number, number] = [30, 30, 30];
    const labelColor: [number, number, number] = [100, 100, 100];

    // Header background
    doc.setFillColor(...headerBg);
    doc.rect(0, 0, this.cardWidth, 14, 'F');

    // Organization name (Hindi)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('पथ विक्रेता एकता संघ', this.cardWidth / 2, 5, { align: 'center' });

    doc.setFontSize(7);
    doc.text('मध्यप्रदेश', this.cardWidth / 2, 9, { align: 'center' });

    doc.setFontSize(5);
    doc.text('रजि. नं. 01/01/03/38684/22', this.cardWidth / 2, 12.5, { align: 'center' });

    // Photo area (left side)
    const photoX = 3;
    const photoY = 17;
    const photoWidth = 20;
    const photoHeight = 25;

    // Photo border
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.rect(photoX, photoY, photoWidth, photoHeight);

    // Add vendor photo if available
    if (data.vendorPhotoBase64) {
      try {
        // Remove data URI prefix if present
        const base64Data = data.vendorPhotoBase64.replace(/^data:image\/\w+;base64,/, '');
        const imgFormat = data.vendorPhotoBase64.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(base64Data, imgFormat, photoX + 0.5, photoY + 0.5, photoWidth - 1, photoHeight - 1);
      } catch (error) {
        console.error('Error adding photo to PDF:', error);
        // Add placeholder text if photo fails
        doc.setFontSize(6);
        doc.setTextColor(...labelColor);
        doc.text('Photo', photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center' });
      }
    } else {
      // Placeholder for photo
      doc.setFillColor(240, 240, 240);
      doc.rect(photoX + 0.5, photoY + 0.5, photoWidth - 1, photoHeight - 1, 'F');
      doc.setFontSize(6);
      doc.setTextColor(...labelColor);
      doc.text('Photo', photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center' });
    }

    // Details area (right side)
    const detailsX = 26;
    const detailsStartY = 17;
    const lineHeight = 5;
    let currentY = detailsStartY;

    doc.setTextColor(...textColor);

    // Helper function to add field
    const addField = (label: string, value: string, fontSize: number = 7) => {
      doc.setFontSize(5);
      doc.setTextColor(...labelColor);
      doc.text(label, detailsX, currentY);

      doc.setFontSize(fontSize);
      doc.setTextColor(...textColor);
      const maxWidth = this.cardWidth - detailsX - 3;
      const lines = doc.splitTextToSize(value || 'N/A', maxWidth);
      doc.text(lines[0], detailsX, currentY + 3);
      currentY += lineHeight;
    };

    // Add fields
    addField('नाम (Name)', data.vendorName);
    addField('व्यवसाय (Occupation)', this.translateBusinessType(data.businessType) || data.businessType);
    addField('दुकान का नाम (Shop Name)', data.businessName);

    // Address (smaller font due to length)
    const fullAddress = this.formatAddress(data);
    addField('पता (Address)', fullAddress, 6);

    // ID Number
    addField('आई.डी. क्रमांक (ID No.)', data.vendorId || data.certificateNumber);

    // Dates row
    const dateY = 45;
    doc.setFontSize(5);
    doc.setTextColor(...labelColor);
    doc.text('दिनांक (Issue Date)', detailsX, dateY);
    doc.text('वैद्यता (Valid Until)', detailsX + 30, dateY);

    doc.setFontSize(6);
    doc.setTextColor(...textColor);
    doc.text(this.formatDate(data.issuedAt), detailsX, dateY + 3);
    doc.text(this.formatDate(data.validUntil), detailsX + 30, dateY + 3);

    // Footer with contact
    doc.setFillColor(...headerBg);
    doc.rect(0, this.cardHeight - 4, this.cardWidth, 4, 'F');

    doc.setFontSize(4);
    doc.setTextColor(255, 255, 255);
    doc.text('Email: pmpathvikretasangh@gmail.com', this.cardWidth / 2, this.cardHeight - 1.5, { align: 'center' });

    return doc.output('arraybuffer');
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
    const fullAddress = parts.join(', ') || 'N/A';
    // Truncate if too long
    return fullAddress.length > 50 ? fullAddress.substring(0, 47) + '...' : fullAddress;
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
    console.log('[ID Card] Image converted to base64, size:', base64.length);
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
