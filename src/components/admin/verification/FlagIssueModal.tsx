'use client'

import React, { useState } from 'react'
import { X, Flag, AlertTriangle } from 'lucide-react'

interface FlagIssueModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
  documentType: string
}

const COMMON_ISSUES = [
  'Document is blurry or unclear',
  'Document is incomplete or cut off',
  'Document appears to be altered or modified',
  'Information does not match application details',
  'Document is expired',
  'Wrong document type uploaded',
  'Document is not in an acceptable format',
  'Name on document does not match'
]

export function FlagIssueModal({
  isOpen,
  onClose,
  onSubmit,
  documentType
}: FlagIssueModalProps) {
  const [reason, setReason] = useState('')
  const [selectedIssue, setSelectedIssue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const finalReason = selectedIssue === 'other' ? reason : selectedIssue

    if (!finalReason.trim()) {
      setError('Please select or enter a reason for flagging')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(finalReason)
      setReason('')
      setSelectedIssue('')
      onClose()
    } catch (err) {
      setError('Failed to flag document. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleIssueSelect = (issue: string) => {
    setSelectedIssue(issue)
    if (issue !== 'other') {
      setReason(issue)
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
              <div className="p-2 bg-red-100 rounded-full mr-3">
                <Flag className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Flag Issue</h3>
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
              Flagging issue for: <span className="font-medium text-gray-900">{formatDocumentType(documentType)}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Common Issues */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select an issue
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {COMMON_ISSUES.map((issue) => (
                  <label
                    key={issue}
                    className={`
                      flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                      ${selectedIssue === issue
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="issue"
                      value={issue}
                      checked={selectedIssue === issue}
                      onChange={() => handleIssueSelect(issue)}
                      className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">{issue}</span>
                  </label>
                ))}
                <label
                  className={`
                    flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                    ${selectedIssue === 'other'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="issue"
                    value="other"
                    checked={selectedIssue === 'other'}
                    onChange={() => handleIssueSelect('other')}
                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <span className="ml-3 text-sm text-gray-700">Other (specify below)</span>
                </label>
              </div>
            </div>

            {/* Custom Reason */}
            {selectedIssue === 'other' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the issue
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter the reason for flagging this document..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
            )}

            {/* Warning */}
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700">
                  Flagging this document will mark it for review. The vendor will be notified about the issue.
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
                disabled={isSubmitting || (!selectedIssue)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Flagging...
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4 mr-2" />
                    Flag Document
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
