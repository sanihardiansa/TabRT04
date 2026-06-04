import dotenv from 'dotenv';

dotenv.config();

export default {
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || process.env.DB_DATABASE || 'tabungan_rt04',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key',
    expire: process.env.JWT_EXPIRE || '7d',
  },
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
};
