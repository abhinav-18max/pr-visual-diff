#!/usr/bin/env node

/**
 * Automated npm publish script for pr-visual-diff monorepo
 * 
 * This script:
 * 1. Backs up all package.json files
 * 2. Replaces workspace:* with actual versions
 * 3. Publishes all packages in dependency order
 * 4. Restores original package.json files
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const PACKAGES_DIR = join(ROOT, 'packages');
const PACKAGES = [
  'core',       // No workspace deps
  'git',        // Depends on: core
  'runner',     // Depends on: core
  'reporter',   // Depends on: core
  'diff-engine', // Depends on: core
  'screenshots', // Depends on: core
  'cli'         // Depends on: all
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getVersion() {
  const rootPkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  return rootPkg.version;
}

function backupPackageJson(packageName) {
  const pkgPath = join(PACKAGES_DIR, packageName, 'package.json');
  const backupPath = `${pkgPath}.backup`;
  copyFileSync(pkgPath, backupPath);
  log(`  ✓ Backed up ${packageName}/package.json`, 'cyan');
}

function restorePackageJson(packageName) {
  const pkgPath = join(PACKAGES_DIR, packageName, 'package.json');
  const backupPath = `${pkgPath}.backup`;
  
  if (existsSync(backupPath)) {
    copyFileSync(backupPath, pkgPath);
    execSync(`rm ${backupPath}`);
    log(`  ✓ Restored ${packageName}/package.json`, 'cyan');
  }
}

function replaceWorkspaceProtocol(packageName, version) {
  const pkgPath = join(PACKAGES_DIR, packageName, 'package.json');
  let content = readFileSync(pkgPath, 'utf-8');
  
  // Replace all workspace:* with the actual version
  content = content.replace(/"workspace:\*"/g, `"${version}"`);
  
  writeFileSync(pkgPath, content, 'utf-8');
  log(`  ✓ Replaced workspace:* with ${version} in ${packageName}`, 'cyan');
}

function publishPackage(packageName, otp) {
  const pkgDir = join(PACKAGES_DIR, packageName);
  
  try {
    log(`\n📦 Publishing ${packageName}...`, 'blue');
    
    const otpFlag = otp ? ` --otp=${otp}` : '';
    const output = execSync(`npm publish --access public${otpFlag}`, {
      cwd: pkgDir,
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    log(`  ✓ Successfully published ${packageName}`, 'green');
    return true;
  } catch (error) {
    log(`  ✗ Failed to publish ${packageName}`, 'red');
    log(`  Error: ${error.message}`, 'red');
    
    // Check if error is due to OTP
    if (error.message.includes('EOTP')) {
      log(`  ℹ️  This account requires 2FA. Please provide OTP code.`, 'yellow');
    }
    
    return false;
  }
}

function verifyNpmLogin() {
  try {
    const username = execSync('npm whoami', { encoding: 'utf-8' }).trim();
    log(`✓ Logged in as: ${username}`, 'green');
    return true;
  } catch {
    log('✗ Not logged in to npm. Run: npm login', 'red');
    return false;
  }
}

async function main() {
  log('\n🚀 pr-visual-diff npm publish script\n', 'blue');
  
  // Step 1: Verify npm login
  log('Step 1: Verifying npm login...', 'yellow');
  if (!verifyNpmLogin()) {
    process.exit(1);
  }
  
  // Step 2: Get version
  const version = getVersion();
  log(`\nStep 2: Publishing version ${version}`, 'yellow');
  
  // Step 3: Check for OTP
  const otp = process.env.NPM_OTP || process.argv[2];
  if (otp) {
    log(`\nℹ️  Using OTP code: ${otp.substring(0, 2)}****`, 'cyan');
  } else {
    log(`\nℹ️  No OTP provided. If your account has 2FA, pass OTP as: npm run publish-packages <code>`, 'yellow');
  }
  
  // Step 4: Backup all package.json files
  log('\nStep 3: Backing up package.json files...', 'yellow');
  PACKAGES.forEach(pkg => backupPackageJson(pkg));
  
  // Step 5: Replace workspace protocol
  log('\nStep 4: Replacing workspace:* references...', 'yellow');
  PACKAGES.forEach(pkg => replaceWorkspaceProtocol(pkg, version));
  
  // Step 6: Publish packages in order
  log('\nStep 5: Publishing packages...', 'yellow');
  const publishResults = PACKAGES.map(pkg => ({
    name: pkg,
    success: publishPackage(pkg, otp)
  }));
  
  // Step 7: Restore package.json files
  log('\nStep 6: Restoring package.json files...', 'yellow');
  PACKAGES.forEach(pkg => restorePackageJson(pkg));
  
  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Publishing Summary', 'blue');
  log('='.repeat(60), 'cyan');
  
  const successful = publishResults.filter(r => r.success);
  const failed = publishResults.filter(r => !r.success);
  
  if (successful.length > 0) {
    log(`\n✓ Successfully published (${successful.length}):`, 'green');
    successful.forEach(r => log(`  - ${r.name}`, 'green'));
  }
  
  if (failed.length > 0) {
    log(`\n✗ Failed to publish (${failed.length}):`, 'red');
    failed.forEach(r => log(`  - ${r.name}`, 'red'));
  }
  
  log('\n' + '='.repeat(60) + '\n', 'cyan');
  
  if (failed.length > 0) {
    log('❌ Some packages failed to publish. Please check the errors above.', 'red');
    process.exit(1);
  } else {
    log('✅ All packages published successfully!', 'green');
    log(`\nVerify your packages at:`, 'cyan');
    log(`  https://www.npmjs.com/package/pr-visual-diff`, 'cyan');
    PACKAGES.slice(0, -1).forEach(pkg => {
      log(`  https://www.npmjs.com/package/@pr-visual-diff/${pkg}`, 'cyan');
    });
  }
}

// Run the script
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  
  // Try to restore backups on error
  log('\nAttempting to restore backups...', 'yellow');
  PACKAGES.forEach(pkg => {
    try {
      restorePackageJson(pkg);
    } catch {}
  });
  
  process.exit(1);
});
