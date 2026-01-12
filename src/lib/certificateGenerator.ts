import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

interface CertificateData {
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

export class CertificateGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private contentWidth: number;

  constructor() {
    // A4 dimensions: 210mm x 297mm
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.margin = 15;
    this.contentWidth = this.pageWidth - (this.margin * 2);
  }

  async generateCertificate(data: CertificateData): Promise<ArrayBuffer> {
    // Draw decorative border
    this.drawBorder();

    // Draw header
    this.drawHeader();

    // Draw title
    this.drawTitle();

    // Draw vendor photo and details
    await this.drawVendorSection(data);

    // Draw certificate body
    this.drawCertificateBody(data);

    // Draw validity section
    this.drawValiditySection(data);

    // Draw QR code and footer
    await this.drawFooter(data);

    // Return as ArrayBuffer
    return this.doc.output('arraybuffer');
  }

  private drawBorder(): void {
    // Outer decorative border
    this.doc.setDrawColor(0, 51, 102); // Dark blue
    this.doc.setLineWidth(2);
    this.doc.rect(8, 8, this.pageWidth - 16, this.pageHeight - 16);

    // Inner border
    this.doc.setLineWidth(0.5);
    this.doc.rect(12, 12, this.pageWidth - 24, this.pageHeight - 24);

    // Corner decorations (simple lines)
    this.doc.setLineWidth(1);
    // Top-left
    this.doc.line(8, 20, 20, 8);
    // Top-right
    this.doc.line(this.pageWidth - 8, 20, this.pageWidth - 20, 8);
    // Bottom-left
    this.doc.line(8, this.pageHeight - 20, 20, this.pageHeight - 8);
    // Bottom-right
    this.doc.line(this.pageWidth - 8, this.pageHeight - 20, this.pageWidth - 20, this.pageHeight - 8);
  }

