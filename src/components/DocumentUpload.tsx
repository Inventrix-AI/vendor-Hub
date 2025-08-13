'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { vendorApi } from '@/lib/api'
import { toast } from 'react-toastify'
import { Upload, FileText, X, CheckCircle } from 'lucide-react'

interface DocumentUploadProps {
  applicationId: string
  documentType: string
  onUploadComplete?: () => void
}

export function DocumentUpload({ applicationId, documentType, onUploadComplete }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      await vendorApi.uploadDocument(applicationId, documentType, file)
      setUploadedFile(file.name)
      toast.success('Document uploaded successfully!')
      onUploadComplete?.()
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload document')
    } finally {
      setUploading(false)
    }
  }, [applicationId, documentType, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  })

  const clearFile = () => {
    setUploadedFile(null)
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'id_proof':
        return 'ID Proof (Aadhaar, Passport, Driving License)'
      case 'address_proof':
        return 'Address Proof (Utility Bill, Bank Statement)'
      case 'business_license':
        return 'Business License / Registration Certificate'
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  if (uploadedFile) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-800">
                {getDocumentTypeLabel(documentType)}
              </p>
              <p className="text-sm text-green-600">{uploadedFile}</p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="text-green-700 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {getDocumentTypeLabel(documentType)} *
      </label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="spinner" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isDragActive ? 'Drop the file here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, PDF up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}