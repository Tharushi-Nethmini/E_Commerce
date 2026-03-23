# E-Commerce Next.js Frontend

Modern Next.js 14 frontend for the E-Commerce Microservices application.

## Features

- **Next.js 14** with App Router
- **Tailwind CSS** for styling
- **JWT Authentication** with cookies
- **Protected Routes** with role-based access
- **API Integration** with all microservices
- **Responsive Design**
- **Docker Support**

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_USER_SERVICE=http://localhost:8081
NEXT_PUBLIC_API_INVENTORY_SERVICE=http://localhost:8082
NEXT_PUBLIC_API_ORDER_SERVICE=http://localhost:8080
NEXT_PUBLIC_API_PAYMENT_SERVICE=http://localhost:8083
```

### Build for Production

```bash
npm run build
npm start
```

### Docker

```bash
# Build image
docker build -t ecommerce-frontend .

# Run container
docker run -p 3000:3000 ecommerce-frontend
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── products/          # Products management
│   ├── orders/            # Orders management
│   ├── payments/          # Payments view
│   └── users/             # User management (Admin only)
├── components/            # Reusable components
│   ├── Navbar.js
│   └── ProtectedRoute.js
├── context/               # React Context providers
│   └── AuthContext.js
└── lib/                   # Utilities
    └── api.js            # Axios instance with interceptors
```

## API Integration

The frontend integrates with 4 microservices:

- **User Service** (8081): Authentication and user management
- **Inventory Service** (8082): Product catalog
- **Order Service** (8080): Order orchestration
- **Payment Service** (8083): Payment processing

## Authentication

- JWT tokens stored in HTTP-only cookies
- Automatic token refresh
- Protected routes with middleware
- Role-based access control (CUSTOMER, ADMIN, SUPPLIER)
