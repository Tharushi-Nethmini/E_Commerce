# NexMart — Quick Start Guide

## Prerequisites

- Node.js 18+ or 20+
- Docker Desktop (optional, for Docker setup)
- Git

## Option 1: Docker Compose (Recommended)

### Start Everything

```bash
# Navigate to project directory
cd E-Commerce

# Start all services with Docker Compose
docker-compose up -d --build

# Wait for services to start (about 30-60 seconds)

# Check status
docker-compose ps
```

### Access Services

- **Frontend**: http://localhost:3000
- **Order API Docs**: http://localhost:8080/api-docs
- **User API Docs**: http://localhost:8081/api-docs
- **Inventory API Docs**: http://localhost:8082/api-docs
- **Payment API Docs**: http://localhost:8083/api-docs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f user-service
```

### Stop Everything

```bash
docker-compose down
```

## Option 2: Local Development

### 1. Start MongoDB

```bash
docker run -d -p 27017:27017 --name mongodb mongo:7-jammy
```

### 2. Install Dependencies for All Services

```bash
# User Service
cd backend/user-service
npm install
cd ../..

# Inventory Service
cd backend/inventory-service
npm install
cd ../..

# Payment Service
cd backend/payment-service
npm install
cd ../..

# Order Service
cd backend/order-service
npm install
cd ../..

# Frontend
cd frontend
npm install
cd ..
```

### 3. Start Services (in separate terminals)

**Terminal 1 - User Service:**
```bash
cd backend/user-service
npm run dev
```

**Terminal 2 - Inventory Service:**
```bash
cd backend/inventory-service
npm run dev
```

**Terminal 3 - Payment Service:**
```bash
cd backend/payment-service
npm run dev
```

**Terminal 4 - Order Service:**
```bash
cd backend/order-service
npm run dev
```

**Terminal 5 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **All API Documentation**: See option 1 above

## First Time Setup

### 1. Register a User

Open http://localhost:3000 and click "Register here"

Fill in:
- Full Name
- Username
- Email
- Password
- Select Role (Customer/Admin/Supplier)

> **Role routing:** After login, **ADMIN** users are directed to the Analytics dashboard (`/analytics`). **CUSTOMER** users land on the personalised Home dashboard (`/home`) showing order stats and recent activity.

### 2. Create Products (Admin/Supplier)

1. Login with your credentials
2. Go to "Products" page
3. Click "Add Product"
4. Fill in product details

> **Search tip:** Use the search bar above the product grid to filter by name, category, or SKU.

### 3. Create an Order

1. Make sure products exist
2. Go to "Products" page and click **Add to Cart**
3. Open "Cart" page and choose payment method
4. Click **Checkout**
5. Open "Payments" page and verify payment appears

> Alternate path: Users can also create an order directly from the Orders page modal.

> **Search tip:** Use the search bar and status dropdown on the Orders page to quickly find specific orders.

### 4. Test Payment Features

1. Open **Payments** page
2. Use status/date filters to verify payment history
3. Click **Generate Invoice** to download the styled PDF invoice
4. Add a saved payment method in the Payment Methods section
5. Set one as default and verify Cart checkout auto-selects it

### 5. Export Analytics (Admin)

1. Login as ADMIN
2. Go to Analytics dashboard (`/analytics`)
3. Click **Export PDF** to download a full report as a PDF file
4. Click **Export Excel** to download all analytics data as a spreadsheet

## Troubleshooting

### Port Already in Use

**Windows PowerShell:**
```powershell
# Find process using port 8080
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess

# Kill it
Stop-Process -Id <PID> -Force
```

**Linux/Mac:**
```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9
```

### MongoDB Connection Error

```bash
# Check if MongoDB is running
docker ps | grep mongodb

# If not, start it
docker start mongodb

# Or create new instance
docker run -d -p 27017:27017 --name mongodb mongo:7-jammy
```

### Service Won't Start

```bash
# Clear node_modules and reinstall
cd <service-directory>
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Docker Issues

```bash
# Remove all containers
docker-compose down -v

# Rebuild everything
docker-compose up -d --build

# View specific service logs
docker logs -f <service-name>
```

## Testing API Endpoints

### Using Swagger UI

Visit the API documentation URLs listed above and use the "Try it out" feature.

### Using cURL

**Register User:**
```bash
curl -X POST http://localhost:8081/api/users/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"john\",\"email\":\"john@example.com\",\"password\":\"password123\",\"fullName\":\"John Doe\",\"role\":\"CUSTOMER\"}"
```

**Create Product:**
```bash
curl -X POST http://localhost:8082/api/inventory/products \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Laptop\",\"description\":\"Gaming Laptop\",\"price\":1299.99,\"quantity\":50,\"category\":\"Electronics\",\"sku\":\"LAP-001\"}"
```

## Environment Variables

### Development (.env files)

Each service has a `.env` file with default settings. For production, update:

**User Service:**
- `JWT_SECRET` - Change to secure random string
- `MONGODB_URI` - Update for production database

**All Services:**
- `NODE_ENV=production`
- `MONGODB_URI` - Production MongoDB URL

### Docker Compose

Edit `docker-compose-node.yml` to change environment variables for all services.

## Next Steps

1. ✅ Get all services running
2. ✅ Test the complete flow (Register → Create Product → Create Order)
3. 📝 Set up CI/CD pipeline (see GitHub Actions templates)
4. 🚀 Deploy to cloud (AWS ECS, Azure Container Apps, etc.)
5. 🔒 Integrate SAST tools (SonarCloud, Snyk)
6. 📊 Add monitoring and logging

## Need Help?

Check the full README-NODE.md for:
- Detailed architecture explanation
- Service-specific documentation
- Cloud deployment guides
- Security best practices
- CI/CD setup instructions

## Project Structure Reference

```
E-Commerce/
├── frontend/                  # Frontend (Port 3000)
├── backend/                   # Backend services
│   ├── user-service/          # User Service (Port 8081)
│   ├── inventory-service/     # Inventory Service (Port 8082)
│   ├── payment-service/       # Payment Service (Port 8083)
│   └── order-service/         # Order Service (Port 8080)
├── docker-compose.yml         # Docker Compose config
├── README.md                  # Full documentation
└── QUICKSTART.md              # This file
```

Happy coding! 🚀
