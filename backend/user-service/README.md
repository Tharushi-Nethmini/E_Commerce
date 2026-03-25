# User Service - Node.js/Express

User authentication and management microservice for the E-Commerce application.

## Features

- User registration and authentication
- JWT token generation and validation
- Role-based access control (CUSTOMER, ADMIN, SUPPLIER)
- Password encryption with bcrypt
- MongoDB database
- Swagger API documentation
- Docker support


## API Endpoints

### Public Endpoints
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login and get JWT token
- `POST /api/users/validate` - Validate JWT token
- `POST /api/users/validate/user` - Get user from token

### Protected Endpoints (requires authentication)
- `GET /api/users/:id` - Get user by ID
- `GET /api/users` - Get all users
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id` - Partially update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Notification Endpoints (requires authentication)
- `GET /api/notifications` - Get all notifications for the logged-in user
- `PATCH /api/notifications/{id}/read` - Mark a notification as read
- `DELETE /api/notifications/{id}` - Delete a notification by ID (supplier only)

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- MongoDB

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables (edit .env file)
cp .env.example .env

# Run development server
npm run dev

# Run production server
npm start
```

### Environment Variables

```env
PORT=8081
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/user-service
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

### Docker

```bash
# Build image
docker build -t user-service .

# Run container
docker run -p 8081:8081 --env-file .env user-service
```

## API Documentation

Once the service is running, visit:
- Swagger UI: http://localhost:8081/api-docs

## Inter-Service Communication

This service is called by:
- **Order Service**: To validate users before creating orders
- **All Services**: To validate JWT tokens

## Database Schema

```javascript
{
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed, required),
  fullName: String (required),
  role: String (enum: CUSTOMER, ADMIN, SUPPLIER),
  createdAt: Date,
  updatedAt: Date
}
```

## Security

- Passwords are hashed using bcrypt (salt rounds: 10)
- JWT tokens expire in 7 days (configurable)
- Helmet.js for security headers
- CORS enabled
- Input validation using express-validator
