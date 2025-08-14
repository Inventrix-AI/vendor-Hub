import { RenewalService } from './renewalService'
import { executeQuery } from './db'

export interface NotificationTemplate {
  subject: string
  emailContent: string
  smsContent: string
}

export class NotificationService {
  // Get notification templates for different reminder types
  static getTemplate(reminderType: string, vendorName: string, daysLeft: number): NotificationTemplate {
    const templates = {
      '30_days': {
        subject: 'Renewal Reminder - 30 Days Left',
        emailContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">Subscription Renewal Reminder</h2>
            <p>Dear ${vendorName},</p>
            
            <p>This is a friendly reminder that your vendor subscription will expire in <strong>${daysLeft} days</strong>.</p>
            
            <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">Action Required</h3>
              <p style="margin-bottom: 0;">Please renew your subscription to continue using our services without interruption.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="%RENEWAL_URL%" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Renew Now
              </a>
            </div>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>VendorHub Team</p>
          </div>
        `,
        smsContent: `Hi ${vendorName}, your VendorHub subscription expires in ${daysLeft} days. Renew now to avoid interruption: %RENEWAL_URL%`
      },
      '15_days': {
        subject: 'Urgent: Renewal Required - 15 Days Left',
        emailContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">⚠️ Urgent: Subscription Expiring Soon</h2>
            <p>Dear ${vendorName},</p>
            
            <p>Your vendor subscription will expire in just <strong style="color: #dc2626;">${daysLeft} days</strong>.</p>
            
            <div style="background-color: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
              <h3 style="color: #991b1b; margin-top: 0;">Immediate Action Required</h3>
              <p style="margin-bottom: 0;">Don't lose access to your vendor dashboard and services. Renew today!</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="%RENEWAL_URL%" 
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Renew Immediately
              </a>
            </div>
            
            <p><strong>What happens if you don't renew:</strong></p>
            <ul>
              <li>Loss of access to vendor dashboard</li>
              <li>Suspension of all vendor services</li>
              <li>Inability to receive new orders</li>
            </ul>
            
            <p>Best regards,<br>VendorHub Team</p>
          </div>
        `,
        smsContent: `URGENT: ${vendorName}, your VendorHub subscription expires in ${daysLeft} days! Renew immediately: %RENEWAL_URL%`
      },
      '7_days': {
        subject: 'FINAL NOTICE: 7 Days Until Expiry',
        emailContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">🚨 FINAL NOTICE: ${daysLeft} Days Left</h2>
            <p>Dear ${vendorName},</p>
            
            <p>This is your <strong>FINAL NOTICE</strong>. Your subscription expires in <strong style="color: #dc2626;">${daysLeft} days</strong>.</p>
            
            <div style="background-color: #fecaca; padding: 15px; border: 2px solid #dc2626; margin: 20px 0; text-align: center;">
              <h3 style="color: #991b1b; margin-top: 0;">⏰ Time Running Out!</h3>
              <p style="margin-bottom: 0; font-size: 18px;"><strong>Renew now or lose access!</strong></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="%RENEWAL_URL%" 
                 style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 18px;">
                RENEW NOW - LAST CHANCE
              </a>
            </div>
            
            <p>Contact us immediately if you need assistance: support@vendorhub.com</p>
            
            <p>Best regards,<br>VendorHub Team</p>
          </div>
        `,
        smsContent: `FINAL NOTICE ${vendorName}: VendorHub expires in ${daysLeft} days! Last chance to renew: %RENEWAL_URL%`
      },
      '1_day': {
        subject: 'EXPIRES TOMORROW - Renew Now!',
        emailContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #991b1b;">🚨 EXPIRES TOMORROW! 🚨</h2>
            <p>Dear ${vendorName},</p>
            
            <p style="font-size: 18px; color: #dc2626;"><strong>Your subscription expires TOMORROW!</strong></p>
            
            <div style="background-color: #991b1b; color: white; padding: 20px; text-align: center; margin: 20px 0;">
              <h3 style="margin-top: 0; color: white;">⚠️ LAST 24 HOURS ⚠️</h3>
              <p style="margin-bottom: 0; font-size: 16px;">Renew immediately to avoid service interruption</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="%RENEWAL_URL%" 
                 style="background-color: #991b1b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 20px;">
                RENEW RIGHT NOW
              </a>
            </div>
            
            <p><strong style="color: #dc2626;">After expiry, you will immediately lose:</strong></p>
            <ul>
              <li>Access to your vendor dashboard</li>
              <li>All vendor privileges and services</li>
              <li>Ability to receive payments</li>
            </ul>
            
            <p>Emergency support: Call +1-800-VENDOR</p>
            
            <p>VendorHub Team</p>
          </div>
        `,
        smsContent: `🚨 ${vendorName}: VendorHub expires TOMORROW! Renew RIGHT NOW: %RENEWAL_URL% Call +1-800-VENDOR for help`
      },
      'expired': {
        subject: 'Account Suspended - Subscription Expired',
        emailContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #991b1b;">Account Suspended</h2>
            <p>Dear ${vendorName},</p>
            
            <p>Your vendor subscription has <strong style="color: #dc2626;">expired</strong> and your account has been suspended.</p>
            
            <div style="background-color: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
              <h3 style="color: #991b1b; margin-top: 0;">Account Status: SUSPENDED</h3>
              <p style="margin-bottom: 0;">All vendor services have been temporarily disabled.</p>
            </div>
            
            <p><strong>To restore your account:</strong></p>
            <ol>
              <li>Renew your subscription immediately</li>
              <li>Contact support if you need assistance</li>
              <li>Your services will be restored within 24 hours of payment</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="%RENEWAL_URL%" 
                 style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Restore Account - Renew Now
              </a>
            </div>
            
            <p>Support: support@vendorhub.com | +1-800-VENDOR</p>
            
            <p>VendorHub Team</p>
          </div>
        `,
        smsContent: `${vendorName}: Your VendorHub account is SUSPENDED due to expired subscription. Restore now: %RENEWAL_URL%`
      }
    }

    return templates[reminderType as keyof typeof templates] || templates['30_days']
  }

  // Send renewal reminder notifications
  static async sendRenewalReminders(): Promise<void> {
    const pendingReminders = await RenewalService.getPendingReminders()
    
    for (const reminder of pendingReminders) {
      try {
        // Get subscription and vendor details
        const subscription = await RenewalService.getSubscriptionById(reminder.subscription_id)
        if (!subscription) continue

        // Get vendor details from application
        const applicationResult = await executeQuery(`
          SELECT va.*, u.full_name, u.email, u.phone
          FROM vendor_applications va
          JOIN users u ON va.user_id = u.id
          WHERE va.id = $1
        `, [subscription.application_id])
        const application = applicationResult.rows[0]

        if (!application) continue

        // Calculate days until expiry
        const now = new Date()
        const expiresAt = new Date(subscription.expires_at!)
        const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        // Get notification template
        const template = this.getTemplate(reminder.reminder_type, application.full_name, Math.max(0, daysLeft))

        // Create renewal URL (you can customize this based on your domain)
        const renewalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/vendor/renewal?vendor_id=${reminder.vendor_id}`
        
        // Replace placeholder URLs
        const emailContent = template.emailContent.replace(/%RENEWAL_URL%/g, renewalUrl)
        const smsContent = template.smsContent.replace(/%RENEWAL_URL%/g, renewalUrl)

        // Send email notification
        if (reminder.notification_type === 'email' || reminder.notification_type === 'both') {
          await this.sendEmail({
            recipient: application.email,
            subject: template.subject,
            content: emailContent,
            vendorId: reminder.vendor_id,
            reminderType: reminder.reminder_type
          })
        }

        // Send SMS notification
        if (reminder.notification_type === 'sms' || reminder.notification_type === 'both') {
          await this.sendSMS({
            recipient: application.phone,
            content: smsContent,
            vendorId: reminder.vendor_id,
            reminderType: reminder.reminder_type
          })
        }

        // Mark reminder as sent
        await executeQuery(`
          UPDATE renewal_reminders 
          SET status = 'sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [reminder.id])

      } catch (error) {
        console.error(`Failed to send reminder ${reminder.id}:`, error)
        
        // Mark as failed
        await executeQuery(`
          UPDATE renewal_reminders 
          SET status = 'failed', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [reminder.id])
      }
    }
  }

