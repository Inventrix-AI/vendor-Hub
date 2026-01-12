'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { Layout } from '@/components/Layout'
import { VerificationProgress } from '@/components/admin/verification'
import { adminApi } from '@/lib/api'
import {
  ArrowLeft,
  Check,
  X,
  FileText,
  User,
  Building2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

export default function VerificationSummaryPage() {
  const router = useRouter()
  const params = useParams()
  const applicationId = params.id as string
  const queryClient = useQueryClient()

  const [decision, setDecision] = useState<'approved' | 'rejected' | ''>('')
  const [rejectionReason, setRejectionReason] = useState('')

  // Fetch application details
  const { data: application, isLoading } = useQuery(
    ['admin-application-detail', applicationId],
    () => adminApi.getApplicationDetail(applicationId),
    { enabled: !!applicationId }
  )

  // Fetch verification status
  const { data: verificationStatus } = useQuery(
    ['verification-status', applicationId],
    async () => {
      const response = await fetch(`/api/admin/verify-section?applicationId=${applicationId}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch verification status')
      return response.json()
    },
    { enabled: !!applicationId }
  )

  // Final decision mutation
  const decisionMutation = useMutation(
    async () => {
      return adminApi.reviewApplication(applicationId, {
        status: decision,
        rejection_reason: decision === 'rejected' ? rejectionReason : undefined
      })
    },
    {
      onSuccess: () => {
        toast.success(decision === 'approved' ? 'Application approved!' : 'Application rejected')
        queryClient.invalidateQueries(['admin-application-detail', applicationId])
        queryClient.invalidateQueries('dashboard-stats')
        router.push(`/admin/applications/${applicationId}`)
      },
      onError: () => {
        toast.error('Failed to submit decision')
      }
    }
  )

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!application) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Application not found</h3>
        </div>
      </Layout>
    )
  }

  const personalVerified = verificationStatus?.personal_verified || false
  const businessVerified = verificationStatus?.business_verified || false
  const allVerified = personalVerified && businessVerified

  // Get flagged documents
  const flaggedDocs = (application.documents || []).filter(
    (doc: any) => doc.verification_status === 'flagged' || doc.reupload_requested
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {application.application_id}
              </h1>
              <p className="text-gray-500 mt-1">
                Status: <span className="font-medium">{application.status.replace('_', ' ')}</span>
              </p>
            </div>
            <button
              onClick={() => router.push(`/admin/applications/${applicationId}`)}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Application
            </button>
          </div>

          {/* Step Progress */}
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-2">Step 3 of 3: Review Summary</p>
            <VerificationProgress
              currentStep="summary"
              personalVerified={personalVerified}
              businessVerified={businessVerified}
            />
          </div>
        </div>

        {/* Verification Status Cards */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Verification Status</h2>

          {/* Personal Verification */}
          <div className={`p-4 rounded-lg border ${personalVerified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <User className={`w-5 h-5 mr-3 ${personalVerified ? 'text-green-600' : 'text-yellow-600'}`} />
                <div>
                  <h3 className="font-medium text-gray-900">Personal Details</h3>
                  {verificationStatus?.personal_verified_at && (
                    <p className="text-sm text-gray-600">
                      Verified by {verificationStatus.personal_verified_by_email} on {formatDate(verificationStatus.personal_verified_at)}
                    </p>
                  )}
                </div>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${personalVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {personalVerified ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Verified
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-1" />
                    Pending
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Business Verification */}
          <div className={`p-4 rounded-lg border ${businessVerified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className={`w-5 h-5 mr-3 ${businessVerified ? 'text-green-600' : 'text-yellow-600'}`} />
                <div>
                  <h3 className="font-medium text-gray-900">Business Details</h3>
                  {verificationStatus?.business_verified_at && (
                    <p className="text-sm text-gray-600">
                      Verified by {verificationStatus.business_verified_by_email} on {formatDate(verificationStatus.business_verified_at)}
                    </p>
                  )}
                </div>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${businessVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {businessVerified ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Verified
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-1" />
                    Pending
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Documents Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents Summary</h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {(application.documents || []).map((doc: any) => (
              <div key={doc.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-500">{doc.file_name}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  doc.verification_status === 'verified'
                    ? 'bg-green-100 text-green-800'
                    : doc.verification_status === 'flagged'
                      ? 'bg-red-100 text-red-800'
                      : doc.reupload_requested
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-600'
                }`}>
                  {doc.verification_status === 'verified' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {doc.verification_status === 'flagged' && <XCircle className="w-3 h-3 mr-1" />}
                  {doc.reupload_requested && !doc.verification_status?.includes('flag') && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {doc.verification_status === 'verified'
                    ? 'Verified'
                    : doc.verification_status === 'flagged'
                      ? 'Flagged'
                      : doc.reupload_requested
                        ? 'Re-upload Requested'
                        : 'Pending'}
                </span>
              </div>
            ))}
            {(!application.documents || application.documents.length === 0) && (
              <div className="p-4 text-center text-gray-500">
                No documents uploaded
              </div>
            )}
          </div>
        </div>

        {/* Flagged Issues */}
        {flaggedDocs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Flagged Issues</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              {flaggedDocs.map((doc: any) => (
                <div key={doc.id} className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">
                      {doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-red-600">
                      {doc.flag_reason || doc.reupload_reason || 'Issue flagged'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Decision */}
        {application.status === 'under_review' && allVerified && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Final Decision</h2>

            <div className="space-y-4">
              {/* Decision Options */}
              <div className="flex space-x-4">
                <label className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                  decision === 'approved'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}>
                  <input
                    type="radio"
                    name="decision"
                    value="approved"
                    checked={decision === 'approved'}
                    onChange={() => setDecision('approved')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-center">
                    <CheckCircle className={`w-6 h-6 mr-2 ${decision === 'approved' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`font-medium ${decision === 'approved' ? 'text-green-700' : 'text-gray-700'}`}>
                      Approve Application
                    </span>
                  </div>
                </label>

                <label className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                  decision === 'rejected'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}>
                  <input
                    type="radio"
                    name="decision"
                    value="rejected"
                    checked={decision === 'rejected'}
                    onChange={() => setDecision('rejected')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-center">
                    <XCircle className={`w-6 h-6 mr-2 ${decision === 'rejected' ? 'text-red-600' : 'text-gray-400'}`} />
                    <span className={`font-medium ${decision === 'rejected' ? 'text-red-700' : 'text-gray-700'}`}>
                      Reject Application
                    </span>
                  </div>
                </label>
              </div>

              {/* Rejection Reason */}
              {decision === 'rejected' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    placeholder="Please provide a clear reason for rejection..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => decisionMutation.mutate()}
                  disabled={
                    !decision ||
                    (decision === 'rejected' && !rejectionReason.trim()) ||
                    decisionMutation.isLoading
                  }
                  className={`flex items-center px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                    decision === 'approved'
                      ? 'bg-green-600 hover:bg-green-700'
                      : decision === 'rejected'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-gray-400 cursor-not-allowed'
                  } disabled:opacity-50`}
                >
                  {decisionMutation.isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : decision === 'approved' ? (
                    <Check className="w-5 h-5 mr-2" />
                  ) : decision === 'rejected' ? (
                    <X className="w-5 h-5 mr-2" />
                  ) : null}
                  Submit Decision
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cannot make decision message */}
        {application.status === 'under_review' && !allVerified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-yellow-800">Verification Incomplete</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Please complete verification of all sections before making a final decision.
                </p>
                <div className="mt-3 flex space-x-3">
                  {!personalVerified && (
                    <button
                      onClick={() => router.push(`/admin/applications/${applicationId}/verify/personal`)}
                      className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                    >
                      Verify Personal Details
                    </button>
                  )}
                  {!businessVerified && (
                    <button
                      onClick={() => router.push(`/admin/applications/${applicationId}/verify/business`)}
                      className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                    >
                      Verify Business Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Already reviewed message */}
        {application.status !== 'under_review' && (
          <div className={`rounded-lg p-6 ${
            application.status === 'approved'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start">
              {application.status === 'approved' ? (
                <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
              )}
              <div>
                <h3 className={`font-medium ${application.status === 'approved' ? 'text-green-800' : 'text-red-800'}`}>
                  Application {application.status === 'approved' ? 'Approved' : 'Rejected'}
                </h3>
                {application.rejection_reason && (
                  <p className="text-sm text-red-700 mt-1">
                    Reason: {application.rejection_reason}
                  </p>
                )}
                {application.reviewed_at && (
                  <p className="text-sm text-gray-600 mt-1">
                    Reviewed on {formatDate(application.reviewed_at)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="mt-6 flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
          <button
            onClick={() => router.push(`/admin/applications/${applicationId}/verify/business`)}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous Step
          </button>

          <button
            onClick={() => router.push(`/admin/applications/${applicationId}`)}
            className="flex items-center px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Back to Application Details
          </button>
        </div>
      </div>
    </Layout>
  )
}
