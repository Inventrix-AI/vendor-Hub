-- Safe Migration: Add unique constraints for mobile and email fields
-- This migration safely handles duplicate data without violating foreign key constraints

-- Step 1: Handle duplicate users by updating their phone numbers instead of deleting them
-- Add a suffix to make duplicate phone numbers unique
UPDATE users 
SET phone = phone || '_duplicate_' || id
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM users u2
    WHERE u2.phone = users.phone
    AND u2.phone IS NOT NULL 
    AND u2.phone != ''
);

-- Step 2: Handle NULL and empty phone values
UPDATE users SET phone = NULL WHERE phone = '';

-- Step 3: Add unique constraint to users.phone (excluding NULL values)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_unique'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE (phone);
    END IF;
END $$;

-- Step 4: Handle duplicate phone numbers in vendor_applications
-- Update duplicates by adding suffix
UPDATE vendor_applications 
SET phone = phone || '_duplicate_' || id
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM vendor_applications va2
    WHERE va2.phone = vendor_applications.phone
    AND va2.phone IS NOT NULL 
    AND va2.phone != ''
);

-- Handle NULL and empty phone values in applications
UPDATE vendor_applications SET phone = NULL WHERE phone = '';

-- Step 5: Add unique constraint to vendor_applications.phone
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vendor_applications_phone_unique'
    ) THEN
        ALTER TABLE vendor_applications ADD CONSTRAINT vendor_applications_phone_unique UNIQUE (phone);
    END IF;
END $$;

-- Step 6: Handle duplicate contact_email in vendor_applications
UPDATE vendor_applications 
SET contact_email = contact_email || '_duplicate_' || id
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM vendor_applications va2
    WHERE va2.contact_email = vendor_applications.contact_email
    AND va2.contact_email IS NOT NULL 
    AND va2.contact_email != ''
);

-- Handle NULL and empty contact_email values
UPDATE vendor_applications SET contact_email = NULL WHERE contact_email = '';

-- Step 7: Add unique constraint to vendor_applications.contact_email
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vendor_applications_contact_email_unique'
    ) THEN
        ALTER TABLE vendor_applications ADD CONSTRAINT vendor_applications_contact_email_unique UNIQUE (contact_email);
    END IF;
END $$;

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendor_applications_phone ON vendor_applications(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendor_applications_contact_email ON vendor_applications(contact_email) WHERE contact_email IS NOT NULL;