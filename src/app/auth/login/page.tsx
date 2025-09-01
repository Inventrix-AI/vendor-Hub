"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "@/lib/auth";
import {
  Eye,
  EyeOff,
  LogIn,
  Building,
  UserCheck,
  ArrowRight,
  User,
  Lock,
} from "lucide-react";
import { useLanguage } from "@/lib/language";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { toast } from "react-toastify";

const schema: yup.ObjectSchema<FormData> = yup
  .object({
    username: yup.string().required("Username/Vendor ID is required"),
    password: yup.string().required("Password is required"),
  })
  .required() as yup.ObjectSchema<FormData>;

type FormData = {
  username?: string;
  password?: string;
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver<FormData>(schema),
  });

  // Redirect if already logged in
  React.useEffect(() => {
    console.log("Login page useEffect triggered, user:", user);
    if (user) {
      console.log("User found, redirecting based on role:", user.role);
      if (user.role === "vendor") {
        console.log("Redirecting to vendor dashboard");
        router.push("/vendor/dashboard");
      } else if (
        user.role === "admin" ||
        user.role === "super_admin" ||
        user.role === "reviewer"
      ) {
        console.log("Redirecting to admin dashboard");
        router.push("/admin/dashboard");
      }
    }
  }, [user, router]);

  const onSubmit = async (data: FormData) => {
    try {
      console.log("Login form submitted with:", { username: data.username });
      setLoading(true);

      // Use the auth context login method for consistent token storage
      await login({ username: data.username || '', password: data.password || '' });

    } catch (error) {
      console.error("Login failed:", error);
      toast.error(
        language === "hi"
          ? (error as any)?.message || "लॉगिन विफल। कृपया पुनः प्रयास करें।"
          : (error as any)?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 ${
        language === "hi" ? "font-mixed" : "font-sans"
      }`}
    >
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-blue-600">
                  {language === "hi"
                    ? "पथ विक्रेता एकता संघ"
                    : "Path Vikreta Ekta Sangh"}
                </h1>
                <p className="text-xs text-neutral-600">
                  {language === "hi" ? "विक्रेता लॉगिन" : "Vendor Login"}
                </p>
              </div>
            </div>

            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="container-fluid py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {language === "hi" ? "वापस स्वागत है" : "Welcome Back"}
              </h1>
              <p className="text-gray-600">
                {language === "hi"
                  ? "अपने खाते में साइन इन करें"
                  : "Sign in to your account"}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <User className="h-4 w-4 inline mr-2" />
                  {language === "hi"
                    ? "विक्रेता ID या ईमेल"
                    : "Vendor ID or Email"}
                </label>
                <input
                  {...register("username")}
                  type="text"
                  id="username"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder={
                    language === "hi"
                      ? "अपना विक्रेता ID या ईमेल दर्ज करें"
                      : "Enter your Vendor ID or email"
                  }
                />
                {language === "en" && (
                  <p className="text-xs text-gray-500 mt-1">
                    विक्रेता ID या ईमेल
                  </p>
                )}
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Lock className="h-4 w-4 inline mr-2" />
                  {language === "hi" ? "पासवर्ड" : "Password"}
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                    placeholder={
                      language === "hi"
                        ? "अपना पासवर्ड दर्ज करें"
                        : "Enter your password"
                    }
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {language === "en" && (
                  <p className="text-xs text-gray-500 mt-1">पासवर्ड</p>
                )}
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>
                      {language === "hi"
                        ? "लॉगिन हो रहा है..."
                        : "Signing in..."}
                    </span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>
                      {language === "hi" ? "साइन इन करें" : "Sign In"}
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 space-y-4">
              <div className="text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      {language === "hi" ? "या" : "or"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/vendor/register")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
                >
                  <UserCheck className="h-5 w-5" />
                  <span>
                    {language === "hi" ? "नया सदस्य बनें" : "Become New Member"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/track-status")}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
                >
                  <ArrowRight className="h-5 w-5" />
                  <span>
                    {language === "hi"
                      ? "आवेदन ट्रैक करें"
                      : "Track Application"}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  {language === "hi"
                    ? "पहली बार लॉगिन कर रहे हैं?"
                    : "First time logging in?"}
                </h4>
                <p className="text-xs text-blue-700">
                  {language === "hi"
                    ? "पंजीकरण के बाद मिले विक्रेता ID और अस्थायी पासवर्ड का उपयोग करें। सफल लॉगिन के बाद आप अपना पासवर्ड बदल सकते हैं।"
                    : "Use the Vendor ID and temporary password received after registration. You can change your password after successful login."}
                </p>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              {language === "hi"
                ? "सहायता की आवश्यकता है? support@pathvikreta.org पर संपर्क करें"
                : "Need help? Contact support@pathvikreta.org"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
