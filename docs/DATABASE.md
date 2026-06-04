# Database Schema - Tabungan RT 04

## Overview
PostgreSQL database for managing member savings, transactions, and audit logs.

## Tables

### 1. users
User accounts table for authentication and authorization.

```sql
- id (UUID) - Primary key
- name (VARCHAR 100) - Full name
- email (VARCHAR 100) - Email address (unique)
- phone (VARCHAR 15) - Phone number
- address (TEXT) - Physical address
- password_hash (VARCHAR 255) - Hashed password
- role (user_role) - admin, member, or treasurer
- is_active (BOOLEAN) - Account active status
- created_at (TIMESTAMP) - Creation timestamp
- updated_at (TIMESTAMP) - Last update timestamp
- created_by (UUID) - User who created this record
- updated_by (UUID) - User who last updated this record
```

### 2. members
Member details linked to users table.

```sql
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users (unique)
- member_number (VARCHAR 50) - Unique member ID
- status (VARCHAR 50) - active, inactive, suspended
- join_date (TIMESTAMP) - Member join date
- balance (DECIMAL 15,2) - Current balance
- created_at (TIMESTAMP) - Record creation time
- updated_at (TIMESTAMP) - Last update time
```

### 3. deposits
Deposit transactions from members.

```sql
- id (UUID) - Primary key
- member_id (UUID) - Foreign key to members
- amount (DECIMAL 15,2) - Deposit amount
- deposit_date (TIMESTAMP) - Transaction date
- description (TEXT) - Additional notes
- recorded_by (UUID) - User who recorded this
- created_at (TIMESTAMP) - Record creation time
- updated_at (TIMESTAMP) - Last update time
```

### 4. withdrawals
Withdrawal requests from members.

```sql
- id (UUID) - Primary key
- member_id (UUID) - Foreign key to members
- amount (DECIMAL 15,2) - Withdrawal amount
- withdrawal_date (TIMESTAMP) - Request date
- reason (TEXT) - Reason for withdrawal
- status (VARCHAR 50) - pending, approved, rejected
- approved_by (UUID) - User who approved/rejected
- approval_date (TIMESTAMP) - Approval date/time
- recorded_by (UUID) - User who recorded request
- created_at (TIMESTAMP) - Record creation time
- updated_at (TIMESTAMP) - Last update time
```

### 5. transactions
Transaction history for reporting.

```sql
- id (UUID) - Primary key
- member_id (UUID) - Foreign key to members
- type (transaction_type) - deposit or withdrawal
- amount (DECIMAL 15,2) - Transaction amount
- transaction_date (TIMESTAMP) - Transaction date
- reference_id (UUID) - Reference to deposit/withdrawal
- description (TEXT) - Transaction notes
- created_by (UUID) - User who recorded this
- created_at (TIMESTAMP) - Record creation time
```

### 6. audit_logs
Audit trail for all CRUD operations.

```sql
- id (UUID) - Primary key
- action (audit_action) - CREATE, READ, UPDATE, DELETE
- table_name (VARCHAR 100) - Table being modified
- record_id (UUID) - ID of modified record
- user_id (UUID) - User who performed action
- changes (JSONB) - Change details
- ip_address (VARCHAR 45) - IP address of requester
- user_agent (TEXT) - Browser/client info
- created_at (TIMESTAMP) - Action timestamp
```

### 7. report_summaries
Cached report summaries for performance.

```sql
- id (UUID) - Primary key
- period_start (DATE) - Report period start
- period_end (DATE) - Report period end
- total_members (INT) - Member count in period
- total_deposits (DECIMAL 15,2) - Total deposits
- total_withdrawals (DECIMAL 15,2) - Total withdrawals
- total_balance (DECIMAL 15,2) - Total balance
- generated_by (UUID) - User who generated report
- created_at (TIMESTAMP) - Generation timestamp
```

## ENUM Types

### user_role
- `admin` - Full system access
- `member` - Member access
- `treasurer` - Treasurer access

### transaction_type
- `deposit` - Money in
- `withdrawal` - Money out

### audit_action
- `CREATE` - Record created
- `READ` - Record read
- `UPDATE` - Record updated
- `DELETE` - Record deleted

## Indexes

Performance indexes created:
```sql
- idx_users_email (ON users.email)
- idx_users_role (ON users.role)
- idx_members_user_id (ON members.user_id)
- idx_members_status (ON members.status)
- idx_deposits_member_id (ON deposits.member_id)
- idx_deposits_date (ON deposits.deposit_date)
- idx_withdrawals_member_id (ON withdrawals.member_id)
- idx_withdrawals_status (ON withdrawals.status)
- idx_transactions_member_id (ON transactions.member_id)
- idx_transactions_date (ON transactions.transaction_date)
- idx_audit_logs_table (ON audit_logs.table_name)
- idx_audit_logs_user (ON audit_logs.user_id)
- idx_audit_logs_date (ON audit_logs.created_at)
```

## Relationships

```
users
  ├─→ members (1 user : 1 member)
  ├─→ deposits (recorded_by)
  ├─→ withdrawals (recorded_by, approved_by)
  ├─→ transactions (created_by)
  └─→ audit_logs (user_id)

members
  ├─→ deposits (1 member : N deposits)
  ├─→ withdrawals (1 member : N withdrawals)
  └─→ transactions (1 member : N transactions)
```

## Sample Queries

### Get member balance summary
```sql
SELECT 
  m.member_number,
  u.name,
  m.balance,
  COALESCE(SUM(d.amount), 0) as total_deposits,
  COALESCE(SUM(w.amount), 0) as total_withdrawals
FROM members m
JOIN users u ON m.user_id = u.id
LEFT JOIN deposits d ON m.id = d.member_id
LEFT JOIN withdrawals w ON m.id = w.member_id AND w.status = 'approved'
GROUP BY m.id, m.member_number, u.name, m.balance;
```

### Get monthly report
```sql
SELECT 
  DATE_TRUNC('month', d.deposit_date)::DATE as month,
  COUNT(DISTINCT d.member_id) as member_count,
  SUM(d.amount) as total_deposits,
  (SELECT SUM(amount) FROM withdrawals 
   WHERE status = 'approved' 
   AND DATE_TRUNC('month', withdrawal_date) = DATE_TRUNC('month', d.deposit_date)) as total_withdrawals
FROM deposits d
GROUP BY DATE_TRUNC('month', d.deposit_date)
ORDER BY month DESC;
```

### Get audit trail for specific member
```sql
SELECT 
  a.created_at,
  a.action,
  a.table_name,
  u.name as user_name,
  a.changes
FROM audit_logs a
LEFT JOIN users u ON a.user_id = u.id
WHERE a.record_id = $1
ORDER BY a.created_at DESC;
```

## Data Integrity

### Constraints
- Foreign key constraints for referential integrity
- UNIQUE constraints on email and member_number
- NOT NULL constraints on critical fields
- CHECK constraints for valid status/role values

### Triggers
- `update_timestamp()` trigger updates `updated_at` automatically
- Applied to: users, members, deposits, withdrawals

## Performance Considerations

- Decimal(15,2) for currency values (no floating-point errors)
- UUID for distributed system support
- JSONB for audit changes (allows querying)
- Partitioning ready (can partition audit_logs by date)
- Denormalization through balance field in members (updated after transactions)

---

For setup instructions, see [SETUP.md](SETUP.md)
