-- Migration: Add storage_url column to documents table for Supabase Storage integration
-- Run this script against your database to add support for Supabase Storage URLs

ALTER TABLE documents 
ADD COLUMN storage_url VARCHAR(1000) DEFAULT NULL;

-- Add index for better performance when querying by storage URL
CREATE INDEX IF NOT EXISTS idx_documents_storage_url ON documents(storage_url) WHERE storage_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN documents.storage_url IS 'Public URL from Supabase Storage for direct access to the document file';