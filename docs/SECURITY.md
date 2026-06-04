# Security Best Practices - Tabungan RT 04

Dokumentasi lengkap untuk security practices yang diterapkan dalam Tabungan RT 04.

## 🔐 1. Authentication & Authorization

### JWT (JSON Web Tokens)
- **Implementation**: jsonwebtoken library
- **Secret**: Long random string (minimum 32 characters)
- **Expiry**: 7 days (configurable)
- **Refresh**: Token harus di-refresh sebelum expiry

```javascript
// .env
JWT_SECRET=your_super_secret_key_minimum_32_chars
JWT_EXPIRE=7d
```

### Password Security
- **Hashing**: bcryptjs dengan salt rounds 10
- **Requirements**:
  - Minimum 8 characters
  - Must contain uppercase, lowercase, number, special character
  - Never store plain text passwords

```javascript
const passwordHash = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(inputPassword, passwordHash);
```

### Role-Based Access Control (RBAC)
```
- Admin: Full system access
- Treasurer: Transaction & report management
- Member: Personal profile & balance view

Implemented via middleware:
@authenticate - Verify JWT token
@authorize('admin', 'treasurer') - Check roles
```

## 🛡️ 2. Input Validation & Sanitization

### Request Validation
- **Library**: Joi for schema validation
- **Applied to**: All user inputs
- **Validation**: Type, format, length, pattern

```javascript
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required(),
});
```

### SQL Injection Prevention
- **Method**: Parameterized queries
- **Library**: pg with positional parameters

```javascript
// ✅ GOOD - Parameterized query
query('SELECT * FROM users WHERE email = $1', [email]);

// ❌ BAD - String concatenation
query(`SELECT * FROM users WHERE email = '${email}'`);
```

### XSS (Cross-Site Scripting) Prevention
- **Frontend**: React automatically escapes JSX
- **API**: No HTML is returned, only JSON
- **Validation**: Joi strips unknown fields

## 📊 3. Database Security

### Connection Security
- **Pool Configuration**: Connection pooling with timeouts
- **Max Connections**: 20 connections
- **Idle Timeout**: 30 seconds
- **Connection Timeout**: 2 seconds

```javascript
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Data Integrity
- **Foreign Keys**: Referential integrity constraints
- **Triggers**: Automatic timestamp updates
- **Transactions**: ACID compliance for critical operations
- **Backups**: Regular automated backups recommended

### Sensitive Data
- **Passwords**: Hashed with bcryptjs (never stored plain)
- **Tokens**: JWT stored in HTTP-only cookies (frontend)
- **Audit Trail**: All changes logged with user information

## 🚀 4. API Security

### CORS (Cross-Origin Resource Sharing)
```javascript
cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
})
```
- Only allow trusted origins
- Update for production domains

### Rate Limiting
- **Limit**: 100 requests per 15 minutes per IP
- **Library**: express-rate-limit
- **Protection**: DOS/DDOS attack mitigation

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);
```

### Security Headers (Helmet.js)
- **Content-Security-Policy**: Prevent XSS
- **X-Frame-Options**: Prevent clickjacking
- **X-Content-Type-Options**: Prevent MIME sniffing
- **Strict-Transport-Security**: Force HTTPS

```javascript
app.use(helmet());
```

### HTTPS/TLS
- **Recommendation**: Always use HTTPS in production
- **Certificate**: Use Let's Encrypt (free) or commercial CA
- **Redirect**: HTTP → HTTPS redirect

## 🔍 5. Audit & Logging

### Complete Audit Trail
All CRUD operations are logged:
```sql
- CREATE: New records
- READ: Data access
- UPDATE: Record changes
- DELETE: Deletions
```

### Logged Information
- **User ID**: Who performed action
- **Timestamp**: When action occurred
- **IP Address**: Request origin
- **User Agent**: Browser/client info
- **Changes**: JSONB format with before/after values
- **Table Name**: Which table was modified
- **Record ID**: Which record was affected

### Audit Log Queries
```javascript
// Get all actions by user
SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC;

// Track changes to specific record
SELECT * FROM audit_logs WHERE table_name = 'members' AND record_id = $1;

// Find deletions
SELECT * FROM audit_logs WHERE action = 'DELETE' AND created_at > NOW() - INTERVAL '7 days';
```

## 🔑 6. Environment Configuration

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tabungan_rt04
DB_USER=postgres
DB_PASSWORD=strong_password_here

