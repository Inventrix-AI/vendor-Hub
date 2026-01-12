'use client'

import React from 'react'
import { Check, X } from 'lucide-react'

interface DetailFieldProps {
  label: string
  value: string | number | null | undefined
  verified?: boolean
  onVerify?: () => void
  className?: string
}

export function DetailField({
  label,
  value,
  verified,
  onVerify,
  className = ''
}: DetailFieldProps) {
  const displayValue = value || 'Not provided'
  const isEmpty = !value

  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-500 mb-1">
        {label}
      </label>
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        <span className={`text-gray-900 ${isEmpty ? 'text-gray-400 italic' : ''}`}>
          {displayValue}
        </span>
        {verified !== undefined && (
          <span
            className={`
              inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
              ${verified
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
              }
            `}
          >
            {verified ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Verified
              </>
            ) : (
              'Pending'
            )}
          </span>
        )}
      </div>
    </div>
  )
}

interface DetailFieldGroupProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function DetailFieldGroup({ title, children, className = '' }: DetailFieldGroupProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
        {title}
      </h3>
      {children}
    </div>
  )
}
