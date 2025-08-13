'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { User } from '@/types'
import { authApi } from '@/lib/api'
import { toast } from 'react-toastify'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: { username: string; password: string }) => Promise<void>
  register: (data: {
    email: string
    password: string
    full_name: string
    phone?: string
  }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = () => {
      const token = Cookies.get('access_token')
      const userData = localStorage.getItem('user')
      
      if (token && userData) {
        try {
          setUser(JSON.parse(userData))
        } catch (error) {
          console.error('Failed to parse user data:', error)
          logout()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials: { username: string; password: string }) => {
    try {
      console.log('AuthContext login called with:', { username: credentials.username })
      const response = await authApi.login(credentials)
      console.log('AuthAPI login response:', response)
      
      // Store token
      Cookies.set('access_token', response.access_token, { expires: 1 }) // 1 day
      console.log('Token stored in cookie')
      
      // Use user data from API response
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        full_name: response.user.full_name,
        role: response.user.role,
        is_active: response.user.is_active,
      }
      
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      console.log('User data stored and state updated:', userData)
      
      toast.success('Login successful!')
      
      // Let the login page handle redirection via useEffect
    } catch (error) {
      console.error('Auth context login error:', error)
      toast.error('Invalid credentials')
      throw error
    }
  }

  const register = async (data: {
    email: string
    password: string
    full_name: string
    phone?: string
  }) => {
    try {
      const response = await authApi.register(data)
      
      // If registration returns user and token, use them directly
      if (response.user && response.access_token) {
        // Store token
        Cookies.set('access_token', response.access_token, { expires: 1 })
        
        // Use user data from API response
        const userData: User = {
          id: response.user.id,
          email: response.user.email,
          full_name: response.user.full_name,
          role: response.user.role,
          is_active: response.user.is_active,
        }
        
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        
        // Let the registration page handle redirection if needed
      }
      
      toast.success('Registration successful!')
    } catch (error) {
      if ((error as any)?.response?.status === 409) {
        toast.error('User already exists')
      } else {
        toast.error('Registration failed')
      }
      throw error
    }
  }

  const logout = () => {
    Cookies.remove('access_token')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/auth/login'
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}