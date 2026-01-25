import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

let pool: Pool | null = null;

export function getDatabase(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    console.log('Initializing database connection...', {
      hasUrl: !!databaseUrl,
      environment: process.env.NODE_ENV,
      urlHost: databaseUrl ? new URL(databaseUrl).hostname : 'N/A'
    });

    // Check if DATABASE_URL contains sslmode parameter
    const hasSslInUrl = databaseUrl.includes('sslmode=');

    pool = new Pool({
      connectionString: databaseUrl,
      // Only set SSL config if not already in URL and we're in production OR connecting to supabase
      ssl: hasSslInUrl ? undefined : (
        process.env.NODE_ENV === 'production' || databaseUrl.includes('supabase.co')
          ? { rejectUnauthorized: false }
          : false
      ),
      max: 5, // Reduce pool size for serverless
      idleTimeoutMillis: 30000, // Increased from 10000 for better serverless stability
      connectionTimeoutMillis: 30000, // Increased from 15000 for slower connections
      statement_timeout: 30000, // 30 second statement timeout
      query_timeout: 30000, // 30 second query timeout
      keepAlive: true, // Keep connections alive
      keepAliveInitialDelayMillis: 10000, // Start keepalive after 10 seconds
    });

    // Add error handler for the pool
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });

    // Initialize schema if needed (but don't await it to avoid blocking)
    initializeSchema().catch(err => {
      console.error('Schema initialization failed:', err);
    });
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
    } else {
      // Run migrations for existing databases
      await runMigrations();
    }
  } catch (error) {
    console.error('Error initializing schema:', error);
  }
}

async function runMigrations() {
  if (!pool) return;

  try {
    // Check if phone column has unique constraint
    const constraintCheck = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name = 'users_phone_unique'
    `);

    if (constraintCheck.rows.length === 0) {
      console.log('Running migration: Adding unique constraints for mobile and email...');

      // Read and execute safe migration
      const migrationPath = join(process.cwd(), 'database', 'migrations', 'add_unique_constraints_safe.sql');
      const migration = readFileSync(migrationPath, 'utf-8');

      // Execute the migration
      await pool.query(migration);

      console.log('Migration completed successfully');
    }

    // Check if pending_registrations table exists
    const pendingTableCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'pending_registrations'
    `);

    if (pendingTableCheck.rows.length === 0) {
      console.log('Running migration: Adding pending_registrations table...');

      // Read and execute pending registrations migration
      const migrationPath = join(process.cwd(), 'database', 'migrations', 'add_pending_registrations_table.sql');
      const migration = readFileSync(migrationPath, 'utf-8');

      // Execute the migration
      await pool.query(migration);

      console.log('Pending registrations table migration completed successfully');
    }

    // Check if verification columns exist
    const verificationColumnCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'vendor_applications'
      AND column_name = 'personal_verified'
    `);

    if (verificationColumnCheck.rows.length === 0) {
      console.log('Running migration: Adding verification columns...');

      // Read and execute verification columns migration
      const migrationPath = join(process.cwd(), 'database', 'migrations', 'add_verification_columns.sql');
      const migration = readFileSync(migrationPath, 'utf-8');

      // Execute the migration
      await pool.query(migration);

      console.log('Verification columns migration completed successfully');
    }

    // Check if certificates table exists
    const certificatesTableCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'certificates'
    `);

    if (certificatesTableCheck.rows.length === 0) {
      console.log('Running migration: Adding certificates table...');

      // Read and execute certificates table migration
      const migrationPath = join(process.cwd(), 'database', 'migrations', 'add_certificates_table.sql');
      const migration = readFileSync(migrationPath, 'utf-8');

      // Execute the migration
      await pool.query(migration);

      console.log('Certificates table migration completed successfully');
    }
  } catch (error) {
    console.error('Error running migrations:', error);
  }
}

