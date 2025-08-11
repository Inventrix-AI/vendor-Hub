import Link from 'next/link'
import { Building2, Shield, CreditCard, FileCheck } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Vendor Onboarding System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamlined vendor verification and onboarding with secure document upload, 
            payment processing, and real-time status tracking.
          </p>
        </header>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="card text-center">
            <Building2 className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Business Registration</h3>
            <p className="text-gray-600">Complete business profile and document submission</p>
          </div>
          
          <div className="card text-center">
            <Shield className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Secure Verification</h3>
            <p className="text-gray-600">Multi-step verification with document review</p>
          </div>
          
          <div className="card text-center">
            <CreditCard className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payment Integration</h3>
            <p className="text-gray-600">Secure payment processing with Razorpay</p>
          </div>
          
          <div className="card text-center">
            <FileCheck className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Real-time Tracking</h3>
            <p className="text-gray-600">Track application status and get instant notifications</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="text-center space-y-4 mb-16">
          <div className="space-x-4">
            <Link href="/auth/register" className="btn-primary text-lg px-8 py-3">
              Start Application
            </Link>
            <Link href="/auth/login" className="btn-secondary text-lg px-8 py-3">
              Login
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            Already have an account? <Link href="/auth/login" className="text-primary-600 hover:underline">Sign in here</Link>
          </p>
        </div>

        {/* Process Flow */}
        <div className="card max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Register & Submit</h3>
              <p className="text-sm text-gray-600">Create account and submit your business application</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Upload Documents</h3>
              <p className="text-sm text-gray-600">Upload required business and identity documents</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Make Payment</h3>
              <p className="text-sm text-gray-600">Complete secure payment to process application</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold mb-2">Get Approved</h3>
              <p className="text-sm text-gray-600">Receive approval and unique vendor ID</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}