  private drawHeader(): void {
    const centerX = this.pageWidth / 2;

    // Organization name
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('PATHARI VISTHAPIT EVAM SAHAYATA MANCH PARIVAR', centerX, 30, { align: 'center' });

    // Subtitle
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(12);
    this.doc.setTextColor(51, 51, 51);
    this.doc.text('Street Vendors Association', centerX, 38, { align: 'center' });

    // Decorative line
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin + 20, 45, this.pageWidth - this.margin - 20, 45);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin + 30, 47, this.pageWidth - this.margin - 30, 47);
  }

  private drawTitle(): void {
    const centerX = this.pageWidth / 2;

    // Certificate title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(24);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('CERTIFICATE OF REGISTRATION', centerX, 60, { align: 'center' });

    // Decorative underline
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(0.5);
    this.doc.line(centerX - 60, 64, centerX + 60, 64);
  }

  private async drawVendorSection(data: CertificateData): Promise<void> {
    const photoX = this.margin + 10;
    const photoY = 75;
    const photoWidth = 35;
    const photoHeight = 45;

    // Photo placeholder/border
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(0.5);
    this.doc.rect(photoX, photoY, photoWidth, photoHeight);

    // Add vendor photo if available
    if (data.vendorPhotoBase64) {
      try {
        this.doc.addImage(data.vendorPhotoBase64, 'JPEG', photoX + 1, photoY + 1, photoWidth - 2, photoHeight - 2);
      } catch (error) {
        console.error('Error adding vendor photo:', error);
        // Draw placeholder text
        this.doc.setFontSize(8);
        this.doc.setTextColor(128, 128, 128);
        this.doc.text('Photo', photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center' });
      }
    } else {
      // Draw placeholder text
      this.doc.setFontSize(8);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text('Photo', photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center' });
    }

    // Certificate and Vendor IDs
    const infoX = photoX + photoWidth + 15;
    let infoY = 80;

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('Certificate No:', infoX, infoY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(data.certificateNumber, infoX + 30, infoY);

    infoY += 8;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('Vendor ID:', infoX, infoY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(data.vendorId, infoX + 22, infoY);

    // Certification text
    infoY += 15;
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(11);
    this.doc.setTextColor(51, 51, 51);
    this.doc.text('This is to certify that', infoX, infoY);
  }

  private drawCertificateBody(data: CertificateData): void {
    let yPos = 130;
    const leftMargin = this.margin + 15;
    const labelWidth = 45;

    // Helper function to draw a field
    const drawField = (label: string, value: string) => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(11);
      this.doc.setTextColor(0, 51, 102);
      this.doc.text(label + ':', leftMargin, yPos);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(value || 'N/A', leftMargin + labelWidth, yPos);
      yPos += 10;
    };

    // Vendor details
    drawField('Name', data.vendorName.toUpperCase());
    drawField('Business Name', data.businessName);
    drawField('Business Type', data.businessType);

    yPos += 5;

    // Address section
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('Address:', leftMargin, yPos);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    yPos += 7;
    this.doc.text(data.address || 'N/A', leftMargin + 5, yPos);
    yPos += 6;
    this.doc.text(`${data.city}, ${data.state} - ${data.postalCode}`, leftMargin + 5, yPos);
    yPos += 6;
    this.doc.text(data.country, leftMargin + 5, yPos);

    yPos += 12;

    // Registration number if available
    if (data.registrationNumber) {
      drawField('Reg. Number', data.registrationNumber);
    }

    drawField('Contact', data.phone);

    // Certification statement
    yPos += 10;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.setTextColor(51, 51, 51);

    const statement = 'is a registered member of the Street Vendors Association and is authorized to conduct business as per the terms and conditions of registration.';
    const splitStatement = this.doc.splitTextToSize(statement, this.contentWidth - 30);
    this.doc.text(splitStatement, leftMargin, yPos);
  }

  private drawValiditySection(data: CertificateData): void {
    const yPos = 235;
    const leftMargin = this.margin + 15;

    // Horizontal line
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin + 10, yPos - 5, this.pageWidth - this.margin - 10, yPos - 5);

    // Issue and validity dates
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 51, 102);

    const issueDate = this.formatDate(data.issuedAt);
    const validUntil = this.formatDate(data.validUntil);

    this.doc.text('Issue Date:', leftMargin, yPos);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(issueDate, leftMargin + 25, yPos);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('Valid Until:', leftMargin + 80, yPos);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(validUntil, leftMargin + 105, yPos);
  }

  private async drawFooter(data: CertificateData): Promise<void> {
    const yPos = 250;
    const qrSize = 30;

    // Generate QR code
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.pvesmp.org'}/verify/${data.certificateNumber}`;

    try {
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#003366',
          light: '#FFFFFF'
        }
      });

      // Add QR code
      this.doc.addImage(qrDataUrl, 'PNG', this.margin + 15, yPos, qrSize, qrSize);
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Draw QR placeholder
      this.doc.setDrawColor(0, 51, 102);
      this.doc.rect(this.margin + 15, yPos, qrSize, qrSize);
      this.doc.setFontSize(6);
      this.doc.text('QR Code', this.margin + 15 + qrSize / 2, yPos + qrSize / 2, { align: 'center' });
    }

    // Seal placeholder (right side)
    const sealX = this.pageWidth - this.margin - 45;
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(1);
    this.doc.circle(sealX + 15, yPos + 15, 15);
    this.doc.setFontSize(8);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text('OFFICIAL', sealX + 15, yPos + 13, { align: 'center' });
    this.doc.text('SEAL', sealX + 15, yPos + 18, { align: 'center' });

    // Signature line (center)
    const signatureX = this.pageWidth / 2;
    this.doc.setLineWidth(0.5);
    this.doc.line(signatureX - 30, yPos + 25, signatureX + 30, yPos + 25);
    this.doc.setFontSize(9);
    this.doc.setTextColor(51, 51, 51);
    this.doc.text('Authorized Signatory', signatureX, yPos + 30, { align: 'center' });

    // Verification URL at bottom
    this.doc.setFontSize(8);
    this.doc.setTextColor(0, 51, 102);
    this.doc.text(`Verify at: ${verificationUrl}`, this.pageWidth / 2, this.pageHeight - 15, { align: 'center' });
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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

// Export a function to generate certificate
export async function generateCertificatePDF(data: CertificateData): Promise<ArrayBuffer> {
  const generator = new CertificateGenerator();
  return generator.generateCertificate(data);
}
