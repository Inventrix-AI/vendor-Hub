'use client'

import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useParams } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { DocumentUpload } from '@/components/DocumentUpload'
import { PaymentModal } from '@/components/PaymentModal'
import { DocumentViewer } from '@/components/DocumentViewer'
import { vendorApi } from '@/lib/api'
import { 
  FileText,
  MapPin,
  Building2,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Upload,
  DollarSign
} from 'lucide-react'
import { VendorApplication } from '@/types'

export default function ApplicationDetailPage() {
  const params = useParams()
  const applicationId = params.id as string
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)

  const { data: application, isLoading, refetch } = useQuery<VendorApplication>(
    ['vendor-application', applicationId],
    () => vendorApi.getApplication(applicationId),
    {
      enabled: !!applicationId
    }
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-500" />
      case 'under_review':
        return <Clock className="h-6 w-6 text-blue-500" />
      case 'payment_pending':
        return <CreditCard className="h-6 w-6 text-yellow-500" />
      default:
        return <Clock className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          title: 'Application Submitted',
          message: 'Please upload required documents and complete payment to proceed.',
          color: 'gray'
        }
      case 'payment_pending':
        return {
          title: 'Payment Required',
          message: 'Please complete the payment to proceed with verification.',
          color: 'yellow'
        }
      case 'under_review':
        return {
          title: 'Under Review',
          message: 'Your application is being reviewed by our team.',
          color: 'blue'
        }
      case 'approved':
        return {
          title: 'Approved!',
          message: 'Congratulations! Your vendor application has been approved.',
          color: 'green'
        }
      case 'rejected':
        return {
          title: 'Application Rejected',
          message: 'Your application has been rejected. Please review the feedback and resubmit.',
          color: 'red'
        }
      default:
        return {
          title: 'Unknown Status',
          message: '',
          color: 'gray'
        }
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

  const statusInfo = getStatusMessage(application.status)
  const applicationFee = 1500 // Fixed fee in INR

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {getStatusIcon(application.status)}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Application {application.application_id}
                </h1>
                <p className="text-gray-600 mt-1">{application.business_name}</p>
                {application.vendor_id && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    Vendor ID: {application.vendor_id}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {statusInfo.title}
              </span>
              <p className="text-sm text-gray-500 mt-2">
                Submitted: {new Date(application.submitted_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className={`mt-4 p-4 rounded-lg ${
            statusInfo.color === 'green' ? 'bg-green-50 border border-green-200' :
            statusInfo.color === 'blue' ? 'bg-blue-50 border border-blue-200' :
            statusInfo.color === 'yellow' ? 'bg-yellow-50 border border-yellow-200' :
            statusInfo.color === 'red' ? 'bg-red-50 border border-red-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <p className={`text-sm ${
              statusInfo.color === 'green' ? 'text-green-800' :
              statusInfo.color === 'blue' ? 'text-blue-800' :
              statusInfo.color === 'yellow' ? 'text-yellow-800' :
              statusInfo.color === 'red' ? 'text-red-800' :
              'text-gray-800'
            }`}>
              {statusInfo.message}
            </p>
          </div>
        </div>

        {/* Application Details */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Business Information */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
            </div>
            
            <div className="space-y-3">
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
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="text-sm text-gray-900">{application.address}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">City, State</dt>
                <dd className="text-sm text-gray-900">{application.city}, {application.state}</dd>
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

        {/* Documents Section */}
        {(application.status === 'pending' || application.status === 'payment_pending') && (
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <Upload className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-medium text-gray-900">Upload Documents</h3>
            </div>
            
            <div className="space-y-6">
              <DocumentUpload
                applicationId={application.application_id}
                documentType="id_proof"
                onUploadComplete={refetch}
              />
              
              <DocumentUpload
                applicationId={application.application_id}
                documentType="address_proof"
                onUploadComplete={refetch}
              />
              
              <DocumentUpload
                applicationId={application.application_id}
                documentType="business_license"
                onUploadComplete={refetch}
              />
            </div>
          </div>
        )}

        {/* Documents Viewing Section */}
        {application.documents && application.documents.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-medium text-gray-900">Uploaded Documents</h3>
              </div>
              <button
                onClick={() => setDocumentViewerOpen(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>View All ({application.documents.length})</span>
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {application.documents.slice(0, 3).map((doc: any) => (
                <div key={doc.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {doc.document_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">{doc.file_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {application.documents.length > 3 && (
                <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      +{application.documents.length - 3} more documents
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Section */}
        {application.status === 'payment_pending' && (
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <DollarSign className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-medium text-gray-900">Payment Required</h3>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                Please complete the payment to proceed with your application review.
              </p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Application Processing Fee</p>
                <p className="text-xs text-gray-500">One-time payment for application review</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">₹{applicationFee}</p>
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="btn-primary mt-2"
                >
                  Pay Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        applicationId={application.application_id}
        amount={applicationFee}
        onPaymentSuccess={() => {
          refetch()
          setPaymentModalOpen(false)
        }}
      />

      {/* Document Viewer Modal */}
      {application.documents && (
        <DocumentViewer
          documents={application.documents}
          isOpen={documentViewerOpen}
          onClose={() => setDocumentViewerOpen(false)}
        />
      )}
    </Layout>
  )
}