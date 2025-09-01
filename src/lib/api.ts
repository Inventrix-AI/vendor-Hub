import axios, { AxiosError } from 'axios'
import { toast } from 'react-toastify'
import Cookies from 'js-cookie'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      Cookies.remove('access_token')
      localStorage.removeItem('user')
      window.location.href = '/auth/login'
    }
    
    // Show error toast
    const message = (error.response?.data as any)?.detail || error.message || 'An error occurred'
    toast.error(message)
    
    return Promise.reject(error)
  }
)

// Auth API calls
export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    // Use fetch instead of axios to avoid circular dependencies with interceptors
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'login',
        username: credentials.username,
        email: credentials.username, // API expects email field
        password: credentials.password
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }
    
    return data
  },
  
  register: async (data: {
    email: string
    password: string
    full_name: string
    phone?: string
  }) => {
    const response = await api.post('/api/auth', {
      action: 'register',
      ...data
    })
    return response.data
  },
}

// Vendor API calls
export const vendorApi = {
  createApplication: async (data: any) => {
    const response = await api.post('/api/vendors', data)
    return response.data
  },
  
  getApplications: async () => {
    const response = await api.get('/api/vendors')
    return response.data
  },
  
  getApplication: async (applicationId: string) => {
    const response = await api.get(`/api/vendors?id=${applicationId}`)
    return response.data
  },
  
  uploadDocument: async (applicationId: string, documentType: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('applicationId', applicationId)
    formData.append('documentType', documentType)
    
    const response = await api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
}

// Payment API calls
export const paymentApi = {
  createOrder: async (data: { applicationId: string; amount: number }) => {
    const response = await api.post('/api/payment/create-order', {
      amount: data.amount * 100, // Convert to paise
      currency: 'INR',
      applicationId: data.applicationId
    })
    return response.data
  },
  
  verifyPayment: async (data: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
    applicationId: string
  }) => {
    const response = await api.post('/api/payment/verify', data)
    return response.data
  },
  
  getPaymentHistory: async () => {
    // Mock payment history data
    return [
      {
        id: 1,
        amount: 500,
        currency: 'INR',
        status: 'success' as const,
        razorpay_order_id: 'order_123456789',
        razorpay_payment_id: 'pay_123456789',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  },
}

// Admin API calls
export const adminApi = {
  getApplications: async (params?: { status?: string; search?: string; limit?: number }) => {
    const queryParams = new URLSearchParams({
      type: 'applications'
    });
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await api.get(`/api/admin?${queryParams.toString()}`)
    return response.data
  },
  
  getApplicationDetail: async (applicationId: string) => {
    const response = await api.get(`/api/admin?type=application&id=${applicationId}`)
    return response.data
  },
  
  getDashboardStats: async () => {
    const response = await api.get('/api/admin')
    return response.data
  },
  
  reviewApplication: async (applicationId: string, data: {
    status: string
    rejection_reason?: string
    application_data?: any
  }) => {
    const response = await api.put('/api/admin', {
      id: applicationId,
      ...data
    })
    return response.data
  },
  
  getAuditLogs: async (_applicationId: string) => {
    // Mock audit logs - in production, implement proper endpoint
    return [
      {
        id: '1',
        action: 'Application Submitted',
        timestamp: new Date().toISOString(),
        user: 'System',
        details: 'Application submitted for review'
      },
      {
        id: '2',
        action: 'Documents Uploaded',
        timestamp: new Date().toISOString(),
        user: 'Vendor',
        details: 'Business documents uploaded'
      }
    ]
  },
}