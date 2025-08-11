'use client'

import React, { useEffect } from 'react'
import { paymentApi } from '@/lib/api'
import { toast } from 'react-toastify'
import { X, CreditCard } from 'lucide-react'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  applicationId: string
  amount: number
  onPaymentSuccess: () => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export function PaymentModal({
  isOpen,
  onClose,
  applicationId,
  amount,
  onPaymentSuccess
}: PaymentModalProps) {
  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handlePayment = async () => {
    try {
      // Create order
      const orderResponse = await paymentApi.createOrder({
        application_id: applicationId,
        amount: amount
      })

      const options = {
        key: orderResponse.key,
        amount: orderResponse.amount * 100, // Convert to paise
        currency: orderResponse.currency,
        name: 'Vendor Onboarding System',
        description: `Payment for application ${applicationId}`,
        order_id: orderResponse.razorpay_order_id,
        handler: async (response: any) => {
          try {
            // Verify payment
            await paymentApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
            
            toast.success('Payment successful!')
            onPaymentSuccess()
            onClose()
          } catch (error) {
            toast.error('Payment verification failed')
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed')
          }
        },
        prefill: {
          email: 'customer@example.com', // This should come from user data
        },
        theme: {
          color: '#2563eb'
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      toast.error('Failed to initiate payment')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Complete Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Application ID:</span>
              <span className="text-sm font-medium text-gray-900">{applicationId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Amount to pay:</span>
              <span className="text-lg font-bold text-gray-900">₹{amount}</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800">Secure Payment</h4>
                <p className="text-sm text-blue-700">
                  Your payment is processed securely through Razorpay. We accept all major credit/debit cards, UPI, and net banking.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handlePayment}
            className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
          >
            <CreditCard className="h-4 w-4" />
            <span>Pay ₹{amount}</span>
          </button>

          <p className="text-xs text-gray-500 text-center">
            By proceeding, you agree to our terms and conditions. Your application will be processed once payment is confirmed.
          </p>
        </div>
      </div>
    </div>
  )
}