# Publishing pr-visual-diff to npm

This guide walks you through publishing the pr-visual-diff monorepo to npm.

## Prerequisites

### 1. Create an npm Account
If you don't have one already:
- Go to https://www.npmjs.com/signup
- Create your account
- Verify your email

### 2. Create an npm Organization (for scoped packages)
Since we use `@pr-visual-diff/*` scoped packages:
- Go to https://www.npmjs.com/org/create
- Create organization: `pr-visual-diff`
- Choose "Unlimited public packages" (free)

### 3. Login to npm
```bash
npm login
```
Enter your username, password, and email when prompted.

Verify you're logged in:
```bash
npm whoami
```

### 4. Install Dependencies
```bash
npm install
```

This installs all dependencies for all workspace packages.

## Publishing Process

### Option 1: Automated Publishing (Recommended)

We'll create a publish script that handles everything:

1. **Run the publish script:**
```bash
npm run publish-packages
```

This script will:
- Install dependencies in all packages
- Replace `workspace:*` with actual versions
- Publish all packages in the correct order
- Restore the workspace protocol

### Option 2: Manual Publishing

If you prefer to publish manually:

1. **Install dependencies:**
```bash
npm install
```

2. **Convert workspace references:**

Before publishing, replace all `workspace:*` references with actual versions.

For each `package.json` in `packages/*/`, change:
```json
"@pr-visual-diff/core": "workspace:*"
```
to:
```json
"@pr-visual-diff/core": "0.1.0"
```

3. **Publish packages in dependency order:**

```bash
# 1. Publish core (no dependencies on other workspace packages)
cd packages/core
npm publish --access public
cd ../..

# 2. Publish packages that depend only on core
cd packages/git
npm publish --access public
cd ../..

cd packages/runner
npm publish --access public
cd ../..

cd packages/reporter
npm publish --access public
cd ../..

# 3. Publish diff-engine (depends on core, has external deps)
cd packages/diff-engine
npm publish --access public
cd ../..

# 4. Publish screenshots (depends on core, has playwright)
cd packages/screenshots
npm publish --access public
cd ../..

# 5. Finally, publish CLI (depends on all packages)
cd packages/cli
npm publish --access public
cd ../..
```

4. **Restore workspace protocol:**

After publishing, restore the `workspace:*` references in your local files for continued development.

## Important Notes

### Access Public
Since you're using scoped packages (`@pr-visual-diff/*`), you MUST use `--access public` flag when publishing, otherwise npm will try to publish them as private (which requires a paid account).

### Two-Factor Authentication (2FA/OTP)

If your npm account has 2FA enabled, you'll need to provide a one-time password (OTP) when publishing:

```bash
# Get your 6-digit code from authenticator app, then:
npm run publish-packages 123456

# Or set as environment variable:
NPM_OTP=123456 npm run publish-packages
```

For detailed 2FA instructions, see [OTP_PUBLISHING_GUIDE.md](./OTP_PUBLISHING_GUIDE.md).

### Version Management

For subsequent releases:

1. **Update versions:**
```bash
# In root directory
npm version patch  # for bug fixes (0.1.0 -> 0.1.1)
npm version minor  # for new features (0.1.0 -> 0.2.0)
npm version major  # for breaking changes (0.1.0 -> 1.0.0)
```

This will update the version in the root package.json. Then manually update all workspace packages to match.

2. **Commit the version change:**
```bash
git add .
git commit -m "chore: bump version to 0.2.0"
git push
```

3. **Create a git tag:**
```bash
git tag v0.2.0
git push --tags
```

4. **Publish the new version** (follow publishing process above)

### Verify Published Packages

After publishing, verify your packages are available:

```bash
npm view pr-visual-diff
npm view @pr-visual-diff/core
npm view @pr-visual-diff/git
npm view @pr-visual-diff/runner
npm view @pr-visual-diff/screenshots
npm view @pr-visual-diff/diff-engine
npm view @pr-visual-diff/reporter
```

Check on npm website:
- https://www.npmjs.com/package/pr-visual-diff
- https://www.npmjs.com/package/@pr-visual-diff/core
- etc.

### Test Installation

After publishing, test the installation in a fresh directory:

```bash
mkdir test-install
cd test-install
npm init -y
npm install pr-visual-diff
npx pr-visual-diff doctor
```

## Automation (CI/CD)

For future automated publishing with GitHub Actions, see the `.github/workflows/publish.yml` example file.

### npm Automation Token

For CI/CD publishing:
1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Create a new "Automation" token
3. Add it to your GitHub repository secrets as `NPM_TOKEN`

## Troubleshooting

### "You do not have permission to publish"
- Make sure you're logged in: `npm whoami`
- Verify you created the `@pr-visual-diff` organization
- Use `--access public` flag

### "Package already exists"
- Package names must be unique on npm
- Check if name is available: `npm view pr-visual-diff`
- If taken, change the name in package.json

### "workspace:* is not a valid version"
- You forgot to replace workspace references before publishing
- Use the automated script or manually replace all `workspace:*` with version numbers

### "Invalid package version"
- All workspace packages must have the same version
- Update all packages to match before publishing

## Next Steps

After successful publishing:

1. Add a badge to your README:
```markdown
[![npm version](https://badge.fury.io/js/pr-visual-diff.svg)](https://www.npmjs.com/package/pr-visual-diff)
```

2. Set up GitHub Actions for automated publishing

3. Consider setting up automated changelogs with conventional commits

4. Set up npm deprecation warnings for older versions when needed
