'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

interface AuthGuardOptions {
  requiredRole?: string[]
  redirectTo?: string
}

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { requiredRole, redirectTo = '/auth/login' } = options

  useEffect(() => {
    if (loading) return // Wait for auth state to load

    if (!user) {
      // No user logged in, redirect to login
      router.push(redirectTo)
      return
    }

    if (requiredRole && !requiredRole.includes(user.role)) {
      // User doesn't have required role, redirect to login
      router.push(redirectTo)
      return
    }
  }, [user, loading, requiredRole, redirectTo, router])

  return { user, loading, isAuthorized: !!user && (!requiredRole || requiredRole.includes(user.role)) }
}