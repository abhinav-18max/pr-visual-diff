# 📦 npm Publishing Checklist

## ✅ What's Been Done

### 1. Package Configuration (All Updated!)
```
✓ packages/cli/package.json         - Main CLI package
✓ packages/core/package.json        - Core utilities
✓ packages/git/package.json         - Git operations
✓ packages/runner/package.json      - App runner
✓ packages/screenshots/package.json - Screenshot capture
✓ packages/diff-engine/package.json - Image comparison
✓ packages/reporter/package.json    - Report generation
```

**Added to each package:**
- ✓ Description, keywords, author
- ✓ License (MIT)
- ✓ Repository links
- ✓ Node version requirement
- ✓ Homepage & bug tracker

### 2. Documentation Created
```
✓ PUBLISHING.md             - Comprehensive guide (800+ lines)
✓ QUICK_PUBLISH_GUIDE.md    - Quick reference
✓ PUBLISH_SUMMARY.md        - What was done
✓ CHANGELOG.md              - Version history
✓ NPM_PUBLISH_CHECKLIST.md  - This file!
```

### 3. Automation Scripts
```
✓ scripts/publish.js        - Automated publish script (200+ lines)
✓ .github/workflows/        - GitHub Actions for auto-publish
✓ .npmignore               - Exclude dev files from packages
```

### 4. Repository Updates
```
✓ README.md                 - Added npm badges
✓ package.json              - Added publish-packages script
```

---

## 🎯 Your Action Items

### Step 1: Commit These Changes
```bash
git add .
git commit -m "chore: prepare package for npm publishing

- Add package metadata to all packages
- Create publishing documentation and guides
- Add automated publish script
- Set up GitHub Actions workflow
- Add CHANGELOG and version tracking"
git push origin main
```

### Step 2: Set Up npm (First Time Only)

#### A. Create npm Account
1. Go to: https://www.npmjs.com/signup
2. Fill in username, email, password
3. Verify your email

#### B. Create Organization
1. Go to: https://www.npmjs.com/org/create
2. Organization name: `pr-visual-diff`
3. Choose: "Unlimited public packages" (FREE)
4. Click "Create"

#### C. Login Locally
```bash
npm login
# Enter your username
# Enter your password
# Enter your email
```

Verify you're logged in:
```bash
npm whoami
# Should show your npm username
```

### Step 3: Publish to npm

**If your npm account has 2FA enabled (you'll see EOTP errors):**

```bash
# Install dependencies
npm install

# Get your 6-digit OTP code from your authenticator app
# Then run immediately:
npm run publish-packages 123456

# Replace 123456 with your actual OTP code
```

**If you don't have 2FA:**

```bash
npm install
npm run publish-packages
```

**What the script does:**
1. ✓ Checks you're logged in to npm
2. ✓ Backs up all package.json files
3. ✓ Converts workspace:* to actual versions (0.1.0)
4. ✓ Publishes packages in correct order:
   - @pr-visual-diff/core (no deps)
   - @pr-visual-diff/git
   - @pr-visual-diff/runner
   - @pr-visual-diff/reporter
   - @pr-visual-diff/diff-engine
   - @pr-visual-diff/screenshots
   - pr-visual-diff (CLI - depends on all)
5. ✓ Restores original package.json files
6. ✓ Shows summary of results

### Step 4: Verify Publication

```bash
# Check packages are published
npm view pr-visual-diff
npm view @pr-visual-diff/core

# Or visit:
# https://www.npmjs.com/package/pr-visual-diff
# https://www.npmjs.com/search?q=%40pr-visual-diff
```

### Step 5: Test Installation

```bash
# Create a test directory
mkdir /tmp/test-pr-visual-diff
cd /tmp/test-pr-visual-diff

# Initialize and install
npm init -y
npm install pr-visual-diff

# Test the CLI
npx pr-visual-diff doctor
```

### Step 6: Create GitHub Release

1. Go to: https://github.com/abhinav-18max/pr-visual-diff/releases/new
2. Click "Choose a tag"
3. Type: `v0.1.0` and click "Create new tag"
4. Release title: `v0.1.0 - Initial Release`
5. Description: Copy from CHANGELOG.md
6. Click "Publish release"

---

## 📊 Publishing Workflow Diagram

```
┌─────────────────────────────────────────────────────┐
│           npm run publish-packages                   │
└───────────────────┬─────────────────────────────────┘
                    │
         ┌──────────▼──────────┐
         │  Verify npm login   │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ Backup package.json │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ Replace workspace:* │
         │   with 0.1.0        │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────────────┐
         │ Publish in dependency order: │
         │  1. @pr-visual-diff/core     │
         │  2. @pr-visual-diff/git      │
         │  3. @pr-visual-diff/runner   │
         │  4. @pr-visual-diff/reporter │
         │  5. @pr-visual-diff/diff-eng │
         │  6. @pr-visual-diff/screenshots│
         │  7. pr-visual-diff (CLI)     │
         └──────────┬──────────────────┘
                    │
         ┌──────────▼──────────┐
         │ Restore originals   │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │   Show summary      │
         └─────────────────────┘
```

---

## 🚨 Before You Publish - Final Check

- [ ] Committed all changes to git
- [ ] Pushed to GitHub
- [ ] Created npm account
- [ ] Created @pr-visual-diff organization
- [ ] Logged in via `npm login`
- [ ] Verified: `npm whoami` shows your username
- [ ] Ran `npm install` successfully
- [ ] Ready to run: `npm run publish-packages`

---

## 📝 Quick Commands Reference

```bash
# Login to npm
npm login

# Check who you're logged in as
npm whoami

# Install dependencies
npm install

# Publish all packages
npm run publish-packages

# Check published packages
npm view pr-visual-diff
npm view @pr-visual-diff/core

# Test global installation
npm install -g pr-visual-diff
pr-visual-diff doctor
```

---

## 🔄 For Future Updates

### Update Version
```bash
npm version patch  # 0.1.0 → 0.1.1 (bug fixes)
npm version minor  # 0.1.0 → 0.2.0 (new features)
npm version major  # 0.1.0 → 1.0.0 (breaking changes)
```

### Update All Packages
Manually update version in all `packages/*/package.json` to match root.

### Update CHANGELOG.md
Add your changes under a new version section.

### Commit, Tag, and Push
```bash
git add .
git commit -m "chore: release v0.2.0"
git tag v0.2.0
git push && git push --tags
```

### Publish
```bash
npm run publish-packages
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `PUBLISHING.md` | Complete publishing guide with all details |
| `QUICK_PUBLISH_GUIDE.md` | Quick reference for common tasks |
| `PUBLISH_SUMMARY.md` | Summary of what was set up |
| `NPM_PUBLISH_CHECKLIST.md` | This checklist (action items) |
| `CHANGELOG.md` | Version history tracking |

---

## 🎉 You're Ready!

When you're ready to publish, just run:

```bash
npm run publish-packages
```

The script will guide you through everything! 🚀
