# Migration Scripts

## Slug Migration

### Quick Start

```bash
# 1. Build the project
npm run build

# 2. Run in dry-run mode (safe preview)
npm run migration:slugs -- --dry-run

# 3. Execute the actual migration
npm run migration:slugs -- --execute

# 4. For production (using compiled JS)
npm run migration:slugs:prod -- --execute --batch-size=50
```

### Available Commands

```bash
# Development (TypeScript)
npm run migration:slugs                    # Dry-run mode
npm run migration:slugs -- --execute       # Execute migration
npm run migration:slugs -- --batch-size=25 # Custom batch size

# Production (JavaScript)
npm run migration:slugs:prod -- --execute
npm run migration:slugs:prod -- --execute --batch-size=25 --log-level=debug

# Rollback (if needed)
npm run migration:slugs:rollback -- --execute
npm run migration:slugs:rollback:prod -- --execute
```

### Safety Features

- **Dry-run by default**: No changes made without `--execute` flag
- **Batch processing**: Processes records in configurable batches
- **Duplicate handling**: Automatically resolves slug conflicts
- **Error recovery**: Continues processing even if individual records fail
- **Comprehensive logging**: Detailed progress and error reporting
- **Backup creation**: Rollback script creates backups before changes

### Migration Process

1. **Listings**: Generates slugs like `listing/taguig-condo-for-sale-abc123def456`
2. **Users**: Generates slugs like `john-doe-abc123def456` or `acme-corp-abc123def456`
3. **Validation**: Ensures no duplicates and proper formatting
4. **Statistics**: Reports processed/updated counts and errors

See `docs/SLUG_MIGRATION_GUIDE.md` for complete documentation.
