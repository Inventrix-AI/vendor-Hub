-- Migration: Add verification columns to vendor_applications and documents tables
-- This migration adds columns needed for the step-by-step document verification flow

-- Add verification columns to vendor_applications table
ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS personal_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS personal_verified_by INTEGER REFERENCES users(id);
ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS personal_verified_at TIMESTAMP;
ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS business_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS business_verified_by INTEGER REFERENCES users(id);
ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS business_verified_at TIMESTAMP;
ALTER TABLE vendor_applications ADD COLUMN IF NOT EXISTS verification_notes JSONB DEFAULT '[]';

-- Add verification columns to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reupload_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reupload_reason TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_url TEXT;

-- Create indexes for verification queries
CREATE INDEX IF NOT EXISTS idx_vendor_applications_personal_verified ON vendor_applications(personal_verified);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_business_verified ON vendor_applications(business_verified);
CREATE INDEX IF NOT EXISTS idx_documents_verification_status ON documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_documents_reupload_requested ON documents(reupload_requested);
