# Slug Migration Guide

This guide covers the safe migration of existing listings and users to include slug fields for SEO-friendly URLs.

## Migration Safety Analysis

### ✅ **SAFE ASPECTS**
- **No Data Loss**: Migrations only ADD nullable columns (`slug`, `slugId`)
- **Backward Compatible**: Existing functionality continues to work
- **Nullable Fields**: New columns are optional, existing records won't break
- **Additive Changes**: No existing columns are modified or dropped

### ⚠️ **CONSIDERATIONS**
- **Unique Constraints**: New unique indexes on nullable fields (safe when all values are NULL)
- **Application Logic**: Ensure your application handles cases where slug fields might be NULL
- **Performance**: Index creation on large tables may cause brief locks

## Migration Steps

### 1. Pre-Migration Checklist

```bash
# 1. Backup your database
pg_dump your_database > backup_before_slug_migration.sql

# 2. Run migrations in dry-run mode first
cd /path/to/backend
npm run build
node dist/scripts/migrate-slugs-production.js --dry-run

# 3. Check for any issues in dry-run output
# 4. Ensure adequate disk space for new indexes
# 5. Plan for brief downtime during index creation
```

### 2. Apply Database Migrations

```bash
# Apply the Prisma migrations
npx prisma migrate deploy

# This will create:
# - listings.slug (TEXT, UNIQUE, NULLABLE)
# - listings.slugId (TEXT, UNIQUE, NULLABLE) 
# - users.slug (TEXT, UNIQUE, NULLABLE)
# - users.slugId (TEXT, UNIQUE, NULLABLE)
# - Associated unique indexes
```

### 3. Populate Slug Fields

```bash
# Run in dry-run mode first to preview changes
node dist/scripts/migrate-slugs-production.js --dry-run --log-level=info

# If dry-run looks good, execute the migration
node dist/scripts/migrate-slugs-production.js --execute --batch-size=50 --log-level=info
```

#### Migration Script Options

| Option | Description | Default |
|--------|-------------|---------|
| `--execute` | Actually perform the migration (without this, runs in dry-run mode) | `false` |
| `--batch-size=N` | Process N records at a time | `100` |
| `--log-level=LEVEL` | Logging level: `info`, `debug`, `error` | `info` |

#### What the Migration Does

**For Listings:**
- Generates slugs like: `listing/taguig-condo-for-sale-abc123def456`
- Uses city from location or attributes
- Includes property type and entity type
- Adds unique 15-character slug ID

**For Users:**
- Generates slugs like: `john-doe-abc123def456` or `acme-corp-abc123def456`
- Prioritizes company name over personal names
- Falls back to `user-abc123def456` if no names available
- Adds unique 15-character slug ID

### 4. Validation

The migration script includes automatic validation:
- Checks for records without slugs
- Detects duplicate slugs
- Validates slug format
- Reports statistics

## Rollback Strategy

If you need to rollback the migration:

### 1. Remove Slug Data

```bash
# Create backup and remove slug fields
node dist/scripts/rollback-slug-migration.js --execute --create-backup
```

### 2. Rollback Database Migrations

```bash
# Create a new migration to remove the columns
npx prisma migrate dev --name remove_slug_fields

# In the generated migration file, add:
# ALTER TABLE "listings" DROP COLUMN "slug";
# ALTER TABLE "listings" DROP COLUMN "slugId";  
# ALTER TABLE "users" DROP COLUMN "slug";
# ALTER TABLE "users" DROP COLUMN "slugId";
```

### 3. Restore from Backup (if needed)

```bash
# If you have a backup file from the rollback script
node -e "
const backup = require('./backups/slug-backup-TIMESTAMP.json');
// Custom restore logic here
"
```

## Production Deployment Checklist

### Before Migration
- [ ] Database backup completed
- [ ] Dry-run executed successfully
- [ ] Application code deployed (handles nullable slugs)
- [ ] Monitoring alerts configured
- [ ] Rollback plan reviewed

### During Migration
- [ ] Apply Prisma migrations: `npx prisma migrate deploy`
- [ ] Run slug population script: `node dist/scripts/migrate-slugs-production.js --execute`
- [ ] Monitor for errors and performance impact
- [ ] Validate migration results

### After Migration
- [ ] Verify slug generation is working for new records
- [ ] Test SEO URL functionality
- [ ] Monitor application logs for errors
- [ ] Update API documentation if needed

## Monitoring and Troubleshooting

### Key Metrics to Monitor
- Database CPU and memory usage during migration
- Application response times
- Error rates in application logs
- Migration script progress and completion time

### Common Issues and Solutions

#### Duplicate Slug Errors
```
Error: Could not generate unique slug after 10 attempts
```
**Solution**: The script handles this automatically by generating new slug IDs

#### Memory Issues with Large Datasets
```
Error: JavaScript heap out of memory
```
**Solution**: Reduce batch size: `--batch-size=25`

#### Database Lock Timeouts
```
Error: could not obtain lock on relation
```
**Solution**: Run during low-traffic hours, consider smaller batches

### Performance Optimization

For large datasets (>100k records):
- Use smaller batch sizes (`--batch-size=25`)
- Run during off-peak hours
- Monitor database performance
- Consider running listings and users separately

## Testing

### Unit Tests
```bash
npm run test -- --testPathPattern=slug
```

### Integration Tests
```bash
# Test slug generation
curl -X POST /api/listings -d '{...}' 
# Verify slug is generated

# Test slug-based retrieval
curl /api/listings/listing/taguig-condo-for-sale-abc123
```

### Manual Validation
```sql
-- Check for records without slugs
SELECT COUNT(*) FROM listings WHERE slug IS NULL OR "slugId" IS NULL;
SELECT COUNT(*) FROM users WHERE slug IS NULL OR "slugId" IS NULL;

-- Check for duplicate slugs
SELECT slug, COUNT(*) FROM listings GROUP BY slug HAVING COUNT(*) > 1;
SELECT slug, COUNT(*) FROM users GROUP BY slug HAVING COUNT(*) > 1;

-- Validate slug format
SELECT id, slug FROM listings WHERE slug IS NOT NULL AND NOT slug ~ '^listing/.+-[a-zA-Z0-9_-]{10,}$';
```

## FAQ

### Q: Will this cause downtime?
A: Minimal downtime during index creation. The migration script can run while the application is live.

### Q: What happens to existing URLs?
A: Existing URLs continue to work. Slug-based URLs are additional, not replacements.

### Q: Can I run this migration multiple times?
A: Yes, the script is idempotent. It skips records that already have slug fields.

### Q: How long will the migration take?
A: Depends on data size. Estimate ~1000 records per minute with default batch size.

### Q: What if the migration fails partway through?
A: The script processes in batches with error handling. Failed records are logged, and you can re-run to complete.

## Support

If you encounter issues:
1. Check the migration logs for specific error messages
2. Verify database connectivity and permissions
3. Ensure sufficient disk space for indexes
4. Review the troubleshooting section above
5. Use the rollback script if needed to restore previous state
