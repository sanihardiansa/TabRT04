import { query, getClient } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';

export const createWithdrawal = async (req, res) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { memberId, amount, reason } = req.validatedData;

    // Check member exists and has sufficient balance
    const memberResult = await client.query('SELECT balance FROM members WHERE id = $1', [memberId]);
    if (memberResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Member not found', 404);
    }

    if (memberResult.rows[0].balance < amount) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Insufficient balance', 400);
    }

    const withdrawalId = uuidv4();

    // Create withdrawal request
    await client.query(
      `INSERT INTO withdrawals (id, member_id, amount, reason, status, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [withdrawalId, memberId, amount, reason, 'pending', req.user.id]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (action, table_name, record_id, user_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      ['CREATE', 'withdrawals', withdrawalId, req.user.id, JSON.stringify({ amount, memberId, reason })]
    );

    await client.query('COMMIT');

    successResponse(res, {
      id: withdrawalId,
      memberId,
      amount,
      reason,
      status: 'pending',
      withdrawalDate: new Date(),
    }, 'Withdrawal request created successfully', 201);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create withdrawal error:', error);
    errorResponse(res, 'Failed to create withdrawal', 500);
  } finally {
    client.release();
  }
};

export const getWithdrawals = async (req, res) => {
  try {
    const { memberId, status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) FROM withdrawals';
    let dataQuery = `SELECT w.id, w.member_id, w.amount, w.withdrawal_date, w.reason, w.status,
                            u1.name as recorded_by_name, u2.name as approved_by_name, m.member_number, mu.name as member_name
                    FROM withdrawals w
                    JOIN users u1 ON w.recorded_by = u1.id
                    LEFT JOIN users u2 ON w.approved_by = u2.id
                    JOIN members m ON w.member_id = m.id
                    JOIN users mu ON m.user_id = mu.id`;
    const params = [];
    const conditions = [];

    if (memberId) {
      conditions.push('w.member_id = $' + (params.length + 1));
      params.push(memberId);
    }

    if (status) {
      conditions.push('w.status = $' + (params.length + 1));
      params.push(status);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      countQuery += whereClause;
      dataQuery += whereClause;
    }

    const countResult = await query(countQuery, params.length > 0 ? params : undefined);
    const total = parseInt(countResult.rows[0].count);

    dataQuery += ' ORDER BY w.withdrawal_date DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await query(dataQuery, params);

    paginatedResponse(res, result.rows, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    errorResponse(res, 'Failed to get withdrawals', 500);
  }
};

export const approveWithdrawal = async (req, res) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status } = req.validatedData;

    // Get withdrawal
    const withdrawalResult = await client.query(
      'SELECT member_id, amount, status FROM withdrawals WHERE id = $1',
      [id]
    );

    if (withdrawalResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Withdrawal not found', 404);
    }

    const withdrawal = withdrawalResult.rows[0];

    if (withdrawal.status !== 'pending') {
      await client.query('ROLLBACK');
      return errorResponse(res, 'Withdrawal is already ' + withdrawal.status, 400);
    }

    if (status === 'approved') {
      // Deduct from member balance
      await client.query(
        'UPDATE members SET balance = balance - $1 WHERE id = $2',
        [withdrawal.amount, withdrawal.member_id]
      );

      // Create transaction record
      await client.query(
        `INSERT INTO transactions (member_id, type, amount, reference_id, description, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [withdrawal.member_id, 'withdrawal', withdrawal.amount, id, 'Penarikan tabungan', req.user.id]
      );
    }

    // Update withdrawal status
    await client.query(
      `UPDATE withdrawals SET status = $1, approved_by = $2, approval_date = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status, req.user.id, id]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (action, table_name, record_id, user_id, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      ['UPDATE', 'withdrawals', id, req.user.id, JSON.stringify({ status })]
    );

    await client.query('COMMIT');

    successResponse(res, {
      id,
      status,
      approvedAt: new Date(),
    }, 'Withdrawal ' + status + ' successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Approve withdrawal error:', error);
    errorResponse(res, 'Failed to approve withdrawal', 500);
  } finally {
    client.release();
  }
};
