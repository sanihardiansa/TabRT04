import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import config from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { auditMiddleware } from './middleware/auditLogger.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import depositRoutes from './routes/depositRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import indonesianRoutes from './routes/indonesianRoutes.js';

dotenv.config();

const app = express();
const port = config.server.port;

// Trust proxy (needed for Render, Railway, etc.)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS - allow frontend domains
const allowedOrigins = config.api.corsOrigin;
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Audit logging middleware
app.use(auditMiddleware);

// Health check (important for Render)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'TabRT04 API is running',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Tabungan RT 04 API',
    version: '1.0.0',
    docs: '/health',
  });
});

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/deposits', depositRoutes);
app.use('/api/v1/withdrawals', withdrawalRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/audits', auditRoutes);

// Indonesian API routes for frontend compatibility
app.use('/api', indonesianRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server (only when not running on Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${port}`);
    console.log(`📡 Environment: ${config.server.nodeEnv}`);
    console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);
  });
}

export default app;
