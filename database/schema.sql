-- Vendor Onboarding System Database Schema (PostgreSQL)

-- Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'vendor', -- 'vendor', 'admin', 'super_admin'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor applications table
CREATE TABLE vendor_applications (
    id SERIAL PRIMARY KEY,
    application_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    vendor_id VARCHAR(50) UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    contact_email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    business_description TEXT,
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    bank_name VARCHAR(255),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    routing_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'under_review'
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    payment_reference VARCHAR(100),
    rejection_reason TEXT,
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Documents table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    document_reference VARCHAR(100) UNIQUE NOT NULL,
    application_id INTEGER NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT true,
    uploaded_by INTEGER NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES vendor_applications(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL,
    vendor_id VARCHAR(50),
    razorpay_order_id VARCHAR(100) NOT NULL,
    razorpay_payment_id VARCHAR(100),
    amount INTEGER NOT NULL, -- Amount in paise
    currency VARCHAR(10) DEFAULT 'INR',
    payment_type VARCHAR(20) DEFAULT 'initial', -- 'initial', 'renewal'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed', 'refunded'
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT false,
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES vendor_applications(id)
);

-- Vendor subscriptions table for renewal tracking
CREATE TABLE vendor_subscriptions (
    id SERIAL PRIMARY KEY,
    vendor_id VARCHAR(50) UNIQUE NOT NULL,
    application_id INTEGER NOT NULL,
    subscription_status VARCHAR(20) DEFAULT 'active', -- 'active', 'expiring_soon', 'expired', 'cancelled'
    current_payment_id INTEGER,
    activated_at TIMESTAMP,
    expires_at TIMESTAMP,
    auto_renewal BOOLEAN DEFAULT false,
    renewal_reminder_sent BOOLEAN DEFAULT false,
    last_reminder_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES vendor_applications(id),
    FOREIGN KEY (current_payment_id) REFERENCES payments(id)
);

-- Renewal reminders table
CREATE TABLE renewal_reminders (
    id SERIAL PRIMARY KEY,
    vendor_id VARCHAR(50) NOT NULL,
    subscription_id INTEGER NOT NULL,
    reminder_type VARCHAR(20) NOT NULL, -- '30_days', '15_days', '7_days', '1_day', 'expired'
    notification_type VARCHAR(20) NOT NULL, -- 'email', 'sms', 'both'
    sent_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    next_reminder_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES vendor_subscriptions(id)
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    application_id INTEGER,
    user_id INTEGER,
    type VARCHAR(20) NOT NULL, -- 'email', 'sms', 'in_app'
    recipient VARCHAR(255) NOT NULL,
    template_id VARCHAR(100),
    subject VARCHAR(500),
    content TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered'
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES vendor_applications(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    application_id INTEGER,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- 'application', 'document', 'payment', 'user'
    entity_id INTEGER,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES vendor_applications(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Admin settings table
CREATE TABLE admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_vendor_applications_status ON vendor_applications(status);
CREATE INDEX idx_vendor_applications_user_id ON vendor_applications(user_id);
CREATE INDEX idx_vendor_applications_application_id ON vendor_applications(application_id);
CREATE INDEX idx_documents_application_id ON documents(application_id);
CREATE INDEX idx_payments_application_id ON payments(application_id);
CREATE INDEX idx_payments_vendor_id ON payments(vendor_id);
CREATE INDEX idx_vendor_subscriptions_vendor_id ON vendor_subscriptions(vendor_id);
CREATE INDEX idx_vendor_subscriptions_expires_at ON vendor_subscriptions(expires_at);
CREATE INDEX idx_vendor_subscriptions_status ON vendor_subscriptions(subscription_status);
CREATE INDEX idx_renewal_reminders_vendor_id ON renewal_reminders(vendor_id);
CREATE INDEX idx_renewal_reminders_next_reminder_at ON renewal_reminders(next_reminder_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_audit_logs_application_id ON audit_logs(application_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_users_email ON users(email);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, role, is_active) 
VALUES ('admin@vendorhub.com', '$2b$12$gjyHZe9lEeEVnqS.E5gvruyYlRBB3oXSpYm5uDOtXB3qF.amu2cVC', 'System Administrator', 'super_admin', 1);

-- Insert test vendor user (password: test123)
INSERT INTO users (email, password_hash, full_name, role, is_active) 
VALUES ('test@vendor.com', '$2b$12$7zND/poUeC8mGF1JmXkFAuT0nqaxpKfhpPTjurv2W7nHkSEqJ1NYa', 'Test Vendor', 'vendor', 1);

-- Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('application_fee', '500', 'Application processing fee in INR'),
('yearly_renewal_fee', '500', 'Yearly renewal fee in INR'),
('max_file_size', '5242880', 'Maximum file upload size in bytes (5MB)'),
('allowed_file_types', 'jpg,jpeg,png,pdf', 'Comma-separated list of allowed file extensions'),
('max_documents', '4', 'Maximum number of documents allowed per application'),
('notification_email', 'noreply@vendorhub.com', 'System notification email address'),
('approval_workflow', 'manual', 'Approval workflow type: manual or automatic'),
('renewal_reminder_days', '30,15,7,1', 'Days before expiry to send renewal reminders'),
('subscription_duration_months', '12', 'Subscription duration in months'),
('reminder_start_month', '11', 'Month to start sending renewal reminders (11th month)');