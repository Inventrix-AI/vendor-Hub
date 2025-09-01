import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { DocumentDB } from '@/lib/database';
import jwt from 'jsonwebtoken';

function getUserFromToken(request: NextRequest): { id: number; email: string } | null {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('access_token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
    return { id: decoded.userId || decoded.user_id, email: decoded.email };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    
    // Get authenticated user
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get document from database
    const document = await DocumentDB.findById(parseInt(documentId));
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if user has access to this document
    // For now, allow access to document owner only
    // In production, you'd also check for admin/reviewer access
    if (document.uploaded_by !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Read file from disk
    const filePath = join(process.cwd(), 'uploads', document.file_path);
    try {
      const fileBuffer = await readFile(filePath);
      
      // Set appropriate headers
      const headers = new Headers();
      headers.set('Content-Type', document.mime_type);
      headers.set('Content-Length', document.file_size.toString());
      headers.set('Cache-Control', 'private, max-age=300'); // 5 minutes cache
      
      // For images, allow inline display; for PDFs, also inline; others as attachment
      const isImage = document.mime_type.startsWith('image/');
      const isPdf = document.mime_type === 'application/pdf';
      
      if (isImage || isPdf) {
        headers.set('Content-Disposition', `inline; filename="${document.file_name}"`);
      } else {
        headers.set('Content-Disposition', `attachment; filename="${document.file_name}"`);
      }

      return new NextResponse(fileBuffer, { headers });
    } catch (fileError) {
      console.error('Error reading file:', fileError);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Document serving error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}