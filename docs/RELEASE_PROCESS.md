# Release Process

Quick guide for creating releases in the Kumakatok backend project.

## Semantic Versioning

Format: `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## Release Steps

### 1. Prepare Release
```bash
# Run tests
pnpm test && pnpm test:e2e

# Get commits since last release
git log v1.0.1..HEAD --oneline
```

### 2. Update Version
```bash
# Update package.json version manually
# Or use: npm version patch|minor|major --no-git-tag-version
```

### 3. Update Changelog
Add new section to `CHANGELOG.md`:
```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Fixed
- Bug fixes

### Changed
- Improvements
```

### 4. Create Release

#### Option A: Simple Flow (Small Teams)
```bash
# Stage files
git add package.json CHANGELOG.md

# Commit
git commit -m "[Release] vX.Y.Z - Brief description"

# Create tag
git tag -a vX.Y.Z -m "Release vX.Y.Z"

# Push
git push origin main
git push origin vX.Y.Z
```

#### Option B: Git Flow (Recommended for Teams)
```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/vX.Y.Z

# 2. Prepare release
git add package.json CHANGELOG.md
git commit -m "[Release] Prepare vX.Y.Z"

# 3. Merge to develop
git checkout develop
git merge --no-ff release/vX.Y.Z

# 4. Merge to main
git checkout main
git merge --no-ff release/vX.Y.Z

# 5. Create tag
git tag -a vX.Y.Z -m "Release vX.Y.Z"

# 6. Push everything
git push origin develop main vX.Y.Z

# 7. Clean up
git branch -d release/vX.Y.Z
```

## Database Migrations
If release includes database changes:
```bash
# Test locally
pnpm db:migrate

# Deploy to production
pnpm db:migrate:prod
```

## Emergency Hotfix
```bash
# Create hotfix branch from tag
git checkout -b hotfix/vX.Y.Z+1 vX.Y.Z

# Apply fix, update version, commit
# Create new tag and push

# Merge back to main
git checkout main
git merge hotfix/vX.Y.Z+1
```

## Useful Commands
```bash
# View changes between releases
git diff v1.0.1..v1.0.2

# Generate changelog entries
git log v1.0.1..HEAD --pretty=format:"- %s"

# List all tags
git tag -l
``` 