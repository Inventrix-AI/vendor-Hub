import Link from 'next/link'
import { 
  Building2, 
  Shield, 
  CreditCard, 
  FileCheck, 
  ArrowRight, 
  CheckCircle, 
  Zap,
  Users,
  TrendingUp,
  Star
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Modern Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-neutral-200/60 sticky top-0 z-50">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-neutral-900">vendorHub</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-neutral-600 hover:text-neutral-900 transition-colors">Features</a>
              <a href="#process" className="text-neutral-600 hover:text-neutral-900 transition-colors">Process</a>
              <a href="#contact" className="text-neutral-600 hover:text-neutral-900 transition-colors">Contact</a>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/auth/login" className="btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="section-padding gradient-subtle relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent"></div>
        <div className="container-fluid relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4 mr-2" />
                Streamlined Vendor Onboarding
              </div>
              
              <h1 className="text-display-2xl text-neutral-900 mb-6">
                Transform Your
                <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"> Vendor Onboarding</span>
              </h1>
              
              <p className="text-body-lg mb-8 max-w-lg">
                Experience seamless vendor registration with secure document management, 
                automated verification, and integrated payment processing. Built for modern businesses.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/auth/register" className="btn btn-primary btn-lg group">
                  Start Your Application
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/admin/dashboard" className="btn btn-secondary btn-lg">
                  Admin Dashboard
                </Link>
              </div>
              
              <div className="flex items-center space-x-6 text-body-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Free Setup</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Secure Processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
            
            <div className="relative animate-float">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-neutral-200/60">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-500">Application Status</span>
                    <span className="status-badge status-success">Approved</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">Business Registration</div>
                        <div className="text-sm text-neutral-500">Completed</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">Document Verification</div>
                        <div className="text-sm text-neutral-500">Verified</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">Payment Processing</div>
                        <div className="text-sm text-neutral-500">Completed</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-800">Vendor ID: VND2024-001</div>
                    <div className="text-xs text-green-600 mt-1">Welcome to the vendor network!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section-padding bg-white">
        <div className="container-fluid">
          <div className="text-center mb-16">
            <h2 className="text-display-lg text-neutral-900 mb-4">
              Everything You Need to Onboard Vendors
            </h2>
            <p className="text-body-lg max-w-2xl mx-auto">
              Our comprehensive platform handles every aspect of vendor onboarding, 
              from initial registration to final approval.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card group cursor-pointer">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-display-md mb-3">Smart Registration</h3>
              <p className="text-body-md mb-4">
                Intelligent forms that adapt to your business type with guided completion and real-time validation.
              </p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                Learn more <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
            
            <div className="card group cursor-pointer">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-display-md mb-3">Secure Verification</h3>
              <p className="text-body-md mb-4">
                Advanced document verification with AI-powered validation and manual review by certified experts.
              </p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                Learn more <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
            
            <div className="card group cursor-pointer">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-display-md mb-3">Payment Integration</h3>
              <p className="text-body-md mb-4">
                Seamless payment processing with multiple payment methods and automated receipt generation.
              </p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                Learn more <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
            
            <div className="card group cursor-pointer">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-display-md mb-3">Real-time Tracking</h3>
              <p className="text-body-md mb-4">
                Live status updates with email and SMS notifications at every step of the approval process.
              </p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                Learn more <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
            
            <div className="card group cursor-pointer">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-display-md mb-3">Admin Dashboard</h3>
              <p className="text-body-md mb-4">
                Powerful admin tools with analytics, bulk operations, and comprehensive reporting capabilities.
              </p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                Learn more <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
            
            <div className="card group cursor-pointer">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-display-md mb-3">Analytics & Reports</h3>
              <p className="text-body-md mb-4">
                Detailed insights into your onboarding process with custom reports and performance metrics.
              </p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                Learn more <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="section-padding gradient-subtle">
        <div className="container-narrow">
          <div className="text-center mb-16">
            <h2 className="text-display-lg text-neutral-900 mb-4">
              Simple 4-Step Process
            </h2>
            <p className="text-body-lg">
              Get from application to approval in just a few simple steps
            </p>
          </div>
          
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
                1
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-display-md mb-2">Register & Submit Application</h3>
                <p className="text-body-md">
                  Create your account and submit your business application with basic company information.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
                2
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-display-md mb-2">Upload Required Documents</h3>
                <p className="text-body-md">
                  Securely upload business licenses, tax certificates, and identity documents with version control.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
                3
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-display-md mb-2">Complete Payment Process</h3>
                <p className="text-body-md">
                  Make secure payment for application processing using our integrated payment system.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
                4
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-display-md mb-2">Get Approved & Start Business</h3>
                <p className="text-body-md">
                  Receive approval notification and your unique vendor ID to start doing business with us.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-white">
        <div className="container-narrow text-center">
          <div className="card-spacious">
            <h2 className="text-display-lg text-neutral-900 mb-4">
              Ready to Transform Your Vendor Onboarding?
            </h2>
            <p className="text-body-lg mb-8 max-w-2xl mx-auto">
              Join thousands of businesses who have streamlined their vendor onboarding process with vendorHub.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/auth/register" className="btn btn-primary btn-lg group">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/admin/reports" className="btn btn-secondary btn-lg">
                View Demo
              </Link>
            </div>
            
            <div className="flex items-center justify-center space-x-6 text-body-sm">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="ml-2 text-neutral-600">5.0 (124 reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-neutral-900 text-neutral-300 section-padding-sm">
        <div className="container-fluid">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">vendorHub</span>
              </div>
              <p className="text-body-sm mb-4">
                Streamlining vendor onboarding with modern technology and exceptional user experience.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-body-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#process" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="/admin/reports" className="hover:text-white transition-colors">Analytics</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-body-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-body-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-neutral-800 pt-8 text-center text-body-sm">
            <p>&copy; 2024 vendorHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}