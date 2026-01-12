'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { Layout } from '@/components/Layout'
import {
  VerificationProgress,
  DetailField,
  DetailFieldGroup,
  DocumentPanel,
  FlagIssueModal,
  RequestReuploadModal
} from '@/components/admin/verification'
import { adminApi } from '@/lib/api'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  MapPin,
  FileText
} from 'lucide-react'

// Business document types - must match the types stored during registration
const BUSINESS_DOC_TYPES = ['shop_photo', 'shop_document', 'gumashta', 'rent_agreement', 'other', 'address_proof', 'business_license', 'shop_image']

export default function BusinessVerificationPage() {
  const router = useRouter()
  const params = useParams()
  const applicationId = params.id as string
  const queryClient = useQueryClient()

  const [selectedDocType, setSelectedDocType] = useState<string>('')
  const [flagModalOpen, setFlagModalOpen] = useState(false)
  const [reuploadModalOpen, setReuploadModalOpen] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null)
  const [selectedDocTypeName, setSelectedDocTypeName] = useState('')

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

  // Mark section as verified mutation
  const verifyMutation = useMutation(
    async () => {
      const response = await fetch('/api/admin/verify-section', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          applicationId,
          section: 'business'
        })
      })
      if (!response.ok) throw new Error('Failed to verify section')
      return response.json()
    },
    {
      onSuccess: () => {
        toast.success('Business details verified successfully!')
        queryClient.invalidateQueries(['verification-status', applicationId])
        router.push(`/admin/applications/${applicationId}/verify/summary`)
      },
      onError: () => {
        toast.error('Failed to verify section')
      }
    }
  )

  // Flag document mutation
  const flagMutation = useMutation(
    async (reason: string) => {
      const response = await fetch('/api/admin/flag-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          documentId: selectedDocId,
          reason
        })
      })
      if (!response.ok) throw new Error('Failed to flag document')
      return response.json()
    },
    {
      onSuccess: () => {
        toast.success('Document flagged successfully')
        queryClient.invalidateQueries(['admin-application-detail', applicationId])
        setFlagModalOpen(false)
      },
      onError: () => {
        toast.error('Failed to flag document')
      }
    }
  )

  // Request reupload mutation
  const reuploadMutation = useMutation(
    async (reason: string) => {
      const response = await fetch('/api/admin/request-reupload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          documentId: selectedDocId,
          applicationId,
          documentType: selectedDocTypeName,
          reason
        })
      })
      if (!response.ok) throw new Error('Failed to request reupload')
      return response.json()
    },
    {
      onSuccess: () => {
        toast.success('Re-upload request sent successfully')
        queryClient.invalidateQueries(['admin-application-detail', applicationId])
        setReuploadModalOpen(false)
      },
      onError: () => {
        toast.error('Failed to request re-upload')
      }
    }
  )

  const handleFlagDocument = (docId: number) => {
    const doc = businessDocs.find(d => d.id === docId)
    if (doc) {
      setSelectedDocId(docId)
      setSelectedDocTypeName(doc.document_type)
      setFlagModalOpen(true)
    }
  }

  const handleRequestReupload = (docId: number) => {
    const doc = businessDocs.find(d => d.id === docId)
    if (doc) {
      setSelectedDocId(docId)
      setSelectedDocTypeName(doc.document_type)
      setReuploadModalOpen(true)
    }
  }

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

  // Filter business documents - exact match on document type
  const businessDocs = (application.documents || []).filter((doc: any) =>
    BUSINESS_DOC_TYPES.includes(doc.document_type.toLowerCase())
  )

  const personalVerified = verificationStatus?.personal_verified || false
  const businessVerified = verificationStatus?.business_verified || false

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
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
            <p className="text-sm text-gray-600 mb-2">Step 2 of 3: Business Verification</p>
            <VerificationProgress
              currentStep="business"
              personalVerified={personalVerified}
              businessVerified={businessVerified}
            />
          </div>
        </div>

        {/* Main Content - Split View */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Business Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <DetailFieldGroup title="Business Details">
              <div className="flex items-center mb-4">
                <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-500">Shop Information</span>
              </div>

              <DetailField
                label="Shop Name"
                value={application.business_name || application.company_name}
              />

              <DetailField
                label="Business Type"
                value={application.business_type}
              />

              {application.business_description && (
                <DetailField
                  label="Description"
                  value={application.business_description}
                />
              )}

              {application.registration_number && (
                <DetailField
                  label="Registration Number"
                  value={application.registration_number}
                />
              )}

              {application.tax_id && (
                <DetailField
                  label="Tax ID / GSTIN"
                  value={application.tax_id}
                />
              )}
            </DetailFieldGroup>

            <DetailFieldGroup title="Address">
              <div className="flex items-center mb-4">
                <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-500">Shop Location</span>
              </div>

              <DetailField
                label="Street Address"
                value={application.address}
              />

              <div className="grid grid-cols-2 gap-4">
                <DetailField
                  label="City"
                  value={application.city}
                />
                <DetailField
                  label="State"
                  value={application.state}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DetailField
                  label="Postal Code"
                  value={application.postal_code}
                />
                <DetailField
                  label="Country"
                  value={application.country}
                />
              </div>
            </DetailFieldGroup>

            {(application.bank_name || application.account_number) && (
              <DetailFieldGroup title="Banking Information">
                <div className="flex items-center mb-4">
                  <FileText className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Bank Details</span>
                </div>

                {application.bank_name && (
                  <DetailField
                    label="Bank Name"
                    value={application.bank_name}
                  />
                )}

                {application.account_number && (
                  <DetailField
                    label="Account Number"
                    value={`****${application.account_number.slice(-4)}`}
                  />
                )}

                {application.ifsc_code && (
                  <DetailField
                    label="IFSC Code"
                    value={application.ifsc_code}
                  />
                )}
              </DetailFieldGroup>
            )}
          </div>

          {/* Right Column - Documents */}
          <div>
            <DocumentPanel
              documents={businessDocs}
              selectedDocumentType={selectedDocType || businessDocs[0]?.document_type}
              onDocumentSelect={setSelectedDocType}
              onFlagDocument={handleFlagDocument}
              onRequestReupload={handleRequestReupload}
            />
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="mt-6 flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
          <button
            onClick={() => router.push(`/admin/applications/${applicationId}/verify/personal`)}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous Step
          </button>

          <div className="flex items-center space-x-4">
            {!businessVerified && (
              <button
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isLoading}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {verifyMutation.isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Mark Verified
              </button>
            )}

            <button
              onClick={() => router.push(`/admin/applications/${applicationId}/verify/summary`)}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <FlagIssueModal
        isOpen={flagModalOpen}
        onClose={() => setFlagModalOpen(false)}
        onSubmit={(reason) => flagMutation.mutateAsync(reason)}
        documentType={selectedDocTypeName}
      />

      <RequestReuploadModal
        isOpen={reuploadModalOpen}
        onClose={() => setReuploadModalOpen(false)}
        onSubmit={(reason) => reuploadMutation.mutateAsync(reason)}
        documentType={selectedDocTypeName}
      />
    </Layout>
  )
}
