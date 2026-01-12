'use client'

import React, { useState, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, Download, Eye, RotateCw, Maximize, Minimize, Grid, FileText } from 'lucide-react'

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
  storage_url?: string // Supabase Storage URL
}

interface DocumentViewerProps {
  documents: Document[]
  isOpen: boolean
  onClose: () => void
}

export function DocumentViewer({ documents, isOpen, onClose }: DocumentViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [zoom, setZoom] = useState(100)
  const [fitToContainer, setFitToContainer] = useState(true)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [compareDocuments, setCompareDocuments] = useState<Document[]>([])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target && (event.target as HTMLElement).tagName === 'INPUT') return

      switch (event.key) {
        case 'Escape':
          onClose()
          break
        case '=':
        case '+':
          event.preventDefault()
          handleZoomIn()
          break
        case '-':
          event.preventDefault()
          handleZoomOut()
          break
        case 'r':
        case 'R':
          event.preventDefault()
          handleRotate()
          break
        case 'f':
        case 'F':
          event.preventDefault()
          setIsFullscreen(!isFullscreen)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isFullscreen, onClose])

  if (!isOpen) return null

  // Helper functions to get document properties
  const getDocumentName = (doc: Document) => 
    doc.document_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  const getDocumentUrl = (doc: Document) => 
    `/api/documents/${doc.id}`
  
  const getDocumentType = (doc: Document) => 
    doc.mime_type

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

  const handleDocumentSelect = (doc: Document) => {
    if (compareMode && compareDocuments.length < 2 && !compareDocuments.find(d => d.id === doc.id)) {
      setCompareDocuments([...compareDocuments, doc])
    } else {
      setSelectedDocument(doc)
      setCompareMode(false)
      setCompareDocuments([])
      // Reset view when selecting new document
      setFitToContainer(true)
      setZoom(100)
      setRotation(0)
    }
  }

  const toggleCompareMode = () => {
    setCompareMode(!compareMode)
    setCompareDocuments([])
    setSelectedDocument(null)
  }

  const removeFromCompare = (docId: string | number) => {
    setCompareDocuments(compareDocuments.filter(d => d.id !== docId))
  }

  const downloadDocument = (doc: Document) => {
    const link = document.createElement('a')
    link.href = getDocumentUrl(doc)
    link.download = doc.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const renderImageViewer = (doc: Document, className = '') => {
    const isImage = getDocumentType(doc).startsWith('image/')

    return (
      <div className={`relative ${className} flex items-center justify-center min-h-96 bg-gray-50 rounded-lg overflow-auto`}>
        {isImage ? (
          <div className={`relative ${fitToContainer ? 'w-full h-full flex items-center justify-center' : ''}`}>
            <img
              src={getDocumentUrl(doc)}
              alt={getDocumentName(doc)}
              className={`shadow-lg rounded-md cursor-pointer ${fitToContainer ? 'max-w-full max-h-[60vh] object-contain' : 'max-w-none'}`}
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
        ) : (
          <div className="text-center p-8">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {getDocumentName(doc)}
            </h3>
            <p className="text-gray-500 mb-4">
              This file type cannot be previewed
            </p>
            <button
              onClick={() => downloadDocument(doc)}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              <Download className="h-4 w-4" />
              <span>Download File</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderPDFViewer = (doc: Document, className = '') => (
    <div className={`${className}`}>
      <iframe
        src={getDocumentUrl(doc)}
        className="w-full h-96 border border-gray-300 rounded-lg"
        title={getDocumentName(doc)}
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
    <div className={`fixed inset-0 z-50 ${isFullscreen ? 'bg-black' : 'bg-black bg-opacity-75'} flex items-center justify-center p-4`}>
      <div className={`${isFullscreen ? 'w-full h-full' : 'max-w-7xl max-h-full w-full'} bg-white rounded-lg shadow-2xl flex flex-col`}>
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-900">Document Viewer</h2>
            <div className="text-sm text-gray-500">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleCompareMode}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  compareMode
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Grid className="h-4 w-4 mr-1 inline" />
                {compareMode ? 'Exit Compare' : 'Compare'}
              </button>
            </div>
          </div>

          {/* Enhanced Controls */}
          <div className="flex items-center space-x-2">
            {selectedDocument && getDocumentType(selectedDocument).startsWith('image/') && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                
                <span className="text-sm text-gray-600 px-2 min-w-[60px] text-center">
                  {fitToContainer ? 'Fit' : `${zoom}%`}
                </span>
                
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-2"></div>

                <button
                  onClick={handleRotate}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                  title="Rotate (R)"
                >
                  <RotateCw className="h-4 w-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-2"></div>
              </>
            )}

            {selectedDocument && (
              <button
                onClick={() => downloadDocument(selectedDocument)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
              title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
              title="Close (ESC)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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
                        {getDocumentName(doc)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {doc.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
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
                      {getDocumentName(doc)}
                    </h4>
                    {getDocumentType(doc).startsWith('image/') 
                      ? renderImageViewer(doc, 'flex-1')
                      : renderPDFViewer(doc, 'flex-1')
                    }
                  </div>
                ))}
              </div>
            ) : selectedDocument ? (
              <div>
                <h4 className="font-medium text-gray-900 mb-4">
                  {getDocumentName(selectedDocument)}
                </h4>
                {getDocumentType(selectedDocument).startsWith('image/')
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

        {/* Footer with keyboard shortcuts */}
        {selectedDocument && getDocumentType(selectedDocument).startsWith('image/') && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Double-click image to reset view</span>
                <span>•</span>
                <span>Use mouse wheel to zoom</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">+/-</kbd>
                  <span>zoom</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">R</kbd>
                  <span>rotate</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">F</kbd>
                  <span>fullscreen</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">ESC</kbd>
                  <span>close</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}