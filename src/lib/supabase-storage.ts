import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Storage bucket name for documents
export const DOCUMENTS_BUCKET = 'vendor-documents'

export class SupabaseStorageService {
  static async uploadDocument(
    applicationId: string,
    documentType: string,
    file: File,
    fileName: string
  ): Promise<{ path: string; publicUrl: string }> {
    const filePath = `${applicationId}/${documentType}/${fileName}`
    
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(filePath)

    return {
      path: data.path,
      publicUrl: publicUrlData.publicUrl
    }
  }

  static async deleteDocument(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([filePath])

    if (error) {
      console.error('Supabase delete error:', error)
      throw new Error(`Delete failed: ${error.message}`)
    }
  }

  static async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      console.error('Supabase signed URL error:', error)
      throw new Error(`Signed URL generation failed: ${error.message}`)
    }

    return data.signedUrl
  }

  static getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(filePath)
    
    return data.publicUrl
  }
}