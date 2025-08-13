'use client'

import React, { useState } from 'react'
import { X, ZoomIn, ZoomOut, Download, Eye } from 'lucide-react'

interface Document {
  id: string
  name: string
  type: string
  url: string
  uploadedAt: string
}

interface DocumentViewerProps {
  documents: Document[]
  isOpen: boolean
  onClose: () => void
}

export function DocumentViewer({ documents, isOpen, onClose }: DocumentViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [zoom, setZoom] = useState(1)
  const [compareMode, setCompareMode] = useState(false)
  const [compareDocuments, setCompareDocuments] = useState<Document[]>([])

  if (!isOpen) return null

  const handleDocumentSelect = (doc: Document) => {
    if (compareMode && compareDocuments.length < 2 && !compareDocuments.find(d => d.id === doc.id)) {
      setCompareDocuments([...compareDocuments, doc])
    } else {
      setSelectedDocument(doc)
      setCompareMode(false)
      setCompareDocuments([])
    }
  }

  const toggleCompareMode = () => {
    setCompareMode(!compareMode)
    setCompareDocuments([])
    setSelectedDocument(null)
  }

  const removeFromCompare = (docId: string) => {
    setCompareDocuments(compareDocuments.filter(d => d.id !== docId))
  }

  const downloadDocument = (doc: Document) => {
    // Create download link
    const link = document.createElement('a')
    link.href = doc.url
    link.download = doc.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderImageViewer = (doc: Document, className = '') => (
    <div className={`relative ${className}`}>
      <div className="bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={doc.url}
          alt={doc.name}
          className="w-full h-auto"
          style={{ transform: `scale(${zoom})` }}
        />
      </div>
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoom(Math.min(3, zoom + 0.25))}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => downloadDocument(doc)}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  const renderPDFViewer = (doc: Document, className = '') => (
    <div className={`${className}`}>
      <iframe
        src={doc.url}
        className="w-full h-96 border border-gray-300 rounded-lg"
        title={doc.name}
      />
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => downloadDocument(doc)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download PDF</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">Document Viewer</h2>
            <button
              onClick={toggleCompareMode}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                compareMode
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {compareMode ? 'Exit Compare Mode' : 'Compare Documents'}
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Document List */}
          <div className="w-1/3 border-r p-4 overflow-y-auto">
            <h3 className="font-medium text-gray-900 mb-4">
              Documents ({documents.length})
            </h3>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleDocumentSelect(doc)}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedDocument?.id === doc.id ? 'border-blue-500 bg-blue-50' : ''
                  } ${
                    compareDocuments.find(d => d.id === doc.id) ? 'border-green-500 bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Eye className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.type} • {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {compareMode && compareDocuments.find(d => d.id === doc.id) && (
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-green-600 font-medium">
                        Selected for comparison
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromCompare(doc.id)
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {compareMode && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  Compare Mode Active
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Select up to 2 documents to compare side by side
                </p>
                <p className="text-xs text-blue-600">
                  Selected: {compareDocuments.length}/2
                </p>
              </div>
            )}
          </div>

          {/* Document Viewer */}
          <div className="flex-1 p-6 overflow-auto">
            {compareMode && compareDocuments.length === 2 ? (
              <div className="grid grid-cols-2 gap-6 h-full">
                {compareDocuments.map((doc, index) => (
                  <div key={doc.id} className="flex flex-col">
                    <h4 className="font-medium text-gray-900 mb-3">
                      {doc.name}
                    </h4>
                    {doc.type.startsWith('image/') 
                      ? renderImageViewer(doc, 'flex-1')
                      : renderPDFViewer(doc, 'flex-1')
                    }
                  </div>
                ))}
              </div>
            ) : selectedDocument ? (
              <div>
                <h4 className="font-medium text-gray-900 mb-4">
                  {selectedDocument.name}
                </h4>
                {selectedDocument.type.startsWith('image/')
                  ? renderImageViewer(selectedDocument)
                  : renderPDFViewer(selectedDocument)
                }
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">
                    {compareMode 
                      ? 'Select documents to compare' 
                      : 'Select a document to view'
                    }
                  </p>
                  <p className="text-sm mt-2">
                    {compareMode
                      ? 'Choose up to 2 documents for side-by-side comparison'
                      : 'Click on any document from the list to view it here'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}