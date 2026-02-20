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
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize @napi-rs/canvas — it has native binaries that webpack should not bundle
      config.externals = config.externals || [];
      config.externals.push({
        '@napi-rs/canvas': 'commonjs @napi-rs/canvas',
      });
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@napi-rs/canvas'],
  },
}

module.exports = nextConfig