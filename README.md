# UTA marketplace

This project is an AI-powered e-commerce platform that provides a personalized shopping experience among UTA students. Built with Express.js, MySQL, and Socket.io for real-time chat functionality.

## Features

- User authentication and profile management
- Browse catalog with categories
- Shopping cart functionality
- Seller page with Product listing capabilities
- Order processing and payment handling
- Address management
- FAQ system
- Real-time chat support
- AI-powered personalized product recommendations

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Communication**: Socket.io
- **AI Recommendations**: Custom recommendation engine based on user interactions

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server (v8.0 or higher)
- npm or yarn

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd e-commerce-backend-1
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Create the database**

```bash
# Create a MySQL database named 'ecommerce_db' (or your preferred name)
mysql -u root -p
CREATE DATABASE commerce_one;
```

5. **Run database migrations**

```bash
# Import the database schema
mysql -u root -p commerce_one < create.sql
```

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will run on `http://localhost:5000` by default (or the port specified in your .env file).

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: User login
- `POST /api/auth/logout`: User logout
- `POST /api/auth/refresh-token`: Refresh access token

### User Management

- `GET /api/users/profile`: Get user profile
- `PUT /api/users/profile`: Update user profile
- `GET /api/users`: Get all users (admin only)


### Products

- `GET /api/products`: Get all products
- `GET /api/products/:id`: Get product details
- `GET /api/products/category/:categoryId`: Get products by category
- `GET /api/products/search`: Search products
- `POST /api/products`: Add product (admin only)
- `PUT /api/products/:id`: Update product (admin only)
- `DELETE /api/products/:id`: Delete product (admin only)

### Categories

- `GET /api/categories`: Get all categories
- `GET /api/categories/:id`: Get category by ID
- `POST /api/categories`: Add category (admin only)
- `PUT /api/categories/:id`: Update category (admin only)
- `DELETE /api/categories/:id`: Delete category (admin only)

### Cart

- `GET /api/cart`: Get user's cart
- `POST /api/cart`: Add item to cart
- `PUT /api/cart/:productId`: Update cart item quantity
- `DELETE /api/cart/:productId`: Remove item from cart
- `DELETE /api/cart`: Clear cart

### Orders

- `GET /api/orders`: Get user's orders
- `GET /api/orders/:id`: Get order details
- `POST /api/orders`: Create new order
- `POST /api/orders/:id/cancel`: Cancel order

### Payments

- `POST /api/payments/process`: Process payment
- `GET /api/payments`: Get payment history
- `GET /api/payments/:id`: Get payment details

### Reviews

- `GET /api/products/:id/reviews`: Get product reviews
- `POST /api/products/:id/reviews`: Add product review
- `PUT /api/reviews/:id`: Update review
- `DELETE /api/reviews/:id`: Delete review

### Addresses

- `GET /api/addresses`: Get user's addresses
- `POST /api/addresses`: Add new address
- `PUT /api/addresses/:id`: Update address
- `DELETE /api/addresses/:id`: Delete address
- `POST /api/addresses/:id/default`: Set address as default


### Recommendations

- `GET /api/recommendations/personalized`: Get personalized recommendations
- `GET /api/recommendations/similar/:productId`: Get similar products/you might also like
- `GET /api/recommendations/recently-viewed`: Get recently viewed products
- `GET /api/recommendations/trending`: Get trending products


## Chat Functionality

The application includes real-time chat functionality using Socket.io. The chat allows customers to communicate with admin support staff.

### Socket.io Events

- `authenticate`: Authenticate user for chat
- `sendMessage`: Send a new message
- `userStatus`: User online/offline status
- `newMessage`: Receive a new message
- `messageSent`: Confirmation of message sent
- `previousMessages`: Load previous messages

# project structure 
e-commerce-backend-1/
│   server.js
│   README.md
│   .gitignore
│   package-lock.json
│   package.json
│   .env
│   .env.example
│   ecommerce-key-one.pem
│
├── config/
│   ├── auth.js
│   ├── database.js
│   ├── multer.js
│   └── socket.js
│
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   ├── cartController.js
│   ├── categoryController.js
│   ├── contactController.js
│   ├── messageController.js
│   ├── orderController.js
│   ├── productController.js
│   ├── reportController.js
│   └── reviewController.js
│
├── database/
│   └── create.sql
│
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
│
├── models/
│   ├── Cart.js
│   ├── Category.js
│   ├── Message.js
│   ├── Order.js
│   ├── Product.js
│   ├── Report.js
│   ├── Review.js
│   ├── Setting.js
│   └── User.js
│
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── cartRoutes.js
│   ├── categoryRoutes.js
│   ├── contactRoutes.js
│   ├── messageRoutes.js
│   ├── orderRoutes.js
│   ├── productRoutes.js
│   ├── reportRoutes.js
│   └── reviewRoutes.js
│
├── services/
│   └── emailService.js
│
├── uploads/
│   (empty or used for storing uploaded files)
│
└── utils/
    ├── errors.js
    ├── helpers.js
    ├── logger.js
    ├── queryBuilder.js
    ├── securityUtils.js
    └── validators.js