// Utility function for executing queries with error handling and retry logic
export async function executeQuery(text: string, params?: any[], retries: number = 2) {
  const db = getDatabase();
  
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      console.log(`Query attempt ${attempt}:`, { query: text.substring(0, 100), params: params?.length });
      const result = await db.query(text, params);
      
      if (attempt > 1) {
        console.log(`Query succeeded on attempt ${attempt}`);
      }
      
      return result;
    } catch (error) {
      const isLastAttempt = attempt === retries + 1;
      const isConnectionError = error instanceof Error && (
        (error as any).code === 'ENOTFOUND' ||
        (error as any).code === 'ECONNREFUSED' ||
        (error as any).code === 'ETIMEDOUT' ||
        error.message.includes('connect') ||
        error.message.includes('timeout')
      );

      console.error(`Database query error (attempt ${attempt}/${retries + 1}):`, {
        error: error instanceof Error ? error.message : error,
        code: error instanceof Error ? (error as any).code : undefined,
        isConnectionError,
        willRetry: !isLastAttempt && isConnectionError
      });

      if (isLastAttempt || !isConnectionError) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
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
        application_id, user_id, vendor_id, company_name, business_name, contact_email, phone,
        business_type, business_description, registration_number, tax_id,
        address, city, state, postal_code, country, bank_name, account_number,
        ifsc_code, routing_number, status, payment_status, gender, age
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *
    `, [
      application.application_id,
      application.user_id,
      application.vendor_id,
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
      'pending',
      application.gender || null,
      application.age || null
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

  findByVendorId: async (vendorId: string) => {
    const result = await executeQuery(`
      SELECT va.*, u.email as user_email, u.full_name as user_full_name, u.phone as user_phone
      FROM vendor_applications va
      JOIN users u ON va.user_id = u.id
      WHERE va.vendor_id = $1
    `, [vendorId]);
    return result.rows[0] || null;
  },

  findById: async (id: number) => {
    const result = await executeQuery(`
      SELECT va.*, u.email as user_email, u.full_name as user_full_name, u.phone as user_phone
      FROM vendor_applications va
      JOIN users u ON va.user_id = u.id
      WHERE va.id = $1
    `, [id]);
    return result.rows[0] || null;
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

  updateById: async (id: number, updates: any) => {
    const fields = Object.keys(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = Object.values(updates);
    values.push(id);

    const result = await executeQuery(`
      UPDATE vendor_applications 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${values.length}
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
  },

  // Verification methods
  updateVerification: async (applicationId: string, section: 'personal' | 'business', verifiedBy: number, notes?: string) => {
    const verifiedColumn = section === 'personal' ? 'personal_verified' : 'business_verified';
    const verifiedByColumn = section === 'personal' ? 'personal_verified_by' : 'business_verified_by';
    const verifiedAtColumn = section === 'personal' ? 'personal_verified_at' : 'business_verified_at';

    let query = `
      UPDATE vendor_applications
      SET ${verifiedColumn} = true,
          ${verifiedByColumn} = $1,
          ${verifiedAtColumn} = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
    `;
    const params: any[] = [verifiedBy];

    if (notes) {
      query += `,
          verification_notes = COALESCE(verification_notes, '[]'::jsonb) || $2::jsonb
      `;
      params.push(JSON.stringify([{ section, notes, timestamp: new Date().toISOString(), by: verifiedBy }]));
    }

    params.push(applicationId);
    query += ` WHERE application_id = $${params.length} RETURNING *`;

    const result = await executeQuery(query, params);
    return result.rows[0];
  },

  getVerificationStatus: async (applicationId: string) => {
    const result = await executeQuery(`
      SELECT
        va.personal_verified,
        va.personal_verified_at,
        va.business_verified,
        va.business_verified_at,
        va.verification_notes,
        u1.full_name as personal_verified_by_name,
        u1.email as personal_verified_by_email,
        u2.full_name as business_verified_by_name,
        u2.email as business_verified_by_email
      FROM vendor_applications va
      LEFT JOIN users u1 ON va.personal_verified_by = u1.id
      LEFT JOIN users u2 ON va.business_verified_by = u2.id
      WHERE va.application_id = $1
    `, [applicationId]);
    return result.rows[0] || null;
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
    storage_url?: string;
  }) => {
    const result = await executeQuery(`
      INSERT INTO documents (
        document_reference, application_id, document_type, file_name,
        file_path, file_size, mime_type, uploaded_by, storage_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      document.document_reference,
      document.application_id,
      document.document_type,
      document.file_name,
      document.file_path,
      document.file_size,
      document.mime_type,
      document.uploaded_by,
      document.storage_url || null
    ]);
    return result.rows[0];
  },

  findByApplicationId: async (applicationId: number) => {
    console.log('[DocumentDB] Finding documents for application_id:', applicationId);

    const result = await executeQuery(
      'SELECT * FROM documents WHERE application_id = $1 AND is_current = true ORDER BY created_at DESC',
      [applicationId]
    );

    console.log('[DocumentDB] Query result:', {
      rowCount: result.rows.length,
      applicationId: applicationId
    });

    return result.rows;
  },

  findById: async (id: number) => {
    const result = await executeQuery(
      'SELECT * FROM documents WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  // Verification methods for documents
  updateVerificationStatus: async (documentId: number, status: string, verifiedBy: number) => {
    const result = await executeQuery(`
      UPDATE documents
      SET verification_status = $1,
          verified_by = $2,
          verified_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [status, verifiedBy, documentId]);
    return result.rows[0];
  },

  flagDocument: async (documentId: number, reason: string, flaggedBy: number) => {
    const result = await executeQuery(`
      UPDATE documents
      SET verification_status = 'flagged',
          flag_reason = $1,
          verified_by = $2,
          verified_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [reason, flaggedBy, documentId]);
    return result.rows[0];
  },

  requestReupload: async (documentId: number, reason: string, requestedBy: number) => {
    const result = await executeQuery(`
      UPDATE documents
      SET reupload_requested = true,
          reupload_reason = $1,
          verification_status = 'reupload_requested',
          verified_by = $2,
          verified_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [reason, requestedBy, documentId]);
    return result.rows[0];
  },

  verifyDocument: async (documentId: number, verifiedBy: number) => {
    const result = await executeQuery(`
      UPDATE documents
      SET verification_status = 'verified',
          verified_by = $1,
          verified_at = CURRENT_TIMESTAMP,
          flag_reason = NULL,
          reupload_requested = false,
          reupload_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [verifiedBy, documentId]);
    return result.rows[0];
  },

  getDocumentsWithVerificationStatus: async (applicationId: number) => {
    const result = await executeQuery(`
      SELECT d.*, u.full_name as verified_by_name, u.email as verified_by_email
      FROM documents d
      LEFT JOIN users u ON d.verified_by = u.id
      WHERE d.application_id = $1 AND d.is_current = true
      ORDER BY d.created_at DESC
    `, [applicationId]);
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
    payment_type?: string;
  }) => {
    const result = await executeQuery(`
      INSERT INTO payments (application_id, razorpay_order_id, amount, currency, payment_type, payment_reference)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      payment.application_id,
      payment.razorpay_order_id,
      payment.amount,
      payment.currency,
      payment.payment_type || 'initial',
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

  updateByOrderId: async (orderId: string, updates: { razorpay_payment_id?: string; status?: string; payment_reference?: string; payment_type?: string }) => {
    const fields = Object.keys(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = Object.values(updates);
    values.push(orderId);

    const result = await executeQuery(`
      UPDATE payments 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE razorpay_order_id = $${values.length}
      RETURNING *
    `, values);
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

// Vendor Subscription operations
export const VendorSubscriptionDB = {
  create: async (subscription: {
    vendor_id: string;
    application_id: number;
    subscription_status?: string;
    activated_at?: Date;
    expires_at?: Date;
  }) => {
    const result = await executeQuery(`
      INSERT INTO vendor_subscriptions (
        vendor_id, application_id, subscription_status, activated_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      subscription.vendor_id,
      subscription.application_id,
      subscription.subscription_status || 'active',
      subscription.activated_at || new Date(),
      subscription.expires_at || new Date()
    ]);
    return result.rows[0];
  },

  findByVendorId: async (vendorId: string) => {
    const result = await executeQuery(
      'SELECT * FROM vendor_subscriptions WHERE vendor_id = $1 ORDER BY created_at DESC LIMIT 1',
      [vendorId]
    );
    return result.rows[0] || null;
  },

  updateStatus: async (vendorId: string, status: string) => {
    const result = await executeQuery(`
      UPDATE vendor_subscriptions 
      SET subscription_status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE vendor_id = $2
      RETURNING *
    `, [status, vendorId]);
    return result.rows[0];
  }
};

// Pending Registration operations
export const PendingRegistrationDB = {
  create: async (pendingRegistration: {
    razorpay_order_id: string;
    application_id: string;
    vendor_id: string;
    registration_data: any;
    expires_at: Date;
  }) => {
    const result = await executeQuery(`
      INSERT INTO pending_registrations (razorpay_order_id, application_id, vendor_id, registration_data, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      pendingRegistration.razorpay_order_id,
      pendingRegistration.application_id,
      pendingRegistration.vendor_id,
      JSON.stringify(pendingRegistration.registration_data),
      pendingRegistration.expires_at
    ]);
    return result.rows[0];
  },

  findByOrderId: async (razorpayOrderId: string) => {
    const result = await executeQuery(`
      SELECT * FROM pending_registrations 
      WHERE razorpay_order_id = $1 AND expires_at > CURRENT_TIMESTAMP
    `, [razorpayOrderId]);
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        ...row,
        registration_data: typeof row.registration_data === 'string' 
          ? JSON.parse(row.registration_data) 
          : row.registration_data
      };
    }
    return null;
  },

  deleteByOrderId: async (razorpayOrderId: string) => {
    const result = await executeQuery(`
      DELETE FROM pending_registrations WHERE razorpay_order_id = $1
      RETURNING *
    `, [razorpayOrderId]);
    return result.rows[0];
  },

  cleanupExpired: async () => {
    const result = await executeQuery(`
      DELETE FROM pending_registrations WHERE expires_at <= CURRENT_TIMESTAMP
      RETURNING COUNT(*)
    `);
    return result.rows[0];
  }
};

// Certificate operations
export const CertificateDB = {
  create: async (certificate: {
    certificate_number: string;
    application_id: number;
    vendor_id: string;
    valid_until: Date;
    issued_by?: number;
    certificate_type?: string;
  }) => {
    const result = await executeQuery(`
      INSERT INTO certificates (
        certificate_number, application_id, vendor_id, valid_until, issued_by, certificate_type
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      certificate.certificate_number,
      certificate.application_id,
      certificate.vendor_id,
      certificate.valid_until,
      certificate.issued_by || null,
      certificate.certificate_type || 'mp'
    ]);
    return result.rows[0];
  },

  findById: async (id: number) => {
    const result = await executeQuery(`
      SELECT c.*, va.company_name, va.business_name, va.business_type,
             va.contact_email, va.phone, va.address, va.city, va.state,
             va.postal_code, va.country, va.registration_number,
             u.full_name as vendor_name, u.email as vendor_email
      FROM certificates c
      JOIN vendor_applications va ON c.application_id = va.id
      JOIN users u ON va.user_id = u.id
      WHERE c.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  findByApplicationId: async (applicationId: number) => {
    const result = await executeQuery(`
      SELECT * FROM certificates
      WHERE application_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [applicationId]);
    return result.rows[0] || null;
  },

  // Find all certificates for an application (supports multiple certificates)
  findAllByApplicationId: async (applicationId: number) => {
    const result = await executeQuery(`
      SELECT * FROM certificates
      WHERE application_id = $1
      ORDER BY created_at DESC
    `, [applicationId]);
    return result.rows;
  },

  // Find all certificates for a vendor
  findAllByVendorId: async (vendorId: string) => {
    const result = await executeQuery(`
      SELECT * FROM certificates
      WHERE vendor_id = $1
      ORDER BY certificate_type, created_at DESC
    `, [vendorId]);
    return result.rows;
  },

  findByCertificateNumber: async (certificateNumber: string) => {
    const result = await executeQuery(`
      SELECT c.*, va.company_name, va.business_name, va.business_type,
             va.contact_email, va.phone, va.address, va.city, va.state,
             va.postal_code, va.country, va.registration_number,
             u.full_name as vendor_name, u.email as vendor_email
      FROM certificates c
      JOIN vendor_applications va ON c.application_id = va.id
      JOIN users u ON va.user_id = u.id
      WHERE c.certificate_number = $1
    `, [certificateNumber]);
    return result.rows[0] || null;
  },

  findByVendorId: async (vendorId: string) => {
    const result = await executeQuery(`
      SELECT * FROM certificates
      WHERE vendor_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [vendorId]);
    return result.rows[0] || null;
  },

  incrementDownloadCount: async (id: number) => {
    const result = await executeQuery(`
      UPDATE certificates
      SET download_count = download_count + 1,
          last_downloaded_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);
    return result.rows[0];
  },

  updateStatus: async (id: number, status: string, revokedReason?: string) => {
    let query = `
      UPDATE certificates
      SET status = $1, updated_at = CURRENT_TIMESTAMP
    `;
    const params: any[] = [status];

    if (status === 'revoked' && revokedReason) {
      query += `, revoked_at = CURRENT_TIMESTAMP, revoked_reason = $2`;
      params.push(revokedReason);
    }

    params.push(id);
    query += ` WHERE id = $${params.length} RETURNING *`;

    const result = await executeQuery(query, params);
    return result.rows[0];
  },

  generateCertificateNumber: async () => {
    const year = new Date().getFullYear();
    const result = await executeQuery(`
      SELECT COUNT(*) as count FROM certificates
      WHERE EXTRACT(YEAR FROM created_at) = $1
    `, [year]);

    const count = parseInt(result.rows[0].count) + 1;
    const paddedCount = count.toString().padStart(6, '0');
    return `CERT-${year}-${paddedCount}`;
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