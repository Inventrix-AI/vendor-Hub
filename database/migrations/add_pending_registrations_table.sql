-- Add pending registrations table for temporary storage before payment
CREATE TABLE IF NOT EXISTS pending_registrations (
    id SERIAL PRIMARY KEY,
    razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
    application_id VARCHAR(50) NOT NULL,
    vendor_id VARCHAR(50) NOT NULL,
    registration_data JSONB NOT NULL, -- Store all form data and file info
    expires_at TIMESTAMP NOT NULL, -- Auto-cleanup after 30 minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for efficient cleanup of expired records
CREATE INDEX IF NOT EXISTS idx_pending_registrations_expires_at ON pending_registrations(expires_at);

-- Create index for efficient lookup by order ID
CREATE INDEX IF NOT EXISTS idx_pending_registrations_order_id ON pending_registrations(razorpay_order_id);