# Phase 1: Security Tasks

## Pre-Planned Tasks (Skip Party Mode)

### High Priority (model: sonnet)
1. Run `npm audit` and fix all vulnerabilities
2. Add DOMPurify for HTML sanitization
3. Implement Content Security Policy headers
4. Audit all API key/secret handling
5. Add input validation on all form fields

### Medium Priority (model: sonnet)
6. Implement rate limiting configuration
7. Add CSRF token protection
8. Sanitize all user-generated content before render
9. Review and fix SQL injection vectors
10. Add secure headers (X-Frame-Options, etc.)

### Lower Priority (model: haiku)
11. Add security-focused ESLint rules
12. Document security best practices
13. Create security audit checklist
14. Add environment variable validation
15. Review third-party dependency permissions

## Validation Criteria
- [ ] `npm audit` shows 0 high/critical vulnerabilities
- [ ] DOMPurify imported where user content rendered
- [ ] No hardcoded secrets in codebase
- [ ] All forms have validation
- [ ] CSP headers configured
