export interface User {
  id: number
  email: string
  full_name: string
  role: 'vendor' | 'admin' | 'super_admin' | 'reviewer'
  is_active: boolean
  phone?: string
}

export interface VendorApplication {
  id: number
  application_id: string
  business_name: string
  business_type: string
  registration_number?: string
  tax_id?: string
  address: string
  city: string
  state: string
  postal_code: string
  country: string
  bank_name?: string
  account_number?: string
  routing_number?: string
  status: ApplicationStatus
  submitted_at: string
  reviewed_at?: string
  approved_at?: string
  vendor_id?: string
  documents?: Document[]
}

export type ApplicationStatus = 
  | 'pending'
  | 'payment_pending'
  | 'under_review'
  | 'approved'
  | 'rejected'

export interface Document {
  id: number
  document_type: string
  filename: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_at: string
}

export interface Payment {
  id: number
  razorpay_order_id: string
  razorpay_payment_id?: string
  amount: number
  currency: string
  status: PaymentStatus
  created_at: string
  updated_at: string
}

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded'

export interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  phone?: string
}

export interface VendorApplicationCreate {
  business_name: string
  business_type: string
  registration_number?: string
  tax_id?: string
  address: string
  city: string
  state: string
  postal_code: string
  country: string
  bank_name?: string
  account_number?: string
  routing_number?: string
}

export interface PaymentOrder {
  razorpay_order_id: string
  amount: number
  currency: string
  key: string
}

export interface PaymentVerification {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export interface AuditLog {
  id: number
  action: string
  details?: string
  user_email: string
  timestamp: string
}

export interface DashboardStats {
  total_applications: number
  pending_applications: number
  approved_applications: number
  rejected_applications: number
}