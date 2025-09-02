'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from 'react-query'
import Link from 'next/link'
import { Layout } from '@/components/Layout'
import { api } from '@/lib/api'
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Eye, 
  MapPin,
  Phone,
  Mail,
  Building,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  User,
  Camera,
  FileImage
} from 'lucide-react'

export default function ApplicationDetailsPage() {
  const params = useParams()
  const applicationId = params.id as string

  const { data: application, isLoading, error } = useQuery(
    ['application', applicationId],
    async () => {
      const response = await api.get(`/api/vendors?id=${applicationId}`)
      return response.data
    },
    { enabled: !!applicationId }
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-500" />
      case 'under_review':
        return <Clock className="h-6 w-6 text-blue-500" />
      case 'pending':
        return <Clock className="h-6 w-6 text-orange-500" />
      default:
        return <AlertCircle className="h-6 w-6 text-gray-500" />
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
      case 'pending':
        return `${baseClasses} bg-orange-100 text-orange-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
    
    switch (paymentStatus) {
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-700`
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-700`
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-700`
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`
    }
  }

  const getDocumentIcon = (documentType: string) => {
    switch (documentType) {
      case 'photo':
        return <Camera className="h-5 w-5 text-blue-500" />
      case 'shop_photo':
        return <Building className="h-5 w-5 text-green-500" />
      case 'id_document':
        return <User className="h-5 w-5 text-purple-500" />
      case 'shop_document':
        return <FileText className="h-5 w-5 text-orange-500" />
      default:
        return <FileImage className="h-5 w-5 text-gray-500" />
    }
  }

  const getDocumentLabel = (documentType: string) => {
    switch (documentType) {
      case 'photo':
        return 'Personal Photo'
      case 'shop_photo':
        return 'Shop Photo'
      case 'id_document':
        return 'ID Document'
      case 'shop_document':
        return 'Shop Document'
      default:
        return documentType.replace('_', ' ')
    }
  }

  if (isLoading) {
    return (
      <Layout title="Application Details">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (error || !application) {
    return (
      <Layout title="Application Details">
        <div className="text-center py-12">
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Application Not Found</h3>
          <p className="text-gray-500 mb-6">The requested application could not be found or you don't have access to it.</p>
          <Link 
            href="/vendor/dashboard" 
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Application Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link 
            href="/vendor/dashboard" 
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        {/* Application Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getStatusIcon(application.status)}
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Application {application.application_id}
                  </h1>
                  {application.vendor_id && (
                    <p className="text-sm text-gray-500 font-mono">
                      Vendor ID: {application.vendor_id}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={getStatusBadge(application.status)}>
                  {application.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className={getPaymentStatusBadge(application.payment_status)}>
                  Payment: {application.payment_status}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Submitted Date</h3>
                <p className="text-sm text-gray-900">
                  {new Date(application.submitted_at || application.created_at).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              {application.reviewed_at && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Reviewed Date</h3>
                  <p className="text-sm text-gray-900">
                    {new Date(application.reviewed_at).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Business Type</h3>
                <p className="text-sm text-gray-900 capitalize">
                  {application.business_type?.replace('_', ' ') || 'N/A'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                <p className="text-sm text-gray-900">
                  {application.city ? `${application.city}, ${application.state}` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Business Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Business Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Business Name</h3>
                <p className="text-sm text-gray-900">{application.business_name || application.company_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Business Description</h3>
                <p className="text-sm text-gray-900">
                  {application.business_description || `${application.business_type?.replace('_', ' ')} business`}
                </p>
              </div>
              {application.registration_number && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Registration Number</h3>
                  <p className="text-sm text-gray-900 font-mono">{application.registration_number}</p>
                </div>
              )}
              {application.tax_id && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Tax ID</h3>
                  <p className="text-sm text-gray-900 font-mono">{application.tax_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-green-600" />
                Contact Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {application.user_full_name && (
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                    <p className="text-sm text-gray-900">{application.user_full_name}</p>
                  </div>
                </div>
              )}
              {application.contact_email && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="text-sm text-gray-900">{application.contact_email}</p>
                  </div>
                </div>
              )}
              {application.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="text-sm text-gray-900">{application.phone}</p>
                  </div>
                </div>
              )}
              {application.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Address</h3>
                    <p className="text-sm text-gray-900">{application.address}</p>
                    {application.postal_code && (
                      <p className="text-sm text-gray-500">PIN: {application.postal_code}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Documents */}
        {application.documents && application.documents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                Uploaded Documents
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {application.documents.map((document: any) => (
                  <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getDocumentIcon(document.document_type)}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {getDocumentLabel(document.document_type)}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {document.file_name}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-3">
                      <p>Size: {(document.file_size / 1024).toFixed(1)} KB</p>
                      <p>Uploaded: {new Date(document.created_at).toLocaleDateString()}</p>
                    </div>

                    <div className="flex space-x-2">
                      {document.storage_url && (
                        <a
                          href={document.storage_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </a>
                      )}
                      <a
                        href={`/api/documents/${document.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Status History / Notes */}
        {application.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-900 mb-1">Rejection Reason</h3>
                <p className="text-sm text-red-700">{application.rejection_reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <Link 
            href="/vendor/dashboard" 
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          
          {application.status === 'pending' && application.payment_status === 'pending' && (
            <Link 
              href="/vendor/register" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Complete Payment
            </Link>
          )}
        </div>
      </div>
    </Layout>
  )
}