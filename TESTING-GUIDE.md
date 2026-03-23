# Testing Guide — NexMart Platform

## ✅ Quick Verification

### 1. Verify Folder Structure

```powershell
# Check root directories
Get-ChildItem -Directory

# Should show:
# .github
# backend
# frontend

# Check backend services
Get-ChildItem -Path backend -Directory

# Should show:
# inventory-service
# order-service
# payment-service
# user-service
```

### 2. Validate Docker Compose

```powershell
# Validate configuration
docker-compose config --services

# Should list:
# mongodb
# user-service
# inventory-service
# payment-service
# order-service
# frontend
```

### 3. Test Docker Compose Build

```powershell
# Clean start
docker-compose down -v

# Build all services
docker-compose build

# Should build:
# ✅ frontend (from ./frontend)
# ✅ user-service (from ./backend/user-service)
# ✅ inventory-service (from ./backend/inventory-service)
# ✅ payment-service (from ./backend/payment-service)
# ✅ order-service (from ./backend/order-service)
```

### 4. Start All Services

```powershell
# Start in detached mode
docker-compose up -d

# Check status
docker-compose ps

# All services should show "Up" status
```

### 5. Verify Services Are Running

```powershell
# Check logs for each service
docker-compose logs frontend
docker-compose logs user-service
docker-compose logs inventory-service
docker-compose logs payment-service
docker-compose logs order-service
docker-compose logs mongodb
```

### 6. Test API Endpoints

```powershell
# Test User Service
Invoke-WebRequest -Uri "http://localhost:8081/api-docs" -Method GET

# Test Inventory Service
Invoke-WebRequest -Uri "http://localhost:8082/api-docs" -Method GET

# Test Payment Service
Invoke-WebRequest -Uri "http://localhost:8083/api-docs" -Method GET

# Test Order Service
Invoke-WebRequest -Uri "http://localhost:8080/api-docs" -Method GET

# Test Frontend
Invoke-WebRequest -Uri "http://localhost:3000" -Method GET
```

### 7. Test End-to-End Flow

#### Open Browser
```
http://localhost:3000
```

#### Register a User
1. Click "Register here"
2. Fill in:
   - Username: testuser
   - Email: test@example.com
   - Password: Test@123
   - Role: CUSTOMER
3. Click Register

#### Login
1. Use credentials from registration
2. **ADMIN** users are redirected to the Analytics dashboard (`/analytics`)
3. **CUSTOMER** users are redirected to the Home dashboard (`/home`)

#### Create Product (Admin Only)
1. Register another user with role ADMIN
2. Login as admin
3. Go to Products
4. Click "Add Product"
5. Fill in product details
6. Submit

#### Create Order
1. Login as CUSTOMER
2. Go to Products and add item(s) to cart
3. Open Cart and complete checkout
4. Go to Payments and confirm payment appears

> Alternate test path: create order directly from Orders page modal.

#### Test Search & Filter (All Roles)

**Products page:**
1. Go to the Products page
2. Type a product name (or partial name) in the search bar — list filters instantly
3. Type a category name — only matching products appear
4. Type a SKU (e.g. `PROD-001`) — exact match is shown

**Orders page:**
1. Go to the Orders page
2. Type part of an order ID in the search bar — matching orders appear
3. Use the **Status** dropdown to filter by `PENDING`, `DELIVERED`, etc.
4. Combine both: type a user ID and select a status — filters stack

**Users page (Admin only):**
1. Go to the Users page
2. Type a username or email — matching users appear
3. Use the **Role** dropdown to show only `ADMIN` or `CUSTOMER` users

**Payments page:**
1. Go to the Payments page
2. Type a transaction ID or order ID — matching payments appear
3. Use the **Status** dropdown to filter by `COMPLETED`, `FAILED`, etc.
4. Use date filters and click **Apply**
5. Click **Generate Invoice** and verify PDF download starts

#### Test Payment Methods Integration
1. On Payments page, add a payment method (`last4`, expiry, type)
2. Mark one method as default
3. Open Cart page and verify default method is preselected
4. Open user Create Order modal and verify saved methods are listed
5. Delete a method and confirm it no longer appears in Cart/Orders selectors

#### Test Analytics Export (Admin Only)
1. Login as ADMIN
2. Go to Analytics (`/analytics`)
3. Click **Export PDF** — a PDF report should download automatically
4. Click **Export Excel** — an `.xlsx` file should download automatically
5. Open both files and verify all KPI sections are present

## 🧪 Local Development Testing

### Start Individual Services

