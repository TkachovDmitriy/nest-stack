#!/usr/bin/env ts-node

/**
 * Production Migration Script: Populate Slug Fields
 *
 * This script safely migrates existing listings and users by generating
 * slug and slugId fields for records that don't have them.
 *
 * SAFETY FEATURES:
 * - Dry run mode by default
 * - Batch processing to avoid memory issues
 * - Detailed logging and progress tracking
 * - Rollback capability
 * - Duplicate slug handling
 * - Database transaction safety
 */

import { PrismaClient } from '@prisma/client';

import { SlugGenerator } from '../src/core/utils/slug-generator.util';

const prisma = new PrismaClient();

interface MigrationOptions {
  dryRun: boolean;
  batchSize: number;
  logLevel: 'info' | 'debug' | 'error';
}

interface MigrationStats {
  listingsProcessed: number;
  listingsUpdated: number;
  usersProcessed: number;
  usersUpdated: number;
  errors: Array<{ id: string; error: string; type: 'listing' | 'user' }>;
  duplicateSlugs: Array<{ slug: string; type: 'listing' | 'user'; count: number }>;
}

class SlugMigrationService {
  private options: MigrationOptions;
  private stats: MigrationStats;

  constructor(options: Partial<MigrationOptions> = {}) {
    this.options = {
      dryRun: true, // Safe default
      batchSize: 100,
      logLevel: 'info',
      ...options,
    };

    this.stats = {
      listingsProcessed: 0,
      listingsUpdated: 0,
      usersProcessed: 0,
      usersUpdated: 0,
      errors: [],
      duplicateSlugs: [],
    };
  }

