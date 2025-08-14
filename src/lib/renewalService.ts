import { executeQuery } from './db'

export interface VendorSubscription {
  id: number
  vendor_id: string
  application_id: number
  subscription_status: 'active' | 'expiring_soon' | 'expired' | 'cancelled'
  current_payment_id?: number
  activated_at?: Date
  expires_at?: Date
  auto_renewal: boolean
  renewal_reminder_sent: boolean
  last_reminder_sent_at?: Date
  created_at: Date
  updated_at: Date
}

export interface RenewalReminder {
  id: number
  vendor_id: string
  subscription_id: number
  reminder_type: '30_days' | '15_days' | '7_days' | '1_day' | 'expired'
  notification_type: 'email' | 'sms' | 'both'
  sent_at?: Date
  status: 'pending' | 'sent' | 'failed'
  next_reminder_at?: Date
  created_at: Date
  updated_at: Date
}

export interface RenewalStats {
  total_subscriptions: number
  active_subscriptions: number
  expiring_soon: number
  expired_subscriptions: number
  pending_renewals: number
}

export class RenewalService {
  // Create a new subscription after successful payment
  static async createSubscription(
    vendorId: string,
    applicationId: number,
    paymentId: number
  ): Promise<VendorSubscription> {
    const now = new Date()
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1) // 1 year from now

