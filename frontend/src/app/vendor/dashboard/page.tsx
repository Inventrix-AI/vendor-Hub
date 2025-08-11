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
  Eye
} from 'lucide-react'
import { VendorApplication, Payment } from '@/types'

export default function VendorDashboard() {
  const { user } = useAuth()
  
  const { data: applications, isLoading: applicationsLoading } = useQuery<VendorApplication[]>(
    'vendor-applications',
    vendorApi.getApplications
  )
  
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