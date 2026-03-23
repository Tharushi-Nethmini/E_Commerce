# Payment Service - Node.js/Express

Payment processing microservice for the E-Commerce application.

## Features

- Payment processing with multiple payment methods
- Transaction ID generation
- Payment status tracking
- Refund functionality
- Simulated payment gateway (90% success rate)
- MongoDB database
- Swagger API documentation
- Docker support

## API Endpoints

### Payment Operations
- `POST /api/payments/process` - Process a new payment
- `GET /api/payments/:id` - Get payment by ID
- `GET /api/payments/order/:orderId` - Get payment by order ID
- `GET /api/payments` - Get all payments
- `GET /api/payments/history` - Get payment history (filter + pagination)
- `POST /api/payments/:id/refund` - Refund a payment
- `GET /api/payments/:id/refund-status` - Get refund status
- `GET /api/payments/:id/invoice` - Generate invoice data

### Payment Methods Management
- `POST /api/payments/methods` - Add a payment method
- `GET /api/payments/methods/:userId` - Get all payment methods for a user
- `PUT /api/payments/methods/:methodId` - Update a payment method
- `DELETE /api/payments/methods/:methodId` - Delete a payment method

### Inter-Service Communication
- `POST /api/payments/status` - Get payment status for an order

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- MongoDB

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
PORT=8083
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/payment-service
```

### Docker

```bash
# Build image
docker build -t payment-service .

# Run container
docker run -p 8083:8083 --env-file .env payment-service
```

## API Documentation

Once the service is running, visit:
- Swagger UI: http://localhost:8083/api-docs

## Inter-Service Communication

This service is called by:
- **Order Service**: To process payments for orders

## Database Schema

```javascript
{
  userId: String (optional, indexed),
  orderId: String (required, indexed),
  amount: Number (required),
  paymentMethod: String (enum),
  transactionId: String (unique),
  status: String (enum: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED),
  failureReason: String,
  refund: {
    status: String (enum: NONE, REQUESTED, REFUNDED),
    reason: String,
    amount: Number,
    requestedAt: Date,
    refundedAt: Date
  },
  processedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Payment Methods

- CREDIT_CARD
- DEBIT_CARD
- PAYPAL
- CASH_ON_DELIVERY

## Payment Flow

1. Order service calls `/process` endpoint
2. Payment record created with PROCESSING status
3. Payment gateway simulation runs (1 second delay, 90% success rate)
4. Status updated to COMPLETED or FAILED
5. Transaction ID generated on success
6. Result returned to order service

## Future Enhancements

- Integration with real payment gateways (Stripe, PayPal, Square)
- Webhook support for async payment notifications
- Payment retry logic
- Installment payment support
- Multi-currency support
