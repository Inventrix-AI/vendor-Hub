'use client'

import React, { useState, useEffect } from 'react'
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Download,
  Flag,
  Upload,
  Check,
  X,
  FileText,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react'

interface Document {
  id: number
  document_reference: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  document_type: string
  created_at: string
  uploaded_at?: string
  storage_url?: string
  verification_status?: string
  flag_reason?: string
  reupload_requested?: boolean
  reupload_reason?: string
}

interface DocumentPanelProps {
  documents: Document[]
  selectedDocumentType?: string
  onDocumentSelect?: (documentType: string) => void
  onFlagDocument?: (documentId: number) => void
  onRequestReupload?: (documentId: number) => void
  onVerifyDocument?: (documentId: number) => void
  readOnly?: boolean
}

export function DocumentPanel({
  documents,
  selectedDocumentType,
  onDocumentSelect,
  onFlagDocument,
  onRequestReupload,
  onVerifyDocument,
  readOnly = false
}: DocumentPanelProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fitToContainer, setFitToContainer] = useState(true)

  // Get unique document types for tabs
  const documentTypes = Array.from(new Set(documents.map(d => d.document_type)))

  // Get selected document
  const selectedDocument = selectedDocumentType
    ? documents.find(d => d.document_type === selectedDocumentType)
    : documents[0]

  // Reset view when switching documents
  useEffect(() => {
    setZoom(100)
    setRotation(0)
    setFitToContainer(true)
  }, [selectedDocumentType])

  const handleZoomIn = () => {
    setFitToContainer(false)
    setZoom(prev => Math.min(prev + 25, 300))
  }
  const handleZoomOut = () => {
    setFitToContainer(false)
    setZoom(prev => Math.max(prev - 25, 25))
  }
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)
  const resetView = () => {
    setZoom(100)
    setRotation(0)
    setFitToContainer(true)
  }

  // Use storage_url directly from Supabase if available, otherwise fall back to API route
  const getDocumentUrl = (doc: Document) => doc.storage_url || `/api/documents/${doc.id}`

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDocumentType = (type: string) =>
    type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const downloadDocument = (doc: Document) => {
    const link = document.createElement('a')
    link.href = getDocumentUrl(doc)
    link.download = doc.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusBadge = (doc: Document) => {
    const status = doc.verification_status || 'pending'

    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Verified' },
      flagged: { bg: 'bg-red-100', text: 'text-red-800', label: 'Flagged' },
      reupload_requested: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Re-upload Requested' }
    }

    const config = statusConfig[status] || statusConfig.pending

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const isImage = (doc: Document) => doc.mime_type?.startsWith('image/')
  const isPDF = (doc: Document) => doc.mime_type === 'application/pdf'

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No documents uploaded</p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Document Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {documentTypes.map(type => {
            const doc = documents.find(d => d.document_type === type)
            const isSelected = selectedDocumentType === type || (!selectedDocumentType && type === documentTypes[0])

            return (
              <button
                key={type}
                onClick={() => onDocumentSelect?.(type)}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${isSelected
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {isImage(doc!) ? (
                  <ImageIcon className="w-4 h-4 mr-2" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                {formatDocumentType(type)}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDocument && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              {isImage(selectedDocument) && (
                <>
                  <button
                    onClick={handleZoomOut}
                    className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 min-w-[50px] text-center">{fitToContainer ? 'Fit' : `${zoom}%`}</span>
                  <button
                    onClick={handleZoomIn}
                    className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <div className="w-px h-5 bg-gray-300" />
                  <button
                    onClick={handleRotate}
                    className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                    title="Rotate"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => downloadDocument(selectedDocument)}
                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {getStatusBadge(selectedDocument)}
          </div>

          {/* Document Viewer */}
          <div className="p-4 min-h-[400px] flex items-center justify-center bg-gray-100">
            {isImage(selectedDocument) ? (
              <div className={`relative overflow-auto max-h-[500px] w-full flex items-center justify-center ${fitToContainer ? '' : 'overflow-scroll'}`}>
                <img
                  src={getDocumentUrl(selectedDocument)}
                  alt={formatDocumentType(selectedDocument.document_type)}
                  className={`shadow-lg rounded cursor-pointer ${fitToContainer ? 'max-w-full max-h-[450px] object-contain' : 'max-w-none'}`}
                  style={{
                    transform: fitToContainer
                      ? `rotate(${rotation}deg)`
                      : `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                    transition: 'transform 0.2s ease-in-out'
                  }}
                  onDoubleClick={resetView}
                  draggable={false}
                />
              </div>
            ) : isPDF(selectedDocument) ? (
              <iframe
                src={getDocumentUrl(selectedDocument)}
                className="w-full h-[500px] border-0 rounded"
                title={formatDocumentType(selectedDocument.document_type)}
              />
            ) : (
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">This file type cannot be previewed</p>
                <button
                  onClick={() => downloadDocument(selectedDocument)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </button>
              </div>
            )}
          </div>

          {/* Document Info */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                <span className="font-medium">Document:</span> {formatDocumentType(selectedDocument.document_type)}
              </div>
              <div>
                <span className="font-medium">Uploaded:</span> {new Date(selectedDocument.created_at).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Size:</span> {formatFileSize(selectedDocument.file_size)}
              </div>
            </div>

            {/* Flag/Re-upload Reason Display */}
            {selectedDocument.flag_reason && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Flagged Issue</p>
                    <p className="text-sm text-red-600 mt-1">{selectedDocument.flag_reason}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedDocument.reupload_reason && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start">
                  <Upload className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Re-upload Requested</p>
                    <p className="text-sm text-orange-600 mt-1">{selectedDocument.reupload_reason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!readOnly && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center space-x-3">
              <button
                onClick={() => onFlagDocument?.(selectedDocument.id)}
                className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Flag className="w-4 h-4 mr-2" />
                Flag Issue
              </button>
              <button
                onClick={() => onRequestReupload?.(selectedDocument.id)}
                className="flex items-center px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Request Re-upload
              </button>
              {selectedDocument.verification_status !== 'verified' && (
                <button
                  onClick={() => onVerifyDocument?.(selectedDocument.id)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors ml-auto"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark Verified
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