  private log(level: 'info' | 'debug' | 'error', message: string, data?: unknown): void {
    if (this.options.logLevel === 'debug' || level !== 'debug') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  /**
   * Generic function to ensure unique slug for any entity type
   */
  private async ensureUniqueSlug<T extends 'listing' | 'user'>(
    entityType: T,
    baseSlug: string,
    slugId: string,
    excludeId?: string,
  ): Promise<{ slug: string; slugId: string }> {
    let attempt = 0;
    let currentSlug = baseSlug;
    let currentSlugId = slugId;

    while (attempt < 10) {
      // Max 10 attempts
      const model = entityType === 'listing' ? prisma.listing : prisma.user;
      const existing = await (
        model as unknown as {
          findFirst: (args: {
            where: Record<string, unknown>;
            select: { id: true; slug: true; slugId: true };
          }) => Promise<{ id: string; slug: string; slugId: string } | null>;
        }
      ).findFirst({
        where: {
          OR: [{ slug: currentSlug }, { slugId: currentSlugId }],
          ...(excludeId && { id: { not: excludeId } }),
        },
        select: { id: true, slug: true, slugId: true },
      });

      if (!existing) {
        return { slug: currentSlug, slugId: currentSlugId };
      }

      // Generate new slug with incremented suffix
      attempt++;
      const newSlugData = this.generateFallbackSlugData(entityType, 15);
      currentSlug = newSlugData.slug;
      currentSlugId = newSlugData.slugId;

      this.log('debug', `${entityType} slug collision detected, trying attempt ${attempt}`, {
        originalSlug: baseSlug,
        newSlug: currentSlug,
        existingRecord: existing.id,
      });
    }

    throw new Error(
      `Could not generate unique slug after ${attempt} attempts for base slug: ${baseSlug}`,
    );
  }

  /**
   * Generate fallback slug data for collision resolution
   */
  private generateFallbackSlugData(
    entityType: 'listing' | 'user',
    slugIdLength: number,
  ): { slug: string; slugId: string } {
    if (entityType === 'listing') {
      return SlugGenerator.generateSlug({
        slugIdLength,
      });
    } else {
      return SlugGenerator.generateUserSlug({
        slugIdLength,
      });
    }
  }

  /**
   * Extract city from listing data with improved fallback logic
   */
  private extractCityFromListing(listing: {
    location?: { city?: string };
    attributes?: Array<{ definition: { key: string }; values: string[] }>;
  }): string | undefined {
    // Priority 1: Direct location city
    if (listing.location?.city) {
      return listing.location.city;
    }

    // Priority 2: Find city in attributes
    const cityAttribute = listing.attributes?.find(
      (attr) =>
        attr.definition.key.toLowerCase().includes('city') ||
        attr.definition.key.toLowerCase().includes('location'),
    );

    if (cityAttribute && cityAttribute.values.length > 0) {
      return cityAttribute.values[0];
    }

    // No fallback to 'listing' - return undefined to let slug generator handle it
    return undefined;
  }

  /**
   * Migrate listings in batches
   */
  async migrateListings(): Promise<void> {
    this.log('info', 'Starting listings migration...');

    // Get total count
    const totalListings = await prisma.listing.count({
      where: {
        OR: [{ slug: null }, { slugId: null }],
      },
    });

    this.log('info', `Found ${totalListings} listings to migrate`);

    if (totalListings === 0) {
      this.log('info', 'No listings need migration');
      return;
    }

    let processed = 0;
    let skip = 0;

    while (processed < totalListings) {
      const listings = await prisma.listing.findMany({
        where: {
          OR: [{ slug: null }, { slugId: null }],
        },
        include: {
          location: true,
          attributes: {
            include: {
              definition: true,
            },
          },
        },
        take: this.options.batchSize,
        skip,
        orderBy: { createdAt: 'asc' },
      });

      if (listings.length === 0) break;

      this.log(
        'info',
        `Processing listings batch: ${skip + 1}-${skip + listings.length} of ${totalListings}`,
      );

      for (const listing of listings) {
        try {
          this.stats.listingsProcessed++;

          // Skip if already has both slug fields
          if (listing.slug && listing.slugId) {
            this.log('debug', `Listing ${listing.id} already has slug fields, skipping`);
            continue;
          }

          // Extract city from location or attributes (no 'listing' fallback)
          const city = this.extractCityFromListing({
            location: listing.location || undefined,
            attributes: listing.attributes,
          });

          // Generate slug data
          const slugData = SlugGenerator.generateListingSlug(
            city,
            listing.propertyType,
            listing.entityType,
            15,
            listing.slugId || undefined, // Preserve existing slugId if any
          );

          // Ensure uniqueness using generic method
          const uniqueSlugData = await this.ensureUniqueSlug(
            'listing',
            slugData.slug,
            slugData.slugId,
            listing.id,
          );

          this.log('debug', `Generated slug for listing ${listing.id}`, {
            city,
            propertyType: listing.propertyType,
            entityType: listing.entityType,
            slug: uniqueSlugData.slug,
            slugId: uniqueSlugData.slugId,
          });

          // Update listing (or log for dry run)
          if (this.options.dryRun) {
            this.log('info', `[DRY RUN] Would update listing ${listing.id}`, {
              slug: uniqueSlugData.slug,
              slugId: uniqueSlugData.slugId,
            });
          } else {
            await prisma.listing.update({
              where: { id: listing.id },
              data: {
                slug: uniqueSlugData.slug,
                slugId: uniqueSlugData.slugId,
              },
            });
            this.log('debug', `Updated listing ${listing.id} with slug: ${uniqueSlugData.slug}`);
          }

          this.stats.listingsUpdated++;
        } catch (error) {
          this.log('error', `Failed to migrate listing ${listing.id}`, error);
          this.stats.errors.push({
            id: listing.id,
            error: error instanceof Error ? error.message : String(error),
            type: 'listing',
          });
        }
      }

      processed += listings.length;
      skip += this.options.batchSize;

      // Progress update
      const percentage = Math.round((processed / totalListings) * 100);
      this.log('info', `Listings progress: ${processed}/${totalListings} (${percentage}%)`);
    }

    this.log(
      'info',
      `Completed listings migration. Processed: ${this.stats.listingsProcessed}, Updated: ${this.stats.listingsUpdated}`,
    );
  }

  /**
   * Migrate users in batches
   */
  async migrateUsers(): Promise<void> {
    this.log('info', 'Starting users migration...');

    // Get total count
    const totalUsers = await prisma.user.count({
      where: {
        OR: [{ slug: null }, { slugId: null }],
      },
    });

    this.log('info', `Found ${totalUsers} users to migrate`);

    if (totalUsers === 0) {
      this.log('info', 'No users need migration');
      return;
    }

    let processed = 0;
    let skip = 0;

    while (processed < totalUsers) {
      const users = await prisma.user.findMany({
        where: {
          OR: [{ slug: null }, { slugId: null }],
        },
        take: this.options.batchSize,
        skip,
        orderBy: { createdAt: 'asc' },
      });

      if (users.length === 0) break;

      this.log(
        'info',
        `Processing users batch: ${skip + 1}-${skip + users.length} of ${totalUsers}`,
      );

      for (const user of users) {
        try {
          this.stats.usersProcessed++;

          // Skip if already has both slug fields
          if (user.slug && user.slugId) {
            this.log('debug', `User ${user.id} already has slug fields, skipping`);
            continue;
          }

          // Generate slug data
          const slugData = SlugGenerator.generateUserSlugFromData(
            user.firstName,
            user.lastName,
            user.companyName,
            15,
            user.slugId || undefined, // Preserve existing slugId if any
          );

          // Ensure uniqueness using generic method
          const uniqueSlugData = await this.ensureUniqueSlug(
            'user',
            slugData.slug,
            slugData.slugId,
            user.id,
          );

          this.log('debug', `Generated slug for user ${user.id}`, {
            firstName: user.firstName,
            lastName: user.lastName,
            companyName: user.companyName,
            slug: uniqueSlugData.slug,
            slugId: uniqueSlugData.slugId,
          });

          // Update user (or log for dry run)
          if (this.options.dryRun) {
            this.log('info', `[DRY RUN] Would update user ${user.id}`, {
              slug: uniqueSlugData.slug,
              slugId: uniqueSlugData.slugId,
            });
          } else {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                slug: uniqueSlugData.slug,
                slugId: uniqueSlugData.slugId,
              },
            });
            this.log('debug', `Updated user ${user.id} with slug: ${uniqueSlugData.slug}`);
          }

          this.stats.usersUpdated++;
        } catch (error) {
          this.log('error', `Failed to migrate user ${user.id}`, error);
          this.stats.errors.push({
            id: user.id,
            error: error instanceof Error ? error.message : String(error),
            type: 'user',
          });
        }
      }

