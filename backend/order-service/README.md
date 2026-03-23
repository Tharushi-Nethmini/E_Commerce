# Order Service - Node.js/Express

Order orchestration microservice for the E-Commerce application. This service coordinates all other microservices to process orders.

## Features

- Order creation with orchestration of multiple services
- Inter-service communication with User, Inventory, and Payment services
- Transaction-like behavior with rollback on failure
- Order status tracking and management
- Order cancellation with stock release
- MongoDB database
- Swagger API documentation
- Docker support

## API Endpoints

### Order Operations
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders` - Get all orders
- `GET /api/orders?userId={userId}` - Get orders by user
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/cancel` - Cancel order

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- MongoDB
- All other microservices running (User, Inventory, Payment)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run development server
npm run dev

# Run production server
npm start
```

### Environment Variables

```env
PORT=8080
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/order-service

# Service URLs
USER_SERVICE_URL=http://localhost:8081
INVENTORY_SERVICE_URL=http://localhost:8082
PAYMENT_SERVICE_URL=http://localhost:8083
```

### Docker

```bash
# Build image
docker build -t order-service .

# Run container
docker run -p 8080:8080 --env-file .env order-service
```

## API Documentation

Once the service is running, visit:
- Swagger UI: http://localhost:8080/api-docs

## Order Creation Flow

The order service orchestrates the following workflow:

1. **Stock Check**: Validates product availability with Inventory Service
2. **Stock Reservation**: Reserves stock (prevents overselling)
3. **Order Creation**: Creates order record in database
4. **Payment Processing**: Processes payment via Payment Service
5. **Stock Confirmation**: Deducts reserved stock from inventory
6. **Order Confirmation**: Updates order status to CONFIRMED

### Failure Handling

- If stock is unavailable → Order fails immediately
- If payment fails → Stock reservation is released
- If stock confirmation fails → Payment is logged but order marked as failed

This ensures data consistency across all services.

## Inter-Service Communication

This service communicates with:

### User Service
- `POST /api/users/validate` - Validate JWT token (optional)
- `POST /api/users/validate/user` - Get user details

### Inventory Service
- `POST /api/inventory/check-stock` - Check stock availability
- `POST /api/inventory/reserve-stock` - Reserve stock
- `POST /api/inventory/confirm-stock` - Confirm and deduct stock
- `POST /api/inventory/release-stock` - Release reserved stock

### Payment Service
- `POST /api/payments/process` - Process payment
- `POST /api/payments/status` - Get payment status

## Database Schema

```javascript
{
  userId: String (required, indexed),
  productId: String (required),
  quantity: Number (required, min: 1),
  totalAmount: Number (required),
  paymentMethod: String (enum),
  paymentId: String,
  status: String (enum: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, FAILED),
  failureReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Order Statuses

- **PENDING**: Order created, waiting for processing
- **CONFIRMED**: Payment successful, stock confirmed
- **PROCESSING**: Order being prepared
- **SHIPPED**: Order shipped to customer
- **DELIVERED**: Order delivered successfully
- **CANCELLED**: Order cancelled by user
- **FAILED**: Order failed (payment/stock issue)

## Error Handling

The service implements proper error handling and rollback:
- Failed payments trigger stock release
- Cancelled orders release reserved stock
- Failed orders are logged with failure reasons

## Testing

To test the complete flow, ensure all services are running:

```bash
# Terminal 1: User Service
cd backend/user-service && npm run dev

# Terminal 2: Inventory Service
cd backend/inventory-service && npm run dev

# Terminal 3: Payment Service
cd backend/payment-service && npm run dev

# Terminal 4: Order Service
cd backend/order-service && npm run dev
```
