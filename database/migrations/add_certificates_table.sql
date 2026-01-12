-- Migration: Add certificates table for vendor certificate tracking
-- This migration creates a table to store certificate information

CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  application_id INTEGER NOT NULL REFERENCES vendor_applications(id),
  vendor_id VARCHAR(50) NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP NOT NULL,
  issued_by INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active',  -- active, expired, revoked
  revoked_at TIMESTAMP,
  revoked_reason TEXT,
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_certificates_vendor_id ON certificates(vendor_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_application_id ON certificates(application_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
