'use client'

import React, { useEffect, useState } from 'react'
import { paymentApi } from '@/lib/api'
import { toast } from 'react-toastify'
import { X, CreditCard, Wifi, WifiOff } from 'lucide-react'

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
  const [isOnline, setIsOnline] = useState(true)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial state
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    // Check if Razorpay script is already loaded
    if (window.Razorpay) {
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existingScript) {
      return
    }

    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    
    script.onload = () => {
      console.log('Razorpay script loaded successfully')
      setRazorpayLoaded(true)
    }
    
    script.onerror = () => {
      console.error('Failed to load Razorpay script')
      setRazorpayLoaded(false)
      toast.error('Failed to load payment system. Please check your internet connection and try again.')
    }
    
    document.body.appendChild(script)

    return () => {
      // Only remove if script exists and was added by this component
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const handlePayment = async () => {
    try {
      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        toast.error('Payment system not loaded. Please wait and try again.')
        return
      }

      // Create order via our API
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          applicationId
        })
      })

      const orderData = await orderResponse.json()
      if (!orderResponse.ok) throw new Error(orderData.error || 'Failed to create order')

      // Use the key from the server response (more secure) or fallback to env variable
      const razorpayKey = orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      
      if (!razorpayKey) {
        throw new Error('Razorpay key not configured')
      }

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Vendor Onboarding System',
        description: `Payment for application ${applicationId}`,
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                application_id: applicationId
              })
            })

            const verifyData = await verifyResponse.json()
            if (verifyResponse.ok) {
              toast.success('Payment successful!')
              
              // If we have credentials, redirect to success page
              if (verifyData.vendorId && verifyData.email && verifyData.temporaryPassword) {
                const successParams = new URLSearchParams({
                  applicationId: verifyData.applicationId,
                  vendorId: verifyData.vendorId,
                  email: verifyData.email,
                  password: verifyData.temporaryPassword,
                  paymentId: verifyData.paymentId,
                })
                window.location.href = `/vendor/success?${successParams.toString()}`
                return
              }
              
              onPaymentSuccess()
              onClose()
            } else {
              throw new Error(verifyData.error || 'Payment verification failed')
            }
          } catch (error) {
            console.error('Payment verification error:', error)
            toast.error(`Payment verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed by user')
          }
        },
        prefill: {
          email: 'customer@example.com',
        },
        theme: {
          color: '#2563eb'
        }
      }

      console.log('Opening Razorpay with options:', { ...options, key: razorpayKey.substring(0, 10) + '...' })
      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Payment initiation error:', error)
      toast.error(`Failed to initiate payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

          {!isOnline && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <WifiOff className="h-5 w-5 text-red-500" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">No Internet Connection</h4>
                  <p className="text-sm text-red-700">
                    Please check your internet connection and try again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isOnline && !razorpayLoaded && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Loading Payment System</h4>
                  <p className="text-sm text-yellow-700">
                    Please wait while we load the secure payment system...
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={!isOnline || !razorpayLoaded}
            className={`w-full flex items-center justify-center space-x-2 py-3 ${
              isOnline && (razorpayLoaded || window.Razorpay) 
                ? 'btn-primary' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>
              {!isOnline 
                ? 'No Internet Connection' 
                : !razorpayLoaded && !window.Razorpay
                ? 'Loading Payment System...'
                : `Pay ₹${amount}`
              }
            </span>
          </button>

          <p className="text-xs text-gray-500 text-center">
            By proceeding, you agree to our terms and conditions. Your application will be processed once payment is confirmed.
          </p>
        </div>
      </div>
    </div>
  )
}