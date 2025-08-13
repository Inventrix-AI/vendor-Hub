import { v4 as uuidv4 } from 'uuid';

export function generateVendorId(companyName: string, businessType: string): string {
  // Create a unique vendor ID based on company name and business type
  const sanitizedCompanyName = companyName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 4)
    .padEnd(4, 'X');
  
  const businessTypeCode = getBusinessTypeCode(businessType);
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits
  const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
  
  return `VND${sanitizedCompanyName}${businessTypeCode}${timestamp}${randomSuffix}`;
}

export function generateApplicationId(): string {
  // Generate unique application ID
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `APP${timestamp}${randomString}`;
}

function getBusinessTypeCode(businessType: string): string {
  const codes: Record<string, string> = {
    'Technology': 'TEC',
    'Manufacturing': 'MFG',
    'Healthcare': 'HLT',
    'Education': 'EDU',
    'Finance': 'FIN',
    'Retail': 'RTL',
    'Food & Beverage': 'FNB',
    'Transportation': 'TRP',
    'Construction': 'CNS',
    'Energy': 'ENR',
    'Environmental': 'ENV',
    'Consulting': 'CON',
    'Media': 'MED',
    'Agriculture': 'AGR',
    'Textiles': 'TXT',
    'Pharmaceuticals': 'PHR',
    'Automotive': 'AUT',
    'Electronics': 'ELC',
    'Software': 'SFT',
    'E-commerce': 'ECM'
  };
  
  return codes[businessType] || 'GEN'; // General if not found
}

export function validateVendorId(vendorId: string): boolean {
  // Validate vendor ID format: VNDxxxxTEC123456ABC
  const pattern = /^VND[A-Z0-9]{4}[A-Z]{3}\d{6}[A-Z0-9]{3}$/;
  return pattern.test(vendorId);
}

export function validateApplicationId(applicationId: string): boolean {
  // Validate application ID format: APP1234567890ABCDEF
  const pattern = /^APP\d{13}[A-Z0-9]{6}$/;
  return pattern.test(applicationId);
}

// Generate unique reference number for payments
export function generatePaymentReference(applicationId: string): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `PAY${applicationId}${timestamp.slice(-8)}${random}`;
}

// Generate unique document reference
export function generateDocumentReference(applicationId: string, documentType: string): string {
  const typeCode = documentType.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  return `DOC${applicationId}${typeCode}${timestamp}${random}`;
}

// Utility to generate various IDs
export const IdGenerator = {
  vendorId: generateVendorId,
  applicationId: generateApplicationId,
  paymentReference: generatePaymentReference,
  documentReference: generateDocumentReference,
  uuid: uuidv4
};