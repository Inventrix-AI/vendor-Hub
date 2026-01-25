-- Migration: Update existing vendors with gender data
-- This is a one-time migration to add gender to existing vendor records

-- For the specific vendor from Bhopal that should get 2 certificates
-- Update vendor "Anupam Pan Bhandar" from Bhopal with gender=male
UPDATE vendor_applications
SET gender = 'male'
WHERE application_id = 'APP17685487954474NPXFZ'
AND city = 'Bhopal';

-- If you need to update other vendors, you can add more UPDATE statements here
-- For example:
-- UPDATE vendor_applications SET gender = 'male' WHERE vendor_id = 'VNDXXX';
-- UPDATE vendor_applications SET gender = 'female' WHERE vendor_id = 'VNDYYY';

-- After running this migration, you'll need to regenerate certificates for these vendors
-- by deleting old certificates and generating new ones through the admin panel
