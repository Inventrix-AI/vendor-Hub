'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth'
import { useLanguage } from '@/lib/language'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { LogOut, User, Settings, ChevronDown, Phone, MapPin, UserCircle } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  title?: string
}

export function Layout({ children, title }: LayoutProps) {
  const { user, logout } = useAuth()
  const { language } = useLanguage()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    setDropdownOpen(false)
    logout()
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-neutral-50 to-white ${language === 'hi' ? 'font-mixed' : 'font-sans'}`}>
      {/* Government Header Strip */}
      <div className="gov-header"></div>
      
      {/* Government Style Navigation */}
      <nav className="bg-white shadow-md border-b border-neutral-200 sticky top-0 z-50">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center space-x-3">
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
            </div>

            <div className="flex items-center space-x-2">
              <LanguageSwitcher />
              {user ? (
                <div className="flex items-center space-x-4 ml-4">
                  <span className="text-sm text-neutral-600 hidden md:block">
                    Welcome, <span className="font-medium text-neutral-900">{user.full_name}</span>
                  </span>
                
                  {user.role === 'vendor' && (
                    <Link
                      href="/vendor/dashboard"
                      className="text-neutral-600 hover:text-gov-blue px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-blue-50"
                    >
                      Dashboard
                    </Link>
                  )}
                  
                  {(user.role === 'admin' || user.role === 'super_admin' || user.role === 'reviewer') && (
                    <Link
                      href="/admin/dashboard"
                      className="text-neutral-600 hover:text-gov-blue px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-blue-50"
                    >
                      Admin
                    </Link>
                  )}

                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center space-x-2 text-neutral-600 hover:text-gov-blue px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-blue-50 cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-gov-blue rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <span className="hidden md:block">Account</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200/60 py-2 z-50 animate-fade-in-up">
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="text-sm font-medium text-neutral-900">{user.full_name}</p>
                        <p className="text-xs text-neutral-500">{user.email}</p>
                      </div>
                      
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors cursor-pointer"
                      >
                        <Settings className="h-4 w-4 mr-3 text-neutral-400" />
                        Profile Settings
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 ml-4">
                  <Link href="/auth/login" className="text-neutral-600 hover:text-gov-blue transition-colors text-sm font-medium">
                    Sign In
                  </Link>
                  <Link href="/vendor/register" className="bg-gov-coral hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="container-fluid py-8">
        {title && (
          <div className="mb-8">
            <h1 className="text-display-lg text-neutral-900">{title}</h1>
          </div>
        )}
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gov-blue text-white">
        <div className="container-fluid py-8 px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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