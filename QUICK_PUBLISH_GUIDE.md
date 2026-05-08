# Quick Publishing Guide

## First-Time Setup (One-time)

### 1. Create npm Account
Visit: https://www.npmjs.com/signup

### 2. Create npm Organization
Visit: https://www.npmjs.com/org/create
- Organization name: `pr-visual-diff`
- Choose "Unlimited public packages" (free)

### 3. Login to npm
```bash
npm login
```

Verify:
```bash
npm whoami
```

## Publishing (Every Release)

### Simple Method (Recommended)

**If your npm account has security codes (backup codes):**
```bash
# 1. Install dependencies
npm install

# 2. Find your npm security codes list (e.g., abc123def456)

# 3. Pick ONE unused code and run
npm run publish-packages abc123def456

# 4. Mark that code as USED (cross it off your list)
```

**If your npm account has TOTP/authenticator app:**
```bash
# 1. Install dependencies
npm install

# 2. Get 6-digit code from your authenticator app (e.g., 123456)

# 3. Run immediately with TOTP code
npm run publish-packages 123456
```

**If you don't have 2FA:**
```bash
# 1. Install dependencies
npm install

# 2. Run automated publish script
npm run publish-packages
```

> **Note:** If you see `EOTP` errors:
> - If you have **security codes** (backup codes): See [SECURITY_CODES_GUIDE.md](./SECURITY_CODES_GUIDE.md)
> - If you have **authenticator app**: See [OTP_PUBLISHING_GUIDE.md](./OTP_PUBLISHING_GUIDE.md)

That's it! The script handles everything:
- ✓ Backs up package.json files
- ✓ Converts workspace:* to versions
- ✓ Publishes in correct order
- ✓ Restores original files

### Verify Published Packages
```bash
npm view pr-visual-diff
npm view @pr-visual-diff/core
```

Or visit:
- https://www.npmjs.com/package/pr-visual-diff
- https://www.npmjs.com/search?q=%40pr-visual-diff

### Test Installation
```bash
mkdir test-pr-visual-diff && cd test-pr-visual-diff
npm init -y
npm install pr-visual-diff
npx pr-visual-diff doctor
```

## Releasing Updates

### 1. Update Version
```bash
# For bug fixes (0.1.0 → 0.1.1)
npm version patch

# For new features (0.1.0 → 0.2.0)
npm version minor

# For breaking changes (0.1.0 → 1.0.0)
npm version major
```

### 2. Update CHANGELOG.md
Add your changes under a new version heading.

### 3. Commit and Tag
```bash
git add .
git commit -m "chore: release v0.2.0"
git tag v0.2.0
git push && git push --tags
```

### 4. Publish
```bash
npm run publish-packages
```

### 5. Create GitHub Release
Go to: https://github.com/abhinav-18max/pr-visual-diff/releases/new
- Choose the tag you just created
- Add release notes from CHANGELOG.md
- Publish release

## Common Issues

### ❌ "You do not have permission to publish"
**Solution:** Add `--access public` flag (already in script), or verify you created the `@pr-visual-diff` organization

### ❌ "Package name already exists"
**Solution:** Package name is taken. Change the name in package.json files

### ❌ "Not logged in"
**Solution:** Run `npm login` first

### ❌ "workspace:* is not a valid version"
**Solution:** The script should handle this. If you see this error, manually replace `workspace:*` with version numbers

## Automated Publishing (Optional)

For automated publishing on version tags:

1. Create npm Automation Token: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Add to GitHub secrets as `NPM_TOKEN`
3. Push a version tag: `git push --tags`
4. GitHub Actions will auto-publish (see `.github/workflows/publish.yml`)

## Files Created

- ✅ `PUBLISHING.md` - Detailed publishing guide
- ✅ `QUICK_PUBLISH_GUIDE.md` - This quick reference (you are here)
- ✅ `CHANGELOG.md` - Version history
- ✅ `scripts/publish.js` - Automated publish script
- ✅ `.github/workflows/publish.yml` - GitHub Actions workflow
- ✅ `.npmignore` - Files to exclude from npm packages
- ✅ Updated all package.json files with metadata

## Need Help?

See the detailed guide: [PUBLISHING.md](./PUBLISHING.md)
