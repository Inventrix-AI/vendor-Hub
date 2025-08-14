'use client'

import React from 'react'
import { useQuery } from 'react-query'
import Link from 'next/link'
import { Layout } from '@/components/Layout'
import { vendorApi, paymentApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  CreditCard,
  Eye,
  Calendar,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { VendorApplication, Payment } from '@/types'

// Subscription status component
function SubscriptionStatusCard({ vendorId }: { vendorId?: string }) {
  const { data: subscriptionStatus, isLoading } = useQuery(
    ['subscription-status', vendorId],
    async () => {
      if (!vendorId) return null
      const response = await fetch(`/api/renewal?vendorId=${vendorId}&action=status`)
      if (!response.ok) return null
      return response.json()
    },
    { enabled: !!vendorId }
  )

  if (isLoading || !subscriptionStatus) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string, daysLeft: number) => {
    if (status === 'expired') return 'bg-red-50 border-red-200 text-red-900'
    if (status === 'expiring_soon' || daysLeft <= 30) return 'bg-yellow-50 border-yellow-200 text-yellow-900'
    return 'bg-green-50 border-green-200 text-green-900'
  }

  const getStatusIcon = (status: string, daysLeft: number) => {
    if (status === 'expired') return <XCircle className="h-6 w-6 text-red-500" />
    if (status === 'expiring_soon' || daysLeft <= 30) return <AlertTriangle className="h-6 w-6 text-yellow-500" />
    return <CheckCircle className="h-6 w-6 text-green-500" />
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'expiring_soon': return 'Expiring Soon'
      case 'expired': return 'Expired'
      case 'no_subscription': return 'No Subscription'
      default: return 'Unknown'
    }
  }

  return (
    <div className={`card border-2 ${getStatusColor(subscriptionStatus.status, subscriptionStatus.daysUntilExpiry)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon(subscriptionStatus.status, subscriptionStatus.daysUntilExpiry)}
          <div>
            <h3 className="text-lg font-semibold">Subscription Status</h3>
            <p className="text-sm opacity-75">
              {getStatusText(subscriptionStatus.status)}
            </p>
          </div>
        </div>
        
        {subscriptionStatus.status !== 'no_subscription' && (
          <div className="text-right">
            <div className="text-2xl font-bold">
              {subscriptionStatus.daysUntilExpiry}
            </div>
            <div className="text-xs opacity-75">days left</div>
          </div>
        )}
      </div>

      {subscriptionStatus.expiresAt && (
        <div className="mt-4 pt-4 border-t border-current border-opacity-20">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Expires: {new Date(subscriptionStatus.expiresAt).toLocaleDateString()}</span>
            </div>
            
            {(subscriptionStatus.status === 'expiring_soon' || subscriptionStatus.status === 'expired') && (
              <Link 
                href={`/vendor/renewal?vendor_id=${vendorId}`}
                className="flex items-center space-x-1 px-3 py-1 bg-white bg-opacity-20 rounded-md hover:bg-opacity-30 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Renew Now</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function VendorDashboard() {
  const { user } = useAuth()
  
  const { data: applications, isLoading: applicationsLoading } = useQuery<VendorApplication[]>(
    'vendor-applications',
    vendorApi.getApplications
  )

  // Get vendor ID from approved applications
  const approvedApplication = applications?.find(app => app.status === 'approved' && app.vendor_id)
  const vendorId = approvedApplication?.vendor_id
  
  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>(
    'payment-history',
    paymentApi.getPaymentHistory
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'under_review':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'payment_pending':
        return <CreditCard className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'under_review':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'payment_pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  return (
    <Layout title="Vendor Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Welcome back, {user?.full_name}!
              </h2>
              <p className="text-gray-600 mt-1">
                Manage your vendor applications and track their status
              </p>
            </div>
            <Link href="/vendor/apply" className="btn-primary flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Application</span>
            </Link>
          </div>
        </div>

        {/* Subscription Status - Only show if vendor has an approved application */}
        {vendorId && <SubscriptionStatusCard vendorId={vendorId} />}

        {/* Applications Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">My Applications</h3>
            {applications && applications.length > 0 && (
              <span className="text-sm text-gray-500">
                {applications.length} application{applications.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {applicationsLoading ? (
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          ) : !applications || applications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No applications yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Get started by submitting your first vendor application.
              </p>
              <div className="mt-6">
                <Link href="/vendor/apply" className="btn-primary">
                  Submit Application
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Application
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Business Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(application.status)}
                          <div className="ml-2">
                            <div className="text-sm font-medium text-gray-900">
                              {application.application_id}
                            </div>
                            {application.vendor_id && (
                              <div className="text-sm text-gray-500">
                                Vendor ID: {application.vendor_id}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {application.business_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(application.status)}>
                          {application.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(application.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/vendor/application/${application.application_id}`}
                          className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Payments Section */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Payments</h3>
          
          {paymentsLoading ? (
            <div className="flex justify-center py-4">
              <div className="spinner" />
            </div>
          ) : !payments || payments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No payment history available
            </p>
          ) : (
            <div className="space-y-4">
              {payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        ₹{payment.amount} - {payment.status}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    payment.status === 'success' ? 'bg-green-100 text-green-800' : 
                    payment.status === 'failed' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}