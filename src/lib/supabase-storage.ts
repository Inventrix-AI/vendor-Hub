import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with proper error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
function validateSupabaseConfig(): { url: string; key: string } {
  if (!supabaseUrl || !supabaseKey) {
    const missingVars = []
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    console.error('❌ Missing Supabase configuration:', missingVars.join(', '))
    console.error('📖 Please check .env.example for required environment variables')
    console.error('🔗 Get your Supabase credentials from: https://app.supabase.com/project/_/settings/api')

    throw new Error(
      `Missing required Supabase environment variables: ${missingVars.join(', ')}. ` +
      `Please add them to your .env file and restart the server.`
    )
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch (error) {
    throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL format: ${supabaseUrl}`)
  }

  return { url: supabaseUrl, key: supabaseKey }
}

// Initialize Supabase client
const config = validateSupabaseConfig()
export const supabase = createClient(config.url, config.key)

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