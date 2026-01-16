/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  },
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Skip output file tracing for sharp to avoid micromatch stack overflow
  outputFileTracingExcludes: {
    '/api/certificates/[id]': ['./node_modules/sharp/**/*'],
  },
}

module.exports = nextConfig