  // Send email notification
  private static async sendEmail(params: {
    recipient: string
    subject: string
    content: string
    vendorId: string
    reminderType: string
  }): Promise<void> {
    // Store notification in database
    await executeQuery(`
      INSERT INTO notifications (
        user_id, type, recipient, template_id, subject, content, status
      ) VALUES (
        (SELECT user_id FROM vendor_applications WHERE vendor_id = $1),
        'email', $2, $3, $4, $5, 'sent'
      )
    `, [
      params.vendorId,
      params.recipient,
      `renewal_${params.reminderType}`,
      params.subject,
      params.content
    ])

    // In a real implementation, you would integrate with an email service like SendGrid, SES, etc.
    console.log(`Email sent to ${params.recipient}: ${params.subject}`)
    console.log(`Content: ${params.content}`)
  }

  // Send SMS notification
  private static async sendSMS(params: {
    recipient: string
    content: string
    vendorId: string
    reminderType: string
  }): Promise<void> {
    // Store notification in database
    await executeQuery(`
      INSERT INTO notifications (
        user_id, type, recipient, template_id, content, status
      ) VALUES (
        (SELECT user_id FROM vendor_applications WHERE vendor_id = $1),
        'sms', $2, $3, $4, 'sent'
      )
    `, [
      params.vendorId,
      params.recipient,
      `renewal_${params.reminderType}_sms`,
      params.content
    ])

    // In a real implementation, you would integrate with an SMS service like Twilio, AWS SNS, etc.
    console.log(`SMS sent to ${params.recipient}: ${params.content}`)
  }

  // Get notification history for a vendor
  static async getNotificationHistory(vendorId: string): Promise<any[]> {
    const result = await executeQuery(`
      SELECT n.*, 'renewal' as category
      FROM notifications n
      JOIN vendor_applications va ON n.user_id = va.user_id
      WHERE va.vendor_id = $1
      AND n.template_id LIKE 'renewal_%'
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [vendorId])
    return result.rows
  }
}