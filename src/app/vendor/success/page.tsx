'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, Copy, Download, Eye, EyeOff, ArrowRight, FileText } from 'lucide-react';
import { useLanguage } from '@/lib/language';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { toast } from 'react-toastify';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});

  // Get data from URL params
  const applicationId = searchParams.get('applicationId');
  const vendorId = searchParams.get('vendorId');
  const email = searchParams.get('email');
  const password = searchParams.get('password');
  const paymentId = searchParams.get('paymentId');

  useEffect(() => {
    // If no data in URL params, redirect to home
    if (!applicationId || !vendorId || !email || !password) {
      router.push('/');
    }
  }, [applicationId, vendorId, email, password, router]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [field]: true });
      toast.success(
        language === 'hi' 
          ? 'कॉपी हो गया!' 
          : 'Copied to clipboard!'
      );
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied({ ...copied, [field]: false });
      }, 2000);
    } catch (err) {
      toast.error(
        language === 'hi' 
          ? 'कॉपी नहीं हो सका' 
          : 'Failed to copy'
      );
    }
  };

  const downloadCredentials = () => {
    const credentialsText = `
${language === 'hi' ? 'पथ विक्रेता एकता संघ - लॉगिन क्रेडेंशियल' : 'Path Vikreta Ekta Sangh - Login Credentials'}

${language === 'hi' ? 'आवेदन ID:' : 'Application ID:'} ${applicationId}
${language === 'hi' ? 'विक्रेता ID:' : 'Vendor ID:'} ${vendorId}
${language === 'hi' ? 'ईमेल:' : 'Email:'} ${email}
${language === 'hi' ? 'पासवर्ड:' : 'Password:'} ${password}
${language === 'hi' ? 'भुगतान ID:' : 'Payment ID:'} ${paymentId}

${language === 'hi' 
  ? 'महत्वपूर्ण: कृपया इन क्रेडेंशियल्स को सुरक्षित रखें। आप इनका उपयोग करके लॉगिन कर सकते हैं और अपने आवेदन की स्थिति देख सकते हैं।' 
  : 'Important: Please keep these credentials secure. You can use them to login and track your application status.'
}

${language === 'hi' ? 'तारीख:' : 'Date:'} ${new Date().toLocaleString()}
`;

    const element = document.createElement('a');
    const file = new Blob([credentialsText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `credentials_${vendorId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success(
      language === 'hi' 
        ? 'क्रेडेंशियल्स डाउनलोड हो गए!' 
        : 'Credentials downloaded!'
    );
  };

  const handleTrackApplication = () => {
    router.push(`/track-status?id=${applicationId}`);
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  if (!applicationId) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 ${language === 'hi' ? 'font-mixed' : 'font-sans'}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-green-600">
                  {language === 'hi' ? 'पंजीकरण सफल!' : 'Registration Successful!'}
                </h1>
                <p className="text-xs text-neutral-600">
                  {language === 'hi' ? 'सदस्यता सक्रिय' : 'Membership Activated'}
                </p>
              </div>
            </div>
            
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="container-fluid py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-green-600 mb-2">
                {language === 'hi' ? 'भुगतान सफल!' : 'Payment Successful!'}
              </h2>
              
              <p className="text-gray-600 mb-4">
                {language === 'hi' 
                  ? 'आपका आवेदन सफलतापूर्वक जमा हो गया है। आपको __ दिन में पुष्टि दी जाएगी।' 
                  : 'Your application has been submitted successfully. You will be confirmed within __ days.'}
              </p>

              {paymentId && (
                <div className="inline-flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    {language === 'hi' ? 'भुगतान ID:' : 'Payment ID:'} {paymentId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Credentials Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {language === 'hi' ? 'आपके लॉगिन क्रेडेंशियल्स' : 'Your Login Credentials'}
              </h3>
              <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg inline-block">
                {language === 'hi' 
                  ? '⚠️ महत्वपूर्ण: कृपया इन्हें सुरक्षित रखें और स्क्रीनशॉट लें' 
                  : '⚠️ Important: Please save these credentials and take a screenshot'}
              </p>
            </div>

            <div className="space-y-4">
              {/* Application ID */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'hi' ? 'आवेदन ID' : 'Application ID'}
                  </label>
                  <span className="text-lg font-mono font-bold text-gray-900">
                    {applicationId}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(applicationId!, 'applicationId')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                  title={language === 'hi' ? 'कॉपी करें' : 'Copy'}
                >
                  {copied.applicationId ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Vendor ID */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'hi' ? 'विक्रेता ID (यूजरनेम)' : 'Vendor ID (Username)'}
                  </label>
                  <span className="text-lg font-mono font-bold text-blue-600">
                    {vendorId}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(vendorId!, 'vendorId')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                  title={language === 'hi' ? 'कॉपी करें' : 'Copy'}
                >
                  {copied.vendorId ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'hi' ? 'ईमेल' : 'Email'}
                  </label>
                  <span className="text-lg font-mono text-gray-900">
                    {email}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(email!, 'email')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                  title={language === 'hi' ? 'कॉपी करें' : 'Copy'}
                >
                  {copied.email ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'hi' ? 'अस्थायी पासवर्ड' : 'Temporary Password'}
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-mono font-bold text-red-600">
                      {showPassword ? password : '••••••••'}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title={showPassword ? (language === 'hi' ? 'छुपाएं' : 'Hide') : (language === 'hi' ? 'दिखाएं' : 'Show')}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(password!, 'password')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                  title={language === 'hi' ? 'कॉपी करें' : 'Copy'}
                >
                  {copied.password ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={downloadCredentials}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>{language === 'hi' ? 'डाउनलोड करें' : 'Download'}</span>
              </button>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-2xl p-6 mb-6">
            <h4 className="font-bold text-blue-900 mb-4">
              {language === 'hi' ? 'अगले चरण:' : 'Next Steps:'}
            </h4>
            <ul className="space-y-3 text-blue-800">
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-700">1</span>
                </div>
                <span>
                  {language === 'hi' 
                    ? 'अपने क्रेडेंशियल्स को सुरक्षित रखें (स्क्रीनशॉट लें या डाउनलोड करें)' 
                    : 'Save your credentials securely (take a screenshot or download)'}
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-700">2</span>
                </div>
                <span>
                  {language === 'hi' 
                    ? 'आवेदन की स्थिति ट्रैक करने के लिए आवेदन ID का उपयोग करें' 
                    : 'Use your Application ID to track application status'}
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-700">3</span>
                </div>
                <span>
                  {language === 'hi' 
                    ? 'विक्रेता डैशबोर्ड में लॉगिन करने के लिए विक्रेता ID और पासवर्ड का उपयोग करें' 
                    : 'Use Vendor ID and password to login to vendor dashboard'}
                </span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleTrackApplication}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>{language === 'hi' ? 'आवेदन ट्रैक करें' : 'Track Application'}</span>
            </button>
            
            <button
              onClick={handleLogin}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              <span>{language === 'hi' ? 'लॉगिन करें' : 'Login'}</span>
            </button>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              {language === 'hi' 
                ? 'सहायता के लिए संपर्क करें: support@pathvikreta.org' 
                : 'For support, contact: support@pathvikreta.org'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}