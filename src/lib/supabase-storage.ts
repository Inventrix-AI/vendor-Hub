import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Initialize Supabase client with proper error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables for public client
function validateSupabaseConfig(): { url: string; anonKey: string } {
  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = []
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    console.error('Missing Supabase configuration:', missingVars.join(', '))
    console.error('Please check .env.example for required environment variables')
    console.error('Get your Supabase credentials from: https://app.supabase.com/project/_/settings/api')

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

  return { url: supabaseUrl, anonKey: supabaseAnonKey }
}

// Initialize public Supabase client (for client-side operations)
const config = validateSupabaseConfig()
export const supabase = createClient(config.url, config.anonKey)

// Initialize admin Supabase client (for server-side operations - bypasses RLS)
// This client should ONLY be used in server-side API routes, never exposed to client
let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    if (!supabaseServiceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set. Server-side uploads will fail.')
      console.error('Get your service role key from: https://app.supabase.com/project/_/settings/api')
      throw new Error(
        'Missing SUPABASE_SERVICE_ROLE_KEY. This is required for server-side file uploads. ' +
        'Add it to your .env file (never expose this key client-side).'
      )
    }

    supabaseAdmin = createClient(config.url, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabaseAdmin
}

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

  static async uploadDocumentBuffer(
    applicationId: string,
    documentType: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<{ path: string; publicUrl: string }> {
    const filePath = `${applicationId}/${documentType}/${fileName}`

    // Use admin client for server-side uploads (bypasses RLS)
    const adminClient = getSupabaseAdmin()

    console.log(`[SupabaseStorage] Uploading to ${filePath} (${fileBuffer.length} bytes, ${mimeType})`)

    const { data, error } = await adminClient.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: mimeType
      })

    if (error) {
      console.error('[SupabaseStorage] Upload error:', error)
      throw new Error(`Upload failed: ${error.message}`)
    }

    console.log(`[SupabaseStorage] Upload successful: ${data.path}`)

    // Get public URL using admin client
    const { data: publicUrlData } = adminClient.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(filePath)

    return {
      path: data.path,
      publicUrl: publicUrlData.publicUrl
    }
  }

  static async deleteDocument(filePath: string): Promise<void> {
    // Use admin client for server-side operations (bypasses RLS)
    const adminClient = getSupabaseAdmin()

    const { error } = await adminClient.storage
      .from(DOCUMENTS_BUCKET)
      .remove([filePath])

    if (error) {
      console.error('[SupabaseStorage] Delete error:', error)
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