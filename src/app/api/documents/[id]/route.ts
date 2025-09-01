import { NextRequest, NextResponse } from 'next/server';
import { DocumentDB } from '@/lib/database';
import { SupabaseStorageService } from '@/lib/supabase-storage';
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

    // Check if we have a storage_url (new Supabase Storage) or need to use file_path (legacy)
    if (document.storage_url) {
      // For Supabase Storage, we can either redirect to the public URL or create a signed URL for security
      // Since we're doing access control, let's create a signed URL
      try {
        const signedUrl = await SupabaseStorageService.getSignedUrl(document.file_path, 3600); // 1 hour expiry
        
        // Redirect to the signed URL
        return NextResponse.redirect(signedUrl);
      } catch (storageError) {
        console.error('Error getting signed URL:', storageError);
        return NextResponse.json({ error: 'File access error' }, { status: 500 });
      }
    } else {
      // Legacy: Try to read from local file system (for backward compatibility)
      const filePath = join(process.cwd(), 'uploads', document.file_path);
      try {
        const { readFile } = await import('fs/promises');
        const { join } = await import('path');
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
        console.error('Error reading local file:', fileError);
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    }
  } catch (error) {
    console.error('Document serving error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}