import { query, getClient } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';

export const createDeposit = async (req, res) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { memberId, amount, description } = req.validatedData;

    // Check member exists
    const memberResult = await client.query('SELECT balance FROM members WHERE id = $1', [memberId]);
    if (memberResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Member not found', 404);
    }

    const depositId = uuidv4();

    // Create deposit
    await client.query(
      `INSERT INTO deposits (id, member_id, amount, description, recorded_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [depositId, memberId, amount, description, req.user.id]
    );

    // Create transaction record
    await client.query(
      `INSERT INTO transactions (member_id, type, amount, reference_id, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [memberId, 'deposit', amount, depositId, description, req.user.id]
    );

    // Update member balance
    await client.query(
      'UPDATE members SET balance = balance + $1 WHERE id = $2',
      [amount, memberId]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (action, table_name, record_id, user_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      ['CREATE', 'deposits', depositId, req.user.id, JSON.stringify({ amount, memberId })]
    );

    await client.query('COMMIT');

    successResponse(res, {
      id: depositId,
      memberId,
      amount,
      depositDate: new Date(),
      recordedBy: req.user.id,
    }, 'Deposit recorded successfully', 201);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create deposit error:', error);
    errorResponse(res, 'Failed to create deposit', 500);
  } finally {
    client.release();
  }
};

export const getDeposits = async (req, res) => {
  try {
    const { memberId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) FROM deposits';
    let dataQuery = `SELECT d.id, d.member_id, d.amount, d.deposit_date, d.description,
                            u.name as recorded_by_name, m.member_number, mu.name as member_name
                    FROM deposits d
                    JOIN users u ON d.recorded_by = u.id
                    JOIN members m ON d.member_id = m.id
                    JOIN users mu ON m.user_id = mu.id`;
    const params = [];

    if (memberId) {
      countQuery += ' WHERE member_id = $1';
      dataQuery += ' WHERE d.member_id = $1';
      params.push(memberId);
    }

    const countResult = await query(countQuery, params.length > 0 ? params : undefined);
    const total = parseInt(countResult.rows[0].count);

    dataQuery += ' ORDER BY d.deposit_date DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await query(dataQuery, params);

    paginatedResponse(res, result.rows, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get deposits error:', error);
    errorResponse(res, 'Failed to get deposits', 500);
  }
};

export const getDepositById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT d.id, d.member_id, d.amount, d.deposit_date, d.description,
              u.name as recorded_by_name, m.member_number
       FROM deposits d
       JOIN users u ON d.recorded_by = u.id
       JOIN members m ON d.member_id = m.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Deposit not found', 404);
    }

    successResponse(res, result.rows[0]);
  } catch (error) {
    console.error('Get deposit error:', error);
    errorResponse(res, 'Failed to get deposit', 500);
  }
};
