# GitHub Actions Setup Checklist

Complete these steps to enable automated publishing to npm.

## ✅ Step 1: Add npm Token to GitHub Secrets

1. **Get your npm automation token:**
   ```bash
   cat ~/.npmrc | grep '_authToken'
   ```
   
   Copy the token value after `//registry.npmjs.org/:_authToken=`

2. **Add to GitHub Secrets:**
   - Go to: https://github.com/abhinav-18max/pr-visual-diff/settings/secrets/actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your automation token
   - Click "Add secret"

## ✅ Step 2: Enable GitHub Actions Permissions

1. **Go to Actions settings:**
   - Visit: https://github.com/abhinav-18max/pr-visual-diff/settings/actions

2. **Enable all actions:**
   - Under "Actions permissions", select:
     - ✓ "Allow all actions and reusable workflows"

3. **Enable write permissions:**
   - Under "Workflow permissions", select:
     - ✓ "Read and write permissions"
   - Click "Save"

## ✅ Step 3: Commit and Push Workflow Files

```bash
# Add workflow files
git add .github/workflows/*.yml

# Commit
git commit -m "ci: add GitHub Actions workflows for automated testing and publishing"

# Push to GitHub
git push origin main
```

## ✅ Step 4: Verify Workflows Are Enabled

1. Go to: https://github.com/abhinav-18max/pr-visual-diff/actions
2. You should see three workflows:
   - ✓ Tests
   - ✓ Version Bump
   - ✓ Publish to npm

## ✅ Step 5: Test the Setup

### Option A: Trigger Test Workflow

This should happen automatically on the next push:

```bash
# Make a small change
echo "" >> README.md

# Commit and push
git add README.md
git commit -m "test: trigger Actions workflow"
git push origin main
```

Then check: https://github.com/abhinav-18max/pr-visual-diff/actions

### Option B: Manually Trigger Version Bump

1. Go to: https://github.com/abhinav-18max/pr-visual-diff/actions/workflows/version-bump.yml
2. Click "Run workflow"
3. Select "patch"
4. Click "Run workflow"
5. Watch it run!

## 🎉 You're Done!

### Next Steps:

#### To Publish a New Version:

1. **Update CHANGELOG.md** with your changes
2. **Run Version Bump workflow:**
   - Go to: https://github.com/abhinav-18max/pr-visual-diff/actions/workflows/version-bump.yml
   - Click "Run workflow"
   - Select bump type (patch/minor/major)
   - Watch the magic happen! ✨

3. **What happens automatically:**
   - ✅ Version bumped in all packages
   - ✅ CHANGELOG updated
   - ✅ Git commit created
   - ✅ Version tag pushed
   - ✅ Publish workflow triggered
   - ✅ Packages published to npm
   - ✅ GitHub Release created

#### Manual Publishing (Alternative):

If you prefer to do it manually:

```bash
# 1. Bump version
npm version patch  # or minor, or major

# 2. Update all packages (use publish script)
npm run publish-packages

# 3. Push with tags
git push origin main --tags
```

## 📚 Documentation

- **Comprehensive Guide**: See [GITHUB_ACTIONS_GUIDE.md](./GITHUB_ACTIONS_GUIDE.md)
- **Publishing Guide**: See [PUBLISHING.md](./PUBLISHING.md)
- **Quick Reference**: See [QUICK_PUBLISH_GUIDE.md](./QUICK_PUBLISH_GUIDE.md)

## 🐛 Troubleshooting

### Workflow Not Running?

- ✓ Check Actions are enabled in settings
- ✓ Check workflow permissions are set to "Read and write"
- ✓ Verify `NPM_TOKEN` secret exists

### Publishing Failed?

- ✓ Check `NPM_TOKEN` is correct
- ✓ Verify you're logged into npm with automation token
- ✓ Check workflow logs in Actions tab

### Need Help?

Check the detailed guide: [GITHUB_ACTIONS_GUIDE.md](./GITHUB_ACTIONS_GUIDE.md)

---

**Status Check:** Visit https://github.com/abhinav-18max/pr-visual-diff/actions to see workflow status
