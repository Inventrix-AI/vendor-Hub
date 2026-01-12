'use client'

import React from 'react'
import { Check } from 'lucide-react'

interface VerificationProgressProps {
  currentStep: 'personal' | 'business' | 'summary'
  personalVerified: boolean
  businessVerified: boolean
}

export function VerificationProgress({
  currentStep,
  personalVerified,
  businessVerified
}: VerificationProgressProps) {
  const steps = [
    { id: 'personal', label: 'Personal', verified: personalVerified },
    { id: 'business', label: 'Business', verified: businessVerified },
    { id: 'summary', label: 'Summary', verified: personalVerified && businessVerified }
  ]

  const getStepStatus = (stepId: string, index: number) => {
    if (stepId === currentStep) return 'current'
    if (steps[index].verified) return 'completed'
    return 'pending'
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id, index)

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${status === 'completed'
                      ? 'bg-green-600 text-white'
                      : status === 'current'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {status === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-sm font-medium
                    ${status === 'current' ? 'text-blue-600' : status === 'completed' ? 'text-green-600' : 'text-gray-500'}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`
                    w-24 h-1 mx-2 rounded
                    ${steps[index].verified ? 'bg-green-600' : 'bg-gray-200'}
                  `}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
