# Backend for AeroHacks v2.0

## Tech Stack

- Node.js 20+
- Express 4.21+
- MongoDB Atlas (Mongoose 8.0+)
- JWT Authentication
- Cloudinary (File Upload)
- SendGrid (Email Service)
- Socket.io (Real-time)

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### 3. Run Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

## Environment Variables Required

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `SENDGRID_API_KEY` - SendGrid API key
- `CLIENT_URL` - Frontend URL (for CORS)

## API Documentation

See `/docs/API.md` for complete API documentation.

## Project Structure

```
backend/
├── config/
│   ├── db.js                 # MongoDB connection
│   ├── cloudinary.js         # Cloudinary configuration
│   └── sendgrid.js           # SendGrid configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── hackathonController.js # Hackathon CRUD
│   ├── teamController.js     # Team management
│   ├── entryLogController.js # QR scanning
│   ├── judgeController.js    # Evaluation
│   ├── adminController.js    # Admin operations
│   └── uploadController.js   # File uploads
├── middleware/
│   ├── auth.js               # JWT verification
│   ├── errorHandler.js       # Error handling
│   ├── validate.js           # Input validation
│   └── upload.js             # Multer configuration
├── models/
│   ├── User.js               # User schema
│   ├── Hackathon.js          # Hackathon schema
│   ├── Team.js               # Team schema
│   ├── EntryLog.js           # Entry log schema
│   └── RefreshToken.js       # Refresh token schema
├── routes/
│   ├── authRoutes.js         # /api/v1/auth/*
│   ├── hackathonRoutes.js    # /api/v1/hackathons/*
│   ├── teamRoutes.js         # /api/v1/teams/*
│   ├── entryLogRoutes.js     # /api/v1/entry-logs/*
│   ├── judgeRoutes.js        # /api/v1/judges/*
│   ├── adminRoutes.js        # /api/v1/admin/*
│   └── uploadRoutes.js       # /api/v1/uploads/*
├── socket/
│   └── socketHandler.js      # Socket.io events
├── utils/
│   ├── codeGenerator.js      # Generate hackathon/role codes
│   ├── qrGenerator.js        # Generate QR codes
│   ├── emailService.js       # Send emails
│   └── validators.js         # Validation schemas (Joi)
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore
├── package.json              # Dependencies
└── server.js                 # Entry point
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample data
- `npm run clean` - Clean database

## License

MIT