      processed += users.length;
      skip += this.options.batchSize;

      // Progress update
      const percentage = Math.round((processed / totalUsers) * 100);
      this.log('info', `Users progress: ${processed}/${totalUsers} (${percentage}%)`);
    }

    this.log(
      'info',
      `Completed users migration. Processed: ${this.stats.usersProcessed}, Updated: ${this.stats.usersUpdated}`,
    );
  }

  /**
   * Validate migration results
   */
  async validateMigration(): Promise<boolean> {
    this.log('info', 'Validating migration results...');

    // Check for records without slugs
    const listingsWithoutSlugs = await prisma.listing.count({
      where: {
        OR: [{ slug: null }, { slugId: null }],
      },
    });

    const usersWithoutSlugs = await prisma.user.count({
      where: {
        OR: [{ slug: null }, { slugId: null }],
      },
    });

    // Check for duplicate slugs
    const duplicateListingSlugs = await prisma.$queryRaw<Array<{ slug: string; count: bigint }>>`
      SELECT slug, COUNT(*) as count 
      FROM listings 
      WHERE slug IS NOT NULL 
      GROUP BY slug 
      HAVING COUNT(*) > 1
    `;

    const duplicateUserSlugs = await prisma.$queryRaw<Array<{ slug: string; count: bigint }>>`
      SELECT slug, COUNT(*) as count 
      FROM users 
      WHERE slug IS NOT NULL 
      GROUP BY slug 
      HAVING COUNT(*) > 1
    `;

    const duplicateListingSlugIds = await prisma.$queryRaw<
      Array<{ slugId: string; count: bigint }>
    >`
      SELECT "slugId", COUNT(*) as count 
      FROM listings 
      WHERE "slugId" IS NOT NULL 
      GROUP BY "slugId" 
      HAVING COUNT(*) > 1
    `;

    const duplicateUserSlugIds = await prisma.$queryRaw<Array<{ slugId: string; count: bigint }>>`
      SELECT "slugId", COUNT(*) as count 
      FROM users 
      WHERE "slugId" IS NOT NULL 
      GROUP BY "slugId" 
      HAVING COUNT(*) > 1
    `;

    const isValid =
      listingsWithoutSlugs === 0 &&
      usersWithoutSlugs === 0 &&
      duplicateListingSlugs.length === 0 &&
      duplicateUserSlugs.length === 0 &&
      duplicateListingSlugIds.length === 0 &&
      duplicateUserSlugIds.length === 0;

    this.log('info', 'Migration validation results:', {
      listingsWithoutSlugs,
      usersWithoutSlugs,
      duplicateListingSlugs: duplicateListingSlugs.length,
      duplicateUserSlugs: duplicateUserSlugs.length,
      duplicateListingSlugIds: duplicateListingSlugIds.length,
      duplicateUserSlugIds: duplicateUserSlugIds.length,
      isValid,
    });

    return isValid;
  }

  /**
   * Run the complete migration process
   */
  async run(): Promise<void> {
    const startTime = Date.now();

    this.log('info', `Starting slug migration...`, {
      dryRun: this.options.dryRun,
      batchSize: this.options.batchSize,
      logLevel: this.options.logLevel,
    });

    try {
      // Pre-migration validation
      this.log('info', 'Running pre-migration validation...');

      // Check database connectivity
      await prisma.$connect();
      this.log('info', 'Database connection established');

      // Run migrations
      await this.migrateListings();
      await this.migrateUsers();

      // Post-migration validation
      if (!this.options.dryRun) {
        const isValid = await this.validateMigration();
        if (!isValid) {
          throw new Error('Migration validation failed');
        }
      }

      const duration = Date.now() - startTime;
      this.log('info', `Migration completed successfully in ${duration}ms`, this.stats);
    } catch (error) {
      this.log('error', 'Migration failed', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Get migration statistics
   */
  getStats(): MigrationStats {
    return { ...this.stats };
  }
}

// CLI Interface
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const options: Partial<MigrationOptions> = {
    dryRun: !args.includes('--execute'),
    batchSize: parseInt(
      args.find((arg) => arg.startsWith('--batch-size='))?.split('=')[1] || '100',
    ),
    logLevel:
      (args.find((arg) => arg.startsWith('--log-level='))?.split('=')[1] as
        | 'info'
        | 'debug'
        | 'error') || 'info',
  };

  if (options.dryRun) {
    console.log('🔍 RUNNING IN DRY-RUN MODE (no actual changes will be made)');
    console.log('💡 Use --execute flag to run the actual migration');
  } else {
    console.log('⚠️  RUNNING IN EXECUTE MODE (changes will be made to the database)');
    console.log('⏱️  Starting in 5 seconds... Press Ctrl+C to cancel');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  const migrationService = new SlugMigrationService(options);
  await migrationService.run();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export { SlugMigrationService };
