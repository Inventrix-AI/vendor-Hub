import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

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

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and PDF allowed.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Create uploads directory structure
    const uploadsDir = join(process.cwd(), 'uploads', applicationId);
    await mkdir(uploadsDir, { recursive: true });
    
    // Save file
    const filePath = join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return file info
    const fileInfo = {
      id: uuidv4(),
      originalName: file.name,
      fileName: fileName,
      filePath: `/uploads/${applicationId}/${fileName}`,
      fileSize: file.size,
      fileType: file.type,
      documentType: documentType,
      applicationId: applicationId,
      uploadedAt: new Date().toISOString()
    };

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: fileInfo
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

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID required' },
        { status: 400 }
      );
    }

    // Mock response - in production, query database
    const files = [
      {
        id: '1',
        originalName: 'passport.jpg',
        fileName: 'uuid-passport.jpg',
        filePath: `/uploads/${applicationId}/uuid-passport.jpg`,
        documentType: 'id_proof',
        uploadedAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({ files });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get files' },
      { status: 500 }
    );
  }
}