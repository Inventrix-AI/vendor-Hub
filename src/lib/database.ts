import Database from 'better-sqlite3';
import { join } from 'path';
import { readFileSync } from 'fs';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    // Initialize database
    const dbPath = join(process.cwd(), 'vendor_system.db');
    db = new Database(dbPath);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Initialize schema if needed
    initializeSchema();
  }
  
  return db;
}

function initializeSchema() {
  if (!db) return;
  
  // Check if tables exist
  const tableCheck = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='users'
  `).get();
  
  if (!tableCheck) {
    console.log('Initializing database schema...');
    
    // Read and execute schema
    const schemaPath = join(process.cwd(), 'database', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          db.exec(statement + ';');
        } catch (error) {
          console.error('Error executing SQL statement:', statement);
          console.error(error);
        }
      }
    }
    
    console.log('Database schema initialized successfully');
  }
}

// User operations
export const UserDB = {
  create: (user: {
    email: string;
    password_hash: string;
    full_name: string;
    phone?: string;
    role?: string;
  }) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, full_name, phone, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(user.email, user.password_hash, user.full_name, user.phone || null, user.role || 'vendor');
  },
  
  findByEmail: (email: string) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },
  
  findById: (id: number) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }
};

// Vendor Application operations
export const VendorApplicationDB = {
  create: (application: any) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO vendor_applications (
        application_id, user_id, company_name, business_name, contact_email, phone,
        business_type, business_description, registration_number, tax_id,
        address, city, state, postal_code, country, bank_name, account_number,
        ifsc_code, routing_number, status, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      application.application_id,
      application.user_id,
      application.company_name,
      application.business_name || application.company_name,
      application.contact_email,
      application.phone,
      application.business_type,
      application.business_description || '',
      application.registration_number || null,
      application.tax_id || null,
      application.address || null,
      application.city || null,
      application.state || null,
      application.postal_code || null,
      application.country || 'India',
      application.bank_name || null,
      application.account_number || null,
      application.ifsc_code || null,
      application.routing_number || null,
      'pending',
      'pending'
    );
  },
  
  findByApplicationId: (applicationId: string) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT va.*, u.email as user_email, u.full_name as user_full_name, u.phone as user_phone
      FROM vendor_applications va
      JOIN users u ON va.user_id = u.id
      WHERE va.application_id = ?
    `);
    return stmt.get(applicationId);
  },
  
  findByUserId: (userId: number) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM vendor_applications WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId);
  },
  
  findAll: (filters: { status?: string; search?: string; limit?: number } = {}) => {
    const db = getDatabase();
    let query = `
      SELECT va.*, u.email as user_email, u.full_name as user_full_name
      FROM vendor_applications va
      JOIN users u ON va.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (filters.status) {
      query += ' AND va.status = ?';
      params.push(filters.status);
    }
    
    if (filters.search) {
      query += ' AND (va.company_name LIKE ? OR va.contact_email LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    query += ' ORDER BY va.created_at DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  },
  
  update: (applicationId: string, updates: any) => {
    const db = getDatabase();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(applicationId);
    
    const stmt = db.prepare(`
      UPDATE vendor_applications 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP 
      WHERE application_id = ?
    `);
    return stmt.run(...values);
  },
  
  getStats: () => {
    const db = getDatabase();
    const stats = {
      total_applications: 0,
      pending_applications: 0,
      approved_applications: 0,
      rejected_applications: 0
    };
    
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM vendor_applications');
    const total = totalStmt.get() as any;
    stats.total_applications = total.count;
    
    const statusStmt = db.prepare('SELECT status, COUNT(*) as count FROM vendor_applications GROUP BY status');
    const statusCounts = statusStmt.all() as any[];
    
    statusCounts.forEach((row: any) => {
      switch (row.status) {
        case 'pending':
          stats.pending_applications = row.count;
          break;
        case 'approved':
          stats.approved_applications = row.count;
          break;
        case 'rejected':
          stats.rejected_applications = row.count;
          break;
      }
    });
    
    return stats;
  }
};

// Document operations
export const DocumentDB = {
  create: (document: {
    document_reference: string;
    application_id: number;
    document_type: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_by: number;
  }) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO documents (
        document_reference, application_id, document_type, file_name,
        file_path, file_size, mime_type, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      document.document_reference,
      document.application_id,
      document.document_type,
      document.file_name,
      document.file_path,
      document.file_size,
      document.mime_type,
      document.uploaded_by
    );
  },
  
  findByApplicationId: (applicationId: number) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM documents WHERE application_id = ? AND is_current = 1 ORDER BY created_at DESC');
    return stmt.all(applicationId);
  },
  
  findById: (documentId: number) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM documents WHERE id = ? AND is_current = 1');
    return stmt.get(documentId);
  }
};

// Payment operations
export const PaymentDB = {
  create: (payment: {
    application_id: number;
    razorpay_order_id: string;
    amount: number;
    currency: string;
    payment_reference: string;
  }) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO payments (application_id, razorpay_order_id, amount, currency, payment_reference)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(
      payment.application_id,
      payment.razorpay_order_id,
      payment.amount,
      payment.currency,
      payment.payment_reference
    );
  },
  
  updateStatus: (orderId: string, updates: { status: string; razorpay_payment_id?: string }) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE payments 
      SET status = ?, razorpay_payment_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE razorpay_order_id = ?
    `);
    return stmt.run(updates.status, updates.razorpay_payment_id || null, orderId);
  },
  
  findByApplicationId: (applicationId: number) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM payments WHERE application_id = ? ORDER BY created_at DESC');
    return stmt.all(applicationId);
  }
};

// Audit log operations
export const AuditLogDB = {
  create: (log: {
    application_id?: number;
    user_id?: number;
    action: string;
    entity_type?: string;
    entity_id?: number;
    old_values?: any;
    new_values?: any;
    ip_address?: string;
    user_agent?: string;
  }) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO audit_logs (
        application_id, user_id, action, entity_type, entity_id,
        old_values, new_values, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      log.application_id || null,
      log.user_id || null,
      log.action,
      log.entity_type || null,
      log.entity_id || null,
      log.old_values ? JSON.stringify(log.old_values) : null,
      log.new_values ? JSON.stringify(log.new_values) : null,
      log.ip_address || null,
      log.user_agent || null
    );
  },
  
  findByApplicationId: (applicationId: number) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT al.*, u.full_name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.application_id = ?
      ORDER BY al.created_at DESC
    `);
    return stmt.all(applicationId);
  }
};

// Close database connection
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}