'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Layout } from '@/components/Layout'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'react-toastify'
import Cookies from 'js-cookie'
import {
  User,
  Mail,
  Phone,
  Building2,
  Save,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  MapPin
} from 'lucide-react'

const profileSchema = yup.object({
  full_name: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().optional(),
})

const passwordSchema = yup.object({
  current_password: yup.string().required('Current password is required'),
  new_password: yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
  confirm_password: yup.string()
    .oneOf([yup.ref('new_password')], 'Passwords must match')
    .required('Please confirm your password'),
})

type ProfileFormData = yup.InferType<typeof profileSchema>
type PasswordFormData = yup.InferType<typeof passwordSchema>

export default function ProfilePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'account'>('profile')
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [loading, setLoading] = useState(false)

  const profileForm = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    }
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
  })

  const handleProfileUpdate = async (data: ProfileFormData) => {
    try {
      setLoading(true)
      // TODO: Implement profile update API
      console.log('Profile update:', data)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (data: PasswordFormData) => {
    try {
      setLoading(true)

      const token = Cookies.get('access_token')
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: data.current_password,
          new_password: data.new_password
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change password')
      }

      toast.success('Password changed successfully!')
      passwordForm.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Layout title="Profile">
        <div className="flex items-center justify-center h-64">
          <p className="text-neutral-500">Please log in to view your profile.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Profile Settings">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="card mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-display-md text-neutral-900 mb-2">{user.full_name}</h2>
              <div className="flex items-center space-x-4 text-body-sm text-neutral-600">
                <div className="flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span className="capitalize">{user.role}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center space-x-1">
                    <Phone className="w-4 h-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card mb-8">
          <nav className="flex space-x-8 border-b border-neutral-200 pb-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'password'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Change Password
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'account'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Account Details
            </button>
          </nav>

          <div className="pt-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name
                    </label>
                    <input
                      {...profileForm.register('full_name')}
                      type="text"
                      className="form-input"
                      placeholder="Enter your full name"
                    />
                    {profileForm.formState.errors.full_name && (
                      <p className="form-error">{profileForm.formState.errors.full_name.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address
                    </label>
                    <input
                      {...profileForm.register('email')}
                      type="email"
                      className="form-input"
                      placeholder="Enter your email"
                    />
                    {profileForm.formState.errors.email && (
                      <p className="form-error">{profileForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      {...profileForm.register('phone')}
                      type="tel"
                      className="form-input"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    {loading ? (
                      <div className="spinner" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-6">
                <div className="max-w-md space-y-6">
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <div className="relative">
                      <input
                        {...passwordForm.register('current_password')}
                        type={showPasswords.current ? 'text' : 'password'}
                        className="form-input pr-10"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4 text-neutral-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-neutral-400" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.current_password && (
                      <p className="form-error">{passwordForm.formState.errors.current_password.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div className="relative">
                      <input
                        {...passwordForm.register('new_password')}
                        type={showPasswords.new ? 'text' : 'password'}
                        className="form-input pr-10"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4 text-neutral-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-neutral-400" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.new_password && (
                      <p className="form-error">{passwordForm.formState.errors.new_password.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <div className="relative">
                      <input
                        {...passwordForm.register('confirm_password')}
                        type={showPasswords.confirm ? 'text' : 'password'}
                        className="form-input pr-10"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4 text-neutral-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-neutral-400" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirm_password && (
                      <p className="form-error">{passwordForm.formState.errors.confirm_password.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    {loading ? (
                      <div className="spinner" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                    <span>Change Password</span>
                  </button>
                </div>
              </form>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="card-compact">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-neutral-900">Account Status</h3>
                        <p className="text-xs text-neutral-500">Your account is currently active</p>
                      </div>
                      <span className="status-badge status-success">Active</span>
                    </div>
                  </div>

                  <div className="card-compact">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-neutral-900">Account Type</h3>
                        <p className="text-xs text-neutral-500 capitalize">{user.role} account</p>
                      </div>
                      <Building2 className="w-5 h-5 text-neutral-400" />
                    </div>
                  </div>

                  <div className="card-compact">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-neutral-900">Member Since</h3>
                        <p className="text-xs text-neutral-500">Account created</p>
                      </div>
                      <Calendar className="w-5 h-5 text-neutral-400" />
                    </div>
                  </div>

                  <div className="card-compact">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-neutral-900">Location</h3>
                        <p className="text-xs text-neutral-500">Not specified</p>
                      </div>
                      <MapPin className="w-5 h-5 text-neutral-400" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-6">
                  <h3 className="text-sm font-medium text-neutral-900 mb-4">Account Actions</h3>
                  <div className="space-y-3">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Download Account Data
                    </button>
                    <button className="text-sm text-red-600 hover:text-red-700 font-medium block">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}