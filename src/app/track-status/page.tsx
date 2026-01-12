'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, FileText, User, MapPin, Building, Clock, CheckCircle, XCircle, AlertCircle, Copy, Phone, Mail } from 'lucide-react';
import { useLanguage } from '@/lib/language';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';

interface ApplicationData {
  application_id: string;
  vendor_id?: string;
  status: string;
  payment_status: string;
  shop_name: string;
  business_type: string;
  applicant_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  submitted_at: string;
  rejection_reason?: string;
  documents: {
    type: string;
    filename: string;
    uploaded_at: string;
  }[];
  payment?: {
    amount: number;
    status: string;
    order_id: string;
  };
}

export default function TrackStatusPage() {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const [applicationId, setApplicationId] = useState(searchParams.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    pending: <Clock className="w-5 h-5" />,
    under_review: <AlertCircle className="w-5 h-5" />,
    approved: <CheckCircle className="w-5 h-5" />,
    rejected: <XCircle className="w-5 h-5" />
  };

  const statusTexts = {
    pending: {
      hi: 'लंबित',
      en: 'Pending'
    },
    under_review: {
      hi: 'समीक्षाधीन',
      en: 'Under Review'
    },
    approved: {
      hi: 'स्वीकृत',
      en: 'Approved'
    },
    rejected: {
      hi: 'अस्वीकृत',
      en: 'Rejected'
    }
  };

  const businessTypeTexts = {
    retailer: { hi: 'खुदरा व्यापारी', en: 'Retailer' },
    grocery: { hi: 'किराना स्टोर', en: 'Grocery Store' },
    pan_shop: { hi: 'पान दुकान', en: 'Pan Shop' },
    street_vendor: { hi: 'पथ विक्रेता', en: 'Street Vendor' },
    wholesale: { hi: 'होलेसेल व्यापारी', en: 'Wholesale Trader' }
  };

  const documentTypeTexts = {
    id_document: { hi: 'पहचान पत्र', en: 'ID Document' },
    photo: { hi: 'फोटो', en: 'Photo' },
    shop_document: { hi: 'दुकान के दस्तावेज़', en: 'Shop Document' },
    shop_photo: { hi: 'दुकान की तस्वीर', en: 'Shop Photo' }
  };

  const handleSearch = async () => {
    if (!applicationId.trim()) {
      setError(language === 'hi' ? 'कृपया आवेदन ID दर्ज करें' : 'Please enter Application ID');
      return;
    }

    setLoading(true);
    setError(null);
    setApplicationData(null);

    try {
      const response = await fetch(`/api/vendor-register?applicationId=${encodeURIComponent(applicationId.trim())}`);
      const data = await response.json();

      if (response.ok) {
        setApplicationData(data);
      } else {
        setError(data.error || (language === 'hi' ? 'आवेदन नहीं मिला' : 'Application not found'));
      }
    } catch (err) {
      setError(language === 'hi' ? 'खोजने में त्रुटि हुई' : 'Error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(language === 'hi' ? 'कॉपी हो गया!' : 'Copied to clipboard!');
    } catch (err) {
      toast.error(language === 'hi' ? 'कॉपी नहीं हो सका' : 'Failed to copy');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 ${language === 'hi' ? 'font-mixed' : 'font-sans'}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-16 px-4">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/Path Vikreta.png"
                alt="Path Vikreta Ekta Sangh Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-lg font-bold text-blue-600">
                  {language === 'hi' ? 'आवेदन की स्थिति ट्रैक करें' : 'Track Application Status'}
                </h1>
                <p className="text-xs text-neutral-600">
                  {language === 'hi' ? 'पथ विक्रेता एकता संघ' : 'Path Vikreta Ekta Sangh'}
                </p>
              </div>
            </Link>

            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="container-fluid py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Search Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                {language === 'hi' ? 'आवेदन खोजें' : 'Search Application'}
              </h2>
              <p className="text-gray-600">
                {language === 'hi' 
                  ? 'अपने आवेदन की स्थिति जानने के लिए आवेदन ID दर्ज करें' 
                  : 'Enter your Application ID to check the status'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <div className="flex-1">
                <input
                  type="text"
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  placeholder={language === 'hi' ? 'आवेदन ID दर्ज करें (जैसे: APP_20240123_ABC123)' : 'Enter Application ID (e.g., APP_20240123_ABC123)'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>{language === 'hi' ? 'खोजें' : 'Search'}</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Application Details */}
          {applicationData && (
            <div className="space-y-6">
              {/* Status Overview */}
              <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {language === 'hi' ? 'आवेदन की स्थिति' : 'Application Status'}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {language === 'hi' ? 'आवेदन ID:' : 'Application ID:'}
                      </span>
                      <span className="font-mono font-bold text-gray-900">{applicationData.application_id}</span>
                      <button
                        onClick={() => copyToClipboard(applicationData.application_id)}
                        className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                        title={language === 'hi' ? 'कॉपी करें' : 'Copy'}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0">
                    <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
                      statusColors[applicationData.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {statusIcons[applicationData.status as keyof typeof statusIcons]}
                      <span>{statusTexts[applicationData.status as keyof typeof statusTexts]?.[language] || applicationData.status}</span>
                    </span>
                  </div>
                </div>

                {applicationData.vendor_id && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        {language === 'hi' ? 'विक्रेता ID:' : 'Vendor ID:'}
                      </span>
                      <span className="font-mono font-bold text-blue-900">{applicationData.vendor_id}</span>
                      <button
                        onClick={() => copyToClipboard(applicationData.vendor_id!)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {applicationData.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-red-900 mb-2">
                      {language === 'hi' ? 'अस्वीकृति का कारण:' : 'Rejection Reason:'}
                    </h4>
                    <p className="text-red-800">{applicationData.rejection_reason}</p>
                  </div>
                )}
              </div>

              {/* Business Details */}
              <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                  <Building className="w-6 h-6 text-blue-600" />
                  <span>{language === 'hi' ? 'व्यवसाय विवरण' : 'Business Details'}</span>
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'hi' ? 'दुकान का नाम' : 'Shop Name'}
                    </label>
                    <p className="text-lg font-semibold text-gray-900">{applicationData.shop_name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'hi' ? 'व्यवसाय का प्रकार' : 'Business Type'}
                    </label>
                    <p className="text-lg text-gray-900">
                      {businessTypeTexts[applicationData.business_type as keyof typeof businessTypeTexts]?.[language] || applicationData.business_type}
                    </p>
                  </div>

                  {applicationData.applicant_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'hi' ? 'आवेदक का नाम' : 'Applicant Name'}
                      </label>
                      <p className="text-lg text-gray-900">{applicationData.applicant_name}</p>
                    </div>
                  )}

                  {applicationData.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{language === 'hi' ? 'फोन' : 'Phone'}</span>
                      </label>
                      <p className="text-lg text-gray-900">{applicationData.phone}</p>
                    </div>
                  )}

                  {applicationData.email && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{language === 'hi' ? 'ईमेल' : 'Email'}</span>
                      </label>
                      <p className="text-lg text-gray-900">{applicationData.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Details */}
              {applicationData.address && (
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                    <MapPin className="w-6 h-6 text-blue-600" />
                    <span>{language === 'hi' ? 'पता' : 'Address'}</span>
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'hi' ? 'पूरा पता' : 'Full Address'}
                      </label>
                      <p className="text-gray-900">{applicationData.address}</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {applicationData.city && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'hi' ? 'शहर' : 'City'}
                          </label>
                          <p className="text-gray-900">{applicationData.city}</p>
                        </div>
                      )}
                      
                      {applicationData.state && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'hi' ? 'राज्य' : 'State'}
                          </label>
                          <p className="text-gray-900">{applicationData.state}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Documents */}
              {applicationData.documents.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <span>{language === 'hi' ? 'अपलोड किए गए दस्तावेज़' : 'Uploaded Documents'}</span>
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {applicationData.documents.map((doc, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {documentTypeTexts[doc.type as keyof typeof documentTypeTexts]?.[language] || doc.type}
                            </h4>
                            <p className="text-sm text-gray-600">{doc.filename}</p>
                            <p className="text-xs text-gray-500">
                              {language === 'hi' ? 'अपलोड:' : 'Uploaded:'} {formatDate(doc.uploaded_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Details */}
              {applicationData.payment && (
                <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    {language === 'hi' ? 'भुगतान विवरण' : 'Payment Details'}
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'hi' ? 'राशि' : 'Amount'}
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        ₹{(applicationData.payment.amount / 100).toFixed(2)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'hi' ? 'भुगतान स्थिति' : 'Payment Status'}
                      </label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        applicationData.payment.status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : applicationData.payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {applicationData.payment.status === 'success' 
                          ? (language === 'hi' ? 'सफल' : 'Success')
                          : applicationData.payment.status === 'pending'
                          ? (language === 'hi' ? 'लंबित' : 'Pending')
                          : (language === 'hi' ? 'विफल' : 'Failed')
                        }
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'hi' ? 'ऑर्डर ID' : 'Order ID'}
                      </label>
                      <p className="text-sm font-mono text-gray-900">{applicationData.payment.order_id}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  {language === 'hi' ? 'आवेदन समयरेखा' : 'Application Timeline'}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {language === 'hi' ? 'आवेदन जमा किया गया' : 'Application Submitted'}
                      </h4>
                      <p className="text-sm text-gray-600">{formatDate(applicationData.submitted_at)}</p>
                    </div>
                  </div>

                  {applicationData.payment && applicationData.payment.status === 'success' && (
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {language === 'hi' ? 'भुगतान सफल' : 'Payment Successful'}
                        </h4>
                        <p className="text-sm text-gray-600">₹{(applicationData.payment.amount / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      applicationData.status === 'approved' 
                        ? 'bg-green-100' 
                        : applicationData.status === 'rejected'
                        ? 'bg-red-100'
                        : applicationData.status === 'under_review'
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}>
                      {statusIcons[applicationData.status as keyof typeof statusIcons]}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {language === 'hi' ? 'वर्तमान स्थिति' : 'Current Status'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {statusTexts[applicationData.status as keyof typeof statusTexts]?.[language] || applicationData.status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Help Section */}
              <div className="bg-blue-50 rounded-2xl p-6">
                <h4 className="font-bold text-blue-900 mb-4">
                  {language === 'hi' ? 'सहायता की आवश्यकता है?' : 'Need Help?'}
                </h4>
                <div className="space-y-2 text-blue-800">
                  <p>
                    {language === 'hi' 
                      ? '• आवेदन से संबंधित किसी भी प्रश्न के लिए हमसे संपर्क करें' 
                      : '• Contact us for any questions related to your application'}
                  </p>
                  <p>
                    {language === 'hi' 
                      ? '• ईमेल: support@pathvikreta.org' 
                      : '• Email: support@pathvikreta.org'}
                  </p>
                  <p>
                    {language === 'hi' 
                      ? '• फोन: +91 12345 67890' 
                      : '• Phone: +91 12345 67890'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}