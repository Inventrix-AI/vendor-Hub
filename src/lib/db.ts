import { Pool, PoolClient } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

let pool: Pool | null = null;

export function getDatabase(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10, // maximum number of connections in pool
      idleTimeoutMillis: 30000, // close idle connections after 30 seconds
      connectionTimeoutMillis: 10000, // return error after 10 seconds if connection could not be established
    });

    // Initialize schema if needed
    initializeSchema();
  }
  
  return pool;
}

async function initializeSchema() {
  if (!pool) return;
  
  try {
    // Check if tables exist
    const tableCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('Initializing database schema...');
      
      // Read and execute schema
      const schemaPath = join(process.cwd(), 'database', 'schema.sql');
      const schema = readFileSync(schemaPath, 'utf-8');
      
      // Execute the entire schema
      await pool.query(schema);
      
      console.log('Database schema initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing schema:', error);
  }
}

// Utility function for executing queries with error handling
export async function executeQuery(text: string, params?: any[]) {
  const db = getDatabase();
  try {
    const result = await db.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// User operations
export const UserDB = {
  create: async (user: {
    email: string;
    password_hash: string;
    full_name: string;
    phone?: string;
    role?: string;
  }) => {
    const result = await executeQuery(`
      INSERT INTO users (email, password_hash, full_name, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [user.email, user.password_hash, user.full_name, user.phone || null, user.role || 'vendor']);
    return result.rows[0];
  },
  
  findByEmail: async (email: string) => {
    const result = await executeQuery('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },
  
  findById: async (id: number) => {
    const result = await executeQuery('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }
};

// Vendor Application operations
export const VendorApplicationDB = {
  create: async (application: any) => {
    const result = await executeQuery(`
      INSERT INTO vendor_applications (
        application_id, user_id, company_name, business_name, contact_email, phone,
        business_type, business_description, registration_number, tax_id,
        address, city, state, postal_code, country, bank_name, account_number,
        ifsc_code, routing_number, status, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `, [
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
    ]);
    return result.rows[0];
  },
  
  findByApplicationId: async (applicationId: string) => {
    const result = await executeQuery(`
      SELECT va.*, u.email as user_email, u.full_name as user_full_name, u.phone as user_phone
      FROM vendor_applications va
      JOIN users u ON va.user_id = u.id
      WHERE va.application_id = $1
    `, [applicationId]);
    return result.rows[0] || null;
  },
  
  findByUserId: async (userId: number) => {
    const result = await executeQuery(
      'SELECT * FROM vendor_applications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },
  
  findAll: async (filters: { status?: string; search?: string; limit?: number } = {}) => {
    let query = `
      SELECT va.*, u.email as user_email, u.full_name as user_full_name
      FROM vendor_applications va
      JOIN users u ON va.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;
    
    if (filters.status) {
      paramCount++;
      query += ` AND va.status = $${paramCount}`;
      params.push(filters.status);
    }
    
    if (filters.search) {
      paramCount++;
      query += ` AND (va.company_name ILIKE $${paramCount} OR va.contact_email ILIKE $${paramCount + 1})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
      paramCount++;
    }
    
    query += ' ORDER BY va.created_at DESC';
    
    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }
    
    const result = await executeQuery(query, params);
    return result.rows;
  },
  
  update: async (applicationId: string, updates: any) => {
    const fields = Object.keys(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = Object.values(updates);
    values.push(applicationId);
    
    const result = await executeQuery(`
      UPDATE vendor_applications 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE application_id = $${values.length}
      RETURNING *
    `, values);
    return result.rows[0];
  },
  
  getStats: async () => {
    const totalResult = await executeQuery('SELECT COUNT(*) as count FROM vendor_applications');
    const statusResult = await executeQuery('SELECT status, COUNT(*) as count FROM vendor_applications GROUP BY status');
    
    const stats = {
      total_applications: parseInt(totalResult.rows[0].count),
      pending_applications: 0,
      approved_applications: 0,
      rejected_applications: 0
    };
    
    statusResult.rows.forEach((row: any) => {
      switch (row.status) {
        case 'pending':
          stats.pending_applications = parseInt(row.count);
          break;
        case 'approved':
          stats.approved_applications = parseInt(row.count);
          break;
        case 'rejected':
          stats.rejected_applications = parseInt(row.count);
          break;
      }
    });
    
    return stats;
  }
};

// Document operations
export const DocumentDB = {
  create: async (document: {
    document_reference: string;
    application_id: number;
    document_type: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_by: number;
  }) => {
    const result = await executeQuery(`
      INSERT INTO documents (
        document_reference, application_id, document_type, file_name,
        file_path, file_size, mime_type, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      document.document_reference,
      document.application_id,
      document.document_type,
      document.file_name,
      document.file_path,
      document.file_size,
      document.mime_type,
      document.uploaded_by
    ]);
    return result.rows[0];
  },
  
  findByApplicationId: async (applicationId: number) => {
    const result = await executeQuery(
      'SELECT * FROM documents WHERE application_id = $1 AND is_current = true ORDER BY created_at DESC',
      [applicationId]
    );
    return result.rows;
  }
};

// Payment operations
export const PaymentDB = {
  create: async (payment: {
    application_id: number;
    razorpay_order_id: string;
    amount: number;
    currency: string;
    payment_reference: string;
  }) => {
    const result = await executeQuery(`
      INSERT INTO payments (application_id, razorpay_order_id, amount, currency, payment_reference)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      payment.application_id,
      payment.razorpay_order_id,
      payment.amount,
      payment.currency,
      payment.payment_reference
    ]);
    return result.rows[0];
  },
  
  updateStatus: async (orderId: string, updates: { status: string; razorpay_payment_id?: string }) => {
    const result = await executeQuery(`
      UPDATE payments 
      SET status = $1, razorpay_payment_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE razorpay_order_id = $3
      RETURNING *
    `, [updates.status, updates.razorpay_payment_id || null, orderId]);
    return result.rows[0];
  },
  
  findByApplicationId: async (applicationId: number) => {
    const result = await executeQuery(
      'SELECT * FROM payments WHERE application_id = $1 ORDER BY created_at DESC',
      [applicationId]
    );
    return result.rows;
  }
};

// Audit log operations
export const AuditLogDB = {
  create: async (log: {
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
    const result = await executeQuery(`
      INSERT INTO audit_logs (
        application_id, user_id, action, entity_type, entity_id,
        old_values, new_values, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      log.application_id || null,
      log.user_id || null,
      log.action,
      log.entity_type || null,
      log.entity_id || null,
      log.old_values ? JSON.stringify(log.old_values) : null,
      log.new_values ? JSON.stringify(log.new_values) : null,
      log.ip_address || null,
      log.user_agent || null
    ]);
    return result.rows[0];
  },
  
  findByApplicationId: async (applicationId: number) => {
    const result = await executeQuery(`
      SELECT al.*, u.full_name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.application_id = $1
      ORDER BY al.created_at DESC
    `, [applicationId]);
    return result.rows;
  }
};

// Close database connection
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// For backwards compatibility, export the database instance
export const db = {
  prepare: () => {
    throw new Error('SQLite prepare() method not available in PostgreSQL. Use async methods instead.');
  },
  exec: () => {
    throw new Error('SQLite exec() method not available in PostgreSQL. Use executeQuery() instead.');
  }
};