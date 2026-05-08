# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-05-09

### Added
- Initial release of pr-visual-diff
- Core visual diff functionality
- npm workspaces monorepo structure
- Git worktree management for base/head comparison
- Playwright-based screenshot capture with authentication hooks
- Pixel diff engine using pixelmatch + pngjs
- Static HTML report generator with manifest.json
- Support for Next.js (port 3000) and Vite (port 4173)
- Configuration system via .visualdiff.json
- CLI commands: `run`, `init`, `doctor`
- Maximum 10 routes per run (MVP constraint)
- Comprehensive documentation (README, USAGE, ARCHITECTURE)
- Example configurations for Next.js and Vite
- MIT license

### Package Structure
- `pr-visual-diff` - Main CLI package
- `@pr-visual-diff/core` - Config, constants, errors, logger, utilities
- `@pr-visual-diff/git` - Git worktree operations
- `@pr-visual-diff/runner` - App installation, build, and startup
- `@pr-visual-diff/screenshots` - Playwright screenshot capture
- `@pr-visual-diff/diff-engine` - Image comparison and normalization
- `@pr-visual-diff/reporter` - HTML report generation

[Unreleased]: https://github.com/abhinav-18max/pr-visual-diff/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/abhinav-18max/pr-visual-diff/releases/tag/v0.1.0
