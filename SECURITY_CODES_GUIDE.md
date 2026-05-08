# Publishing with npm Security Codes

Your npm account uses **security codes** (also called backup codes or recovery codes). These are different from TOTP codes (authenticator apps).

## 🔑 What Are Security Codes?

Security codes are **one-time use backup codes** provided by npm when you enable 2FA. They look like:

- `abc123def456`
- `ABCD-1234-EFGH-5678`
- `xyz789uvw321`

You typically get **10 security codes** when you set up 2FA.

## ⚠️ IMPORTANT: Each Code is One-Time Use Only!

- ✅ Each code can be used **only once**
- ❌ After using a code, **cross it off your list**
- 📝 Keep track of which codes you've used
- 🔄 When you run out, generate new codes from npm

---

## 🚀 How to Publish

### Step 1: Find Your Security Codes

Your security codes are in one of these places:
1. A text file you saved when setting up 2FA
2. Your password manager
3. A screenshot from when you set up 2FA
4. npm website: https://www.npmjs.com/settings/YOUR_USERNAME/tfa (can generate new ones)

### Step 2: Pick ONE Unused Code

Look at your list and pick a code you haven't used yet. For example:
- ✅ `abc123def456` (not used)
- ❌ ~~`xyz789uvw321`~~ (already used - crossed off)

### Step 3: Publish with the Code

```bash
npm run publish-packages abc123def456
```

Replace `abc123def456` with your actual security code.

### Step 4: Mark Code as Used

**Immediately after publishing**, cross that code off your list:

```
Security Codes:
✅ abc123def456  ← USED FOR PUBLISHING PR-VISUAL-DIFF
❌ xyz789uvw321  ← ALREADY USED
⬜ def456ghi789  ← AVAILABLE
⬜ ghi123jkl456  ← AVAILABLE
⬜ jkl789mno123  ← AVAILABLE
...
```

---

## 📋 Full Publishing Workflow

```bash
# 1. Find your security codes list

# 2. Install dependencies
npm install

# 3. Pick one unused security code from your list

# 4. Publish with that code
npm run publish-packages abc123def456

# 5. Wait for success message

# 6. Cross off that code from your list

# 7. Verify packages are published
npm view pr-visual-diff
```

---

## 🔄 What If I Run Out of Security Codes?

Generate new security codes on npm:

1. Go to: https://www.npmjs.com/settings/YOUR_USERNAME/tfa
2. Click "Regenerate Recovery Codes" or similar
3. Save the new codes securely
4. Use one of the new codes for publishing

---

## 🆚 Security Codes vs TOTP Codes

| Feature | Security Codes | TOTP Codes |
|---------|---------------|------------|
| Source | npm website | Authenticator app |
| Format | `abc123def456` | `123456` |
| Validity | One-time use only | 30 seconds |
| Quantity | 10 codes | Unlimited |
| When to use | Backup/recovery | Regular use |

---

## ✅ Example: Publishing Successfully

```bash
# You have these codes:
# ✅ code1: abc123def456 (unused)
# ❌ code2: xyz789uvw321 (used)
# ✅ code3: def456ghi789 (unused)

# Publish using code1
$ npm run publish-packages abc123def456

🚀 pr-visual-diff npm publish script

Step 1: Verifying npm login...
✓ Logged in as: abhinav24dev

Step 2: Publishing version 0.1.0

ℹ️  Using OTP code: ab****

Step 5: Publishing packages...

📦 Publishing core...
  ✓ Successfully published core

📦 Publishing git...
  ✓ Successfully published git

... (all packages)

✅ All packages published successfully!

# Now mark code1 as used:
# ✅ code1: abc123def456 (USED - pr-visual-diff v0.1.0)
# ❌ code2: xyz789uvw321 (used)
# ✅ code3: def456ghi789 (unused) ← use this next time
```

---

## 🚨 Troubleshooting

### "Invalid OTP"
**Possible causes:**
1. ❌ You already used that security code
2. ❌ Typo in the code
3. ❌ Extra spaces before/after the code
4. ❌ Wrong npm account

**Solution:**
- Try the next unused code from your list
- Make sure you're copying the full code
- Remove any spaces

### "Code doesn't work"
**If none of your codes work:**
1. Generate new codes from npm: https://www.npmjs.com/settings/YOUR_USERNAME/tfa
2. Use one of the fresh codes immediately
3. Save the new codes securely

### "I lost all my codes"
**Solution:**
1. Go to npm: https://www.npmjs.com/login
2. Click "Can't sign in?"
3. Follow account recovery steps
4. Once recovered, regenerate security codes

---

## 💡 Best Practices

### ✅ DO:
- Keep security codes in a password manager
- Cross off codes immediately after using
- Generate new codes when you run low
- Save codes in multiple secure places

### ❌ DON'T:
- Share security codes with anyone
- Commit codes to git repositories
- Use the same code twice
- Lose track of which codes are used

---

## 📝 Security Codes Checklist

Create a simple checklist format:

```
npm Security Codes for @abhinav24dev
Generated: 2026-05-09

[ ] abc123def456
[ ] xyz789uvw321
[ ] def456ghi789
[ ] ghi123jkl456
[ ] jkl789mno123
[ ] mno456pqr123
[ ] pqr789stu456
[ ] stu123vwx789
[ ] vwx456yza123
[ ] yza789bcd456

Used for:
[X] xyz789uvw321 - pr-visual-diff v0.1.0 (2026-05-09)
```

---

## 🎯 Quick Commands

```bash
# Publishing with security code
npm run publish-packages abc123def456

# Alternative method
NPM_OTP=abc123def456 npm run publish-packages

# Verify published
npm view pr-visual-diff

# Test installation
npm install -g pr-visual-diff
pr-visual-diff doctor
```

---

## 🔗 Useful Links

- Generate new codes: https://www.npmjs.com/settings/YOUR_USERNAME/tfa
- npm 2FA docs: https://docs.npmjs.com/configuring-two-factor-authentication
- Account recovery: https://www.npmjs.com/login

---

## ✨ You're Ready!

Find one unused security code and run:

```bash
npm run publish-packages YOUR_SECURITY_CODE
```

Don't forget to mark it as used! 📝
