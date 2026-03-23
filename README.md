# NexMart — Microservices E-Commerce Platform
## Next.js + Node.js/Express Implementation

NexMart is a complete microservices-based e-commerce platform demonstrating DevOps practices and cloud capabilities for SLIIT SE4010 assignment.

## 🏗️ Architecture Overview

This project consists of:
- **1 Next.js Frontend** (Port 3000)
- **4 Node.js/Express Microservices**:
  1. **User Service** (Port 8081) - User authentication and management
  2. **Inventory Service** (Port 8082) - Product catalog and stock management
  3. **Order Service** (Port 8080) - Order orchestration (coordinator)
  4. **Payment Service** (Port 8083) - Payment processing
- **MongoDB** - Database for all services

### Communication Flow

```
Next.js Client → Order Service → User Service (validate user)
                               → Inventory Service (check & reserve stock)
                               → Payment Service (process payment)
                               → Inventory Service (confirm stock)
```

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND                         │
│                  (React 18 + App Router)                    │
│                       Port: 3000                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
            ▼                             ▼
  ┌──────────────────┐         ┌──────────────────┐
  │  Direct Service  │         │  Order Service   │
  │     Calls        │         │  (Orchestrator)  │
  │                  │         │    Port: 8080    │
  └──────────────────┘         └────────┬─────────┘
            │                           │
    ┌───────┼───────────────────────────┼──────────┐
    │       │                           │          │
    ▼       ▼                           ▼          ▼
┌────────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐
│  User  │ │Inventory│ │ Payment  │ │ Inventory │
│Service │ │ Service │ │ Service  │ │  Service  │
│ :8081  │ │  :8082  │ │  :8083   │ │   :8082   │
└───┬────┘ └────┬────┘ └────┬─────┘ └─────┬─────┘
    │           │           │             │
    └───────────┴───────────┴─────────────┘
                      │
                      ▼
          ┌──────────────────────────┐
          │      MongoDB             │
          │  (Shared Database Server)│
          │    Port: 27017           │
          │                          │
          │  - user-service DB       │
          │  - inventory-service DB  │
          │  - payment-service DB    │
          │  - order-service DB      │
          └──────────────────────────┘
```

## 🚀 Technology Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** for UI
- **Custom CSS** with NexMart design system (indigo-purple gradient theme)
- **Axios** for HTTP requests
- **JWT cookies** for authentication

### Backend
- **Node.js 20** runtime
- **Express.js** web framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Swagger/OpenAPI** for documentation
- **Helmet.js** for security

### DevOps
- **Docker** & **Docker Compose**
- **Multi-stage builds** for optimization
- **Health checks** for all services
- **Non-root users** in containers

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or 20
- **MongoDB** 7.0+
- **Docker** & **Docker Compose** (optional)
- **Git**

### Quick Start with Docker Compose

```bash
# Clone the repository
git clone <your-repo-url>
cd E-Commerce

# Start all services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Access the application:
- **Frontend**: http://localhost:3000
- **Order Service API**: http://localhost:8080/api-docs
- **User Service API**: http://localhost:8081/api-docs
- **Inventory Service API**: http://localhost:8082/api-docs
- **Payment Service API**: http://localhost:8083/api-docs

### Running Services Individually

#### 1. Start MongoDB

```bash
docker run -d -p 27017:27017 --name mongodb mongo:7-jammy
```

#### 2. Start User Service

```bash
cd backend/user-service
npm install
npm run dev
```

#### 3. Start Inventory Service

```bash
cd backend/inventory-service
npm install
npm run dev
```

#### 4. Start Payment Service

```bash
cd backend/payment-service
npm install
npm run dev
```

#### 5. Start Order Service

```bash
cd backend/order-service
npm install
npm run dev
```

#### 6. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📖 API Documentation

Each service has Swagger documentation available:

- **User Service**: http://localhost:8081/api-docs
- **Inventory Service**: http://localhost:8082/api-docs
- **Order Service**: http://localhost:8080/api-docs
- **Payment Service**: http://localhost:8083/api-docs

## 🔧 Service Details

### User Service (Port 8081)

**Responsibility**: User authentication and profile management

