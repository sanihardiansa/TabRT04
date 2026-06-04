import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';

export const getDashboard = async (req, res) => {
  try {
    // Total members
    const membersResult = await query('SELECT COUNT(*) FROM members WHERE status = $1', ['active']);
    const totalMembers = parseInt(membersResult.rows[0].count);

    // Total balance
    const balanceResult = await query('SELECT SUM(balance) as total FROM members');
    const totalBalance = balanceResult.rows[0].total || 0;

    // Total deposits (this month)
    const depositsResult = await query(
      `SELECT SUM(amount) as total FROM deposits
       WHERE DATE_TRUNC('month', deposit_date) = DATE_TRUNC('month', CURRENT_TIMESTAMP)`
    );
    const monthlyDeposits = depositsResult.rows[0].total || 0;

    // Total withdrawals (this month)
    const withdrawalsResult = await query(
      `SELECT SUM(amount) as total FROM withdrawals
       WHERE DATE_TRUNC('month', withdrawal_date) = DATE_TRUNC('month', CURRENT_TIMESTAMP)
       AND status = 'approved'`
    );
    const monthlyWithdrawals = withdrawalsResult.rows[0].total || 0;

    // Pending withdrawals
    const pendingResult = await query('SELECT COUNT(*) FROM withdrawals WHERE status = $1', ['pending']);
    const pendingWithdrawals = parseInt(pendingResult.rows[0].count);

    // Recent transactions
    const recentResult = await query(
      `SELECT t.id, t.type, t.amount, t.transaction_date, m.member_number, u.name
       FROM transactions t
       JOIN members m ON t.member_id = m.id
       JOIN users u ON m.user_id = u.id
       ORDER BY t.transaction_date DESC
       LIMIT 10`
    );

    successResponse(res, {
      summary: {
        totalMembers,
        totalBalance: parseFloat(totalBalance),
        monthlyDeposits: parseFloat(monthlyDeposits),
        monthlyWithdrawals: parseFloat(monthlyWithdrawals),
        pendingWithdrawals,
      },
      recentTransactions: recentResult.rows,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    errorResponse(res, 'Failed to get dashboard data', 500);
  }
};

export const getReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let whereClause = '';
    const params = [];

    if (startDate && endDate) {
      whereClause = 'WHERE d.deposit_date BETWEEN $1 AND $2 OR w.withdrawal_date BETWEEN $1 AND $2';
      params.push(startDate, endDate);
    }

    // Get deposits in period
    let depositsQuery = `SELECT SUM(amount) as total FROM deposits`;
    let withdrawalsQuery = `SELECT SUM(amount) as total FROM withdrawals WHERE status = 'approved'`;

    if (startDate && endDate) {
      depositsQuery += ` WHERE deposit_date BETWEEN $1 AND $2`;
      withdrawalsQuery += ` AND withdrawal_date BETWEEN $1 AND $2`;
    }

    const depositsResult = await query(depositsQuery, startDate ? [startDate, endDate] : []);
    const withdrawalsResult = await query(withdrawalsQuery, startDate ? [startDate, endDate] : []);

    const totalDeposits = depositsResult.rows[0].total || 0;
    const totalWithdrawals = withdrawalsResult.rows[0].total || 0;

    // Get member transactions
    let transactionsQuery = `SELECT m.member_number, u.name, SUM(CASE WHEN t.type = 'deposit' THEN t.amount ELSE 0 END) as deposits,
                                    SUM(CASE WHEN t.type = 'withdrawal' THEN t.amount ELSE 0 END) as withdrawals
                             FROM transactions t
                             JOIN members m ON t.member_id = m.id
                             JOIN users u ON m.user_id = u.id`;

    if (startDate && endDate) {
      transactionsQuery += ` WHERE t.transaction_date BETWEEN $1 AND $2`;
    }

    transactionsQuery += ` GROUP BY m.member_number, u.name ORDER BY m.member_number`;

    const transactionsResult = await query(
      transactionsQuery,
      startDate ? [startDate, endDate] : []
    );

    successResponse(res, {
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalDeposits: parseFloat(totalDeposits),
        totalWithdrawals: parseFloat(totalWithdrawals),
        netAmount: parseFloat(totalDeposits) - parseFloat(totalWithdrawals),
      },
      memberTransactions: transactionsResult.rows,
    });
  } catch (error) {
    console.error('Report error:', error);
    errorResponse(res, 'Failed to get report', 500);
  }
};

export const getMemberReport = async (req, res) => {
  try {
    const { memberId } = req.params;

    // Get member details
    const memberResult = await query(
      `SELECT m.id, m.member_number, m.balance, u.name FROM members m
       JOIN users u ON m.user_id = u.id WHERE m.id = $1`,
      [memberId]
    );

    if (memberResult.rows.length === 0) {
      return errorResponse(res, 'Member not found', 404);
    }

    const member = memberResult.rows[0];

    // Get deposits
    const depositsResult = await query(
      'SELECT SUM(amount) as total FROM deposits WHERE member_id = $1',
      [memberId]
    );

    // Get withdrawals
    const withdrawalsResult = await query(
      'SELECT SUM(amount) as total FROM withdrawals WHERE member_id = $1 AND status = $2',
      [memberId, 'approved']
    );

    // Get transaction history
    const transactionsResult = await query(
      `SELECT id, type, amount, transaction_date, description
       FROM transactions WHERE member_id = $1
       ORDER BY transaction_date DESC`,
      [memberId]
    );

    successResponse(res, {
      member: {
        id: member.id,
        memberNumber: member.member_number,
        name: member.name,
        currentBalance: parseFloat(member.balance),
      },
      summary: {
        totalDeposits: parseFloat(depositsResult.rows[0].total) || 0,
        totalWithdrawals: parseFloat(withdrawalsResult.rows[0].total) || 0,
      },
      transactions: transactionsResult.rows,
    });
  } catch (error) {
    console.error('Member report error:', error);
    errorResponse(res, 'Failed to get member report', 500);
  }
};
