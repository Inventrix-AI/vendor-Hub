import { DocumentDB, AuditLogDB } from './database';
import { IdGenerator } from './vendorId';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface DocumentVersion {
  id: number;
  document_reference: string;
  application_id: number;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  version: number;
  is_current: boolean;
  uploaded_by: number;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export class DocumentVersionService {
  private static uploadsDir = join(process.cwd(), 'uploads');

  static async ensureUploadsDir() {
    if (!existsSync(this.uploadsDir)) {
      await mkdir(this.uploadsDir, { recursive: true });
    }
  }

  static async uploadDocument(params: {
    applicationId: string;
    documentType: string;
    file: File;
    uploadedBy: number;
  }): Promise<DocumentVersion> {
    const { applicationId, documentType, file, uploadedBy } = params;

    await this.ensureUploadsDir();

    // Check if this document type already exists for this application
    const existingDocs = await this.getDocumentHistory(applicationId, documentType);
    const newVersion = existingDocs.length + 1;

    // Generate unique document reference
    const documentReference = IdGenerator.documentReference(applicationId, documentType);
    
    // Create versioned filename
    const fileExtension = file.name.split('.').pop();
    const versionedFileName = `${documentType}_v${newVersion}_${Date.now()}.${fileExtension}`;
    const filePath = join(this.uploadsDir, applicationId, versionedFileName);
    
    // Ensure application directory exists
    const appDir = join(this.uploadsDir, applicationId);
    if (!existsSync(appDir)) {
      await mkdir(appDir, { recursive: true });
    }

    // Save file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Mark previous versions as not current
    if (existingDocs.length > 0) {
      await this.markPreviousVersionsAsOld(applicationId, documentType);
    }

    // Save to database
    const result = DocumentDB.create({
      document_reference: documentReference,
      application_id: parseInt(applicationId),
      document_type: documentType,
      file_name: versionedFileName,
      file_path: filePath,
      file_size: buffer.length,
      mime_type: file.type,
      uploaded_by: uploadedBy
    });

    // Log the action
    AuditLogDB.create({
      application_id: parseInt(applicationId),
      user_id: uploadedBy,
      action: `Document Uploaded - ${documentType} v${newVersion}`,
      entity_type: 'document',
      entity_id: result.lastInsertRowid as number,
      new_values: {
        document_reference: documentReference,
        document_type: documentType,
        version: newVersion,
        file_name: versionedFileName
      }
    });

    return {
      id: result.lastInsertRowid as number,
      document_reference: documentReference,
      application_id: parseInt(applicationId),
      document_type: documentType,
      file_name: versionedFileName,
      file_path: filePath,
      file_size: buffer.length,
      mime_type: file.type,
      version: newVersion,
      is_current: true,
      uploaded_by: uploadedBy,
      uploaded_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private static async markPreviousVersionsAsOld(applicationId: string, documentType: string) {
    // This would update the database to mark previous versions as not current
    // For now, we'll implement this as a mock function
    console.log(`Marking previous versions of ${documentType} for application ${applicationId} as old`);
  }

  static async getDocumentHistory(applicationId: string, documentType?: string): Promise<DocumentVersion[]> {
    const applicationIdNum = parseInt(applicationId);
    
    // Get all documents for this application
    const allDocs = DocumentDB.findByApplicationId(applicationIdNum) as DocumentVersion[];
    
    if (documentType) {
      return allDocs.filter(doc => doc.document_type === documentType)
                   .sort((a, b) => b.version - a.version);
    }
    
    return allDocs.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  }

  static async getCurrentDocuments(applicationId: string): Promise<DocumentVersion[]> {
    const applicationIdNum = parseInt(applicationId);
    const allDocs = DocumentDB.findByApplicationId(applicationIdNum) as DocumentVersion[];
    
    return allDocs.filter(doc => doc.is_current);
  }

  static async getDocumentByReference(documentReference: string): Promise<DocumentVersion | null> {
    // This would query the database for a specific document by reference
    // For now, returning null as we'd need to implement this query in DocumentDB
    return null;
  }

  static async deleteDocumentVersion(documentReference: string, deletedBy: number): Promise<void> {
    // This would soft-delete a document version
    // Log the deletion action
    AuditLogDB.create({
      user_id: deletedBy,
      action: `Document Deleted - ${documentReference}`,
      entity_type: 'document',
      old_values: { document_reference: documentReference }
    });
  }

  static async restoreDocumentVersion(documentReference: string, restoredBy: number): Promise<void> {
    // This would restore a deleted document version
    AuditLogDB.create({
      user_id: restoredBy,
      action: `Document Restored - ${documentReference}`,
      entity_type: 'document',
      new_values: { document_reference: documentReference }
    });
  }

  static getDocumentVersionSummary(documents: DocumentVersion[]): {
    totalVersions: number;
    documentTypes: string[];
    lastUpdated: string;
    totalSize: number;
  } {
    const documentTypes = Array.from(new Set(documents.map(doc => doc.document_type)));
    const totalSize = documents.reduce((sum, doc) => sum + doc.file_size, 0);
    const lastUpdated = documents.length > 0 ? 
      documents.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0].uploaded_at :
      '';

    return {
      totalVersions: documents.length,
      documentTypes,
      lastUpdated,
      totalSize
    };
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  static isPDFFile(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }

  static getFileIcon(mimeType: string): string {
    if (this.isImageFile(mimeType)) return '🖼️';
    if (this.isPDFFile(mimeType)) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📎';
  }
}