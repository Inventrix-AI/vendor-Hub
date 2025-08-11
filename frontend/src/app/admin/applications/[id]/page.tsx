'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useParams } from 'next/navigation'
import { toast } from 'react-toastify'
import { Layout } from '@/components/Layout'
import { adminApi } from '@/lib/api'
import { 
  FileText,
  MapPin,
  Building2,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  MessageSquare
} from 'lucide-react'

export default function ApplicationReviewPage() {
  const params = useParams()
  const applicationId = params.id as string
  const queryClient = useQueryClient()
  
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | ''>('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)

  const { data: application, isLoading } = useQuery(
    ['admin-application-detail', applicationId],
    () => adminApi.getApplicationDetail(applicationId),
    {
      enabled: !!applicationId
    }
  )

  const { data: auditLogs } = useQuery(
    ['audit-logs', applicationId],
    () => adminApi.getAuditLogs(applicationId),
    {
      enabled: !!applicationId
    }
  )

  const reviewMutation = useMutation(
    (data: { status: string; rejection_reason?: string }) =>
      adminApi.reviewApplication(applicationId, data),
    {
      onSuccess: () => {
        toast.success('Application reviewed successfully!')
        queryClient.invalidateQueries(['admin-application-detail', applicationId])
        queryClient.invalidateQueries('dashboard-stats')
        setShowReviewForm(false)
        setReviewStatus('')
        setRejectionReason('')
      },
      onError: () => {
        toast.error('Failed to review application')
      }
    }
  )

  const handleReview = async () => {
    if (!reviewStatus) return

    reviewMutation.mutate({
      status: reviewStatus,
      rejection_reason: reviewStatus === 'rejected' ? rejectionReason : undefined
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-500" />
      case 'under_review':
        return <Clock className="h-6 w-6 text-blue-500" />
      default:
        return <Clock className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
    
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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="spinner" />
        </div>
      </Layout>
    )
  }

  if (!application) {
    return (
      <Layout>
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">Application not found</h3>
          <p className="mt-2 text-sm text-gray-500">
            The requested application could not be found.
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {getStatusIcon(application.status)}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {application.business_name}
                </h1>
                <p className="text-gray-600 mt-1">
                  Application ID: {application.application_id}
                </p>
                {application.vendor_id && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Vendor ID: {application.vendor_id}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <span className={getStatusBadge(application.status)}>
                {application.status.replace('_', ' ')}
              </span>
              <p className="text-sm text-gray-500 mt-2">
                Submitted: {new Date(application.submitted_at).toLocaleDateString()}
              </p>
              {application.reviewed_at && (
                <p className="text-sm text-gray-500">
                  Reviewed: {new Date(application.reviewed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Review Actions */}
          {application.status === 'under_review' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              {!showReviewForm ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="btn-primary"
                >
                  Review Application
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="reviewStatus"
                        value="approved"
                        checked={reviewStatus === 'approved'}
                        onChange={(e) => setReviewStatus(e.target.value as 'approved')}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-green-700">Approve</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="reviewStatus"
                        value="rejected"
                        checked={reviewStatus === 'rejected'}
                        onChange={(e) => setReviewStatus(e.target.value as 'rejected')}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-red-700">Reject</span>
                    </label>
                  </div>

                  {reviewStatus === 'rejected' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for rejection *
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="input-field"
                        placeholder="Please provide a clear reason for rejection..."
                      />
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={handleReview}
                      disabled={
                        !reviewStatus || 
                        (reviewStatus === 'rejected' && !rejectionReason.trim()) ||
                        reviewMutation.isLoading
                      }
                      className="btn-primary flex items-center space-x-2"
                    >
                      {reviewMutation.isLoading ? (
                        <div className="spinner" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Submit Review</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowReviewForm(false)
                        setReviewStatus('')
                        setRejectionReason('')
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applicant Information */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-medium text-gray-900">Applicant Information</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{application.user_email}</dd>
                </div>
                {application.user_phone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="text-sm text-gray-900">{application.user_phone}</dd>
                  </div>
                )}
              </div>
            </div>

            {/* Business Information */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Business Name</dt>
                  <dd className="text-sm text-gray-900">{application.business_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Business Type</dt>
                  <dd className="text-sm text-gray-900">{application.business_type}</dd>
                </div>
                {application.registration_number && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Registration Number</dt>
                    <dd className="text-sm text-gray-900">{application.registration_number}</dd>
                  </div>
                )}
                {application.tax_id && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Tax ID</dt>
                    <dd className="text-sm text-gray-900">{application.tax_id}</dd>
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Street Address</dt>
                  <dd className="text-sm text-gray-900">{application.address}</dd>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">City</dt>
                    <dd className="text-sm text-gray-900">{application.city}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">State</dt>
                    <dd className="text-sm text-gray-900">{application.state}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Postal Code</dt>
                    <dd className="text-sm text-gray-900">{application.postal_code}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Country</dt>
                    <dd className="text-sm text-gray-900">{application.country}</dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Banking Information */}
            {(application.bank_name || application.account_number) && (
              <div className="card">
                <div className="flex items-center space-x-2 mb-4">
                  <Building2 className="h-5 w-5 text-primary-600" />
                  <h3 className="text-lg font-medium text-gray-900">Banking Information</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {application.bank_name && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Bank Name</dt>
                      <dd className="text-sm text-gray-900">{application.bank_name}</dd>
                    </div>
                  )}
                  {application.account_number && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Account Number</dt>
                      <dd className="text-sm text-gray-900">****{application.account_number.slice(-4)}</dd>
                    </div>
                  )}
                  {application.routing_number && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Routing Number</dt>
                      <dd className="text-sm text-gray-900">{application.routing_number}</dd>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Documents */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
              
              {!application.documents || application.documents.length === 0 ? (
                <p className="text-sm text-gray-500">No documents uploaded yet</p>
              ) : (
                <div className="space-y-3">
                  {application.documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {doc.document_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-gray-500">{doc.filename}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-primary-600 hover:text-primary-700">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Log */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-medium text-gray-900">Activity Log</h3>
              </div>
              
              {!auditLogs || auditLogs.length === 0 ? (
                <p className="text-sm text-gray-500">No activity recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="border-l-4 border-primary-200 pl-4 py-2">
                      <p className="text-sm font-medium text-gray-900">{log.action}</p>
                      {log.details && (
                        <p className="text-sm text-gray-600">{log.details}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {log.user_email} • {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}