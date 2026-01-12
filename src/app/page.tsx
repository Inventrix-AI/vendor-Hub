'use client';

import Link from 'next/link'
import Image from 'next/image'
import {
  Shield,
  CreditCard,
  FileCheck,
  ArrowRight,
  CheckCircle,
  Zap,
  Users,
  TrendingUp,
  Star,
  Phone,
  MapPin,
  Mail,
  Upload,
  User,
  Building,
  IndianRupee,
  UserCircle
} from 'lucide-react'
import { useLanguage } from '@/lib/language'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function Home() {
  const { t, language } = useLanguage();

  return (
    <div className={`min-h-screen ${language === 'hi' ? 'font-mixed' : 'font-sans'}`}>
      {/* Government Header Strip */}
      <div className="gov-header"></div>
      {/* Government Style Navigation */}
      <nav className="bg-white shadow-md border-b border-neutral-200 sticky top-0 z-50">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/Path Vikreta.png"
                alt="Path Vikreta Ekta Sangh Logo"
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gov-blue leading-tight">
                  {language === 'hi' ? 'पथ विक्रेता एकता संघ' : 'Path Vikreta Ekta Sangh'}
                </span>
                <span className="text-xs text-neutral-600">
                  {language === 'hi' ? 'मध्यप्रदेश' : 'Madhya Pradesh'}
                </span>
              </div>
            </Link>
            
            <div className="flex items-center space-x-2">
              <LanguageSwitcher />
              <div className="hidden md:flex items-center space-x-4 ml-4">
                <a href="#benefits" className="text-neutral-600 hover:text-gov-blue transition-colors text-sm">
                  {t('nav.features')}
                </a>
                <a href="#membership" className="text-neutral-600 hover:text-gov-blue transition-colors text-sm">
                  {t('nav.process')}
                </a>
                <a href="#contact" className="text-neutral-600 hover:text-gov-blue transition-colors text-sm">
                  {t('nav.contact')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-orange-50 py-12 md:py-16">
        <div className="container-fluid">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-gov-coral text-white rounded-full text-sm font-medium mb-6">
              <Building className="w-4 h-4 mr-2" />
              {t('hero.badge')}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-gov-blue mb-6 leading-tight">
              {t('hero.title.main')}<br />
              <span className="text-gov-coral">{t('hero.title.highlight')}</span>
            </h1>
            
            <p className="text-lg md:text-xl text-neutral-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/vendor/register" className="btn bg-gov-coral hover:bg-red-500 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105">
                {t('hero.startApplication')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link href="/auth/login" className="btn bg-white text-gov-blue border-2 border-gov-blue hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-lg transition-all">
                {t('nav.signIn')}
              </Link>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <CheckCircle className="w-5 h-5 text-gov-teal" />
                <span>{language === 'hi' ? 'सुरक्षित प्रक्रिया' : 'Secure Process'}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <CheckCircle className="w-5 h-5 text-gov-teal" />
                <span>{language === 'hi' ? 'तुरंत अप्रूवल' : 'Quick Approval'}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <CheckCircle className="w-5 h-5 text-gov-teal" />
                <span>{language === 'hi' ? 'आसान प्रक्रिया' : 'Easy Process'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction Section - Enhanced */}
      <section id="introduction" className="bg-white py-16 md:py-20">
        <div className="container-fluid">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-gov-blue rounded-full text-sm font-medium">
                  <Building className="w-4 h-4 mr-2" />
                  {language === 'hi' ? 'संगठन परिचय' : 'About Organization'}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gov-blue leading-tight">
                  {t('intro.title')}
                </h2>
                <div className="space-y-4 text-lg leading-relaxed">
                  <p className="text-gov-blue font-semibold text-xl">{t('intro.greeting')}</p>
                  <p className="text-neutral-700">{t('intro.description')}</p>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-6 pt-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-gov-blue">500+</div>
                    <div className="text-sm text-neutral-600">
                      {language === 'hi' ? 'सक्रिय सदस्य' : 'Active Members'}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-gov-coral">100%</div>
                    <div className="text-sm text-neutral-600">
                      {language === 'hi' ? 'सुरक्षित प्रक्रिया' : 'Secure Process'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Visual */}
              <div className="relative">
                <div className="bg-gradient-to-br from-gov-blue to-gov-coral rounded-2xl p-8 text-white">
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Building className="w-20 h-20 mx-auto mb-4 opacity-80" />
                      <h3 className="text-xl font-bold mb-2">
                        {language === 'hi' ? 'एक मजबूत संगठन' : 'A Strong Organization'}
                      </h3>
                      <p className="text-sm opacity-90">
                        {language === 'hi' 
                          ? 'सभी विक्रेताओं के लिए एकजुट मंच' 
                          : 'United platform for all vendors'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-gov-teal rounded-full flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Benefits Section - Enhanced */}
      <section id="benefits" className="bg-white py-16 md:py-20">
        <div className="container-fluid">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
                <Star className="w-4 h-4 mr-2" />
                {language === 'hi' ? 'सदस्यता के फायदे' : 'Membership Benefits'}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gov-blue mb-4">
                {t('benefits.title')}
              </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                {language === 'hi' 
                  ? 'हमारे संगठन से जुड़कर पाएं अनेक लाभ' 
                  : 'Join our organization and get numerous benefits'}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Benefit 1 */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:shadow-lg transition-all transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gov-blue rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gov-blue mb-4">
                  {language === 'hi' ? 'एकता और संगठन' : 'Unity & Organization'}
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  {t('benefits.unity')}
                </p>
              </div>
              
              {/* Benefit 2 */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 hover:shadow-lg transition-all transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gov-teal rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gov-blue mb-4">
                  {language === 'hi' ? 'व्यवसाय विकास' : 'Business Growth'}
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  {t('benefits.goals')}
                </p>
              </div>
              
              {/* Benefit 3 */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 hover:shadow-lg transition-all transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gov-coral rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gov-blue mb-4">
                  {language === 'hi' ? 'सहायता और सुरक्षा' : 'Support & Protection'}
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  {t('benefits.support')}
                </p>
              </div>
              
              {/* Benefit 4 */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:shadow-lg transition-all transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gov-blue mb-4">
                  {language === 'hi' ? 'निर्णय में सहभागिता' : 'Decision Participation'}
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  {t('benefits.decision')}
                </p>
              </div>
              
              {/* Benefit 5 */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-8 hover:shadow-lg transition-all transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-yellow-600 rounded-2xl flex items-center justify-center mb-6">
                  <Building className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gov-blue mb-4">
                  {language === 'hi' ? 'संसाधन और सुविधाएं' : 'Resources & Facilities'}
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  {t('benefits.resources')}
                </p>
              </div>

              {/* Additional Benefit */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-8 hover:shadow-lg transition-all transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gov-blue mb-4">
                  {language === 'hi' ? 'तत्काल समाधान' : 'Quick Solutions'}
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  {language === 'hi' 
                    ? 'व्यापारिक समस्याओं का तुरंत समाधान और सलाह प्राप्त करें'
                    : 'Get instant solutions and advice for business problems'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements for Membership Section */}
      <section id="requirements" className="bg-gray-50 py-16 md:py-20">
        <div className="container-fluid">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-6">
                <FileCheck className="w-4 h-4 mr-2" />
                {language === 'hi' ? 'आवश्यकताएं' : 'Requirements'}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gov-blue mb-4">
                {t('membership.title')}
              </h2>
              <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
                {language === 'hi' 
                  ? 'सदस्यता के लिए निम्नलिखित आवश्यकताओं को पूरा करें' 
                  : 'Meet the following requirements for membership'}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Requirement 1 */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-gov-coral rounded-2xl flex items-center justify-center mb-6">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gov-blue mb-4">
                  {language === 'hi' ? 'आयु सीमा' : 'Age Requirement'}
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  {t('membership.age')}
                </p>
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm font-semibold text-red-700">
                    {language === 'hi' ? '✓ न्यूनतम 18 वर्ष' : '✓ Minimum 18 years'}
                  </p>
                </div>
              </div>

              {/* Requirement 2 */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-gov-blue rounded-2xl flex items-center justify-center mb-6">
                  <Building className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gov-blue mb-4">
                  {language === 'hi' ? 'व्यवसाय प्रकार' : 'Business Type'}
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  {t('membership.retailer')}
                </p>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-semibold text-blue-700">
                    {language === 'hi' ? '✓ खुदरा विक्रेता' : '✓ Retail Vendor'}
                  </p>
                </div>
              </div>

              {/* Requirement 3 */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-gov-teal rounded-2xl flex items-center justify-center mb-6">
                  <FileCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gov-blue mb-4">
                  {language === 'hi' ? 'दस्तावेज़' : 'Documents'}
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  {t('membership.id')}
                </p>
                <div className="mt-4 p-3 bg-teal-50 rounded-lg">
                  <p className="text-sm font-semibold text-teal-700">
                    {language === 'hi' ? '✓ पहचान पत्र आवश्यक' : '✓ ID Proof Required'}
                  </p>
                </div>
              </div>

              {/* Membership Fee - Integrated as 4th Card */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-6">
                  <IndianRupee className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gov-blue mb-4">
                  {t('membershipFee.title')}
                </h3>
                <p className="text-neutral-700 leading-relaxed mb-4">
                  {t('membershipFee.duration')}
                </p>
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-700">
                    ₹151 {language === 'hi' ? '/ वर्ष' : '/ year'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Become a Member - Enhanced Steps Section */}
      <section id="membership-process" className="bg-gradient-to-br from-blue-50 to-orange-50 py-16 md:py-20">
        <div className="container-fluid">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-white text-gov-blue rounded-full text-sm font-medium mb-6 shadow-sm">
                <ArrowRight className="w-4 h-4 mr-2" />
                {language === 'hi' ? 'सदस्यता प्रक्रिया' : 'Membership Process'}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gov-blue mb-4">
                {language === 'hi' ? 'सदस्य बनने की प्रक्रिया' : 'Proceed to Become a Member'}
              </h2>
              <p className="text-xl text-neutral-600 mb-8">
                {language === 'hi' 
                  ? '4 आसान चरणों में सदस्यता प्राप्त करें' 
                  : 'Get membership in 4 easy steps'}
              </p>
            </div>
            
            {/* Progress Flow */}
            <div className="relative mb-16">
              {/* Connecting Line */}
              <div className="hidden lg:block absolute top-16 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-gov-coral via-gov-blue via-gov-teal to-yellow-500 rounded-full"></div>
              
              {/* Steps */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                {/* Step 1 */}
                <div className="relative">
                  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 h-full">
                    <div className="text-center h-full flex flex-col">
                      <div className="relative mb-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-gov-coral to-red-400 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto shadow-lg">
                          1
                        </div>
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                          <div className="w-10 h-10 bg-white border-4 border-gov-coral rounded-full flex items-center justify-center shadow-sm">
                            <User className="w-5 h-5 text-gov-coral" />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gov-blue mb-4">
                        {language === 'hi' ? 'व्यक्तिगत जानकारी' : 'Personal Information'}
                      </h3>
                      <div className="space-y-2 text-sm text-neutral-600 flex-grow">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-gov-coral rounded-full flex-shrink-0"></div>
                          <span>{language === 'hi' ? 'नाम और आयु' : 'Name & Age'}</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-gov-coral rounded-full flex-shrink-0"></div>
                          <span>{language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-gov-coral rounded-full flex-shrink-0"></div>
                          <span>{language === 'hi' ? 'पहचान पत्र' : 'ID Proof'}</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-gov-coral rounded-full flex-shrink-0"></div>
                          <span>{language === 'hi' ? 'फोटो' : 'Photo'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 h-full">
                    <div className="text-center h-full flex flex-col">
                      <div className="relative mb-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-gov-blue to-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto shadow-lg">
                          2
                        </div>
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                          <div className="w-10 h-10 bg-white border-4 border-gov-blue rounded-full flex items-center justify-center shadow-sm">
                            <Building className="w-5 h-5 text-gov-blue" />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gov-blue mb-4">
                        {language === 'hi' ? 'व्यवसाय विवरण' : 'Business Details'}
                      </h3>
                      <div className="space-y-2 text-sm text-neutral-600 flex-grow">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-gov-blue rounded-full flex-shrink-0"></div>
                          <span>{language === 'hi' ? 'दुकान का नाम' : 'Shop Name'}</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-gov-blue rounded-full flex-shrink-0"></div>
                          <span>{language === 'hi' ? 'व्यवसाय प्रकार' : 'Business Type'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 h-full">
                    <div className="text-center h-full flex flex-col">
                      <div className="relative mb-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-gov-teal to-teal-400 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto shadow-lg">
                          3
                        </div>
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                          <div className="w-10 h-10 bg-white border-4 border-gov-teal rounded-full flex items-center justify-center shadow-sm">
                            <FileCheck className="w-5 h-5 text-gov-teal" />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gov-blue mb-4">
                        {language === 'hi' ? 'पता और दस्तावेज़' : 'Address & Documents'}
                      </h3>
                      <div className="space-y-2 text-sm text-neutral-600 flex-grow">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-gov-teal rounded-full flex-shrink-0"></div>
                          <span>{language === 'hi' ? 'पूरा पता' : 'Complete Address'}</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-gov-teal rounded-full flex-shrink-0"></div>
                          <span>{language === 'hi' ? 'दुकान के दस्तावेज़' : 'Shop Documents'}</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-gov-teal rounded-full flex-shrink-0"></div>
                          <span>{language === 'hi' ? 'दुकान की तस्वीर' : 'Shop Photo'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative">
                  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 h-full">
                    <div className="text-center h-full flex flex-col">
                      <div className="relative mb-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-yellow-400 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto shadow-lg">
                          4
                        </div>
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                          <div className="w-10 h-10 bg-white border-4 border-yellow-500 rounded-full flex items-center justify-center shadow-sm">
                            <IndianRupee className="w-5 h-5 text-yellow-600" />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gov-blue mb-4">
                        {language === 'hi' ? 'भुगतान और पुष्टि' : 'Payment & Confirmation'}
                      </h3>
                      <div className="space-y-2 text-sm text-neutral-600 flex-grow">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                          <span>{language === 'hi' ? '₹151 भुगतान' : '₹151 Payment'}</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                          <span>{language === 'hi' ? 'यूनीक ID प्राप्त करें' : 'Get Unique ID'}</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                          <span>{language === 'hi' ? 'तुरंत खाता सक्रिय' : 'Instant Activation'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Call to Action */}
            <div className="text-center">
              <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-gov-blue mb-4">
                  {language === 'hi' ? 'अभी शुरू करें!' : 'Get Started Now!'}
                </h3>
                <p className="text-neutral-600 mb-6">
                  {language === 'hi' 
                    ? 'केवल 10 मिनट में अपनी सदस्यता पूरी करें'
                    : 'Complete your membership in just 10 minutes'}
                </p>
                <Link 
                  href="/vendor/register" 
                  className="bg-gradient-to-r from-gov-coral to-red-500 hover:from-red-500 hover:to-gov-coral text-white px-10 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg inline-flex items-center"
                >
                  {language === 'hi' ? 'सदस्यता के लिए आवेदन करें' : 'Apply for Membership'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <p className="text-sm text-neutral-500 mt-4">
                  {language === 'hi' 
                    ? '✓ सुरक्षित प्रक्रिया • ✓ तुरंत अप्रूवल • ✓ आसान प्रक्रिया' 
                    : '✓ Secure Process • ✓ Quick Approval • ✓ Easy Process'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gov-blue text-white">
        <div className="container-fluid py-8 px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Organization Info */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/Path Vikreta.png"
                  alt="Path Vikreta Ekta Sangh Logo"
                  width={56}
                  height={56}
                  className="w-14 h-14 object-contain bg-white rounded-lg p-1"
                />
                <div>
                  <h3 className="font-bold text-lg">
                    {language === 'hi' ? 'पथ विक्रेता एकता संघ' : 'Path Vikreta Ekta Sangh'}
                  </h3>
                  <p className="text-blue-200 text-sm">
                    {language === 'hi' ? 'मध्यप्रदेश' : 'Madhya Pradesh'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-blue-100 leading-relaxed">
                {language === 'hi'
                  ? 'खुदरा विक्रेताओं के लिए एकता, सहयोग और विकास का मंच'
                  : 'A platform for unity, cooperation and development for retail vendors'}
              </p>
            </div>

            {/* Contact Details */}
            <div className="flex flex-col items-center md:items-start">
              <h4 className="font-semibold text-lg mb-4">
                {language === 'hi' ? 'संपर्क करें' : 'Contact Us'}
              </h4>
              <div className="space-y-3 text-blue-100">
                <div className="flex items-center space-x-2">
                  <UserCircle className="w-5 h-5 text-blue-200" />
                  <span>{language === 'hi' ? 'अनुज शाक्यवार' : 'Anuj Shakyawar'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-blue-200" />
                  <a href="tel:+917000619985" className="hover:text-white transition-colors">
                    +91 70006 19985
                  </a>
                </div>
                <div className="flex items-start space-x-2">
                  <MapPin className="w-5 h-5 text-blue-200 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">
                    {language === 'hi'
                      ? 'एल जी 34 भरत आर्केड कोलार रोड़ भोपाल'
                      : 'LG 34 Bharat Arcade, Kolar Road, Bhopal'}
                  </span>
                </div>
              </div>
            </div>

            {/* Important Links */}
            <div className="flex flex-col items-center md:items-start">
              <h4 className="font-semibold text-lg mb-4">
                {language === 'hi' ? 'महत्वपूर्ण लिंक' : 'Important Links'}
              </h4>
              <ul className="space-y-2 text-sm text-blue-100">
                <li><a href="#benefits" className="hover:text-white transition-colors">
                  {language === 'hi' ? 'संगठन के लाभ' : 'Organization Benefits'}
                </a></li>
                <li><a href="#membership" className="hover:text-white transition-colors">
                  {language === 'hi' ? 'सदस्यता' : 'Membership'}
                </a></li>
                <li><a href="/vendor/register" className="hover:text-white transition-colors">
                  {language === 'hi' ? 'आवेदन फार्म' : 'Application Form'}
                </a></li>
                <li><a href="/auth/login" className="hover:text-white transition-colors">
                  {language === 'hi' ? 'लॉगिन' : 'Login'}
                </a></li>
              </ul>
            </div>

            {/* FRAI Certification */}
            <div className="flex flex-col items-center md:items-end">
              <Image
                src="/FRAI.png"
                alt="FRAI Certification"
                width={120}
                height={120}
                className="w-28 h-28 object-contain bg-white rounded-lg p-2"
              />
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-blue-400/30 mt-8 pt-6 text-center text-blue-200 text-sm">
            <p>
              © {new Date().getFullYear()} {language === 'hi' ? 'पथ विक्रेता एकता संघ। सर्वाधिकार सुरक्षित।' : 'Path Vikreta Ekta Sangh. All rights reserved.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}