import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const auditLog = async (action, tableName, recordId, userId, changes = null, req = null) => {
  try {
    const ipAddress = req?.ip || 'unknown';
    const userAgent = req?.get('user-agent') || 'unknown';

    await query(
      `INSERT INTO audit_logs (id, action, table_name, record_id, user_id, changes, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv4(),
        action,
        tableName,
        recordId,
        userId,
        changes ? JSON.stringify(changes) : null,
        ipAddress,
        userAgent,
      ]
    );
  } catch (error) {
    console.error('Audit logging error:', error);
  }
};

export const auditMiddleware = (req, res, next) => {
  req.auditLog = auditLog;
  next();
};
