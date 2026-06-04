import { query } from '../config/database.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';

export const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { action, table, userId } = req.query;

    let countQuery = 'SELECT COUNT(*) FROM audit_logs';
    let dataQuery = `SELECT a.id, a.action, a.table_name, a.record_id, a.user_id, 
                            a.changes, a.ip_address, a.created_at, u.name as user_name
                    FROM audit_logs a
                    LEFT JOIN users u ON a.user_id = u.id`;
    const params = [];
    const conditions = [];

    if (action) {
      conditions.push('a.action = $' + (params.length + 1));
      params.push(action);
    }

    if (table) {
      conditions.push('a.table_name = $' + (params.length + 1));
      params.push(table);
    }

    if (userId) {
      conditions.push('a.user_id = $' + (params.length + 1));
      params.push(userId);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      countQuery += whereClause;
      dataQuery += whereClause;
    }

    const countResult = await query(countQuery, params.length > 0 ? params : undefined);
    const total = parseInt(countResult.rows[0].count);

    dataQuery += ' ORDER BY a.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await query(dataQuery, params);

    paginatedResponse(res, result.rows, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    errorResponse(res, 'Failed to get audit logs', 500);
  }
};

export const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT a.id, a.action, a.table_name, a.record_id, a.user_id, 
              a.changes, a.ip_address, a.user_agent, a.created_at, u.name as user_name
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Audit log not found', 404);
    }

    successResponse(res, result.rows[0]);
  } catch (error) {
    console.error('Get audit log error:', error);
    errorResponse(res, 'Failed to get audit log', 500);
  }
};

export const getTableAuditHistory = async (req, res) => {
  try {
    const { table, recordId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countQuery = `SELECT COUNT(*) FROM audit_logs 
                      WHERE table_name = $1 AND record_id = $2`;
    
    const dataQuery = `SELECT a.id, a.action, a.user_id, a.changes, a.ip_address, 
                             a.created_at, u.name as user_name
                      FROM audit_logs a
                      LEFT JOIN users u ON a.user_id = u.id
                      WHERE a.table_name = $1 AND a.record_id = $2
                      ORDER BY a.created_at DESC
                      LIMIT $3 OFFSET $4`;

    const countResult = await query(countQuery, [table, recordId]);
    const total = parseInt(countResult.rows[0].count);

    const result = await query(dataQuery, [table, recordId, limit, offset]);

    paginatedResponse(res, result.rows, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get table audit history error:', error);
    errorResponse(res, 'Failed to get audit history', 500);
  }
};
