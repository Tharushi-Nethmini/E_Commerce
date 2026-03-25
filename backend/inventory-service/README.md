# Low Stock Email Notification (Not API)

This service supports automatic supplier notification via email when product stock drops below a threshold. **Note:** Notification API endpoints for users are now managed by the User Service, not here.

To enable low-stock email notifications, set the following environment variables:

```
NOTIFY_EMAIL_USER=your_email@gmail.com
NOTIFY_EMAIL_PASS=your_email_password_or_app_password
```

These credentials are used for sending low-stock alerts to suppliers. For security, use an app password or environment secret manager in production.

**Product Schema Changes:**
- `lowStockNotified` (Boolean): Tracks if notification was sent for current low-stock event.
- `lowStockThreshold` (Number): Threshold for low stock (default: 10).

**Notification Logic:**
- When product quantity drops to or below `lowStockThreshold` and `lowStockNotified` is false, an email is sent to the supplier and the flag is set to true.
- When stock is replenished above the threshold, the flag is reset.
# Inventory Service - Node.js/Express

Product catalog and inventory management microservice for the E-Commerce application.

## Features

- Product CRUD operations
- Stock management with reservations
- Stock check, reserve, confirm, and release operations
- Category-based product filtering
- MongoDB database
- Swagger API documentation
- Docker support

## API Endpoints

### Product Management
- `POST /api/inventory/products` - Create new product
- `GET /api/inventory/products/:id` - Get product by ID
- `GET /api/inventory/products` - Get all products
- `GET /api/inventory/products?category={category}` - Get products by category
- `PUT /api/inventory/products/:id` - Update product
- `DELETE /api/inventory/products/:id` - Delete product

### Inter-Service Communication
- `POST /api/inventory/check-stock` - Check stock availability
- `POST /api/inventory/reserve-stock` - Reserve stock for order
- `POST /api/inventory/confirm-stock` - Confirm and deduct stock after payment
- `POST /api/inventory/release-stock` - Release reserved stock if order fails

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
PORT=8082
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/inventory-service
```

### Docker

```bash
# Build image
docker build -t inventory-service .

# Run container
docker run -p 8082:8082 --env-file .env inventory-service
```

## API Documentation

Once the service is running, visit:
- Swagger UI: http://localhost:8082/api-docs

## Inter-Service Communication

This service is called by:
- **Order Service**: To check stock, reserve stock, confirm stock, and release stock during order processing

## Database Schema

```javascript
{
  name: String,
  description: String,
  price: Number,
  quantity: Number,
  category: String,
  sku: String (unique),
  available: Boolean,
  reservedQuantity: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Stock Management Flow

1. **Check Stock**: Order service checks if product is available
2. **Reserve Stock**: If available, stock is reserved (not yet deducted)
3. **Confirm Stock**: After successful payment, stock is deducted
4. **Release Stock**: If order/payment fails, reserved stock is released

This ensures inventory accuracy even with concurrent orders.
