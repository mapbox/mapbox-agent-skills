# Mapbox Token Security Guide

Quick reference for securing Mapbox access tokens. Critical security rules for token management.

## Token Types - Quick Reference

| Type          | Format | Use                      | Can Expose?                    |
| ------------- | ------ | ------------------------ | ------------------------------ |
| **Public**    | `pk.*` | Client-side, mobile apps | ✅ Yes (with URL restrictions) |
| **Secret**    | `sk.*` | Server-side only         | ❌ NEVER expose                |
| **Temporary** | `tk.*` | One-time operations      | ✅ Yes (expires in 1hr)        |

## Critical Security Rules

### ❌ Never Do This

```javascript
// ❌ NEVER commit tokens
const MAPBOX_TOKEN = 'pk.eyJ1...'; // Don't hardcode!

// ❌ NEVER use secret tokens client-side
<script>mapboxgl.accessToken = 'sk.eyJ1...'; // Exposed to users!</script>;

// ❌ NEVER log tokens
console.log('Token:', token); // Shows in browser console

// ❌ NEVER share tokens in public repos
// .env file committed to GitHub
```

### ✅ Always Do This

```javascript
// ✅ Use environment variables
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// ✅ Add URL restrictions to public tokens
// In Mapbox dashboard: Restrict to your domain(s)

// ✅ Use secret tokens only server-side
// server.js or API routes only

// ✅ Add .env to .gitignore
// .gitignore
.env
.env.local
```

## Token Selection Decision Tree

**Question 1: Where will this token be used?**

- Client-side (browser/mobile) → Use **public token** (pk.\*)
- Server-side (API/backend) → Use **secret token** (sk.\*)
- One-time operation → Use **temporary token** (tk.\*)

**Question 2: What operations are needed?**

- Display maps only → Public token with `styles:tiles, styles:read`
- Upload/modify data → Secret token with write scopes
- Administrative tasks → Secret token with admin scopes

## Scope Management

### Public Token Scopes (Most Common)

```
✅ styles:tiles    - Display raster style tiles
✅ styles:read     - Read style specifications
✅ fonts:read      - Access Mapbox fonts
✅ datasets:read   - Read dataset data
```

### Secret Token Scopes (Server-Side Only)

```
⚠️  styles:write   - Create/modify styles
⚠️  styles:list    - List all styles
⚠️  tokens:write   - Create/modify tokens
⚠️  uploads:write  - Upload data
```

**Principle:** Grant minimum scopes needed. Don't use `styles:write` if only reading.

## URL Restrictions

**For all public tokens, always add URL restrictions:**

1. Go to Mapbox Dashboard → Access Tokens
2. Select token → URL Restrictions
3. Add allowed URLs:
   ```
   http://localhost:*          # Development
   https://yourdomain.com/*    # Production
   https://*.yourdomain.com/*  # Subdomains
   ```

**Impact:** Prevents token abuse if exposed. Must do for production.

## Environment Variable Setup

### Web Applications

```bash
# .env.local (Next.js, Vite)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
VITE_MAPBOX_TOKEN=pk.your_token_here

# .env (Create React App)
REACT_APP_MAPBOX_TOKEN=pk.your_token_here
```

### Mobile Applications

```javascript
// iOS (Config.xcconfig)
MAPBOX_TOKEN = pk.your_token_here;

// Android (gradle.properties)
MAPBOX_TOKEN = pk.your_token_here;
```

**Always add to .gitignore:**

```
.env
.env.local
.env.*.local
```

## Token Rotation

**When to rotate:**

- 🔴 Immediately if token exposed publicly (GitHub, logs, etc.)
- 🟡 Every 90 days for secret tokens (best practice)
- 🟡 When team member leaves with access
- 🟡 After security incident

**How to rotate safely:**

1. Create new token with same scopes
2. Update environment variables
3. Deploy new code
4. Verify new token works
5. Delete old token (grace period: 24-48hrs)

## Common Vulnerabilities

### 1. Token in Public Repository

**Risk:** Anyone can use your token, rack up charges
**Fix:** Immediately rotate token, add to .gitignore, use git history rewrite if needed

### 2. No URL Restrictions

**Risk:** Token can be used on any domain
**Fix:** Add URL restrictions in dashboard immediately

### 3. Secret Token in Frontend

**Risk:** Full API access exposed to all users
**Fix:** Move to server-side, rotate token immediately

### 4. Overly Permissive Scopes

**Risk:** Token can do more than needed
**Fix:** Create new token with minimum required scopes

## Token Exposure Response

**If token is exposed publicly:**

1. **Immediately** create new token in dashboard
2. Update environment variables with new token
3. Deploy updated code
4. Delete exposed token in dashboard
5. Check Mapbox dashboard for unexpected usage
6. Add URL restrictions to new token
7. Review security practices

**Don't wait** - exposed tokens can be used within minutes.

## Quick Security Checklist

✅ Using public tokens (pk._) for client-side?
✅ URL restrictions added to all public tokens?
✅ No tokens hardcoded in source code?
✅ .env files in .gitignore?
✅ Secret tokens (sk._) only used server-side?
✅ Minimum scopes granted per token?
✅ Tokens rotated regularly (90 days)?
✅ No tokens in logs or console output?
✅ Different tokens for dev/staging/production?
✅ Team members have individual tokens (not shared)?

## Framework-Specific Patterns

### Next.js

```javascript
// Public token (client-side)
const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Secret token (server-side API routes only)
const secretToken = process.env.MAPBOX_SECRET_TOKEN;
```

### React

```javascript
// Must use REACT_APP_ prefix
const token = process.env.REACT_APP_MAPBOX_TOKEN;
```

### Vue/Vite

```javascript
// Must use VITE_ prefix
const token = import.meta.env.VITE_MAPBOX_TOKEN;
```

## Rate Limiting

**Free tier limits:**

- 50,000 map loads/month
- 100,000 API requests/month

**Best practices:**

- Cache tiles in CDN
- Implement client-side caching
- Monitor usage in dashboard
- Set up usage alerts

**If approaching limits:** Upgrade plan or optimize caching.
