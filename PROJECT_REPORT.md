# Project Report: NexMart — Microservices E-Commerce Platform

## SE4010 - Current Trends in Software Engineering
## Cloud Computing Assignment - 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Microservices Description](#microservices-description)
3. [Inter-Service Communication](#inter-service-communication)
4. [DevOps Practices](#devops-practices)
5. [Security Measures](#security-measures)
6. [Challenges and Solutions](#challenges-and-solutions)
7. [Conclusion](#conclusion)

---

## 1. Architecture Overview

### 1.1 System Architecture

Our e-commerce application is built using a microservices architecture with four independently deployable services. Each service is containerized using Docker and can be deployed on cloud platforms like AWS or Azure.

**Architecture Diagram:**

```
┌────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                          │
│                     (Web/Mobile Application)                   │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                         │
│              (AWS ALB / Azure Application Gateway)             │
│            Routes requests to appropriate services             │
└──────┬──────────────┬──────────────┬──────────────┬───────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│   User   │   │Inventory │   │  Order   │   │ Payment  │
│ Service  │   │ Service  │   │ Service  │   │ Service  │
│  :8081   │◄──┤  :8082   │◄──┤  :8080   │◄──┤  :8083   │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ User DB  │   │Product DB│   │ Order DB │   │Payment DB│
│(MongoDB) │   │(MongoDB) │   │(MongoDB) │   │(MongoDB) │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

### 1.2 Technology Stack

- **Backend Framework:** Express.js 4.x
- **Language:** JavaScript (Node.js 20)
- **Database:** MongoDB 7.0 with Mongoose ODM
- **Containerization:** Docker with multi-stage builds
- **Container Registry:** Docker Hub / AWS ECR / Azure ACR
- **Cloud Platforms:** AWS ECS (Fargate) / Azure Container Apps
- **CI/CD:** GitHub Actions
- **API Documentation:** Swagger/OpenAPI (swagger-jsdoc + swagger-ui-express)
- **Security:** JWT (jsonwebtoken), Helmet.js, bcryptjs
- **DevSecOps:** SonarCloud (SAST), Snyk (Dependency Scanning)
- **Frontend:** Next.js 14, React 18, custom NexMart CSS design system, live search/filter on all data pages, PDF & Excel export (jsPDF + SheetJS)

---

## 2. Microservices Description

### 2.1 User Service (Student 1)

**Port:** 8081  
**Responsibility:** User authentication and profile management

**Key Features:**
- User registration with validation
- Login with JWT token generation
- Token validation for other services
- User profile CRUD operations
- Password encryption using BCrypt
- Role-based user types (CUSTOMER, ADMIN, SUPPLIER)

**API Endpoints:**
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login and get JWT token
- `GET /api/users/{id}` - Get user details
- `POST /api/users/validate` - Validate JWT token (for inter-service calls)

**Role in Application:** Provides authentication and user information to other services, particularly the Order Service which validates users before creating orders.

---

### 2.2 Inventory Service (Student 2)

**Port:** 8082  
**Responsibility:** Product catalog and inventory management

**Key Features:**
- Product CRUD operations
- Stock quantity tracking
- Stock reservation system
- Category-based filtering
- Stock availability checking
- Real-time inventory updates

**API Endpoints:**
- `POST /api/inventory/products` - Create product
- `GET /api/inventory/products` - Get all products
- `POST /api/inventory/check-stock` - Check stock availability
- `POST /api/inventory/reserve-stock` - Reserve stock for order
- `POST /api/inventory/confirm-stock` - Confirm stock deduction

**Role in Application:** Manages product catalog and ensures stock availability. The Order Service communicates with this service to check, reserve, and confirm stock during order processing.

---

### 2.3 Order Service (Student 3) - **ORCHESTRATOR**

**Port:** 8080  
**Responsibility:** Order management and service orchestration

**Key Features:**
- Order creation with multiple items
- Service orchestration (coordinates with User, Inventory, Payment services)
- Order status management
- Order cancellation with automatic stock release
- Transaction management
- Error handling and rollback

**API Endpoints:**
- `POST /api/orders` - Create order (triggers full integration flow)
- `GET /api/orders` - Get all orders
- `GET /api/orders/{id}` - Get order details
- `POST /api/orders/{id}/cancel` - Cancel order

**Role in Application:** Acts as the central orchestrator that coordinates the entire order workflow by calling User, Inventory, and Payment services in sequence.

**Order Creation Flow:**
1. Validate user with User Service
2. For each product: Check stock with Inventory Service
3. Reserve stock with Inventory Service
4. Create order in database
5. Process payment with Payment Service
6. Confirm stock deduction with Inventory Service
7. Update order status to CONFIRMED

---

### 2.4 Payment Service (Student 4)

**Port:** 8083  
**Responsibility:** Payment processing

**Key Features:**
- Payment processing with multiple methods
- Transaction ID generation
- Payment status tracking
- Refund processing
- Payment gateway simulation
- Duplicate payment prevention
- Payment history API with filters and pagination
- Saved payment methods management (add/update/delete/default)
- Invoice payload generation for PDF export

**API Endpoints:**
- `POST /api/payments/process` - Process payment
- `GET /api/payments/order/{orderId}` - Get payment by order
- `POST /api/payments/{id}/refund` - Process refund
- `GET /api/payments/history` - Filtered payment history
- `GET /api/payments/{id}/refund-status` - Get refund status
- `GET /api/payments/{id}/invoice` - Generate invoice data
- `POST /api/payments/methods` - Add payment method
- `GET /api/payments/methods/{userId}` - Get methods for user
- `PUT /api/payments/methods/{methodId}` - Update payment method
- `DELETE /api/payments/methods/{methodId}` - Delete payment method

**Role in Application:** Handles payment processing for orders. Called by the Order Service after stock reservation to complete the transaction.

---

## 3. Inter-Service Communication

### 3.1 Communication Pattern

All services communicate using **synchronous REST API calls** via the Axios HTTP client. This ensures real-time validation and immediate feedback.

### 3.2 Communication Examples

#### Example 1: Order Service → User Service

**Purpose:** Validate user exists before creating order

```javascript
const response = await axios.get(
  `${process.env.USER_SERVICE_URL}/api/users/${userId}`,
  { headers: { Authorization: req.headers.authorization } }
);
const user = response.data;
```

**Demonstration:** When creating an order, the Order Service first validates the user ID exists in the User Service.

---

#### Example 2: Order Service → Inventory Service

**Purpose:** Check and reserve stock

```javascript
// Check stock availability
const stockCheck = await axios.post(
  `${process.env.INVENTORY_SERVICE_URL}/api/inventory/check-stock`,
  { productId, quantity },
  { headers: { Authorization: req.headers.authorization } }
);

// Reserve stock
await axios.post(
  `${process.env.INVENTORY_SERVICE_URL}/api/inventory/reserve-stock`,
  { productId, quantity },
  { headers: { Authorization: req.headers.authorization } }
);
```

**Demonstration:** Order Service checks if products are in stock, then reserves them before payment.

---

#### Example 3: Order Service → Payment Service

**Purpose:** Process payment

```javascript
const paymentResponse = await axios.post(
  `${process.env.PAYMENT_SERVICE_URL}/api/payments/process`,
  { orderId, amount, userId },
  { headers: { Authorization: req.headers.authorization } }
);
```

**Demonstration:** After stock reservation, Order Service processes payment through Payment Service.

---

### 3.3 Complete Integration Flow

```
Step 1: Client → Order Service
  POST /api/orders { userId: 1, items: [...] }

Step 2: Order Service → User Service
  GET /api/users/1
  Response: User details

Step 3: Order Service → Inventory Service
  POST /api/inventory/check-stock { productId: 1, quantity: 2 }
  Response: { available: true }

Step 4: Order Service → Inventory Service
  POST /api/inventory/reserve-stock { productId: 1, quantity: 2 }
  Response: Success

Step 5: Order Service → Payment Service
  POST /api/payments/process { orderId: 1, userId: 1, amount: 199.98 }
  Response: { status: "COMPLETED", transactionId: "TXN123" }

Step 6: Order Service → Inventory Service
  POST /api/inventory/confirm-stock { productId: 1, quantity: 2 }
  Response: Success

Step 7: Order Service → Client
  Response: Order created with status PENDING (awaiting admin confirmation)
```

---

## 4. DevOps Practices

### 4.1 Version Control (Git/GitHub)

**Implementation:**
- Each microservice has its own Git repository
- Meaningful commit messages following conventional commits
- `.gitignore` to exclude build artifacts and sensitive files
- README documentation for each service

**Benefits:**
- Independent versioning of services
- Easy collaboration and code review
- Clear change history

---

### 4.2 CI/CD Pipeline (GitHub Actions)

**Pipeline Configuration:** Each service has a `.github/workflows/ci.yml` file

**Pipeline Stages:**

1. **Code Checkout**
   ```yaml
   - uses: actions/checkout@v3
   ```

2. **Build Environment Setup**
   ```yaml
   - name: Set up Node.js 20
     uses: actions/setup-node@v4
     with:
       node-version: '20'
   ```

3. **Security Scanning (DevSecOps)**
   - **SonarCloud:** Static Application Security Testing (SAST)
   - **Snyk:** Dependency vulnerability scanning

4. **Build & Test**
   ```yaml
   - name: Install and test
     run: npm ci && npm test
   ```

5. **Containerization**
   - Build Docker image using multi-stage Dockerfile
   - Push to Docker Hub with tags (latest, commit SHA)

6. **Deployment** (Optional)
   - Deploy to AWS ECS or Azure Container Apps

**Benefits:**
- Automated testing on every commit
- Early detection of security vulnerabilities
- Consistent build process
- Automated deployment

---

### 4.3 Containerization (Docker)

**Multi-Stage Dockerfile:**

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 8080
CMD ["node", "src/server.js"]
```

**Benefits:**
- Small image size (Alpine Linux, no dev dependencies)
- Non-root user for security
- Cacheable layers for faster builds
- Health checks included

---

### 4.4 Infrastructure as Code

**Docker Compose for Local Development:**

```yaml
services:
  user-service:
    build: ./user-service
    ports: ["8081:8081"]
  
  inventory-service:
    build: ./inventory-service
    ports: ["8082:8082"]
  
  order-service:
    build: ./order-service
    ports: ["8080:8080"]
    depends_on:
      - user-service
      - inventory-service
      - payment-service
```

**Benefits:**
- One-command setup for entire application
- Consistent development environment
- Service dependency management

---

## 5. Security Measures

### 5.1 Application Security

#### 5.1.1 Authentication & Authorization (User Service)

**JWT Token-Based Authentication:**
- Users receive JWT tokens upon successful login
- Tokens contain user ID, username, and role
- Tokens expire after 24 hours
- Other services validate tokens via User Service

**Implementation:**
```javascript
// Generate JWT (User Service)
const token = jwt.sign(
  { userId: user._id, username: user.username, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

---

#### 5.1.2 Password Security

**BCrypt Hashing:**
```javascript
const bcrypt = require('bcryptjs');

// Hash before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
```

All passwords are hashed using bcryptjs (strength 10) before storage.

---

#### 5.1.3 Input Validation

**Express-validator on all routes:**
```javascript
const { body, validationResult } = require('express-validator');

router.post('/register', [
  body('username').isLength({ min: 3, max: 50 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  // ...
});
```

---

### 5.2 DevSecOps Practices

#### 5.2.1 Static Application Security Testing (SAST)

**SonarCloud Integration:**
- Analyzes code for security vulnerabilities
- Checks for code smells and bugs
- Measures code coverage
- Enforces quality gates

**Configuration:**
```yaml
- name: SonarCloud Scan
  uses: SonarSource/sonarcloud-github-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  with:
    args: >
      -Dsonar.projectKey=your-org_service-name
      -Dsonar.organization=your-org
```

---

#### 5.2.2 Dependency Vulnerability Scanning

**Snyk Integration:**
- Scans npm dependencies for known vulnerabilities
- Reports CVEs in third-party packages
- Suggests upgrade paths

**Configuration:**
```yaml
- name: Run Snyk
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

---

### 5.3 Cloud Security

#### 5.3.1 IAM Roles (Least Privilege)

**AWS ECS Task Role:**
- Services use IAM roles instead of access keys
- Each service has minimum required permissions
- No hardcoded credentials

**Example:**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
    "Resource": "arn:aws:logs:region:account:log-group:/ecs/user-service:*"
  }]
}
```

---

#### 5.3.2 Network Security (Security Groups)

**Security Group Configuration:**
- Load Balancer SG: Allow inbound HTTP/HTTPS from internet
- Service SG: Allow inbound only from Load Balancer SG
- Database SG: Allow inbound only from Service SG

**Example:**
```bash
# Service security group - only allow ALB
aws ec2 authorize-security-group-ingress \
  --group-id sg-service \
  --protocol tcp \
  --port 8080 \
  --source-group sg-alb
```

---

#### 5.3.3 Container Security

1. **Non-root User:** All containers run as non-root user
   ```dockerfile
   RUN adduser -S appuser -G appgroup
   USER appuser
   ```

2. **Image Scanning:** Docker Hub/ECR automatic vulnerability scanning

3. **Minimal Base Images:** Using Alpine Linux for smaller attack surface

---

### 5.4 Secrets Management

**Never Hardcode Secrets:**
- JWT secrets configured via environment variables
- Database credentials managed by cloud provider
- API keys stored in AWS Secrets Manager / Azure Key Vault

**Environment Variables (`.env`):**
```env
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/user-service
PORT=8081
```

---

## 6. Challenges and Solutions

### 6.1 Inter-Service Communication Challenges

#### Challenge: Service Discovery
**Problem:** Services need to know URLs of other services
**Solution:** 
- Local: Docker Compose service names
- Cloud: Load Balancer DNS names
- Configuration via environment variables

#### Challenge: Network Latency
**Problem:** Multiple HTTP calls increase response time
**Solution:**
- Keep services lightweight (MongoDB in-memory indexing)
- Consider async messaging for non-critical operations
- Implement circuit breakers (future enhancement)

---

### 6.2 Transaction Management

#### Challenge: Distributed Transactions
**Problem:** Order creation involves multiple services; if payment fails, need to rollback stock reservation

**Solution: Saga Pattern (Compensating Transactions)**
```javascript
try {
  await reserveStock();
  await processPayment();
  await confirmStock();
} catch (err) {
  // Compensate: release reserved stock
  await releaseStock();
  throw new Error('Order failed: ' + err.message);
}
```
```

---

### 6.3 Development Challenges

#### Challenge: Running Multiple Services Locally
**Problem:** Difficult to run 4 services simultaneously for testing

**Solution:**
- Docker Compose for one-command startup
- Health checks to ensure dependencies are ready
- Integration test script (`test-integration.sh`)

#### Challenge: Service Dependencies
**Problem:** Order Service depends on other three services

**Solution:**
- Docker Compose `depends_on` with health checks
- Graceful error handling when services unavailable
- Clear logging for debugging

---

### 6.4 Cloud Deployment Challenges

#### Challenge: Free Tier Limits
**Problem:** Need to stay within AWS/Azure free tier

**Solution:**
- Use smallest instance sizes (0.25 vCPU, 0.5GB RAM)
- Set up billing alerts
- Auto-scaling with min=0 for non-critical times

#### Challenge: Security Group Configuration
**Problem:** Services couldn't communicate initially

**Solution:**
- Properly configured security groups
- Used service discovery via internal DNS
- Tested connectivity using CloudWatch logs

---

## 7. Conclusion

### 7.1 Key Achievements

✅ **Frontend Features**
- Live client-side search and filter on Products, Orders, Users, and Payments pages
- PDF and Excel report export from the Analytics dashboard
- Branded NexMart favicon with indigo-purple gradient SVG icon

✅ **Microservices Architecture**
- Successfully implemented 4 independently deployable services
- Clear separation of concerns
- Demonstrated inter-service communication

✅ **DevOps Practices**
- Complete CI/CD pipelines with GitHub Actions
- Automated testing and security scanning
- Containerization with Docker

✅ **DevSecOps**
- SAST with SonarCloud
- Dependency scanning with Snyk
- Security best practices implemented

✅ **Cloud Deployment**
- Services deployed to AWS/Azure
- Load balancing configured
- Health monitoring enabled

✅ **Security**
- JWT authentication
- BCrypt password hashing
- IAM roles and security groups
- Input validation

---

### 7.2 Learning Outcomes

1. **Microservices Design:** Understanding of service boundaries and communication patterns
2. **DevOps Pipeline:** Hands-on experience with CI/CD automation
3. **Cloud Deployment:** Practical knowledge of AWS ECS/Azure Container Apps
4. **Security:** Implementation of security best practices and DevSecOps
5. **Orchestration:** Understanding of service coordination and transaction management

---

### 7.3 Future Enhancements

1. **API Gateway:** Implement an Express-based gateway service for unified entry point
2. **Service Mesh:** Use Istio for advanced traffic management
3. **Message Queue:** Add RabbitMQ/Kafka for asynchronous communication
4. **Caching:** Add Redis for performance optimization
5. **Monitoring:** Implement distributed tracing with Zipkin/Jaeger
6. **Circuit Breaker:** Implement opossum for fault tolerance
7. **Real-Time Updates:** Add WebSocket support for live order tracking notifications

---

### 7.4 Demonstration Checklist

For the 10-minute demonstration:

- [ ] Show architecture diagram
- [ ] Show all 4 microservices running
- [ ] Demonstrate complete order flow showing inter-service communication
- [ ] Show logs proving communication between services
- [ ] Demonstrate CI/CD pipeline running (make a code change, push, watch pipeline)
- [ ] Show deployed services on cloud (AWS/Azure)
- [ ] Explain security measures (JWT, IAM roles, security groups)
- [ ] Show SonarCloud and Snyk reports
- [ ] Discuss one major challenge faced and how it was solved

---

### 7.5 References

1. Spring Boot Documentation - https://spring.io/projects/spring-boot
2. Docker Documentation - https://docs.docker.com/
3. AWS ECS Documentation - https://docs.aws.amazon.com/ecs/
4. Azure Container Apps - https://learn.microsoft.com/azure/container-apps/
5. Microservices Patterns by Chris Richardson
6. GitHub Actions Documentation - https://docs.github.com/actions

---

**Date:** March 2026  
**Module:** SE4010 - Current Trends in Software Engineering  
**Institution:** SLIIT - Faculty of Computing
