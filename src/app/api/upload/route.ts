import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '@/lib/db';
import { SupabaseStorageService } from '@/lib/supabase-storage';

// Document type definitions with specific requirements
const DOCUMENT_TYPES = {
  'passport_photo': {
    name: 'Passport-size Photo',
    required: true,
    maxSize: 2 * 1024 * 1024, // 2MB for photos
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    description: 'Recent passport-size photograph'
  },
  'shop_address_proof': {
    name: 'Shop Address Proof',
    required: true,
    maxSize: 5 * 1024 * 1024, // 5MB for documents
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    description: 'Shop/business address verification document'
  },
  'id_card': {
    name: 'ID Card',
    required: true,
    maxSize: 5 * 1024 * 1024, // 5MB for documents
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    description: 'Aadhaar Card, Driving License, or Voter ID'
  },
  'business_license': {
    name: 'Business License',
    required: false,
    maxSize: 5 * 1024 * 1024, // 5MB for documents
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    description: 'Optional business registration or license document'
  }
};

const MAX_DOCUMENTS = 4;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const applicationId = formData.get('applicationId') as string;
    const documentType = formData.get('documentType') as string;

    if (!file || !applicationId || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate document type
    if (!DOCUMENT_TYPES[documentType as keyof typeof DOCUMENT_TYPES]) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    const docConfig = DOCUMENT_TYPES[documentType as keyof typeof DOCUMENT_TYPES];

    // Check current document count for this application
    const existingDocuments = await executeQuery(`
      SELECT COUNT(*) as count FROM documents 
      WHERE application_id = (
        SELECT id FROM vendor_applications WHERE application_id = $1
      ) AND is_current = true
    `, [applicationId]);

    if (parseInt(existingDocuments.rows[0].count) >= MAX_DOCUMENTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_DOCUMENTS} documents allowed per application` },
        { status: 400 }
      );
    }

    // Check if this document type already exists (prevent duplicates)
    const existingDocType = await executeQuery(`
      SELECT COUNT(*) as count FROM documents 
      WHERE application_id = (
        SELECT id FROM vendor_applications WHERE application_id = $1
      ) AND document_type = $2 AND is_current = true
    `, [applicationId, documentType]);

    if (parseInt(existingDocType.rows[0].count) > 0) {
      return NextResponse.json(
        { error: `Document type '${docConfig.name}' already uploaded. Please delete the existing one first.` },
        { status: 400 }
      );
    }

    // Validate file size based on document type
    if (file.size > docConfig.maxSize) {
      const maxSizeMB = Math.round(docConfig.maxSize / (1024 * 1024));
      return NextResponse.json(
        { error: `File size exceeds ${maxSizeMB}MB limit for ${docConfig.name}` },
        { status: 400 }
      );
    }

    // Validate file type based on document type
    if (!docConfig.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type for ${docConfig.name}. Allowed types: ${docConfig.allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const documentReference = `DOC_${uuidv4().toUpperCase()}`;
    const fileName = `${documentReference}.${fileExtension}`;
    
    // Upload to Supabase Storage
    const uploadResult = await SupabaseStorageService.uploadDocument(
      applicationId,
      documentType,
      file,
      fileName
    );

    // Get application internal ID
    const applicationResult = await executeQuery(`
      SELECT id, user_id FROM vendor_applications WHERE application_id = $1
    `, [applicationId]);
    const applicationRow = applicationResult.rows[0];

    if (!applicationRow) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Store document info in database
    const documentResult = await executeQuery(`
      INSERT INTO documents (
        document_reference, application_id, document_type, file_name, file_path,
        file_size, mime_type, version, is_current, uploaded_by, storage_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, true, $8, $9)
      RETURNING id
    `, [
      documentReference,
      applicationRow.id,
      documentType,
      fileName,
      uploadResult.path, // Supabase storage path
      file.size,
      file.type,
      applicationRow.user_id,
      uploadResult.publicUrl // Store the public URL for easy access
    ]);
    const documentId = documentResult.rows[0].id;

    // Return file info
    const fileInfo = {
      id: documentId,
      documentReference: documentReference,
      originalName: file.name,
      fileName: fileName,
      filePath: uploadResult.path,
      storageUrl: uploadResult.publicUrl,
      fileSize: file.size,
      fileType: file.type,
      documentType: documentType,
      documentName: docConfig.name,
      applicationId: applicationId,
      uploadedAt: new Date().toISOString()
    };

    return NextResponse.json({
      message: `${docConfig.name} uploaded successfully`,
      file: fileInfo,
      remainingSlots: MAX_DOCUMENTS - (parseInt(existingDocuments.rows[0].count) + 1)
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const action = searchParams.get('action');

    if (action === 'document-types') {
      // Return available document types with their configurations
      return NextResponse.json({
        documentTypes: DOCUMENT_TYPES,
        maxDocuments: MAX_DOCUMENTS
      });
    }

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID required' },
        { status: 400 }
      );
    }

    // Get documents for this application from database
    const documentsResult = await executeQuery(`
      SELECT 
        d.*,
        d.document_reference as "documentReference",
        d.file_name as "fileName",
        d.file_path as "filePath",
        d.file_size as "fileSize",
        d.mime_type as "fileType",
        d.document_type as "documentType",
        d.uploaded_at as "uploadedAt",
        d.storage_url as "storageUrl"
      FROM documents d
      JOIN vendor_applications va ON d.application_id = va.id
      WHERE va.application_id = $1 AND d.is_current = true
      ORDER BY d.created_at DESC
    `, [applicationId]);
    const documents = documentsResult.rows;

    // Add document type names and configurations
    const documentsWithInfo = documents.map(doc => {
      const docConfig = DOCUMENT_TYPES[doc.documentType as keyof typeof DOCUMENT_TYPES];
      return {
        ...doc,
        documentName: docConfig?.name || doc.documentType,
        documentDescription: docConfig?.description || '',
        isRequired: docConfig?.required || false
      };
    });

    return NextResponse.json({ 
      files: documentsWithInfo,
      totalCount: documents.length,
      remainingSlots: MAX_DOCUMENTS - documents.length
    });

  } catch (error) {
    console.error('GET documents error:', error);
    return NextResponse.json(
      { error: 'Failed to get documents' },
      { status: 500 }
    );
  }
}

// Add DELETE method to remove documents
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID required' },
        { status: 400 }
      );
    }

    // Mark document as not current instead of deleting
    const result = await executeQuery(`
      UPDATE documents 
      SET is_current = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_current = true
    `, [documentId]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Document removed successfully'
    });

  } catch (error) {
    console.error('DELETE document error:', error);
    return NextResponse.json(
      { error: 'Failed to remove document' },
      { status: 500 }
    );
  }
}