-- Vendor Onboarding System Database Schema

-- Users table for authentication
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'vendor', -- 'vendor', 'admin', 'super_admin'
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vendor applications table
CREATE TABLE vendor_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    reviewed_at DATETIME,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Documents table
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_reference VARCHAR(100) UNIQUE NOT NULL,
    application_id INTEGER NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT 1,
    uploaded_by INTEGER NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES vendor_applications(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Payments table
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    razorpay_order_id VARCHAR(100) NOT NULL,
    razorpay_payment_id VARCHAR(100),
    amount INTEGER NOT NULL, -- Amount in paise
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed', 'refunded'
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    failure_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES vendor_applications(id)
);

-- Notifications table
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER,
    user_id INTEGER,
    type VARCHAR(20) NOT NULL, -- 'email', 'sms', 'in_app'
    recipient VARCHAR(255) NOT NULL,
    template_id VARCHAR(100),
    subject VARCHAR(500),
    content TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered'
    sent_at DATETIME,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES vendor_applications(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- 'application', 'document', 'payment', 'user'
    entity_id INTEGER,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES vendor_applications(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Admin settings table
CREATE TABLE admin_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_vendor_applications_status ON vendor_applications(status);
CREATE INDEX idx_vendor_applications_user_id ON vendor_applications(user_id);
CREATE INDEX idx_vendor_applications_application_id ON vendor_applications(application_id);
CREATE INDEX idx_documents_application_id ON documents(application_id);
CREATE INDEX idx_payments_application_id ON payments(application_id);
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
('max_file_size', '5242880', 'Maximum file upload size in bytes (5MB)'),
('allowed_file_types', 'pdf,jpg,jpeg,png', 'Comma-separated list of allowed file extensions'),
('notification_email', 'noreply@vendorsystem.com', 'System notification email address'),
('approval_workflow', 'manual', 'Approval workflow type: manual or automatic');