**Key Features**:
- JWT-based authentication
- User registration and login
- Role-based access (CUSTOMER, ADMIN, SUPPLIER)
- Token validation for other services

**Endpoints**:
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login and get JWT
- `GET /api/users` - Get all users
- `POST /api/users/validate` - Validate token

### Inventory Service (Port 8082)

**Responsibility**: Product catalog and inventory management

**Key Features**:
- Product CRUD operations
- Stock management with reservations
- Category-based filtering
- Prevents overselling

**Endpoints**:
- `POST /api/inventory/products` - Create product
- `GET /api/inventory/products` - List products
- `POST /api/inventory/check-stock` - Check availability
- `POST /api/inventory/reserve-stock` - Reserve stock

### Payment Service (Port 8083)

**Responsibility**: Payment processing

**Key Features**:
- Multiple payment methods
- Transaction tracking
- Simulated payment gateway (90% success rate)
- Refund support
- Payment history with filters and pagination
- Saved payment methods management per user
- Invoice payload generation for completed/refunded payments

**Endpoints**:
- `POST /api/payments/process` - Process payment
- `GET /api/payments` - List payments
- `GET /api/payments/history` - Filtered payment history
- `POST /api/payments/:id/refund` - Refund payment
- `GET /api/payments/:id/refund-status` - Refund status
- `GET /api/payments/:id/invoice` - Invoice data
- `POST /api/payments/methods` - Add payment method
- `GET /api/payments/methods/:userId` - List saved methods
- `PUT /api/payments/methods/:methodId` - Update payment method
- `DELETE /api/payments/methods/:methodId` - Delete payment method

### Order Service (Port 8080)

**Responsibility**: Order orchestration

**Key Features**:
- Coordinates all other services
- Transaction-like behavior
- Automatic rollback on failures
- Order tracking

**Endpoints**:
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `POST /api/orders/:id/cancel` - Cancel order

## 🎨 NexMart Frontend Features

- **User Home Dashboard** — Personalised stats (orders, spending, active orders) at `/home`
- **Admin Analytics** — Revenue KPIs, orders-by-status chart, user-role breakdown at `/analytics`
- **Analytics Export** — Export full reports as PDF (jsPDF) or Excel (SheetJS) directly from the Analytics dashboard
- **Role-Based Navigation** — ADMIN sees Analytics, Users, Products; CUSTOMER sees Home, Products, Orders, Payments, Cart
- **Live Search & Filter** — Instant client-side search bars on all data pages:
  - **Products**: search by name, category, or SKU
  - **Orders**: search by order ID / user ID / product ID + status dropdown filter
  - **Users**: search by username, email, or full name + role dropdown filter
  - **Payments**: search by payment ID / order ID / transaction ID + status/date filters
- **Payment Methods Management** — Add/set-default/delete saved payment methods on the Payments page
- **Invoice Generation** — One-click professional PDF invoice download from Payments page
- **Checkout Method Reuse** — Cart checkout and user Create Order modal consume saved payment methods (default auto-selected)
- **Professional NexMart UI** — Indigo-purple gradient design system, rounded cards, pill badges across all pages
- **Product Image Upload** — Drag-and-drop styled upload zone with live preview
- **Rs. Currency** — All monetary values displayed in Sri Lankan Rupees
- **Secure Modals** — Blur-backdrop overlays with animation on Products, Orders and Users pages
- **Branded Favicon** — NexMart SVG icon (indigo-purple gradient) displayed in the browser tab

## 🔐 Security Features

- **JWT Authentication** with bcrypt password hashing
- **Helmet.js** for security headers
- **CORS** properly configured
- **Input validation** on all endpoints
- **Non-root Docker users**
- **Environment variable** management
- **MongoDB connection** security

## 🐳 Docker Support

Each service has:
- **Multi-stage Dockerfile** for optimized builds
- **Health checks** for monitoring
- **Non-root user** execution
- **Minimal alpine images**
- **.dockerignore** for smaller images

## 📦 Project Structure

