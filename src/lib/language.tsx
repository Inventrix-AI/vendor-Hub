'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'hi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation data
const translations = {
  // Navigation
  'nav.features': {
    hi: 'सुविधाएं',
    en: 'Features'
  },
  'nav.process': {
    hi: 'प्रक्रिया',
    en: 'Process'
  },
  'nav.contact': {
    hi: 'संपर्क',
    en: 'Contact'
  },
  'nav.signIn': {
    hi: 'साइन इन करें',
    en: 'Sign In'
  },
  'nav.getStarted': {
    hi: 'शुरू करें',
    en: 'Get Started'
  },
  'nav.register': {
    hi: 'रजिस्टर करें',
    en: 'Register'
  },

  // Hero Section
  'hero.badge': {
    hi: 'पथ विक्रेता एकता संघ मध्यप्रदेश',
    en: 'Path Vikreta Ekta Sangh Madhya Pradesh'
  },
  'hero.title.main': {
    hi: 'पथ विक्रेता एकता संघ',
    en: 'Path Vikreta Ekta Sangh'
  },
  'hero.title.highlight': {
    hi: 'मध्यप्रदेश',
    en: 'Madhya Pradesh'
  },
  'hero.subtitle': {
    hi: 'खुदरा विक्रेताओं के लिए एकता, सहयोग और विकास का मंच। सदस्यता लें और अपने अधिकारों की रक्षा करें।',
    en: 'A platform for unity, cooperation and development for retail vendors. Join membership and protect your rights.'
  },
  'hero.startApplication': {
    hi: 'सदस्यता के लिए आवेदन करें',
    en: 'Apply for Membership'
  },
  'hero.adminDashboard': {
    hi: 'एडमिन डैशबोर्ड',
    en: 'Admin Dashboard'
  },

  // Introduction
  'intro.title': {
    hi: 'प्रस्तावना',
    en: 'Introduction'
  },
  'intro.greeting': {
    hi: 'नमस्कार खुदरा विक्रेता भाईओं,',
    en: 'Greetings retail vendor brothers,'
  },
  'intro.description': {
    hi: 'पथ विक्रेता एकता संघ मध्यप्रदेश, मध्य प्रदेश राज्य स्तर की एक रजिस्टर की हुई संस्था है। संगठन बनाने के निम्न कारण हैं:',
    en: 'Street Vendor Unity Union Madhya Pradesh is a registered institution at the Madhya Pradesh state level. The following are the reasons for forming the organization:'
  },

  // Benefits
  'benefits.title': {
    hi: 'संगठन बनाने के लाभ',
    en: 'Benefits of Forming Organization'
  },
  'benefits.unity': {
    hi: 'एकता और सहयोग: संगठन बनाने से लोगों को एक साथ लाने और सहयोग करने का अवसर मिलता है।',
    en: 'Unity and Cooperation: Forming an organization provides an opportunity to bring people together and cooperate.'
  },
  'benefits.goals': {
    hi: 'साझा लक्ष्य: संगठन बनाने से साझा लक्ष्य को प्राप्त करने के लिए काम करने का अवसर मिलता है।',
    en: 'Shared Goals: Forming an organization provides the opportunity to work towards achieving common goals.'
  },
  'benefits.support': {
    hi: 'समर्थन और सहायता: संगठन बनाने से सदस्यों को समर्थन और सहायता प्रदान करने का अवसर मिलता है।',
    en: 'Support and Assistance: Forming an organization provides the opportunity to provide support and assistance to members.'
  },
  'benefits.decision': {
    hi: 'निर्णय लेने की प्रक्रिया: संगठन बनाने से निर्णय लेने की प्रक्रिया में सुधार होता है और सदस्यों की भागीदारी बढ़ती है।',
    en: 'Decision Making Process: Forming an organization improves the decision-making process and increases member participation.'
  },
  'benefits.resources': {
    hi: 'संसाधनों का बेहतर उपयोग: संगठन बनाने से संसाधनों का बेहतर उपयोग करने का अवसर मिलता है।',
    en: 'Better Use of Resources: Forming an organization provides the opportunity to make better use of resources.'
  },

  // Membership
  'membership.title': {
    hi: 'सदस्यता के लिए आवश्यक शर्तें',
    en: 'Requirements for Membership'
  },
  'membership.retailer': {
    hi: 'खुदरा विक्रेता होना: सदस्य बनने के लिए आपको मध्यप्रदेश में खुदरा विक्रेता के रूप में कार्य करना आवश्यक है।',
    en: 'Must be a Retailer: To become a member, you must work as a retailer in Madhya Pradesh.'
  },
  'membership.age': {
    hi: 'आयु सीमा: सदस्य बनने के लिए आपकी आयु कम से कम 18 वर्ष होनी चाहिए।',
    en: 'Age Limit: You must be at least 18 years old to become a member.'
  },
  'membership.id': {
    hi: 'वैध पहचान पत्र: सदस्य बनने के लिए आपके पास वैध पहचान पत्र जैसे कि आधार कार्ड, वोटर आईडी कार्ड, या पैन कार्ड होना चाहिए।',
    en: 'Valid ID: To become a member, you must have a valid ID such as Aadhaar Card, Voter ID Card, or PAN Card.'
  },

  // Membership Benefits
  'membershipBenefits.title': {
    hi: 'सदस्यता के लाभ',
    en: 'Membership Benefits'
  },
  'membershipBenefits.membership': {
    hi: 'संगठन की सदस्यता: सदस्य बनने से आपको पथ विक्रेता एकता संघ मध्यप्रदेश की सदस्यता मिलेगी।',
    en: 'Organization Membership: By becoming a member, you will get membership of Street Vendor Unity Union MP.'
  },
  'membershipBenefits.support': {
    hi: 'समर्थन और सहायता: सदस्य बनने से आपको संगठन से समर्थन और सहायता मिलेगी।',
    en: 'Support and Assistance: By becoming a member, you will receive support and assistance from the organization.'
  },
  'membershipBenefits.training': {
    hi: 'प्रशिक्षण और कौशल विकास: सदस्य बनने से आपको प्रशिक्षण और कौशल विकास के अवसर मिलेंगे।',
    en: 'Training and Skill Development: By becoming a member, you will get training and skill development opportunities.'
  },

  // Membership Fee
  'membershipFee.title': {
    hi: 'सदस्यता शुल्क',
    en: 'Membership Fee'
  },
  'membershipFee.annual': {
    hi: 'वार्षिक सदस्यता शुल्क ₹151 होगी',
    en: 'Annual membership fee will be ₹151'
  },
  'membershipFee.duration': {
    hi: 'सदस्यता अवधि एक वर्ष होगी',
    en: 'Membership duration will be one year'
  },

  // Application Form
  'form.title': {
    hi: 'सदस्य बनने के लिए आगे बढ़ें',
    en: 'Proceed to Become a Member'
  },
  'form.name': {
    hi: 'नाम',
    en: 'Name'
  },
  'form.age': {
    hi: 'आयु',
    en: 'Age'
  },
  'form.gender': {
    hi: 'लिंग',
    en: 'Gender'
  },
  'form.male': {
    hi: 'पुरुष',
    en: 'Male'
  },
  'form.female': {
    hi: 'स्त्री',
    en: 'Female'
  },
  'form.uploadId': {
    hi: 'वैध पहचान पत्र अपलोड करें',
    en: 'Upload Valid ID'
  },
  'form.uploadPhoto': {
    hi: 'फोटो अपलोड करें',
    en: 'Upload Photo'
  },
  'form.shopName': {
    hi: 'दुकान का नाम',
    en: 'Shop Name'
  },
  'form.business': {
    hi: 'व्यवसाय',
    en: 'Business'
  },
  'form.address': {
    hi: 'पता',
    en: 'Address'
  },
  'form.pincode': {
    hi: 'पिन कोड',
    en: 'Pincode'
  },
  'form.city': {
    hi: 'शहर',
    en: 'City'
  },
  'form.state': {
    hi: 'राज्य',
    en: 'State'
  },
  'form.proceedPayment': {
    hi: 'पेमेंट गेटवे पर आगे बढ़ें',
    en: 'Proceed to Payment Gateway'
  },

  // Business Types
  'business.retailer': {
    hi: 'खुदरा व्यापारी',
    en: 'Retailer'
  },
  'business.grocery': {
    hi: 'किराना स्टोर',
    en: 'Grocery Store'
  },
  'business.panShop': {
    hi: 'पान दुकान',
    en: 'Pan Shop'
  },
  'business.streetVendor': {
    hi: 'पथ विक्रेता',
    en: 'Street Vendor'
  },
  'business.wholesale': {
    hi: 'होलसेल व्यापारी',
    en: 'Wholesale Trader'
  },

  // Success Message
  'success.title': {
    hi: 'धन्यवाद',
    en: 'Thank You'
  },
  'success.message': {
    hi: 'आपका पेमेंट सफलतापूर्वक हो चुका है। आपको __ दिन में पुष्टि दी जाएगी कि आपकी सदस्यता सफलतापूर्वक रजिस्टर हो चुकी है या नहीं।',
    en: 'Your payment has been completed successfully. You will be confirmed within __ days whether your membership has been successfully registered or not.'
  },

  // Common
  'common.continue': {
    hi: 'आगे बढ़ें',
    en: 'Continue'
  },
  'common.submit': {
    hi: 'जमा करें',
    en: 'Submit'
  },
  'common.back': {
    hi: 'वापस',
    en: 'Back'
  },
  'common.close': {
    hi: 'बंद करें',
    en: 'Close'
  },
  'common.loading': {
    hi: 'लोड हो रहा है...',
    en: 'Loading...'
  },
  'common.error': {
    hi: 'त्रुटि',
    en: 'Error'
  },
  'common.success': {
    hi: 'सफलता',
    en: 'Success'
  },
  'common.warning': {
    hi: 'चेतावनी',
    en: 'Warning'
  }
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>('hi'); // Default to Hindi

  // Save language preference to localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'hi' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[key as keyof typeof translations]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};