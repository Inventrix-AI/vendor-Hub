import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/api/auth',
  '/api/vendors',
  '/api/payment',
  '/api/upload',
  '/_next',
  '/favicon.ico'
]

// Protected routes that require authentication
const protectedRoutes = [
  '/admin',
  '/vendor',
  '/profile'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public routes and API routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Check if route requires authentication
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('access_token')?.value
    
    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
      
      // Check role-based access
      if (pathname.startsWith('/admin') && 
          !['admin', 'super_admin', 'reviewer'].includes(decoded.role)) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
      
      if (pathname.startsWith('/vendor') && decoded.role !== 'vendor') {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
      
    } catch (error) {
      // Invalid token, redirect to login
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}