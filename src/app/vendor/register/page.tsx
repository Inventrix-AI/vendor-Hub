"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import {
  User,
  Building,
  FileCheck,
  IndianRupee,
  ArrowRight,
  ArrowLeft,
  Upload,
  Check,
  Globe,
  Copy,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLanguage } from "@/lib/language";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { usePincodeData } from "@/lib/pincodeService";
import { processFiles } from "@/lib/imageCompression";

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Validation schemas for each step
const step1Schema = yup.object({
  name: yup.string().required("Name is required"),
  age: yup
    .number()
    .min(18, "Must be at least 18 years old")
    .required("Age is required"),
  mobile: yup
    .string()
    .required("Mobile number is required")
    .matches(/^[0-9]{10}$/, "Invalid mobile number (10 digits required)"),
  email: yup.string().email("Invalid email format").optional(),
  gender: yup.string().required("Gender is required"),
  id_type: yup.string().required("ID type is required"),
  id_document: yup.mixed().required("ID document is required"),
  photo: yup.mixed().required("Photo is required"),
});

const step2Schema = yup.object({
  shop_name: yup.string().required("Shop name is required"),
  business_type: yup.string().required("Business type is required"),
});

const step3Schema = yup.object({
  address_line1: yup.string().required("Address is required"),
  address_line2: yup.string(),
  landmark: yup.string(),
  pincode: yup
    .string()
    .required("Pincode is required")
    .matches(/^[0-9]{6}$/, "Invalid pincode"),
  city: yup.string().required("City is required"),
  state: yup.string().required("State is required"),
  shop_document_type: yup.string().required("Shop document type is required"),
  shop_document: yup.mixed().required("Shop document is required"),
  shop_photo: yup.mixed().required("Shop photo is required"),
});

interface FormData {
  // Step 1 - Personal Information
  name: string;
  age: number;
  mobile: string;
  email?: string;
  gender: string;
  id_type: string;
  id_document: File | null;
  photo: File | null;

  // Step 2 - Business Details
  shop_name: string;
  business_type: string;

  // Step 3 - Address & Documents
  address_line1: string;
  address_line2: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
  shop_document_type: string;
  shop_document: File | null;
  shop_photo: File | null;
}

const businessTypes = [
  { hi: "खुदरा व्यापारी", en: "Retailer", value: "retailer" },
  { hi: "किराना स्टोर", en: "Grocery Store", value: "grocery" },
  { hi: "पान दुकान", en: "Pan Shop", value: "pan_shop" },
  { hi: "पथ विक्रेता", en: "Street Vendor", value: "street_vendor" },
  { hi: "होलेसेल व्यापारी", en: "Wholesale Trader", value: "wholesale" },
];

const idTypes = [
  { hi: "आधार कार्ड", en: "Aadhaar Card", value: "aadhaar_card" },
  { hi: "वोटर कार्ड", en: "Voter ID Card", value: "voter_id" },
  { hi: "ड्राइविंग लाइसेंस", en: "Driving License", value: "driving_license" },
  { hi: "पैन कार्ड", en: "PAN Card", value: "pan_card" },
];

const shopDocumentTypes = [
  { hi: "गुमाश्ता धारा लाइसेंस", en: "Gumashta License", value: "gumashta" },
  { hi: "भाड़ा करार", en: "Rent Agreement", value: "rent_agreement" },
  { hi: "अन्य", en: "Other", value: "other" },
];

