# Tabungan RT 04 - Sistem Keuangan Digital

Sistem manajemen tabungan digital untuk warga RT 04 dengan fitur lengkap untuk mengelola anggota, setoran, penarikan, laporan, dan audit logs.

## 🎯 Fitur Utama

- ✅ **Dashboard** - Ringkasan data keuangan real-time
- ✅ **Manajemen Anggota** - CRUD anggota penabung
- ✅ **Setoran Tabungan** - Pencatatan setoran warga
- ✅ **Penarikan Tabungan** - Request dan approval penarikan
- ✅ **Laporan & Mutasi** - Laporan keuangan detail
- ✅ **Audit Logs** - Tracking semua aktivitas CRUD
- ✅ **Authentication & Authorization** - Role-based access control
- ✅ **Security Best Practices** - JWT, password hashing, rate limiting

## 📊 Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 12+
- **Authentication**: JWT (jsonwebtoken)
- **Security**: 
  - Password hashing dengan bcryptjs
  - Rate limiting
  - Helmet untuk HTTP security headers
  - CORS enabled
  - Input validation dengan Joi

### Frontend
- **Framework**: React 18.x
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS + responsive design

### Mobile (Future)
- React Native / Flutter untuk Android dan iOS

## 🏗️ Struktur Project

```
tabungan-rt04/
├── backend/                      # Backend API
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   ├── db/                  # Database schema & seed
│   │   ├── middleware/          # Auth, error handling
│   │   ├── controllers/         # Business logic
│   │   ├── routes/              # API routes
│   │   ├── models/              # Data models
│   │   ├── utils/               # Utilities & helpers
│   │   └── server.js            # Entry point
│   ├── tests/                   # Unit & integration tests
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── frontend/                    # Frontend React + Vite
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── context/             # React Context (Auth)
│   │   ├── services/            # API services
│   │   ├── hooks/               # Custom hooks
│   │   ├── styles/              # CSS files
│   │   ├── utils/               # Utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .gitignore
│
├── mobile/                      # Mobile app (future)
│   └── README.md
│
├── docs/                        # Documentation
│   ├── API.md                   # API documentation
│   ├── DATABASE.md              # Database schema
│   ├── SETUP.md                 # Setup guide
│   └── SECURITY.md              # Security practices
│
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js v18 or higher
- PostgreSQL 12 or higher
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Setup database**
   ```bash
   # Create database and tables
   npm run migrate
   
   # Seed sample data
   npm run seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```
   Server akan berjalan di `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Frontend akan berjalan di `http://localhost:5173`

## 📚 API Documentation

See [docs/API.md](docs/API.md) for detailed API endpoints.

### Base URL
```
http://localhost:5000/api/v1
```

### Main Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user profile

- `GET /members` - Get all members
- `POST /members` - Create new member
- `GET /members/:id` - Get member detail
- `PUT /members/:id` - Update member
- `DELETE /members/:id` - Deactivate member

- `POST /deposits` - Create deposit
- `GET /deposits` - Get all deposits
- `GET /deposits/:id` - Get deposit detail

- `POST /withdrawals` - Create withdrawal request
- `GET /withdrawals` - Get all withdrawals
- `PUT /withdrawals/:id/approve` - Approve/reject withdrawal

- `GET /reports/dashboard` - Dashboard summary
- `GET /reports/summary` - Period report
- `GET /reports/member/:memberId` - Member report

- `GET /audits` - Get audit logs
- `GET /audits/:id` - Get audit log detail

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Login Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "admin|treasurer|member"
    }
  }
}
```

### Using Token
Add to request header:
```
Authorization: Bearer <token>
```

## 👥 Roles & Permissions

### Admin
- Manage all users and members
- View all transactions
- Approve/reject withdrawals
- Access audit logs
- Generate reports

### Treasurer
- Create and record transactions
- Approve withdrawals
- View reports
- Cannot access audit logs

### Member
- View own profile and balance
- Request withdrawals
- View own transaction history
- Cannot manage other members

## 📋 Database

PostgreSQL database with the following main tables:
- `users` - User accounts
- `members` - Member details
- `deposits` - Deposit transactions
- `withdrawals` - Withdrawal requests
- `transactions` - Transaction history
- `audit_logs` - Activity audit trail
- `report_summaries` - Report cache

See [docs/DATABASE.md](docs/DATABASE.md) for detailed schema.

## 🔒 Security Features

✅ **Authentication**
- JWT-based authentication
- Secure password hashing with bcryptjs
- Session management

✅ **Authorization**
- Role-based access control (RBAC)
- Route protection with middleware

✅ **Input Validation**
- Request validation with Joi
- SQL injection prevention with parameterized queries
- XSS protection

✅ **API Security**
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Helmet for HTTP security headers
- HTTPS ready

✅ **Audit Trail**
- Complete CRUD logging
- User activity tracking
- IP address logging
- Timestamp recording

## 📝 Demo Credentials

After running migrations and seeding:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@rt04.local | Admin@123 |
| Treasurer | treasurer@rt04.local | Treasurer@123 |
| Member | member1@rt04.local | Member@123 |

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:watch
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚢 Production Deployment

### Backend
1. Set environment variables for production
2. Build: `npm run build`
3. Start: `npm start`
4. Use process manager (PM2, forever, etc.)
5. Setup reverse proxy (Nginx, Apache)
6. Enable HTTPS/SSL

### Frontend
1. Build: `npm run build`
2. Deploy `dist` folder to web server
3. Setup reverse proxy to backend API
4. Enable gzip compression
5. Setup CDN for assets

## 📱 Mobile App Integration

Mobile apps (iOS/Android) can integrate using:
- REST API endpoints
- Same authentication flow (JWT tokens)
- Base URL: `https://api.tabungan-rt04.com/api/v1`

## 📞 Support & Development

For API integration questions or mobile development:
- See API documentation: [docs/API.md](docs/API.md)
- Database schema: [docs/DATABASE.md](docs/DATABASE.md)
- Security guide: [docs/SECURITY.md](docs/SECURITY.md)

## 📄 License

MIT License

## 🎓 Learning Resources

This project demonstrates:
- Clean architecture principles
- RESTful API design
- Database design with PostgreSQL
- JWT authentication
- Role-based authorization
- React hooks and context
- Best practices for full-stack development
- Security best practices
- Audit logging and compliance

---

**Built with best practices in mind for security, scalability, and maintainability.**
