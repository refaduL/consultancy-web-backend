# University Consultancy Platform - Backend API

Backend system for managing abroad consultancy services, connecting students with international universities.

## 🚀 Quick Start

### Prerequisites

- Node.js v16+
- MongoDB
- npm/yarn

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/consultancy-backend.git
cd consultancy-backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Seed database (optional)
npm run seed

# Start server
npm run dev
```

Server runs at `http://localhost:5000`

## 📁 Project Structure

```
/backend
 ┣ /src
 ┃ ┣ /config        # DB connection, environment setup
 ┃ ┣ /controllers   # Business logic
 ┃ ┣ /models        # Mongoose schemas
 ┃ ┣ /routes        # API endpoints
 ┃ ┣ /middlewares   # Auth, validation, error handling
 ┃ ┣ /utils         # Helpers (email, JWT, logger)
 ┃ ┣ /tests         # Unit/integration tests
 ┃ ┣ app.js         # Express app setup
 ┃ ┗ server.js      # Server entry point
 ┣ .env
 ┣ .gitignore
 ┣ package.json
 ┗ README.md
```

## 📌 Main Features

- User authentication (JWT)
- University search & filtering
- Consultancy application system
- Document upload & management
- Admin dashboard
- Email notifications
- Blog & resources

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Auth**: JWT, bcrypt
- **Storage**: Cloudinary/AWS S3
- **Email**: Nodemailer/SendGrid

## 📝 API Endpoints

```
# Auth
POST   /api/auth/register-user
POST   /api/auth/verify-user

POST   /api/auth/login
POST   /api/auth/reset-password
POST   /api/auth/logout

# Users
GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
DEL    /api/users/:id
GET    /api/users/search

# Universities
GET    /api/universities
GET    /api/universities/:id
GET    /api/universities/search

# 🚧 Work in Progress...
More endpoints coming soon!
```

## 🧪 Scripts

```bash
npm run dev          # Start development server
npm start            # Start production server
npm test             # Run tests
```

## 📄 License

MIT License

## 👥 Contributors

Refadul Islam: [refadul.cse@gmail.com](mailto:refadul.cse@gmail.com)

---

**Need help?** Open an issue or contact support.
