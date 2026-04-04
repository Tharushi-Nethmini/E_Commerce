/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // For Docker optimization
  env: {
    API_USER_SERVICE: process.env.API_USER_SERVICE || 'http://16.16.24.81:8081',
    API_INVENTORY_SERVICE: process.env.API_INVENTORY_SERVICE || 'http://16.16.24.81:8082',
    API_ORDER_SERVICE: process.env.API_ORDER_SERVICE || 'http://16.16.24.81:8080',
    API_PAYMENT_SERVICE: process.env.API_PAYMENT_SERVICE || 'http://16.16.24.81:8083',
    NEXT_PUBLIC_API_USER_SERVICE: process.env.NEXT_PUBLIC_API_USER_SERVICE || process.env.API_USER_SERVICE || 'http://16.16.24.81:8081',
    NEXT_PUBLIC_API_INVENTORY_SERVICE: process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE || process.env.API_INVENTORY_SERVICE || 'http://16.16.24.81:8082',
    NEXT_PUBLIC_API_ORDER_SERVICE: process.env.NEXT_PUBLIC_API_ORDER_SERVICE || process.env.API_ORDER_SERVICE || 'http://16.16.24.81:8080',
    NEXT_PUBLIC_API_PAYMENT_SERVICE: process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE || process.env.API_PAYMENT_SERVICE || 'http://16.16.24.81:8083',
  },
}

module.exports = nextConfig