```powershell
# Terminal 1 - MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7-jammy

# Terminal 2 - User Service
cd backend/user-service
npm install
npm run dev
# Should show: Server running on port 8081

# Terminal 3 - Inventory Service
cd backend/inventory-service
npm install
npm run dev
# Should show: Server running on port 8082

# Terminal 4 - Payment Service
cd backend/payment-service
npm install
npm run dev
# Should show: Server running on port 8083

# Terminal 5 - Order Service
cd backend/order-service
npm install
npm run dev
# Should show: Server running on port 8080

# Terminal 6 - Frontend
cd frontend
npm install
npm run dev
# Should show: Next.js running on http://localhost:3000
```

### Test Service Communication

```powershell
# Register user via API
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "Test@123"
    role = "CUSTOMER"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8081/api/users/register" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# Login to get token
$loginBody = @{
    username = "testuser"
    password = "Test@123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8081/api/users/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"

$token = ($response.Content | ConvertFrom-Json).token
Write-Host "Token: $token"

# Create product (requires admin token)
$productBody = @{
    name = "Test Product"
    description = "Test Description"
    price = 1299.99
    quantity = 100
    sku = "TEST-001"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8082/api/inventory/products" `
    -Method POST `
    -Headers @{Authorization = "Bearer $token"} `
    -Body $productBody `
    -ContentType "application/json"
```

## 📊 Success Criteria

### All Checks Should Pass ✅

- [ ] Folder structure matches new layout
- [ ] docker-compose config shows all 6 services
- [ ] All services build successfully
- [ ] All services start without errors
- [ ] All health checks pass
- [ ] All Swagger UIs accessible
- [ ] Frontend loads at http://localhost:3000
- [ ] User registration works
- [ ] User login works
- [ ] Product creation works
- [ ] Order creation works
- [ ] Payment processing works
- [ ] Inter-service communication works

## 🔍 Troubleshooting

### Issue: Services Won't Build

```powershell
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Issue: Port Already in Use

```powershell
# Find process using port
netstat -ano | findstr "3000"
netstat -ano | findstr "8080"
netstat -ano | findstr "8081"
netstat -ano | findstr "8082"
netstat -ano | findstr "8083"

# Stop all Docker containers
docker-compose down
docker stop $(docker ps -aq)
```

### Issue: Database Connection Failed

```powershell
# Check MongoDB is running
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb

# Wait for health check
docker-compose ps
```

### Issue: Service Can't Find Another Service

```powershell
# Check network
docker network ls
docker network inspect e-commerce_ecommerce-network

# Verify service names
docker-compose ps

# Check service logs for connection errors
docker-compose logs [service-name]
```

## 📝 Test Results Template

```
Date: _______________
Tester: _______________

Docker Compose Tests:
[ ] Configuration valid
[ ] All services build
[ ] All services start
[ ] All health checks pass

API Tests:
[ ] User Service Swagger: http://localhost:8081/api-docs
[ ] Inventory Service Swagger: http://localhost:8082/api-docs
[ ] Payment Service Swagger: http://localhost:8083/api-docs
[ ] Order Service Swagger: http://localhost:8080/api-docs

Frontend Tests:
[ ] Frontend loads: http://localhost:3000
[ ] Registration works
[ ] Login works
[ ] Products page loads
[ ] Orders page loads
[ ] Payments page loads
[ ] Users page loads (admin only)

Integration Tests:
[ ] User can register
[ ] User can login
[ ] Admin can create product
[ ] Customer can create order
[ ] Payment processes successfully
[ ] Saved payment method can be added/updated/deleted
[ ] Invoice PDF downloads from Payments page
[ ] Order status updates correctly

Notes:
_________________________________
_________________________________
_________________________________
```

## 🚀 Performance Benchmarks

### Expected Build Times
- Frontend: 30-60 seconds
- Each Service: 20-40 seconds
- Total: 2-4 minutes (first build)

### Expected Startup Times
- MongoDB: 5-10 seconds
- Backend Services: 3-5 seconds each
- Frontend: 10-15 seconds
- Total: 30-45 seconds

### Expected Response Times
- API endpoints: < 100ms
- Frontend page loads: < 1 second
- Order creation flow: < 2 seconds

---

**Ready to Test?** Run these commands in order:

```powershell
# 1. Validate
docker-compose config --services

# 2. Build
docker-compose build

# 3. Start
docker-compose up -d

# 4. Check
docker-compose ps

# 5. Test
Start-Process "http://localhost:3000"
Start-Process "http://localhost:8081/api-docs"
```

Good luck! 🎉
