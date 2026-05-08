# 🚀 Publish Right Now - Quick Start

## You Have Security Codes (One-Time Backup Codes)

```
┌──────────────────────────────────────────────────────────┐
│  QUICK PUBLISH WITH SECURITY CODES                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. Find your npm security codes                        │
│     (looks like: abc123def456 or ABCD-1234-EFGH)        │
│                                                          │
│  2. Pick ONE code that you haven't used yet             │
│                                                          │
│  3. Run this command:                                   │
│                                                          │
│     npm run publish-packages abc123def456              │
│                                                          │
│  4. Mark that code as USED (cross it off)               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Example

```bash
# You have these security codes:
# ✅ abc123def456 (unused)
# ❌ xyz789uvw321 (already used)
# ✅ def456ghi789 (unused)

# Use the first unused code:
npm run publish-packages abc123def456

# After success, mark it as used:
# ❌ abc123def456 (USED - pr-visual-diff)
# ❌ xyz789uvw321 (already used)
# ✅ def456ghi789 (unused) ← use this next time
```

---

## 📍 Where Are My Security Codes?

Your security codes might be in:

1. **Text file** you saved when setting up npm 2FA
2. **Password manager** (1Password, LastPass, etc.)
3. **Screenshot** from when you enabled 2FA
4. **Email** from npm
5. **Generate new ones**: https://www.npmjs.com/settings/YOUR_USERNAME/tfa

---

## ⚠️ IMPORTANT: One-Time Use!

- ✅ Each security code works **only once**
- ❌ You **cannot** reuse a code
- 📝 **Must** track which codes are used
- 🔄 Generate new codes when you run low

---

## 🎯 Full Command

```bash
npm run publish-packages YOUR_SECURITY_CODE
```

**Real example:**
```bash
npm run publish-packages abc123def456
```

---

## ✅ After Publishing

1. **Mark the code as used** (cross it off your list)
2. **Verify packages:**
   ```bash
   npm view pr-visual-diff
   ```
3. **Test installation:**
   ```bash
   npm install -g pr-visual-diff
   pr-visual-diff doctor
   ```

---

## 🆘 Troubleshooting

### "Invalid OTP"
- ❌ You already used that code → Try the next unused one
- ❌ Typo in the code → Double-check spelling
- ❌ Extra spaces → Copy without spaces

### "I don't have any unused codes"
Generate new codes:
1. Go to: https://www.npmjs.com/settings/abhinav24dev/tfa
2. Click "Regenerate Recovery Codes"
3. Save them securely
4. Use one of the new codes

### "I lost my codes"
Follow npm account recovery at: https://www.npmjs.com/login

---

## 📚 Detailed Guides

For more information, see:
- **`SECURITY_CODES_GUIDE.md`** - Complete security codes guide
- **`FIXES_APPLIED.md`** - What was fixed
- **`QUICK_PUBLISH_GUIDE.md`** - General publishing guide

---

## ⚡ TL;DR

```bash
# 1. Find one unused security code from your list

# 2. Run this:
npm run publish-packages YOUR_CODE_HERE

# 3. Mark that code as used

# 4. Done! 🎉
```

That's it! Go publish your package now! 🚀
