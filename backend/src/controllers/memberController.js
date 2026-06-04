import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import bcrypt from 'bcryptjs';

export const getAllMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countResult = await query('SELECT COUNT(*) FROM members');
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT m.id, m.member_number, m.status, m.balance, m.join_date,
              u.name, u.email, u.phone, u.address
       FROM members m
       JOIN users u ON m.user_id = u.id
       ORDER BY m.join_date DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    paginatedResponse(res, result.rows, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get members error:', error);
    errorResponse(res, 'Failed to get members', 500);
  }
};

export const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT m.id, m.member_number, m.status, m.balance, m.join_date, m.user_id,
              u.name, u.email, u.phone, u.address
       FROM members m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Member not found', 404);
    }

    const member = result.rows[0];

    // Get transaction history
    const transactionsResult = await query(
      `SELECT id, type, amount, transaction_date, description
       FROM transactions
       WHERE member_id = $1
       ORDER BY transaction_date DESC
       LIMIT 10`,
      [id]
    );

    member.recentTransactions = transactionsResult.rows;

    successResponse(res, member);
  } catch (error) {
    console.error('Get member error:', error);
    errorResponse(res, 'Failed to get member', 500);
  }
};

export const createMember = async (req, res) => {
  const client = await require('../config/database.js').getClient();

  try {
    await client.query('BEGIN');

    const { name, email, phone, address } = req.validatedData;
    const userId = uuidv4();
    const memberId = uuidv4();
    const memberNumber = `MBR-RT04-${Date.now().toString().slice(-6)}`;
    const defaultPassword = await bcrypt.hash('Member@123', 10);

    // Check if email exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Email already exists', 400);
    }

    // Create user
    await client.query(
      `INSERT INTO users (id, name, email, phone, address, password_hash, role, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, name, email, phone, address, defaultPassword, 'member', true, req.user.id]
    );

    // Create member
    await client.query(
      `INSERT INTO members (id, user_id, member_number, status, balance)
       VALUES ($1, $2, $3, $4, $5)`,
      [memberId, userId, memberNumber, 'active', 0]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (action, table_name, record_id, user_id)
       VALUES ($1, $2, $3, $4)`,
      ['CREATE', 'members', memberId, req.user.id]
    );

    await client.query('COMMIT');

    successResponse(res, {
      id: memberId,
      userId,
      name,
      email,
      memberNumber,
      status: 'active',
      balance: 0,
    }, 'Member created successfully', 201);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create member error:', error);
    errorResponse(res, 'Failed to create member', 500);
  } finally {
    client.release();
  }
};

export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.validatedData;

    // Get member
    const memberResult = await query('SELECT user_id FROM members WHERE id = $1', [id]);
    if (memberResult.rows.length === 0) {
      return errorResponse(res, 'Member not found', 404);
    }

    const userId = memberResult.rows[0].user_id;

    // Update user
    await query(
      `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email),
                        phone = COALESCE($3, phone), address = COALESCE($4, address)
       WHERE id = $5`,
      [name, email, phone, address, userId]
    );

    // Audit log
    await query(
      `INSERT INTO audit_logs (action, table_name, record_id, user_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      ['UPDATE', 'members', id, req.user.id, JSON.stringify({ name, email, phone, address })]
    );

    successResponse(res, { id, updated: true }, 'Member updated successfully');
  } catch (error) {
    console.error('Update member error:', error);
    errorResponse(res, 'Failed to update member', 500);
  }
};

export const deactivateMember = async (req, res) => {
  try {
    const { id } = req.params;

    const memberResult = await query('SELECT user_id FROM members WHERE id = $1', [id]);
    if (memberResult.rows.length === 0) {
      return errorResponse(res, 'Member not found', 404);
    }

    const userId = memberResult.rows[0].user_id;

    // Deactivate user
    await query('UPDATE users SET is_active = false WHERE id = $1', [userId]);

    // Update member status
    await query('UPDATE members SET status = $1 WHERE id = $2', ['inactive', id]);

    // Audit log
    await query(
      `INSERT INTO audit_logs (action, table_name, record_id, user_id)
       VALUES ($1, $2, $3, $4)`,
      ['UPDATE', 'members', id, req.user.id]
    );

    successResponse(res, { id, deactivated: true }, 'Member deactivated successfully');
  } catch (error) {
    console.error('Deactivate member error:', error);
    errorResponse(res, 'Failed to deactivate member', 500);
  }
};
