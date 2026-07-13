# Incident Response & Common Mistakes

## Incident Response Plan

### If a Token is Compromised

**Immediate actions (first 15 minutes):**

1. **Revoke the token** via Mapbox dashboard or API
2. **Create replacement token** with different scopes/restrictions if needed
3. **Update all services** using the compromised token
4. **Notify team** via incident channel

**Investigation (within 24 hours):** 5. **Review access logs** to understand exposure 6. **Check for unauthorized usage** in Mapbox dashboard 7. **Identify root cause** (how was it exposed?) 8. **Document incident** with timeline and impact

**Prevention (within 1 week):** 9. **Update procedures** to prevent recurrence 10. **Implement additional safeguards** (CI checks, secret scanning) 11. **Train team** on lessons learned 12. **Update documentation** with new security measures

## Common Security Mistakes

### 1. Exposing Secret Tokens in Client Code

❌ **CRITICAL ERROR:**

```javascript
// NEVER DO THIS - Secret token in client code
const map = new mapboxgl.Map({
  accessToken: 'sk.YOUR_SECRET_TOKEN_HERE' // SECRET TOKEN
});
```

✅ **Correct:**

```javascript
// Public token only in client code
const map = new mapboxgl.Map({
  accessToken: 'pk.YOUR_PUBLIC_TOKEN_HERE' // PUBLIC TOKEN
});
```

### 2. Overly Permissive Scopes

❌ **Too broad:**

```json
{
  "scopes": ["styles:*", "tokens:*"]
}
```

✅ **Specific:**

```json
{
  "scopes": ["styles:read"]
}
```

### 3. Missing URL Restrictions

❌ **No restrictions:**

```json
{
  "scopes": ["styles:read"],
  "allowedUrls": [] // Token works anywhere
}
```

✅ **Domain restricted:**

```json
{
  "scopes": ["styles:read"],
  "allowedUrls": ["https://myapp.com/*"]
}
```

### 4. Long-Lived Tokens Without Rotation

❌ **Never rotated:**

```
Token created: Jan 2020
Last rotation: Never
Still in production: Yes
```

✅ **Regular rotation:**

```
Token created: Dec 2024
Last rotation: Dec 2024
Next rotation: Mar 2025
```

### 5. Tokens in Version Control

❌ **Committed to Git:**

```javascript
// config.js (committed to repo)
export const MAPBOX_TOKEN = 'sk.YOUR_SECRET_TOKEN_HERE';
```

✅ **Environment variables:**

```javascript
// config.js
export const MAPBOX_TOKEN = process.env.MAPBOX_SECRET_TOKEN;
```

```bash
# .env (in .gitignore)
MAPBOX_SECRET_TOKEN=sk.YOUR_SECRET_TOKEN_HERE
```
