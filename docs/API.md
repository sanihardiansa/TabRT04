# API Documentation - Tabungan RT 04

Base URL: `http://localhost:5000/api/v1`

All requests require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ /* optional validation errors */ ]
}
```

## Authentication Endpoints

### Register User
```
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "081234567890",
  "address": "Jl. Sudirman 123",
  "password": "SecurePass@123"
}
```

**Password Requirements:**
- Minimum 8 characters
- Must contain: uppercase, lowercase, number, special character (@$!%*?&)

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "memberNumber": "MBR-RT04-123456"
  }
}
```

### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "admin|treasurer|member"
    }
  }
}
```

### Get Current User
```
GET /auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "081234567890",
    "address": "Jl. Sudirman 123",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "member": {
      "member_number": "MBR-RT04-123456",
      "status": "active",
      "balance": 1000000,
      "join_date": "2024-01-15T10:30:00Z"
    }
  }
}
```

## Members Endpoints

### Get All Members
```
GET /members?page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Records per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "member_number": "MBR-RT04-001",
      "status": "active",
      "balance": 1500000,
      "join_date": "2024-01-10T00:00:00Z",
      "name": "Anggota Satu",
      "email": "anggota1@rt04.local",
      "phone": "081234567890",
      "address": "Jl. Sudirman 123"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### Get Member By ID
```
GET /members/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "member_number": "MBR-RT04-001",
    "status": "active",
    "balance": 1500000,
    "join_date": "2024-01-10T00:00:00Z",
    "name": "Anggota Satu",
    "email": "anggota1@rt04.local",
    "recentTransactions": [
      {
        "id": "uuid",
        "type": "deposit",
        "amount": 100000,
        "transaction_date": "2024-01-15T10:00:00Z",
        "description": "Setoran bulanan"
      }
    ]
  }
}
```

### Create Member (Admin/Treasurer)
```
POST /members
Authorization: Bearer <token>
Role: admin, treasurer
```

**Request Body:**
```json
{
  "name": "New Member",
  "email": "newmember@rt04.local",
  "phone": "081234567891",
  "address": "Jl. Ahmad Yani 456",
  "memberNumber": "MBR-RT04-051" (optional)
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "message": "Member created successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "name": "New Member",
    "email": "newmember@rt04.local",
    "memberNumber": "MBR-RT04-051",
    "status": "active",
    "balance": 0
  }
}
```

### Update Member (Admin/Treasurer)
```
PUT /members/:id
Authorization: Bearer <token>
Role: admin, treasurer
```

**Request Body:** (all optional)
```json
{
  "name": "Updated Name",
  "email": "updated@rt04.local",
  "phone": "081234567892",
  "address": "Jl. Updated 789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member updated successfully",
  "data": {
    "id": "uuid",
    "updated": true
  }
}
```

### Deactivate Member (Admin)
```
DELETE /members/:id
Authorization: Bearer <token>
Role: admin
```

**Response:**
```json
{
  "success": true,
  "message": "Member deactivated successfully",
  "data": {
    "id": "uuid",
    "deactivated": true
  }
}
```

## Deposits Endpoints

### Create Deposit (Admin/Treasurer)
```
POST /deposits
Authorization: Bearer <token>
Role: admin, treasurer
```

**Request Body:**
```json
{
  "memberId": "uuid",
  "amount": 100000,
  "description": "Setoran bulan Januari"
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "message": "Deposit recorded successfully",
  "data": {
    "id": "uuid",
    "memberId": "uuid",
    "amount": 100000,
    "depositDate": "2024-01-15T10:30:00Z",
    "recordedBy": "uuid"
  }
}
```

### Get All Deposits
```
GET /deposits?memberId=uuid&page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `memberId` (optional) - Filter by member
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Records per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "member_id": "uuid",
      "amount": 100000,
      "deposit_date": "2024-01-15T10:30:00Z",
      "description": "Setoran bulan Januari",
      "recorded_by_name": "Bendahara"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### Get Deposit By ID
```
GET /deposits/:id
Authorization: Bearer <token>
```

## Withdrawals Endpoints

### Create Withdrawal Request
```
POST /withdrawals
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "memberId": "uuid",
  "amount": 50000,
  "reason": "Keperluan sekolah anak"
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "message": "Withdrawal request created successfully",
  "data": {
    "id": "uuid",
    "memberId": "uuid",
    "amount": 50000,
    "reason": "Keperluan sekolah anak",
    "status": "pending",
    "withdrawalDate": "2024-01-15T10:30:00Z"
  }
}
```

### Get All Withdrawals
```
GET /withdrawals?memberId=uuid&status=pending&page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `memberId` (optional) - Filter by member
- `status` (optional) - pending, approved, rejected
- `page` (optional) - Page number
- `limit` (optional) - Records per page

### Approve/Reject Withdrawal (Admin/Treasurer)
```
PUT /withdrawals/:id/approve
Authorization: Bearer <token>
Role: admin, treasurer
```

**Request Body:**
```json
{
  "status": "approved" | "rejected"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal approved successfully",
  "data": {
    "id": "uuid",
    "status": "approved",
    "approvedAt": "2024-01-15T10:35:00Z"
  }
}
```

## Reports Endpoints

### Get Dashboard
```
GET /reports/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalMembers": 50,
      "totalBalance": 50000000,
      "monthlyDeposits": 5000000,
      "monthlyWithdrawals": 1000000,
      "pendingWithdrawals": 3
    },
    "recentTransactions": [
      {
        "id": "uuid",
        "type": "deposit",
        "amount": 100000,
        "transaction_date": "2024-01-15T10:00:00Z",
        "name": "Anggota Satu"
      }
    ]
  }
}
```

### Get Report Summary (Admin/Treasurer)
```
GET /reports/summary?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (optional) - YYYY-MM-DD format
- `endDate` (optional) - YYYY-MM-DD format

### Get Member Report
```
GET /reports/member/:memberId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "member": {
      "id": "uuid",
      "memberNumber": "MBR-RT04-001",
      "name": "Anggota Satu",
      "currentBalance": 1500000
    },
    "summary": {
      "totalDeposits": 2000000,
      "totalWithdrawals": 500000
    },
    "transactions": [
      {
        "id": "uuid",
        "type": "deposit",
        "amount": 100000,
        "transaction_date": "2024-01-15T10:00:00Z",
        "description": "Setoran bulanan"
      }
    ]
  }
}
```

## Audit Logs Endpoints

### Get Audit Logs (Admin)
```
GET /audits?action=CREATE&table=members&userId=uuid&page=1&limit=20
Authorization: Bearer <token>
Role: admin
```

**Query Parameters:**
- `action` (optional) - CREATE, READ, UPDATE, DELETE
- `table` (optional) - Table name
- `userId` (optional) - Filter by user
- `page` (optional) - Page number
- `limit` (optional) - Records per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "CREATE",
      "table_name": "members",
      "record_id": "uuid",
      "user_id": "uuid",
      "user_name": "Admin User",
      "changes": { "name": "New Member" },
      "ip_address": "192.168.1.100",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Get Audit Log By ID (Admin)
```
GET /audits/:id
Authorization: Bearer <token>
Role: admin
```

### Get Table Audit History (Admin)
```
GET /audits/table/:table/:recordId?page=1&limit=20
Authorization: Bearer <token>
Role: admin
```

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limiting

API implements rate limiting:
- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: 
  - `X-RateLimit-Limit`: Total limit
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

---

For more information, see [README.md](../README.md)
