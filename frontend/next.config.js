/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // For Docker optimization
  env: {
    API_USER_SERVICE: process.env.API_USER_SERVICE || 'http://localhost:8081',
    API_INVENTORY_SERVICE: process.env.API_INVENTORY_SERVICE || 'http://localhost:8082',
    API_ORDER_SERVICE: process.env.API_ORDER_SERVICE || 'http://localhost:8080',
    API_PAYMENT_SERVICE: process.env.API_PAYMENT_SERVICE || 'http://localhost:8083',
    NEXT_PUBLIC_API_USER_SERVICE: process.env.NEXT_PUBLIC_API_USER_SERVICE || process.env.API_USER_SERVICE || 'http://localhost:8081',
    NEXT_PUBLIC_API_INVENTORY_SERVICE: process.env.NEXT_PUBLIC_API_INVENTORY_SERVICE || process.env.API_INVENTORY_SERVICE || 'http://localhost:8082',
    NEXT_PUBLIC_API_ORDER_SERVICE: process.env.NEXT_PUBLIC_API_ORDER_SERVICE || process.env.API_ORDER_SERVICE || 'http://localhost:8080',
    NEXT_PUBLIC_API_PAYMENT_SERVICE: process.env.NEXT_PUBLIC_API_PAYMENT_SERVICE || process.env.API_PAYMENT_SERVICE || 'http://localhost:8083',
  },
}

module.exports = nextConfig
