# TownKart Localized Instant Grocery Delivery System

A full-stack web application that connects local shops with customers for fast, reliable delivery services. Built with Node.js, Express, MongoDB, and React.

## Features

### For Customers
- Browse local shops and products
- Search and filter shops by category
- Add products to cart
- Secure checkout process
- Track order status
- View order history
- Real-time notifications
- User profile management

### For Shops
- Shop profile management
- Product catalog management
- Order management
- Inventory tracking
- Analytics dashboard

### Technical Features
- JWT authentication
- Real-time notifications
- Responsive design
- RESTful API
- Image upload support
- Email notifications
- Search and filtering

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **multer** - File uploads
- **nodemailer** - Email sending
- **cloudinary** - Image storage

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **React Query** - Data fetching
- **React Hook Form** - Form handling
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client
- **React Toastify** - Notifications

## Project Structure

```
smart-local-delivery/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-local-delivery
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smart-local-delivery
   JWT_SECRET=your-jwt-secret
   JWT_EXPIRE=30d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the Backend**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start the Frontend**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Shops
- `GET /api/shops` - Get all shops
- `GET /api/shops/:id` - Get shop by ID
- `POST /api/shops` - Create new shop
- `PUT /api/shops/:id` - Update shop
- `DELETE /api/shops/:id` - Delete shop

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read

## Database Models

### User
- name, email, phone, password
- role (customer/shop_owner)
- address, preferences

### Shop
- name, description, location
- category, contact info
- operating hours, rating

### Product
- name, description, price
- category, images, stock
- shop reference

### Order
- items, total amount
- status, delivery address
- user and shop references

### Notification
- type, title, message
- user reference, read status
- delivery methods

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@smartdelivery.com or create an issue in the repository.
