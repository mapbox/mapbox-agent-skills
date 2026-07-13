---
name: mapbox-token-security
description: Security best practices for Mapbox access tokens, including scope management, URL restrictions, rotation strategies, and protecting sensitive data. Use when creating, managing, or advising on Mapbox token security.
---

# Mapbox Token Security Skill

This skill provides security expertise for managing Mapbox access tokens safely and effectively.

## Token Types and When to Use Them

### Public Tokens (pk.\*)

**Characteristics:**

- Can be safely exposed in client-side code
- Limited to specific public scopes only
- Can have URL restrictions
- Cannot access sensitive APIs

**When to use:**

- Client-side web applications
- Mobile apps
- Public-facing demos
- Embedded maps on websites

**Allowed scopes:**

- `styles:tiles` - Display style tiles (raster)
- `styles:read` - Read style specifications
- `fonts:read` - Access Mapbox fonts
- `datasets:read` - Read dataset data
- `vision:read` - Vision API access

### Secret Tokens (sk.\*)

**Characteristics:**

- **NEVER expose in client-side code**
- Full API access with any scopes
- Server-side use only
- Can create/manage other tokens

**When to use:**

- Server-side applications
- Backend services
- CI/CD pipelines
- Administrative tasks
- Token management

**Common scopes:**

- `styles:write` - Create/modify styles
- `styles:list` - List all styles
- `tokens:read` - View token information
- `tokens:write` - Create/modify tokens
- User feedback management scopes

### Temporary Tokens (tk.\*)

**Characteristics:**

- Short-lived (max 1 hour)
- Created by secret tokens
- Single-purpose use
- Automatically expire

**When to use:**

- One-time operations
- Temporary delegated access
- Short-lived demos
- Security-conscious workflows

## Scope Management Best Practices

### Principle of Least Privilege

**Always grant the minimum scopes needed:**

❌ **Bad:**

```javascript
// Overly permissive - don't do this
{
  scopes: ['styles:read', 'styles:write', 'styles:list', 'styles:delete', 'tokens:read', 'tokens:write'];
}
```

✅ **Good:**

```javascript
// Only what's needed for displaying a map
{
  scopes: ['styles:read', 'fonts:read'];
}
// Add 'styles:tiles' if your map uses raster tile sources
{
  scopes: ['styles:read', 'fonts:read', 'styles:tiles'];
}
```

### Scope Combinations by Use Case

**Public Map Display (client-side):**

```json
{
  "scopes": ["styles:read", "fonts:read", "styles:tiles"],
  "note": "Public token for map display",
  "allowedUrls": ["https://myapp.com/*"]
}
```

**Style Management (server-side):**

```json
{
  "scopes": ["styles:read", "styles:write", "styles:list"],
  "note": "Backend style management - SECRET TOKEN"
}
```

**Token Administration (server-side):**

```json
{
  "scopes": ["tokens:read", "tokens:write"],
  "note": "Token management only - SECRET TOKEN"
}
```

**Read-Only Access:**

```json
{
  "scopes": ["styles:list", "styles:read", "tokens:read"],
  "note": "Auditing/monitoring - SECRET TOKEN"
}
```

## URL Restrictions

### Why URL Restrictions Matter

URL restrictions limit where a public token can be used, preventing unauthorized usage if the token is exposed.

### Effective URL Patterns

✅ **Recommended patterns:**

```
https://myapp.com/*           # Production domain
https://*.myapp.com/*         # All subdomains
https://staging.myapp.com/*   # Staging environment
http://localhost:*            # Local development
```

❌ **Avoid these:**

```
*                             # No restriction (insecure)
http://*                      # Any HTTP site (insecure)
*.com/*                       # Too broad
```

### Multiple Environment Strategy

Create separate tokens for each environment:

```javascript
// Production
{
  note: "Production - myapp.com",
  scopes: ["styles:read", "fonts:read"],
  allowedUrls: ["https://myapp.com/*", "https://www.myapp.com/*"]
}

// Staging
{
  note: "Staging - staging.myapp.com",
  scopes: ["styles:read", "fonts:read"],
  allowedUrls: ["https://staging.myapp.com/*"]
}

// Development
{
  note: "Development - localhost",
  scopes: ["styles:read", "fonts:read"],
  allowedUrls: ["http://localhost:*", "http://127.0.0.1:*"]
}
```

## Token Storage and Handling

### Server-Side (Secret Tokens)

✅ **DO:**

- Store in environment variables
- Use secret management services (AWS Secrets Manager, HashiCorp Vault)
- Encrypt at rest
- Limit access via IAM policies
- Log token usage

❌ **DON'T:**

- Hardcode in source code
- Commit to version control
- Store in plaintext configuration files
- Share via email or Slack
- Reuse across multiple services

**Example: Secure Environment Variable:**

```bash
# .env (NEVER commit this file)
MAPBOX_SECRET_TOKEN=sk.ey...

# .gitignore (ALWAYS include .env)
.env
.env.local
.env.*.local
```

### Client-Side (Public Tokens)

✅ **DO:**

- Use public tokens only
- Apply URL restrictions
- Use different tokens per app
- Rotate periodically
- Monitor usage

❌ **DON'T:**

- Expose secret tokens
- Use tokens without URL restrictions
- Share tokens between unrelated apps
- Use tokens with excessive scopes

**Example: Safe Client Usage:**

```javascript
// Public token with URL restrictions - SAFE
const mapboxToken = 'pk.YOUR_MAPBOX_TOKEN_HERE';

// This token is restricted to your domain
// and only has styles:read scope
mapboxgl.accessToken = mapboxToken;
```

## Security Checklist

**Token Creation:**

- [ ] Use public tokens for client-side, secret for server-side
- [ ] Apply principle of least privilege for scopes
- [ ] Add URL restrictions to public tokens
- [ ] Use descriptive names/notes for token identification
- [ ] Document intended use and environment

**Token Management:**

- [ ] Store secret tokens in environment variables or secret managers
- [ ] Never commit tokens to version control
- [ ] Rotate tokens every 90 days (or per policy)
- [ ] Remove unused tokens promptly
- [ ] Separate tokens by environment (dev/staging/prod)

**Monitoring:**

- [ ] Track token usage patterns
- [ ] Set up alerts for unusual activity
- [ ] Regular security audits (monthly)
- [ ] Review team access quarterly
- [ ] Scan repositories for exposed tokens

**Incident Response:**

- [ ] Documented revocation procedure
- [ ] Emergency contact list
- [ ] Rotation process documented
- [ ] Post-incident review template
- [ ] Team training on security procedures

## Reference Files

For detailed guidance on specific topics, load these references as needed:

- **`references/rotation-monitoring.md`** — Token rotation strategies (zero-downtime + emergency), monitoring metrics, alerting rules, and monthly/quarterly audit checklists. Load when: implementing rotation, setting up monitoring, or conducting audits.
- **`references/incident-response.md`** — Step-by-step incident response plan and common security mistakes with code examples. Load when: responding to a token compromise, reviewing code for security issues, or training on anti-patterns.

## When to Use This Skill

Invoke this skill when:

- Creating new tokens
- Deciding between public vs secret tokens
- Setting up token restrictions
- Implementing token rotation
- Investigating security incidents
- Conducting security audits
- Training team on token security
- Reviewing code for token exposure
