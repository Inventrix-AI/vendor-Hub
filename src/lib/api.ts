import axios, { AxiosError } from 'axios'
import { toast } from 'react-toastify'
import Cookies from 'js-cookie'

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000'

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
    const formData = new FormData()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)
    
    const response = await api.post('/api/auth/token', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
  
  register: async (data: {
    email: string
    password: string
    full_name: string
    phone?: string
  }) => {
    const response = await api.post('/api/auth/register', data)
    return response.data
  },
}

// Vendor API calls
export const vendorApi = {
  createApplication: async (data: any) => {
    const response = await api.post('/api/vendors/applications', data)
    return response.data
  },
  
  getApplications: async () => {
    const response = await api.get('/api/vendors/applications')
    return response.data
  },
  
  getApplication: async (applicationId: string) => {
    const response = await api.get(`/api/vendors/applications/${applicationId}`)
    return response.data
  },
  
  uploadDocument: async (applicationId: string, documentType: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', documentType)
    
    const response = await api.post(
      `/api/vendors/applications/${applicationId}/documents`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return response.data
  },
}

// Payment API calls
export const paymentApi = {
  createOrder: async (data: { application_id: string; amount: number }) => {
    const response = await api.post('/api/payments/create-order', data)
    return response.data
  },
  
  verifyPayment: async (data: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }) => {
    const response = await api.post('/api/payments/verify-payment', data)
    return response.data
  },
  
  getPaymentHistory: async () => {
    const response = await api.get('/api/payments/history')
    return response.data
  },
}

// Admin API calls
export const adminApi = {
  getApplications: async (params?: {
    status?: string
    search?: string
    skip?: number
    limit?: number
  }) => {
    const response = await api.get('/api/admin/applications', { params })
    return response.data
  },
  
  getApplicationDetail: async (applicationId: string) => {
    const response = await api.get(`/api/admin/applications/${applicationId}`)
    return response.data
  },
  
  reviewApplication: async (applicationId: string, data: {
    status: string
    rejection_reason?: string
  }) => {
    const response = await api.put(`/api/admin/applications/${applicationId}/review`, data)
    return response.data
  },
  
  getDashboardStats: async () => {
    const response = await api.get('/api/admin/dashboard/stats')
    return response.data
  },
  
  getAuditLogs: async (applicationId: string) => {
    const response = await api.get(`/api/admin/audit-logs/${applicationId}`)
    return response.data
  },
}