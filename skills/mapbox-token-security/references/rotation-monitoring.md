# Token Rotation & Monitoring

## Token Rotation Strategy

### When to Rotate Tokens

**Mandatory rotation:**

- Token exposed in public repository
- Team member leaves with token access
- Suspected compromise or breach
- Service decommissioning
- Compliance requirements

**Scheduled rotation:**

- Every 90 days (recommended for production)
- Every 30 days (high-security environments)
- After major deployments
- During security audits

### Rotation Process

**Zero-downtime rotation:**

1. **Create new token** with same scopes
2. **Deploy new token** to canary/staging environment
3. **Verify functionality** with new token
4. **Gradually roll out** to production
5. **Monitor for issues** for 24-48 hours
6. **Revoke old token** after confirmation
7. **Update documentation** with rotation date

**Emergency rotation:**

1. **Immediately revoke** compromised token
2. **Create replacement** token
3. **Deploy emergency update** to all services
4. **Notify team** of incident
5. **Investigate** how compromise occurred
6. **Update procedures** to prevent recurrence

## Monitoring and Auditing

### Track Token Usage

**Metrics to monitor:**

- API request volume per token
- Geographic distribution of requests
- Error rates by token
- Unexpected spike patterns
- Requests from unauthorized domains

**Alert on:**

- Usage from unexpected IPs/regions
- Sudden traffic spikes (>200% normal)
- High error rates (>10%)
- Requests outside allowed URLs
- Off-hours access patterns

### Regular Security Audits

**Monthly checklist:**

- [ ] Review all active tokens
- [ ] Verify token scopes are still appropriate
- [ ] Check for unused tokens (revoke if inactive >30 days)
- [ ] Confirm URL restrictions are current
- [ ] Review team member access
- [ ] Check for tokens in public repositories (GitHub scan)
- [ ] Verify documentation is up-to-date

**Quarterly checklist:**

- [ ] Rotate production tokens
- [ ] Full token inventory
- [ ] Access control review
- [ ] Update incident response procedures
- [ ] Security training for team