# Server
PORT=5000
NODE_ENV=production

# Security
JWT_SECRET=minimum_32_character_random_string
JWT_EXPIRE=7d
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
```

### Never Commit Secrets
- ✅ Commit `.env.example`
- ❌ Never commit `.env`
- Use secure secret management in production

## 🏗️ 7. Architecture Security

### Defense in Depth
```
Frontend (React)
  ↓
HTTPS/TLS
  ↓
API Gateway (Rate Limiting, CORS)
  ↓
Authentication (JWT)
  ↓
Authorization (RBAC)
  ↓
Input Validation (Joi)
  ↓
Business Logic
  ↓
Database (with constraints, triggers)
  ↓
Audit Logging
```

### Error Handling
- **User Errors**: Generic messages (prevent info disclosure)
- **Developer Errors**: Detailed logs (server-side only)
- **Stack Traces**: Never expose in production

```javascript
// ✅ GOOD - Generic error
res.status(500).json({ message: 'Internal server error' });

// ❌ BAD - Exposes stack trace
res.status(500).json({ error: error.stack });
```

## 🔐 8. Deployment Security

### Production Checklist

#### Backend
- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Use environment variables (never hardcode secrets)
- [ ] Database password != default
- [ ] Update `CORS_ORIGIN` to production domain
- [ ] Regular backups configured
- [ ] Logs monitored and archived
- [ ] Rate limiting appropriate for load
- [ ] Process manager (PM2/systemd) configured

#### Frontend
- [ ] Build with `npm run build`
- [ ] Deploy `dist` folder only
- [ ] Configure API URL for production
- [ ] Enable gzip compression
- [ ] Use CDN for static assets
- [ ] Implement cache headers
- [ ] Enable HTTPS

#### Database
- [ ] Change default postgres password
- [ ] Restrict database user permissions
- [ ] Enable SSL connections
- [ ] Regular backups with retention policy
- [ ] Monitor disk space
- [ ] Configure connection limits
- [ ] Enable query logging for audit

#### Server Infrastructure
- [ ] Firewall configured
- [ ] Only required ports open (80, 443, 5432)
- [ ] SSH key-based auth (disable password login)
- [ ] Regular OS updates/patches
- [ ] Intrusion detection system (IDS)
- [ ] DDoS protection (CloudFlare, AWS Shield)
- [ ] Uptime monitoring
- [ ] Incident response plan

## 📋 9. Compliance & Standards

### Security Standards Applied
- **OWASP Top 10**: Mitigations for common vulnerabilities
- **NIST Cybersecurity Framework**: Best practices
- **CWE**: Common Weakness Enumeration coverage
- **GDPR**: Data privacy considerations

### Regular Security Tasks
- Weekly: Review audit logs for suspicious activity
- Monthly: Update dependencies (`npm audit fix`)
- Quarterly: Security assessment
- Annually: Third-party penetration testing

## 🚨 10. Incident Response

### Security Incident Plan
1. **Detection**: Monitor audit logs, alerts
2. **Containment**: Isolate affected systems
3. **Eradication**: Remove threats
4. **Recovery**: Restore from backups
5. **Lessons Learned**: Post-incident review

### Key Contacts
- Security Team Lead: [contact]
- Database Admin: [contact]
- System Admin: [contact]

## 📚 References

- **OWASP**: https://owasp.org/
- **NIST**: https://www.nist.gov/
- **npm Security**: https://docs.npmjs.com/security/
- **Node.js Security**: https://nodejs.org/en/knowledge/file-system/security/introduction/
- **PostgreSQL Security**: https://www.postgresql.org/docs/current/sql-syntax.html

## ✅ Security Checklist

### Before Going Live
- [ ] Database backups automated
- [ ] HTTPS certificate installed
- [ ] All dependencies updated
- [ ] Audit logs enabled
- [ ] Rate limiting configured
- [ ] Error handling appropriate
- [ ] Secrets in environment variables
- [ ] CORS properly configured
- [ ] Database user permissions restricted
- [ ] Monitoring and alerting active

### Ongoing
- [ ] Weekly audit log reviews
- [ ] Monthly dependency updates
- [ ] Quarterly security assessments
- [ ] Annual penetration testing
- [ ] Regular backups tested
- [ ] Documentation updated

---

**Remember: Security is a journey, not a destination. Stay vigilant! 🛡️**