// Credentials Modal Component
const CredentialsModal = ({
  isOpen,
  onClose,
  credentials,
  language,
}: {
  isOpen: boolean;
  onClose: () => void;
  credentials: {
    vendorId: string;
    applicationId: string;
    password: string;
  } | null;
  language: string;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
      toast.success(language === "hi" ? "कॉपी हो गया!" : "Copied!");
    } catch (err) {
      toast.error(
        language === "hi" ? "कॉपी करने में त्रुटि" : "Failed to copy"
      );
    }
  };

  if (!isOpen || !credentials) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {language === "hi" ? "आपके लॉगिन विवरण" : "Your Login Details"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-700 mb-3">
              {language === "hi"
                ? "कृपया इन विवरणों को सुरक्षित रखें। आप इनका उपयोग लॉगिन करने के लिए कर सकते हैं।"
                : "Please save these details safely. You can use them to login."}
            </p>
          </div>

          {/* Vendor ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === "hi" ? "विक्रेता ID" : "Vendor ID"}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={credentials.vendorId}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() =>
                  copyToClipboard(credentials.vendorId, "vendorId")
                }
                className="p-2 text-gray-500 hover:text-blue-600"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            {copied === "vendorId" && (
              <p className="text-xs text-green-600 mt-1">
                {language === "hi" ? "कॉपी हो गया!" : "Copied!"}
              </p>
            )}
          </div>

          {/* Application ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === "hi" ? "आवेदन ID" : "Application ID"}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={credentials.applicationId}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() =>
                  copyToClipboard(credentials.applicationId, "applicationId")
                }
                className="p-2 text-gray-500 hover:text-blue-600"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            {copied === "applicationId" && (
              <p className="text-xs text-green-600 mt-1">
                {language === "hi" ? "कॉपी हो गया!" : "Copied!"}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === "hi" ? "अस्थायी पासवर्ड" : "Temporary Password"}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type={showPassword ? "text" : "password"}
                value={credentials.password}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() =>
                  copyToClipboard(credentials.password, "password")
                }
                className="p-2 text-gray-500 hover:text-blue-600"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            {copied === "password" && (
              <p className="text-xs text-green-600 mt-1">
                {language === "hi" ? "कॉपी हो गया!" : "Copied!"}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            {language === "hi" ? "ठीक है" : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function VendorRegisterPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<"hi" | "en">("hi");
  const [showLanguageSelector, setShowLanguageSelector] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{
    id_document?: string;
    photo?: string;
    shop_document?: string;
    shop_photo?: string;
  }>({});
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentials, setCredentials] = useState<{
    vendorId: string;
    applicationId: string;
    password: string;
  } | null>(null);
  const [pincodeError, setPincodeError] = useState<string>('');
  const [mobileError, setMobileError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [validationLoading, setValidationLoading] = useState<{mobile: boolean, email: boolean}>({mobile: false, email: false});
  const { language, setLanguage } = useLanguage();
  const { lookupPincode, loading: pincodeLoading } = usePincodeData();
  const router = useRouter();

  // Load Razorpay script
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        console.log("Razorpay script loaded successfully");
      };
      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        toast.error(
          language === "hi"
            ? "भुगतान गेटवे लोड नहीं हुआ।"
            : "Payment gateway failed to load."
        );
      };
      document.body.appendChild(script);

      return () => {
        const existingScript = document.querySelector(
          'script[src*="razorpay"]'
        );
        if (existingScript) {
          document.body.removeChild(existingScript);
        }
      };
    }
  }, [language]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      gender: "",
      id_type: "",
      business_type: "",
      shop_document_type: "",
      state: "Madhya Pradesh",
    },
  });

  const watchedPincode = watch("pincode");
  const watchedMobile = watch("mobile");
  const watchedEmail = watch("email");

  // Auto-populate city and state based on pincode with debounce
  useEffect(() => {
    if (!watchedPincode) {
      setPincodeError('');
      return;
    }

    if (watchedPincode.length === 6) {
      // Add a small delay to prevent rapid API calls
      const timeoutId = setTimeout(async () => {
        try {
          setPincodeError(''); // Clear any previous errors
          const data = await lookupPincode(watchedPincode);
          if (data) {
            setValue("city", data.city);
            setValue("state", data.state);
          } else {
            // No city found for this pincode
            setValue("city", "");
            setValue("state", "Madhya Pradesh");
            setPincodeError(
              language === "hi" 
                ? "गलत पिन कोड। कृपया सही पिन कोड डालें।" 
                : "Invalid pincode. Please enter a correct pincode."
            );
          }
        } catch (error) {
          console.error("Failed to lookup pincode:", error);
          setValue("city", "");
          setValue("state", "Madhya Pradesh");
          setPincodeError(
            language === "hi" 
              ? "पिन कोड खोजने में त्रुटि। कृपया दोबारा कोशिश करें।" 
              : "Error looking up pincode. Please try again."
          );
        }
      }, 500); // 500ms delay

      return () => clearTimeout(timeoutId);
    } else {
      // Clear city and state if pincode is incomplete
      setValue("city", "");
      setValue("state", "Madhya Pradesh");
      setPincodeError('');
    }
  }, [watchedPincode, setValue, language, lookupPincode]);

  // Validate mobile number uniqueness
  useEffect(() => {
    if (!watchedMobile) {
      setMobileError('');
      return;
    }

    if (watchedMobile.length === 10) {
      const timeoutId = setTimeout(async () => {
        setValidationLoading(prev => ({ ...prev, mobile: true }));
        setMobileError('');

        try {
          const response = await fetch('/api/validate-unique', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'mobile', value: watchedMobile })
          });

          const result = await response.json();
          if (!result.isUnique) {
            setMobileError(
              language === "hi" 
                ? "यह मोबाइल नंबर पहले से रजिस्टर है।" 
                : "This mobile number is already registered."
            );
          }
        } catch (error) {
          console.error('Mobile validation error:', error);
        } finally {
          setValidationLoading(prev => ({ ...prev, mobile: false }));
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setMobileError('');
    }
  }, [watchedMobile, language]);

  // Validate email uniqueness
  useEffect(() => {
    if (!watchedEmail || !watchedEmail.includes('@')) {
      setEmailError('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setValidationLoading(prev => ({ ...prev, email: true }));
      setEmailError('');

      try {
        const response = await fetch('/api/validate-unique', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'email', value: watchedEmail })
        });

        const result = await response.json();
        if (!result.isUnique) {
          setEmailError(
            language === "hi" 
              ? "यह ईमेल पहले से रजिस्टर है।" 
              : "This email is already registered."
          );
        }
      } catch (error) {
        console.error('Email validation error:', error);
      } finally {
        setValidationLoading(prev => ({ ...prev, email: false }));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedEmail, language]);

  const steps = [
    {
      title: { hi: "व्यक्तिगत जानकारी", en: "Personal Information" },
      icon: User,
      color: "bg-gov-coral",
    },
    {
      title: { hi: "व्यवसाय विवरण", en: "Business Details" },
      icon: Building,
      color: "bg-gov-blue",
    },
    {
      title: { hi: "पता और दस्तावेज़", en: "Address & Documents" },
      icon: FileCheck,
      color: "bg-gov-teal",
    },
    {
      title: { hi: "भुगतान और पुष्टि", en: "Payment & Confirmation" },
      icon: IndianRupee,
      color: "bg-yellow-500",
    },
  ];

  const handleLanguageSelect = (lang: "hi" | "en") => {
    setSelectedLanguage(lang);
    setLanguage(lang);
    setShowLanguageSelector(false);
  };

  const nextStep = async () => {
    let isValid = false;

    switch (currentStep) {
      case 0:
        isValid = await trigger(["name", "age", "mobile", "gender", "id_type"]);
        // Also check for validation errors
        if (isValid && (mobileError || emailError)) {
          isValid = false;
        }
        break;
      case 1:
        isValid = await trigger(["shop_name", "business_type"]);
        break;
      case 2:
        isValid = await trigger([
          "address_line1",
          "pincode",
          "city",
          "state",
          "shop_document_type",
        ]);
        break;
      default:
        isValid = true;
    }

    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      // Show processing toast
      toast.info(
        language === "hi"
          ? "फ़ाइलें प्रोसेस हो रही हैं..."
          : "Processing files...",
        { autoClose: 2000 }
      );

      // Process files: compress images, validate PDFs
      const processedFiles = await processFiles({
        id_document: data.id_document,
        photo: data.photo,
        shop_document: data.shop_document,
        shop_photo: data.shop_photo,
      });

      // Check for file validation errors (e.g., PDF too large)
      if (processedFiles.errors.length > 0) {
        setLoading(false);
        processedFiles.errors.forEach((error) => {
          toast.error(error);
        });
        return;
      }

      // Log compression stats and processed files
      const { stats } = processedFiles;
      console.log(`[Upload] Original total: ${(stats.originalTotal / 1024 / 1024).toFixed(2)}MB`);
      console.log(`[Upload] Final total: ${(stats.finalTotal / 1024 / 1024).toFixed(2)}MB`);
      console.log(`[Upload] Saved: ${stats.savedPercent}% (${(stats.savedBytes / 1024).toFixed(0)}KB)`);

      // Debug: Log each processed file
      console.log('[Upload] Processed files:', {
        id_document: processedFiles.id_document ? {
          name: processedFiles.id_document.name,
          size: processedFiles.id_document.size,
          type: processedFiles.id_document.type
        } : null,
        photo: processedFiles.photo ? {
          name: processedFiles.photo.name,
          size: processedFiles.photo.size,
          type: processedFiles.photo.type
        } : null,
        shop_document: processedFiles.shop_document ? {
          name: processedFiles.shop_document.name,
          size: processedFiles.shop_document.size,
          type: processedFiles.shop_document.type
        } : null,
        shop_photo: processedFiles.shop_photo ? {
          name: processedFiles.shop_photo.name,
          size: processedFiles.shop_photo.size,
          type: processedFiles.shop_photo.type
        } : null
      });

      // Create FormData for file uploads
      const formData = new FormData();

      // Add all form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        // Skip file fields - we'll add processed versions
        if (key === 'id_document' || key === 'photo' || key === 'shop_document' || key === 'shop_photo') {
          return;
        }
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      // Add processed files (compressed images or validated PDFs)
      if (processedFiles.id_document) {
        formData.append('id_document', processedFiles.id_document);
      }
      if (processedFiles.photo) {
        formData.append('photo', processedFiles.photo);
      }
      if (processedFiles.shop_document) {
        formData.append('shop_document', processedFiles.shop_document);
      }
      if (processedFiles.shop_photo) {
        formData.append('shop_photo', processedFiles.shop_photo);
      }

      // Submit to backend API
      const response = await fetch("/api/vendor-register", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      if (result.success) {
        // Show success message
        toast.success(
          language === "hi" 
            ? "पंजीकरण डेटा वैलिडेट हो गया है। कृपया भुगतान पूरा करें।" 
            : "Registration data validated. Please complete payment."
        );

        // Credentials will be shown on the success page after payment
        // No need to show modal here as we redirect to success page
        // if (result.payment_details) {
        //   setCredentials({
        //     vendorId: result.payment_details.vendor_id,
        //     applicationId: result.payment_details.application_id,
        //     password: result.payment_details.temporary_password || 'Not available yet',
        //   });
        //   setShowCredentialsModal(true);
        // }

        // Integrate Razorpay payment with better error handling
        if (result.payment_details && window.Razorpay) {
          try {
            console.log("Initializing Razorpay with:", {
              key: result.payment_details.razorpay_key,
              amount: result.payment_details.amount,
              order_id: result.payment_details.order_id,
            });

            const options = {
              key: result.payment_details.razorpay_key,
              amount: result.payment_details.amount,
              currency: result.payment_details.currency,
              name:
                language === "hi"
                  ? "पथ विक्रेता एकता संघ"
                  : "Path Vikreta Ekta Sangh",
              description:
                language === "hi" ? "सदस्यता शुल्क" : "Membership Fee",
              order_id: result.payment_details.order_id,
              handler: async function (response: any) {
                try {
                  // Verify payment
                  const verifyResponse = await fetch("/api/payment/verify", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                    }),
                  });

                  const verifyResult = await verifyResponse.json();

                  if (verifyResult.success) {
                    toast.success(
                      language === "hi"
                        ? "भुगतान सफल! आपका आवेदन जमा हो गया है।"
                        : "Payment successful! Your application has been submitted."
                    );

                    // Redirect to success page with credentials
                    const successParams = new URLSearchParams({
                      applicationId: verifyResult.applicationId,
                      vendorId: verifyResult.vendorId,
                      email: verifyResult.email,
                      password: verifyResult.temporaryPassword,
                      paymentId: response.razorpay_payment_id,
                    });

                    router.push(`/vendor/success?${successParams.toString()}`);
                  } else {
                    toast.error(
                      language === "hi"
                        ? "भुगतान सत्यापन विफल।"
                        : "Payment verification failed."
                    );
                  }
                } catch (verifyError) {
                  console.error("Payment verification error:", verifyError);
                  toast.error(
                    language === "hi"
                      ? "भुगतान सत्यापन में त्रुटि।"
                      : "Payment verification error."
                  );
                }
              },
              prefill: {
                name: data.name,
                email: data.email || `${result.payment_details.vendor_id}@pathvikreta.org`,
                contact: data.mobile,
              },
              theme: {
                color: "#FF6B6B",
              },
              modal: {
                ondismiss: function () {
                  console.log("Payment modal dismissed");
                  // Don't freeze the page when modal is dismissed
                },
              },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
          } catch (razorpayError) {
            console.error("Razorpay initialization error:", razorpayError);
            toast.error(
              language === "hi"
                ? "भुगतान गेटवे में त्रुटि।"
                : "Payment gateway error."
            );
          }
        } else {
          console.error("Razorpay not loaded or payment data missing");
          toast.warning(
            language === "hi"
              ? "भुगतान गेटवे लोड नहीं हुआ। आप बाद में भुगतान कर सकते हैं।"
              : "Payment gateway failed to load. You can complete payment later."
          );

          // Redirect to registration page to retry
          toast.info(
            language === "hi"
              ? "कृपया पेज रिलोड करें और भुगतान दोबारा कोशिश करें।"
              : "Please reload the page and try payment again."
          );
        }
      } else {
        throw new Error(result.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error(
        language === "hi"
          ? `पंजीकरण में त्रुटि हुई: ${error.message}`
          : `Registration failed: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (showLanguageSelector) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4 ${
          language === "hi" ? "font-mixed" : "font-sans"
        }`}
      >
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <Globe className="w-16 h-16 text-gov-blue mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gov-blue mb-2">
              {language === "hi" ? "भाषा चुनें" : "Choose Language"}
            </h2>
            <p className="text-neutral-600 mb-8">
              {language === "hi"
                ? "फॉर्म भरने के लिए अपनी पसंदीदा भाषा चुनें"
                : "Select your preferred language for filling the form"}
            </p>

            <div className="space-y-4">
              <button
                onClick={() => handleLanguageSelect("hi")}
                className="w-full bg-gov-coral hover:bg-red-500 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                हिंदी (Hindi)
              </button>
              <button
                onClick={() => handleLanguageSelect("en")}
                className="w-full bg-gov-blue hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                English
              </button>
            </div>

            <p className="text-xs text-neutral-500 mt-6">
              {language === "hi"
                ? "आप बाद में भी भाषा बदल सकते हैं"
                : "You can change the language later"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-50 ${
        language === "hi" ? "font-mixed" : "font-sans"
      }`}
    >
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
                <h1 className="text-lg font-bold text-gov-blue">
                  {language === "hi"
                    ? "पथ विक्रेता एकता संघ"
                    : "Path Vikreta Ekta Sangh"}
                </h1>
                <p className="text-xs text-neutral-600">
                  {language === "hi"
                    ? "सदस्यता पंजीकरण"
                    : "Membership Registration"}
                </p>
              </div>
            </Link>

            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white py-4 shadow-sm">
        <div className="container-fluid">
          <div className="flex items-center justify-center space-x-2 md:space-x-8 overflow-x-auto px-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={index} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        isActive
                          ? step.color
                          : isCompleted
                          ? "bg-gov-teal"
                          : "bg-gray-300"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <p className="text-xs mt-1 text-center max-w-20">
                      {step.title[language]}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 md:w-16 h-1 mx-2 ${
                        isCompleted ? "bg-gov-teal" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container-fluid py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Personal Information */}
            {currentStep === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-gov-blue mb-6">
                  {language === "hi"
                    ? "व्यक्तिगत जानकारी"
                    : "Personal Information"}
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === "hi" ? "नाम" : "Name"} *
                    </label>
                    <input
                      {...register("name")}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent"
                      placeholder={
                        language === "hi"
                          ? "अपना पूरा नाम लिखें"
                          : "Enter your full name"
                      }
                    />
                    {language === "en" && (
                      <p className="text-xs text-neutral-500 mt-1">नाम</p>
                    )}
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === "hi" ? "आयु" : "Age"} *
                      </label>
                      <input
                        {...register("age", { valueAsNumber: true })}
                        type="number"
                        min="18"
                        max="100"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent"
                        placeholder="18"
                      />
                      {language === "en" && (
                        <p className="text-xs text-neutral-500 mt-1">आयु</p>
                      )}
                      {errors.age && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.age.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === "hi" ? "मोबाइल नंबर" : "Mobile Number"} *
                      </label>
                      <div className="relative">
                        <input
                          {...register("mobile")}
                          type="tel"
                          maxLength={10}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent"
                          placeholder="9876543210"
                        />
                        {validationLoading.mobile && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gov-blue border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                      {language === "en" && (
                        <p className="text-xs text-neutral-500 mt-1">मोबाइल नंबर</p>
                      )}
                      {errors.mobile && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.mobile.message}
                        </p>
                      )}
                      {mobileError && (
                        <p className="text-red-600 text-sm mt-1">
                          {mobileError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === "hi" ? "ईमेल (वैकल्पिक)" : "Email (Optional)"}
                    </label>
                    <div className="relative">
                      <input
                        {...register("email")}
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent"
                        placeholder={
                          language === "hi"
                            ? "your.email@example.com"
                            : "your.email@example.com"
                        }
                      />
                      {validationLoading.email && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gov-blue border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                    {language === "en" && (
                      <p className="text-xs text-neutral-500 mt-1">ईमेल (वैकल्पिक)</p>
                    )}
                    {errors.email && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.email.message}
                      </p>
                    )}
                    {emailError && (
                      <p className="text-red-600 text-sm mt-1">
                        {emailError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === "hi" ? "लिंग" : "Gender"} *
                    </label>
                    <select
                      {...register("gender")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent"
                    >
                      <option value="">
                        {language === "hi" ? "चयन करें" : "Select"}
                      </option>
                      <option value="male">
                        {language === "hi" ? "पुरुष" : "Male"}
                      </option>
                      <option value="female">
                        {language === "hi" ? "स्त्री" : "Female"}
                      </option>
                    </select>
                    {language === "en" && (
                      <p className="text-xs text-neutral-500 mt-1">लिंग</p>
                    )}
                    {errors.gender && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === "hi"
                        ? "पहचान पत्र का प्रकार"
                        : "ID Document Type"}{" "}
                      *
                    </label>
                    <select
                      {...register("id_type")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent"
                    >
                      <option value="">
                        {language === "hi" ? "चयन करें" : "Select"}
                      </option>
                      {idTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type[language]}
                        </option>
                      ))}
                    </select>
                    {language === "en" && (
                      <p className="text-xs text-neutral-500 mt-1">
                        पहचान पत्र का प्रकार
                      </p>
                    )}
                    {errors.id_type && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.id_type.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === "hi"
                        ? "पहचान पत्र अपलोड करें"
                        : "Upload ID Document"}{" "}
                      *
                    </label>
                    <label
                      htmlFor="id-upload"
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gov-blue transition-colors cursor-pointer block"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {language === "hi"
                          ? "पहचान पत्र अपलोड करने के लिए क्लिक करें"
                          : "Click to upload ID document"}
                      </p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        id="id-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setValue("id_document", file);
                            setUploadedFiles((prev) => ({
                              ...prev,
                              id_document: file.name,
                            }));
                          }
                        }}
                      />
                    </label>
                    {uploadedFiles.id_document && (
                      <p className="text-sm text-green-600 mt-2 flex items-center">
                        <Check className="w-4 h-4 mr-2" />
                        {uploadedFiles.id_document}
                      </p>
                    )}
                    {language === "en" && (
                      <p className="text-xs text-neutral-500 mt-1">
                        पहचान पत्र अपलोड करें
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === "hi" ? "फोटो अपलोड करें" : "Upload Photo"} *
                    </label>
                    <label
                      htmlFor="photo-upload"
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gov-blue transition-colors cursor-pointer block"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {language === "hi"
                          ? "पासपोर्ट साइज़ फोटो या सेल्फी अपलोड करें"
                          : "Upload passport size photo or selfie"}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="photo-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setValue("photo", file);
                            setUploadedFiles((prev) => ({
                              ...prev,
                              photo: file.name,
                            }));
                          }
                        }}
                      />
                    </label>
                    {uploadedFiles.photo && (
                      <p className="text-sm text-green-600 mt-2 flex items-center">
                        <Check className="w-4 h-4 mr-2" />
                        {uploadedFiles.photo}
                      </p>
                    )}
                    {language === "en" && (
                      <p className="text-xs text-neutral-500 mt-1">
                        फोटो अपलोड करें
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Business Details */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-gov-blue mb-6">
                  {language === "hi" ? "व्यवसाय विवरण" : "Business Details"}
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === "hi" ? "दुकान का नाम" : "Shop Name"} *
                    </label>
                    <input
                      {...register("shop_name")}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent"
                      placeholder={
                        language === "hi"
                          ? "दुकान का नाम लिखें"
                          : "Enter shop name"
                      }
                    />
                    {language === "en" && (
                      <p className="text-xs text-neutral-500 mt-1">
                        दुकान का नाम
                      </p>
                    )}
                    {errors.shop_name && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.shop_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === "hi"
                        ? "व्यवसाय का प्रकार"
                        : "Business Type"}{" "}
                      *
                    </label>
                    <select
                      {...register("business_type")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent"
                    >
                      <option value="">
                        {language === "hi"
                          ? "व्यवसाय चुनें"
                          : "Select business type"}
                      </option>
                      {businessTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type[language]}
                        </option>
                      ))}
                    </select>
                    {language === "en" && (
                      <p className="text-xs text-neutral-500 mt-1">
                        व्यवसाय का प्रकार
                      </p>
                    )}
                    {errors.business_type && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.business_type.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Address & Documents */}
            {currentStep === 2 && (
              <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-gov-blue mb-6">
                  {language === "hi"
                    ? "पता और दस्तावेज़"
                    : "Address & Documents"}
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === "hi" ? "पता" : "Address"} *
                    </label>
                    <input
                      {...register("address_line1")}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent mb-3"
                      placeholder={
                        language === "hi"
                          ? "पूरा पता लिखें"
                          : "Enter complete address"
                      }
                    />
                    <input
                      {...register("address_line2")}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent"
                      placeholder={
                        language === "hi"
                          ? "पता लाइन 2 (वैकल्पिक)"
                          : "Address line 2 (optional)"
                      }
                    />
                    {language === "en" && (
                      <p className="text-xs text-neutral-500 mt-1">पता</p>
                    )}
                    {errors.address_line1 && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.address_line1.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === "hi" ? "सीमा चिन्ह" : "Landmark"}
                    </label>
                    <input
                      {...register("landmark")}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent"
                      placeholder={
                        language === "hi" ? "सीमा चिन्ह" : "Landmark"
                      }
                    />
                    {language === "en" && (
                      <p className="text-xs text-neutral-500 mt-1">
                        सीमा चिन्ह
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === "hi" ? "पिन कोड" : "Pincode"} *
                      </label>
                      <div className="relative">
                        <input
                          {...register("pincode")}
                          type="text"
                          maxLength={6}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent"
                          placeholder="462001"
                        />
                        {pincodeLoading && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gov-blue border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                      {language === "en" && (
                        <p className="text-xs text-neutral-500 mt-1">पिन कोड</p>
                      )}
                      {errors.pincode && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.pincode.message}
                        </p>
                      )}
                      {pincodeError && (
                        <p className="text-red-600 text-sm mt-1">
                          {pincodeError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === "hi" ? "शहर" : "City"} *
                      </label>
                      <input
                        {...register("city")}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent bg-gray-100"
                        placeholder={language === "hi" ? "शहर" : "City"}
                        readOnly
                      />
                      {language === "en" && (
                        <p className="text-xs text-neutral-500 mt-1">शहर</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === "hi" ? "राज्य" : "State"} *
                      </label>
                      <input
                        {...register("state")}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent bg-gray-100"
                        value="Madhya Pradesh"
                        readOnly
                      />
                      {language === "en" && (
                        <p className="text-xs text-neutral-500 mt-1">राज्य</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === "hi"
                        ? "दुकान के दस्तावेज़ का प्रकार"
                        : "Shop Document Type"}{" "}
                      *
                    </label>
                    <select
                      {...register("shop_document_type")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue focus:border-transparent"
                    >
                      <option value="">
                        {language === "hi" ? "चयन करें" : "Select"}
                      </option>
                      {shopDocumentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type[language]}
                        </option>
                      ))}
                    </select>
                    {language === "en" && (
                      <p className="text-xs text-neutral-500 mt-1">
                        दुकान के दस्तावेज़ का प्रकार
                      </p>
                    )}
                    {errors.shop_document_type && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.shop_document_type.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === "hi"
                        ? "दुकान के दस्तावेज़ अपलोड करें"
                        : "Upload Shop Document"}{" "}
                      *
                    </label>
                    <label
                      htmlFor="shop-doc-upload"
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gov-blue transition-colors cursor-pointer block"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {language === "hi"
                          ? "दुकान के दस्तावेज़ अपलोड करने के लिए क्लिक करें"
                          : "Click to upload shop document"}
                      </p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        id="shop-doc-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setValue("shop_document", file);
                            setUploadedFiles((prev) => ({
                              ...prev,
                              shop_document: file.name,
                            }));
                          }
                        }}
                      />
                    </label>
                    {uploadedFiles.shop_document && (
                      <p className="text-sm text-green-600 mt-2 flex items-center">
                        <Check className="w-4 h-4 mr-2" />
                        {uploadedFiles.shop_document}
                      </p>
                    )}
                    {language === "en" && (
                      <p className="text-xs text-neutral-500 mt-1">
                        दुकान के दस्तावेज़ अपलोड करें
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === "hi" ? "दुकान की तस्वीर" : "Shop Photo"} *
                    </label>
                    <label
                      htmlFor="shop-photo-upload"
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gov-blue transition-colors cursor-pointer block"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {language === "hi"
                          ? "दुकान की तस्वीर अपलोड करने के लिए क्लिक करें"
                          : "Click to upload shop photo"}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="shop-photo-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setValue("shop_photo", file);
                            setUploadedFiles((prev) => ({
                              ...prev,
                              shop_photo: file.name,
                            }));
                          }
                        }}
                      />
                    </label>
                    {uploadedFiles.shop_photo && (
                      <p className="text-sm text-green-600 mt-2 flex items-center">
                        <Check className="w-4 h-4 mr-2" />
                        {uploadedFiles.shop_photo}
                      </p>
                    )}
                    {language === "en" && (
                      <p className="text-xs text-neutral-500 mt-1">
                        दुकान की तस्वीर
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Payment & Confirmation */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-gov-blue mb-6">
                  {language === "hi"
                    ? "भुगतान और पुष्टि"
                    : "Payment & Confirmation"}
                </h2>

                <div className="text-center">
                  <div className="bg-gov-coral text-white rounded-xl p-8 mb-8">
                    <IndianRupee className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">
                      {language === "hi" ? "सदस्यता शुल्क" : "Membership Fee"}
                    </h3>
                    <div className="text-4xl font-bold mb-2">₹151</div>
                    <p className="opacity-90">
                      {language === "hi" ? "(वार्षिक शुल्क)" : "(Annual Fee)"}
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-6 mb-8">
                    <h4 className="font-semibold text-gov-blue mb-4">
                      {language === "hi"
                        ? "भुगतान के बाद आपको मिलेगा:"
                        : "After payment you will receive:"}
                    </h4>
                    <ul className="space-y-2 text-left max-w-md mx-auto">
                      <li className="flex items-center space-x-2">
                        <Check className="w-5 h-5 text-gov-teal" />
                        <span>
                          {language === "hi"
                            ? "यूनीक विक्रेता आईडी"
                            : "Unique Vendor ID"}
                        </span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-5 h-5 text-gov-teal" />
                        <span>
                          {language === "hi"
                            ? "लॉगिन के लिए पासवर्ड"
                            : "Login Password"}
                        </span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-5 h-5 text-gov-teal" />
                        <span>
                          {language === "hi"
                            ? "पेमेंट की रसीद"
                            : "Payment Receipt"}
                        </span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <Check className="w-5 h-5 text-gov-teal" />
                        <span>
                          {language === "hi"
                            ? "आवेदन की स्थिति ट्रैकिंग"
                            : "Application Status Tracking"}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <p className="text-sm text-neutral-600 mb-6">
                    {language === "hi"
                      ? "आपको __ दिन में पुष्टि दी जाएगी कि आपकी सदस्यता सफलतापूर्वक रजिस्टर हो चुकी है या नहीं।"
                      : "You will be confirmed within __ days whether your membership has been successfully registered or not."}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{language === "hi" ? "पिछला" : "Previous"}</span>
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center space-x-2 bg-gov-coral hover:bg-red-500 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  <span>{language === "hi" ? "आगे" : "Next"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>
                        {language === "hi"
                          ? "भुगतान हो रहा है..."
                          : "Processing Payment..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <IndianRupee className="w-4 h-4" />
                      <span>
                        {language === "hi" ? "₹151 भुगतान करें" : "Pay ₹151"}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Credentials Modal - Commented out as credentials are shown on success page */}
      {/* <CredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
        credentials={credentials}
        language={language}
      /> */}
    </div>
  );
}
