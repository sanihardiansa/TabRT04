# Setup Guide - Tabungan RT 04

## Prerequisites

### System Requirements
- Node.js v18.0.0 or higher
- PostgreSQL 12 or higher
- npm v8.0.0 or higher (or yarn)
- Git

### Installation

#### macOS
```bash
# Install using Homebrew
brew install node@18
brew install postgresql

# Start PostgreSQL service
brew services start postgresql
```

#### Ubuntu/Debian
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
```

#### Windows
- Download and install Node.js from https://nodejs.org/ (v18 LTS)
- Download and install PostgreSQL from https://www.postgresql.org/download/windows/
- Use PostgreSQL installer to configure and start service

## Project Setup

### 1. Clone or Extract Project
```bash
cd tabungan-rt04
```

### 2. Backend Setup

#### 2.1 Navigate to Backend Directory
```bash
cd backend
```

#### 2.2 Install Dependencies
```bash
npm install
```

#### 2.3 Configure Environment Variables
```bash
# Copy example env file
cp .env.example .env

# Edit .env file with your settings
nano .env
```

**Update these values in .env:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tabungan_rt04
DB_USER=postgres
DB_PASSWORD=your_postgres_password
PORT=5000
JWT_SECRET=change_this_to_long_random_string
NODE_ENV=development
```

#### 2.4 Create PostgreSQL Database
```bash
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL prompt:
CREATE DATABASE tabungan_rt04;
\q
```

Or using single command:
```bash
psql -U postgres -c "CREATE DATABASE tabungan_rt04;"
```

#### 2.5 Run Database Migrations
```bash
npm run migrate
```

This will create all tables, indexes, and triggers.

#### 2.6 Seed Sample Data
```bash
npm run seed
```

This creates demo users:
- Admin: admin@rt04.local / Admin@123
- Treasurer: treasurer@rt04.local / Treasurer@123
- Member: member1@rt04.local / Member@123

#### 2.7 Start Backend Server
```bash
npm run dev
```

Server should start at `http://localhost:5000`

**Output:**
```
✅ Server running on port 5000
📡 Environment: development
🔒 CORS enabled for: http://localhost:5173, http://localhost:3000
```

### 3. Frontend Setup

#### 3.1 Navigate to Frontend Directory (in new terminal)
```bash
cd frontend
```

#### 3.2 Install Dependencies
```bash
npm install
```

#### 3.3 Verify API Configuration
Check `src/services/api.js` has correct backend URL:
```javascript
const API = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  ...
});
```

#### 3.4 Start Frontend Development Server
```bash
npm run dev
```

Frontend should start at `http://localhost:5173`

**Output:**
```
  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 4. Verify Installation

#### 4.1 Test Backend
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status":"ok","message":"Server is running"}
```

#### 4.2 Test API Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rt04.local","password":"Admin@123"}'
```

#### 4.3 Access Frontend
Open browser and navigate to `http://localhost:5173`

Login with demo credentials:
- Email: admin@rt04.local
- Password: Admin@123

## Database Management

### Backup Database
```bash
pg_dump -U postgres tabungan_rt04 > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
psql -U postgres tabungan_rt04 < backup_file.sql
```

### Reset Database (WARNING: Deletes all data)
```bash
# Drop database
psql -U postgres -c "DROP DATABASE tabungan_rt04;"

# Create new database
psql -U postgres -c "CREATE DATABASE tabungan_rt04;"

# Run migrations
cd backend && npm run migrate

# Seed data
npm run seed
```

## Troubleshooting

### Issue: PostgreSQL Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
1. Verify PostgreSQL is running: `psql -U postgres`
2. Check DB_HOST, DB_PORT, DB_USER in .env
3. Restart PostgreSQL service

### Issue: Database Already Exists
```
Error: database "tabungan_rt04" already exists
```

**Solution:**
- Choose a different database name in .env
- Or drop existing database: `psql -U postgres -c "DROP DATABASE tabungan_rt04;"`

### Issue: Port Already in Use
```
Error: listen EADDRINUSE :::5000
```

**Solution:**
1. Change PORT in backend/.env
2. Or kill process using port: `lsof -ti:5000 | xargs kill -9`

### Issue: CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
1. Verify CORS_ORIGIN in backend/.env matches frontend URL
2. Default values support localhost:5173 and localhost:3000
3. For production, update to actual domain

### Issue: Node Modules Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Development Tips

### Backend Development

**Auto-reload on changes:**
```bash
npm run dev
```
Uses nodemon for automatic server restart.

**Run tests:**
```bash
npm test
npm run test:watch
```

**Check code quality:**
```bash
npm run lint
```

### Frontend Development

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

**Lint code:**
```bash
npm run lint
```

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_NAME | Database name | tabungan_rt04 |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | (required) |
| PORT | API port | 5000 |
| NODE_ENV | Environment | development |
| JWT_SECRET | JWT signing key | (required) |
| JWT_EXPIRE | Token expiry | 7d |
| CORS_ORIGIN | CORS allowed origins | http://localhost:5173,http://localhost:3000 |
| LOG_LEVEL | Logging level | debug |

### Frontend (vite.config.js)

```javascript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true
    }
  }
}
```

## Production Deployment

### Backend Deployment (example with PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start app with PM2
pm2 start backend/src/server.js --name "tabungan-rt04-api"

# Save PM2 process list
pm2 save

# Setup startup script
pm2 startup
```

### Frontend Deployment

```bash
# Build production bundle
npm run build

# Deploy 'dist' folder to web server (Nginx, Apache, etc.)
# Configure server to route all requests to index.html for SPA routing
```

### Using Docker (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t tabungan-rt04-api .
docker run -p 5000:5000 -e DB_PASSWORD=... tabungan-rt04-api
```

## Next Steps

1. **Customize**: Update branding, colors, and content
2. **Add Features**: Extend with additional functionality
3. **Testing**: Write unit and integration tests
4. **Security**: Review and update security settings for production
5. **Monitoring**: Setup logging and monitoring
6. **Mobile**: Develop native mobile apps using the API

## Support & Resources

- API Documentation: [docs/API.md](API.md)
- Database Schema: [docs/DATABASE.md](DATABASE.md)
- Main README: [README.md](../README.md)

---

**Happy coding! 🚀**
