'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { LogOut, User, Building2, Settings, ChevronDown } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  title?: string
}

export function Layout({ children, title }: LayoutProps) {
  const { user, logout } = useAuth()
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white">
      <nav className="bg-white/95 backdrop-blur-md border-b border-neutral-200/60 sticky top-0 z-50">
        <div className="container-fluid">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-neutral-900">vendorHub</span>
              </Link>
            </div>

            {user ? (
              <div className="flex items-center space-x-6">
                <span className="text-sm text-neutral-600 hidden md:block">
                  Welcome, <span className="font-medium text-neutral-900">{user.full_name}</span>
                </span>
                
                {user.role === 'vendor' && (
                  <Link
                    href="/vendor/dashboard"
                    className="text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-neutral-100"
                  >
                    Dashboard
                  </Link>
                )}
                
                {(user.role === 'admin' || user.role === 'super_admin' || user.role === 'reviewer') && (
                  <Link
                    href="/admin/dashboard"
                    className="text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-neutral-100"
                  >
                    Admin
                  </Link>
                )}

                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-neutral-100 cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
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
              <div className="flex items-center space-x-3">
                <Link href="/auth/login" className="btn btn-ghost btn-sm">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn btn-primary btn-sm">
                  Get Started
                </Link>
              </div>
            )}
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
    </div>
  )
}