```
E-Commerce/
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js pages
│   │   ├── components/    # React components
│   │   ├── context/       # Auth context
│   │   └── lib/           # Utilities
│   ├── Dockerfile
│   └── package.json
│
├── backend/               # Backend microservices
│   ├── user-service/      # User microservice
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   └── config/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── inventory-service/ # Inventory microservice
│   │   ├── src/           # Same structure
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── payment-service/   # Payment microservice
│   │   ├── src/           # Same structure
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── order-service/     # Order microservice
│       ├── src/
│       │   ├── clients/   # Service clients
│       │   └── ...        # Same structure
│       ├── Dockerfile
│       └── package.json
│
├── docker-compose.yml     # Docker Compose config
└── README.md              # This file
```

## 🧪 Testing the Application

### 1. Register a User

```bash
curl -X POST http://localhost:8081/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "role": "CUSTOMER"
  }'
```

### 2. Create a Product

```bash
curl -X POST http://localhost:8082/api/inventory/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Product",
    "description": "A great product",
    "price": 99.99,
    "quantity": 100,
    "category": "Electronics",
    "sku": "PROD-001"
  }'
```

### 3. Create an Order

```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_FROM_STEP_1",
    "productId": "PRODUCT_ID_FROM_STEP_2",
    "quantity": 2,
    "paymentMethod": "CREDIT_CARD"
  }'
```

### 4. Verify Payment Features

- Open Payments page and verify the new order appears in **My Payments**
- Click **Generate Invoice** to download a professional PDF invoice
- Add a payment method and set one as default
- Go to Cart (or user Create Order modal) and confirm default saved method is preselected

## 🚀 Deployment

### Cloud Deployment Options

1. **AWS**:
   - ECS (Elastic Container Service) with Fargate
   - ECR (Elastic Container Registry) for images
   - RDS for MongoDB (DocumentDB)
   - ALB for load balancing

2. **Azure**:
   - Azure Container Apps
   - Azure Container Registry
   - Cosmos DB (MongoDB API)
   - Azure Application Gateway

3. **Google Cloud**:
   - Cloud Run
   - Container Registry
   - Cloud MongoDB
   - Cloud Load Balancer

### CI/CD with GitHub Actions

Each service can have its own workflow:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push Docker image
        # ... deployment steps
```

## 📝 Assignment Requirements Checklist

- ✅ **4 Microservices**: User, Inventory, Order, Payment
- ✅ **Inter-service Communication**: Order service communicates with all others
- ✅ **Docker Containerization**: All services containerized
- ✅ **CI/CD Ready**: GitHub Actions compatible
- ✅ **API Documentation**: Swagger/OpenAPI for all services
- ✅ **Security**: JWT, Helmet, bcrypt, input validation
- ✅ **Cloud Deployment Ready**: ECS/Azure Container Apps compatible
- ✅ **DevOps Practices**: Multi-stage builds, health checks, logging
- ✅ **Live Search & Filter**: Client-side search on Products, Orders, Users, and Payments pages
- ✅ **Analytics Export**: PDF and Excel report export from Analytics dashboard
- ✅ **Branded Favicon**: NexMart SVG icon in browser tab

## 🔗 Service Communication Example

When creating an order:

1. **Frontend** → calls Order Service
2. **Order Service** → validates with User Service
3. **Order Service** → checks stock with Inventory Service
4. **Order Service** → reserves stock with Inventory Service
5. **Order Service** → processes payment with Payment Service
6. **Order Service** → confirms stock with Inventory Service
7. **Order Service** → stores order as `PENDING` (awaiting admin confirmation) and returns response

## 📄 License

This project is for educational purposes (SLIIT SE4010 Assignment).

## 👥 Team

- **Student 1**: User Service
- **Student 2**: Inventory Service
- **Student 3**: Payment Service
- **Student 4**: Order Service

## 🆘 Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
docker ps | grep mongodb

# View MongoDB logs
docker logs mongodb
```

### Service Not Starting

```bash
# View service logs
docker logs <service-name>

# Rebuild specific service
docker-compose -f docker-compose-node.yml up -d --build <service-name>
```

### Port Already in Use

```bash
# Find process using port
netstat -ano | findstr :8080

# Kill process (Windows)
taskkill /PID <pid> /F
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Swagger/OpenAPI Spec](https://swagger.io/specification/)
