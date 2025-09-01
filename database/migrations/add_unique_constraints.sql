-- Migration: Add unique constraints for mobile and email fields
-- This migration adds unique constraints to ensure no duplicate mobile numbers or emails

-- Add unique constraint to users.phone (mobile number)
-- First, remove any existing duplicate phone numbers (keep the first one)
DELETE FROM users 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM users 
    WHERE phone IS NOT NULL AND phone != '' 
    GROUP BY phone
);

-- Add unique constraint to phone column
ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE (phone);

-- Add unique constraint to vendor_applications.phone
-- First, remove any existing duplicate phone numbers in applications
DELETE FROM vendor_applications 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM vendor_applications 
    WHERE phone IS NOT NULL AND phone != '' 
    GROUP BY phone
);

-- Add unique constraint to application phone column
ALTER TABLE vendor_applications ADD CONSTRAINT vendor_applications_phone_unique UNIQUE (phone);

-- Add unique constraint to vendor_applications.contact_email
-- First, remove any existing duplicate emails in applications
DELETE FROM vendor_applications 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM vendor_applications 
    WHERE contact_email IS NOT NULL AND contact_email != '' 
    GROUP BY contact_email
);

-- Add unique constraint to application contact_email column
ALTER TABLE vendor_applications ADD CONSTRAINT vendor_applications_contact_email_unique UNIQUE (contact_email);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendor_applications_phone ON vendor_applications(phone);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_contact_email ON vendor_applications(contact_email);