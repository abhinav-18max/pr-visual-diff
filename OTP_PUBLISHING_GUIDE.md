# Publishing with 2FA/OTP or Security Codes

Your npm account has authentication enabled, which requires either:
- **TOTP codes** (6-digit codes from authenticator app) - regenerates every 30 seconds
- **Security codes** (one-time backup codes from npm) - use once and cross off

## Quick Solution

### If You Have Security Codes (Backup Codes)

**Security codes are one-time use only. Cross them off after using!**

```bash
# Use one of your security codes
npm run publish-packages abc123def456

# Or if it's a different format:
npm run publish-packages ABCD-1234-EFGH-5678
```

Your security codes look like:
- Short alphanumeric codes (e.g., `abc123def456`)
- Or hyphenated format (e.g., `ABCD-1234-EFGH-5678`)

**Important:** Each code can only be used ONCE. Mark it as used after publishing!

### If You Have TOTP/Authenticator App

```bash
# Get your 6-digit code from your authenticator app
npm run publish-packages 123456
```

Replace `123456` with your actual TOTP code from:
- Google Authenticator
- Authy
- 1Password
- Or your preferred authenticator app

### Method 2: Set Environment Variable

```bash
NPM_OTP=123456 npm run publish-packages
```

### Method 3: Publish Each Package Manually

If you prefer manual control:

```bash
# Get your OTP code first, then publish each package:
cd packages/core
npm publish --access public --otp=123456

cd ../git
npm publish --access public --otp=123456

cd ../runner
npm publish --access public --otp=123456

cd ../reporter
npm publish --access public --otp=123456

cd ../diff-engine
npm publish --access public --otp=123456

cd ../screenshots
npm publish --access public --otp=123456

cd ../cli
npm publish --access public --otp=123456
```

**Important:** OTP codes expire quickly (usually 30 seconds), so have your authenticator ready!

## What Changed

The publish script now supports authentication codes in two ways:

1. **Command line argument**: `npm run publish-packages <CODE>`
2. **Environment variable**: `NPM_OTP=<code> npm run publish-packages`

Works with:
- ✅ Security codes (backup/recovery codes)
- ✅ TOTP codes (authenticator app)
- ✅ Any format npm accepts

## Troubleshooting

### "OTP code expired" or "Invalid OTP"

**If using Security Codes (backup codes):**
- ❌ Make sure the code hasn't been used before
- ❌ Check for typos or extra spaces
- ❌ Verify you're copying the full code
- ✅ Try the next unused code from your list

**If using TOTP (authenticator app):**
- ❌ The code times out after ~30 seconds
- ❌ Make sure you're copying the 6-digit code correctly
- ❌ Verify you're using the right authenticator account
- ✅ Get a fresh code and try again immediately

### "Still asks for OTP even though I provided it"

**If using Security Codes:**
- Each security code works for ONE npm command
- Publishing 7 packages means the script uses the SAME code for all
- This should work with the automated script
- If it fails, you may need to publish packages manually (one security code per package)

**If using TOTP:**
- The code might have expired between packages
- Try again with a fresh code immediately

## Disable 2FA (Not Recommended)

If you want to disable 2FA for easier publishing (not recommended for security):

1. Go to: https://www.npmjs.com/settings/YOUR_USERNAME/tfa
2. Click "Disable 2FA"
3. Confirm

However, it's much safer to keep 2FA enabled and just use the OTP parameter when publishing.

## What Was Fixed

1. ✅ Updated `scripts/publish.js` to accept OTP parameter
2. ✅ Fixed repository URLs (added `git+` prefix)
3. ✅ Made `bin.js` executable
4. ✅ Better error messages when OTP is required

## Example: Full Publish Workflow

### With Security Codes (Backup Codes)

```bash
# 1. Ensure you're on the main branch with latest changes
git checkout main
git pull

# 2. Find your list of security codes from npm

# 3. Install dependencies
npm install

# 4. Pick ONE unused security code (e.g., abc123def456)

# 5. Publish with the security code
npm run publish-packages abc123def456

# 6. IMPORTANT: Mark that code as USED (cross it off your list)

# 7. Wait for success message!
```

### With TOTP (Authenticator App)

```bash
# 1. Ensure you're on the main branch with latest changes
git checkout main
git pull

# 2. Open your authenticator app on your phone/computer

# 3. Install dependencies
npm install

# 4. Get your TOTP code (e.g., 123456)

# 5. Publish immediately with the code
npm run publish-packages 123456

# 6. Wait for success message!
```

## Script Output

When successful, you'll see:

```
🚀 pr-visual-diff npm publish script

Step 1: Verifying npm login...
✓ Logged in as: abhinav24dev

Step 2: Publishing version 0.1.0

ℹ️  Using OTP code: 12****

Step 3: Backing up package.json files...
  ✓ Backed up core/package.json
  ...

Step 5: Publishing packages...

📦 Publishing core...
  ✓ Successfully published core

📦 Publishing git...
  ✓ Successfully published git

...

============================================================
📊 Publishing Summary
============================================================

✓ Successfully published (7):
  - core
  - git
  - runner
  - reporter
  - diff-engine
  - screenshots
  - cli

============================================================

✅ All packages published successfully!
```

## Next Steps After Successful Publishing

1. **Verify packages are live:**
```bash
npm view pr-visual-diff
npm view @pr-visual-diff/core
```

2. **Test installation:**
```bash
mkdir test && cd test
npm install pr-visual-diff
npx pr-visual-diff doctor
```

3. **Create GitHub Release:**
- Go to: https://github.com/abhinav-18max/pr-visual-diff/releases/new
- Tag: `v0.1.0`
- Title: "Release v0.1.0"
- Description: From CHANGELOG.md
- Publish

4. **Share your package!**
- Tweet it
- Post on Reddit
- Share on LinkedIn
- Add to awesome lists

---

## Quick Reference Card

### Security Codes (One-Time Backup Codes)
```
┌──────────────────────────────────────────────────┐
│  PUBLISHING WITH SECURITY CODES                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  1. Find your list of npm security codes        │
│  2. Pick ONE unused code (e.g., abc123def456)   │
│  3. Run:                                         │
│                                                  │
│     npm run publish-packages abc123def456       │
│                                                  │
│  4. Mark that code as USED (cross it off!)      │
│                                                  │
│  OR:                                            │
│                                                  │
│     NPM_OTP=abc123def456 npm run publish-packages│
│                                                  │
└──────────────────────────────────────────────────┘
```

### TOTP Codes (Authenticator App)
```
┌──────────────────────────────────────────────────┐
│  PUBLISHING WITH TOTP - QUICK COMMANDS           │
├──────────────────────────────────────────────────┤
│                                                  │
│  1. Open authenticator app                      │
│  2. Get 6-digit code (e.g., 123456)            │
│  3. Run immediately:                            │
│                                                  │
│     npm run publish-packages 123456             │
│                                                  │
│  OR:                                            │
│                                                  │
│     NPM_OTP=123456 npm run publish-packages     │
│                                                  │
└──────────────────────────────────────────────────┘
```

That's it! Your packages are now ready to publish with 2FA support. 🎉
