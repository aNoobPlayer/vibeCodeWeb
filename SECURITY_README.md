# Security Notice

## Development Setup

This application currently uses **in-memory storage** and **plain-text password storage** for development and demonstration purposes only.

### Current Implementation
- **Storage**: In-memory (MemStorage) - data is lost on server restart
- **Authentication**: Session-based with express-session
- **Password Storage**: Plain text (NOT secure)
- **Demo Accounts**:
  - Admin: username `admin`, password `admin123`
  - Student: username `student`, password `student123`

### ⚠️ Production Requirements

Before deploying to production, you MUST implement:

1. **Password Security**
   - Hash passwords using bcrypt or argon2
   - Never store plain-text passwords
   - Implement password strength requirements

2. **Database**
   - Replace in-memory storage with PostgreSQL or another database
   - Use proper database migrations
   - Implement connection pooling

3. **Session Management**
   - Use a production session store (Redis, PostgreSQL)
   - Enable secure cookie flags for HTTPS
   - Implement session rotation
   - Add CSRF protection

4. **Security Headers**
   - Implement helmet.js for security headers
   - Configure CORS properly
   - Add rate limiting for login attempts

5. **Audit & Monitoring**
   - Log authentication attempts
   - Monitor failed login attempts
   - Implement account lockout after failed attempts

6. **Environment Variables**
   - Use strong, randomly generated SESSION_SECRET
   - Store all secrets in environment variables
   - Never commit secrets to version control

## For Development Only

This setup is intentionally simplified for development and testing. Do not use this configuration in any production environment.
