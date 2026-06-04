import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const register = async (req, res) => {
  const client = await require('../config/database.js').getClient();

  try {
    await client.query('BEGIN');

    const { name, email, phone, address, password } = req.validatedData;
    const userId = uuidv4();

    // Check if email already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Email already registered', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    await client.query(
      `INSERT INTO users (id, name, email, phone, address, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, name, email, phone, address, passwordHash, 'member', true]
    );

    // Create member
    const memberId = uuidv4();
    const memberNumber = `MBR-RT04-${Date.now().toString().slice(-6)}`;
    
    await client.query(
      `INSERT INTO members (id, user_id, member_number, status, balance)
       VALUES ($1, $2, $3, $4, $5)`,
      [memberId, userId, memberNumber, 'active', 0]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (action, table_name, record_id, user_id)
       VALUES ($1, $2, $3, $4)`,
      ['CREATE', 'users', userId, userId]
    );

    await client.query('COMMIT');

    successResponse(res, {
      userId,
      email,
      name,
      memberNumber,
    }, 'User registered successfully', 201);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    errorResponse(res, 'Registration failed', 500);
  } finally {
    client.release();
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.validatedData;

    // Find user by email or email prefix (username)
    const result = await query(
      'SELECT id, password_hash, role, name FROM users WHERE (email = $1 OR email LIKE $1 || \'@%\') AND is_active = true',
      [email]
    );
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const user = result.rows[0];

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, email },
      config.jwt.secret,
      { expiresIn: config.jwt.expire }
    );

    successResponse(res, {
      token,
      user: {
        id: user.id,
        email,
        role: user.role,
        name: user.name,
      },
    }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, 'Login failed', 500);
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.address, u.role, u.is_active, u.created_at
       FROM users u
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const user = result.rows[0];

    // Get member details if they are a member
    if (user.role === 'member') {
      const memberResult = await query(
        'SELECT member_number, status, balance, join_date FROM members WHERE user_id = $1',
        [user.id]
      );
      if (memberResult.rows.length > 0) {
        user.member = memberResult.rows[0];
      }
    }

    successResponse(res, user);
  } catch (error) {
    console.error('Get current user error:', error);
    errorResponse(res, 'Failed to get user', 500);
  }
};
