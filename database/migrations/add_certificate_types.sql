-- Migration: Add certificate types for multi-certificate support
-- This migration adds support for multiple certificate types (MP, Mahila Ekta, City-specific)
-- ALSO adds missing fields: gender and age

-- Add certificate_type column to certificates table
ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS certificate_type VARCHAR(50) DEFAULT 'mp';

-- Add gender column to vendor_applications if not exists
ALTER TABLE vendor_applications
ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

-- Add age column to vendor_applications if not exists
ALTER TABLE vendor_applications
ADD COLUMN IF NOT EXISTS age INTEGER;

-- Set all existing vendors as 'male' (default for existing records)
UPDATE vendor_applications
SET gender = 'male'
WHERE gender IS NULL;

-- Update certificate_number to be non-unique since vendors can have multiple certificates
-- We'll drop the unique constraint and make the combination of vendor_id + certificate_type unique instead
ALTER TABLE certificates DROP CONSTRAINT IF EXISTS certificates_certificate_number_key;

-- Add unique constraint on vendor_id + certificate_type to ensure one certificate of each type per vendor
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_vendor_type
ON certificates(vendor_id, certificate_type);

-- Add index for certificate_type for efficient querying
CREATE INDEX IF NOT EXISTS idx_certificates_type ON certificates(certificate_type);

-- Add comment to document certificate types
COMMENT ON COLUMN certificates.certificate_type IS 'Types: mp (Madhya Pradesh - common for all), mahila_ekta (for female vendors), bhopal, jabalpur, gwalior, indore, mandsour, rewa, ujjain (city-specific certificates)';

-- Add comment for gender field
COMMENT ON COLUMN vendor_applications.gender IS 'Vendor gender: male, female, other - used for certificate type determination';
