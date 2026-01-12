'use client'

import React, { useState } from 'react'
import { X, Upload, Mail } from 'lucide-react'

interface RequestReuploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
  documentType: string
}

const REUPLOAD_REASONS = [
  'Document quality is too low - please upload a clearer image',
  'Document is partially visible - please upload a complete scan',
  'Document is expired - please upload a current valid document',
  'Wrong document type - please upload the correct document',
  'File format not supported - please upload in JPG, PNG, or PDF format',
  'Document information is unreadable - please upload a better quality scan'
]

export function RequestReuploadModal({
  isOpen,
  onClose,
  onSubmit,
  documentType
}: RequestReuploadModalProps) {
  const [reason, setReason] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const finalReason = selectedReason === 'other' ? reason : selectedReason

    if (!finalReason.trim()) {
      setError('Please select or enter a reason for re-upload request')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(finalReason)
      setReason('')
      setSelectedReason('')
      onClose()
    } catch (err) {
      setError('Failed to request re-upload. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReasonSelect = (selectedValue: string) => {
    setSelectedReason(selectedValue)
    if (selectedValue !== 'other') {
      setReason(selectedValue)
    } else {
      setReason('')
    }
  }

  if (!isOpen) return null

  const formatDocumentType = (type: string) =>
    type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-full mr-3">
                <Upload className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Request Re-upload</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Document Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Requesting re-upload for: <span className="font-medium text-gray-900">{formatDocumentType(documentType)}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Common Reasons */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select a reason
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {REUPLOAD_REASONS.map((reasonOption) => (
                  <label
                    key={reasonOption}
                    className={`
                      flex items-start p-3 border rounded-lg cursor-pointer transition-colors
                      ${selectedReason === reasonOption
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reasonOption}
                      checked={selectedReason === reasonOption}
                      onChange={() => handleReasonSelect(reasonOption)}
                      className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 mt-0.5"
                    />
                    <span className="ml-3 text-sm text-gray-700">{reasonOption}</span>
                  </label>
                ))}
                <label
                  className={`
                    flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                    ${selectedReason === 'other'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="reason"
                    value="other"
                    checked={selectedReason === 'other'}
                    onChange={() => handleReasonSelect('other')}
                    className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">Other (specify below)</span>
                </label>
              </div>
            </div>

            {/* Custom Reason */}
            {selectedReason === 'other' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe what you need
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why a new document is needed..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
            )}

            {/* Email Notice */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  An email notification will be sent to the vendor with instructions to upload a new document.
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (!selectedReason)}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Request Re-upload
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