    const result = await executeQuery(`
      INSERT INTO vendor_subscriptions (
        vendor_id, application_id, subscription_status, current_payment_id,
        activated_at, expires_at, auto_renewal, renewal_reminder_sent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      vendorId,
      applicationId,
      'active',
      paymentId,
      now.toISOString(),
      expiresAt.toISOString(),
      false, // auto_renewal disabled by default
      false  // renewal_reminder_sent false
    ])

    const subscription = result.rows[0]

    // Schedule renewal reminders
    await this.scheduleRenewalReminders(vendorId, subscription.id, expiresAt)

    return subscription
  }

  // Get subscription by vendor ID
  static async getSubscriptionByVendorId(vendorId: string): Promise<VendorSubscription | null> {
    const result = await executeQuery(
      'SELECT * FROM vendor_subscriptions WHERE vendor_id = $1',
      [vendorId]
    )
    return result.rows[0] || null
  }

  // Get subscription by ID
  static async getSubscriptionById(id: number): Promise<VendorSubscription | null> {
    const result = await executeQuery(
      'SELECT * FROM vendor_subscriptions WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  }

  // Schedule renewal reminders at different intervals
  static async scheduleRenewalReminders(
    vendorId: string,
    subscriptionId: number,
    expiresAt: Date
  ): Promise<void> {
    // Delete existing reminders for this vendor
    await executeQuery(`
      DELETE FROM renewal_reminders WHERE vendor_id = $1
    `, [vendorId])

    const reminderTypes = ['30_days', '15_days', '7_days', '1_day'] as const
    
    for (const reminderType of reminderTypes) {
      const days = parseInt(reminderType.split('_')[0])
      const reminderDate = new Date(expiresAt)
      reminderDate.setDate(reminderDate.getDate() - days)

      await executeQuery(`
        INSERT INTO renewal_reminders (
          vendor_id, subscription_id, reminder_type, notification_type, next_reminder_at
        ) VALUES ($1, $2, $3, $4, $5)
      `, [vendorId, subscriptionId, reminderType, 'both', reminderDate.toISOString()])
    }
  }

  // Update subscription status based on expiry
  static async updateSubscriptionStatuses(): Promise<void> {
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(now.getDate() + 30)

    // Mark expired subscriptions
    await executeQuery(`
      UPDATE vendor_subscriptions 
      SET subscription_status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE expires_at < $1 AND subscription_status != 'expired'
    `, [now.toISOString()])

    // Mark expiring soon (within 30 days)
    await executeQuery(`
      UPDATE vendor_subscriptions 
      SET subscription_status = 'expiring_soon', updated_at = CURRENT_TIMESTAMP
      WHERE expires_at <= $1 AND expires_at > $2 AND subscription_status = 'active'
    `, [thirtyDaysFromNow.toISOString(), now.toISOString()])
  }

  // Get subscription status with days until expiry
  static async getSubscriptionStatus(vendorId: string): Promise<{
    status: string
    daysUntilExpiry: number
    expiresAt: string | null
    subscription: VendorSubscription | null
  }> {
    const subscription = await this.getSubscriptionByVendorId(vendorId)
    
    if (!subscription || !subscription.expires_at) {
      return {
        status: 'no_subscription',
        daysUntilExpiry: 0,
        expiresAt: null,
        subscription: null
      }
    }

    const now = new Date()
    const expiresAt = new Date(subscription.expires_at)
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    let status = subscription.subscription_status
    if (daysUntilExpiry <= 0) {
      status = 'expired'
    } else if (daysUntilExpiry <= 30) {
      status = 'expiring_soon'
    } else {
      status = 'active'
    }

    return {
      status,
      daysUntilExpiry: Math.max(0, daysUntilExpiry),
      expiresAt: subscription.expires_at.toString(),
      subscription
    }
  }

  // Process renewal payment and extend subscription
  static async processRenewalPayment(vendorId: string, paymentId: number): Promise<VendorSubscription> {
    const subscription = await this.getSubscriptionByVendorId(vendorId)
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    // Extend subscription by 1 year
    const newExpiresAt = new Date(subscription.expires_at!)
    newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1)

    const result = await executeQuery(`
      UPDATE vendor_subscriptions 
      SET subscription_status = 'active', 
          expires_at = $1,
          current_payment_id = $2,
          renewal_reminder_sent = false,
          updated_at = CURRENT_TIMESTAMP
      WHERE vendor_id = $3
      RETURNING *
    `, [newExpiresAt.toISOString(), paymentId, vendorId])

    // Schedule new renewal reminders
    await this.scheduleRenewalReminders(vendorId, subscription.id, newExpiresAt)

    return result.rows[0]
  }

  // Get pending reminders that need to be sent
  static async getPendingReminders(): Promise<RenewalReminder[]> {
    const now = new Date()
    const result = await executeQuery(`
      SELECT * FROM renewal_reminders 
      WHERE status = 'pending' 
      AND (next_reminder_at IS NULL OR next_reminder_at <= $1)
      ORDER BY next_reminder_at ASC
    `, [now.toISOString()])

    return result.rows
  }

  // Get renewal statistics
  static async getRenewalStats(): Promise<RenewalStats> {
    const totalResult = await executeQuery('SELECT COUNT(*) as count FROM vendor_subscriptions')
    const activeResult = await executeQuery("SELECT COUNT(*) as count FROM vendor_subscriptions WHERE subscription_status = 'active'")
    const expiringSoonResult = await executeQuery("SELECT COUNT(*) as count FROM vendor_subscriptions WHERE subscription_status = 'expiring_soon'")
    const expiredResult = await executeQuery("SELECT COUNT(*) as count FROM vendor_subscriptions WHERE subscription_status = 'expired'")
    const pendingRemindersResult = await executeQuery("SELECT COUNT(*) as count FROM renewal_reminders WHERE status = 'pending'")

    return {
      total_subscriptions: parseInt(totalResult.rows[0].count),
      active_subscriptions: parseInt(activeResult.rows[0].count),
      expiring_soon: parseInt(expiringSoonResult.rows[0].count),
      expired_subscriptions: parseInt(expiredResult.rows[0].count),
      pending_renewals: parseInt(pendingRemindersResult.rows[0].count)
    }
  }

  // Cancel subscription
  static async cancelSubscription(vendorId: string): Promise<void> {
    await executeQuery(`
      UPDATE vendor_subscriptions 
      SET subscription_status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE vendor_id = $1
    `, [vendorId])

    // Cancel pending reminders
    await executeQuery(`
      UPDATE renewal_reminders 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE vendor_id = $1 AND status = 'pending'
    `, [vendorId])
  }
}