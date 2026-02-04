# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Sailor, please help us by reporting it responsibly.

**Please do NOT open a public issue for security vulnerabilities.**

### How to Report

- **Email**: Create a private security advisory on GitHub or contact the repository maintainers directly
- **Response Time**: We will acknowledge your report within 48 hours
- **Process**: We will investigate and work on a fix, keeping you informed of our progress

### What to Include

When reporting a vulnerability, please include:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** of the vulnerability
4. **Suggested fix** (if you have one)
5. **Your contact information** for follow-up questions

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| Older   | :x:                |

## Security Best Practices

### For Development

- **Never commit secrets**: API keys, passwords, or tokens should never be in the repository
- **Use `.env` files**: Store sensitive configuration in environment variables (see `.env.example`)
- **Review dependencies**: Regularly update dependencies to patch known vulnerabilities
- **Default credentials**: Change all default passwords (database, admin users) in production

### For Production Deployment

1. **Change Default Credentials**
   - Database password: Change from `sailor123` to a strong password
   - Admin user: Change from `admin@sailor.com / admin123`
   - JWT secret: Generate a new secret key

2. **Use HTTPS**
   - Replace self-signed certificates with valid SSL/TLS certificates (Let's Encrypt, etc.)
   - Enable HSTS (HTTP Strict Transport Security)

3. **Environment Variables**
   - Never hardcode secrets in `application.yml` or code
   - Use environment variables or secret management services
   - Example: `JWT_SECRET`, `SPRING_DATASOURCE_PASSWORD`

4. **Database Security**
   - Use strong passwords
   - Limit network access (firewall rules)
   - Enable SSL/TLS for database connections
   - Regular backups

5. **Application Security**
   - Keep dependencies up to date
   - Enable CORS only for trusted origins
   - Set appropriate rate limiting
   - Monitor logs for suspicious activity

6. **Access Control**
   - Follow principle of least privilege for user roles
   - Regularly audit user accounts and permissions
   - Disable or remove unused accounts

## Known Limitations

### Development Defaults

This application includes default credentials for **development purposes only**:

- Database: `sailor / sailor123`
- Admin user: `admin@sailor.com / admin123`
- User: `user@sailor.com / user123`
- JWT secret: Auto-generated at runtime (changes on restart)

**⚠️ These MUST be changed before production deployment.**

### Self-Signed Certificates

The included SSL certificates in `nginx/certs/` are self-signed and intended for local development only.

**For production**, obtain valid certificates from:
- [Let's Encrypt](https://letsencrypt.org/) (free)
- Commercial Certificate Authority
- Your cloud provider's certificate service

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who help improve Sailor's security.

---

**Last Updated**: February 2026
