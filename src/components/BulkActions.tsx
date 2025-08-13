'use client'

import React, { useState } from 'react'
import { CheckCircle, XCircle, Download, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'

interface BulkActionsProps {
  selectedIds: string[]
  onActionComplete: () => void
  onClearSelection: () => void
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedIds,
  onActionComplete,
  onClearSelection
}) => {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleBulkAction = async (action: 'approve' | 'reject' | 'export' | 'delete') => {
    if (selectedIds.length === 0) {
      toast.error('No applications selected')
      return
    }

    setIsProcessing(true)
    
    try {
      switch (action) {
        case 'approve':
          await processBulkApproval()
          break
        case 'reject':
          await processBulkRejection()
          break
        case 'export':
          await exportApplications()
          break
        case 'delete':
          await deleteApplications()
          break
      }
      
      onActionComplete()
      onClearSelection()
      toast.success(`Successfully processed ${selectedIds.length} application(s)`)
    } catch (error) {
      console.error('Bulk action error:', error)
      toast.error('Failed to process bulk action')
    } finally {
      setIsProcessing(false)
    }
  }

  const processBulkApproval = async () => {
    // Process each application approval
    const promises = selectedIds.map(async (id) => {
      const response = await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'approved',
          application_data: { company_name: 'Bulk Approved', contact_email: 'bulk@example.com' }
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to approve application ${id}`)
      }
    })
    
    await Promise.all(promises)
  }

  const processBulkRejection = async () => {
    const rejectionReason = prompt('Enter rejection reason:')
    if (!rejectionReason) return
    
    const promises = selectedIds.map(async (id) => {
      const response = await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'rejected',
          rejection_reason: rejectionReason,
          application_data: { company_name: 'Bulk Rejected', contact_email: 'bulk@example.com' }
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to reject application ${id}`)
      }
    })
    
    await Promise.all(promises)
  }

  const exportApplications = async () => {
    // Create CSV export
    const applications = await Promise.all(
      selectedIds.map(async (id) => {
        const response = await fetch(`/api/admin?type=applications&id=${id}`)
        return response.json()
      })
    )
    
    const csvContent = generateCSV(applications)
    downloadCSV(csvContent, `applications_export_${new Date().toISOString().split('T')[0]}.csv`)
  }

  const deleteApplications = async () => {
    const confirmed = confirm(`Are you sure you want to delete ${selectedIds.length} application(s)? This action cannot be undone.`)
    if (!confirmed) return
    
    // Note: This would need a DELETE endpoint in the API
    toast.info('Delete functionality would be implemented with proper API endpoint')
  }

  const generateCSV = (applications: any[]) => {
    const headers = [
      'Application ID',
      'Company Name',
      'Contact Email',
      'Phone',
      'Business Type',
      'Status',
      'Submitted At'
    ]
    
    const rows = applications.map(app => [
      app.application_id,
      app.company_name,
      app.contact_email,
      app.phone,
      app.business_type,
      app.status,
      app.submitted_at
    ])
    
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n')
  }

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  if (selectedIds.length === 0) {
    return null
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-blue-900">
            {selectedIds.length} application(s) selected
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleBulkAction('approve')}
            disabled={isProcessing}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Approve All
          </button>
          
          <button
            onClick={() => handleBulkAction('reject')}
            disabled={isProcessing}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Reject All
          </button>
          
          <button
            onClick={() => handleBulkAction('export')}
            disabled={isProcessing}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </button>
          
          <button
            onClick={() => handleBulkAction('delete')}
            disabled={isProcessing}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </button>
          
          <button
            onClick={onClearSelection}
            disabled={isProcessing}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Clear Selection
          </button>
        </div>
      </div>
      
      {isProcessing && (
        <div className="mt-2">
          <div className="text-xs text-blue-700">Processing bulk action...</div>
          <div className="w-full bg-blue-200 rounded-full h-1 mt-1">
            <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}
    </div>
  )
}