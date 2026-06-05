#!/usr/bin/env ts-node

/**
 * Rollback Script: Remove Slug Fields
 *
 * This script safely removes slug and slugId fields from listings and users
 * in case the migration needs to be rolled back.
 *
 * SAFETY FEATURES:
 * - Dry run mode by default
 * - Batch processing
 * - Detailed logging
 * - Backup creation before rollback
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RollbackOptions {
  dryRun: boolean;
  batchSize: number;
  createBackup: boolean;
  logLevel: 'info' | 'debug' | 'error';
}

interface RollbackStats {
  listingsProcessed: number;
  listingsRolledBack: number;
  usersProcessed: number;
  usersRolledBack: number;
  errors: Array<{ id: string; error: string; type: 'listing' | 'user' }>;
  backupCreated: boolean;
  backupPath?: string;
}

class SlugRollbackService {
  private options: RollbackOptions;
  private stats: RollbackStats;

  constructor(options: Partial<RollbackOptions> = {}) {
    this.options = {
      dryRun: true, // Safe default
      batchSize: 100,
      createBackup: true,
      logLevel: 'info',
      ...options,
    };

    this.stats = {
      listingsProcessed: 0,
      listingsRolledBack: 0,
      usersProcessed: 0,
      usersRolledBack: 0,
      errors: [],
      backupCreated: false,
    };
  }

  private log(level: 'info' | 'debug' | 'error', message: string, data?: unknown) {
    if (this.options.logLevel === 'debug' || level !== 'debug') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  /**
   * Create backup of slug data before rollback
   */
  async createBackup(): Promise<void> {
    if (!this.options.createBackup) {
      this.log('info', 'Backup creation skipped');
      return;
    }

    this.log('info', 'Creating backup of slug data...');

    try {
      // Get all listings with slug data
      const listings = await prisma.listing.findMany({
        where: {
          OR: [{ slug: { not: null } }, { slugId: { not: null } }],
        },
        select: {
          id: true,
          slug: true,
          slugId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Get all users with slug data
      const users = await prisma.user.findMany({
        where: {
          OR: [{ slug: { not: null } }, { slugId: { not: null } }],
        },
        select: {
          id: true,
          slug: true,
          slugId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const backup = {
        timestamp: new Date().toISOString(),
        listings: listings.map((l) => ({
          id: l.id,
          slug: l.slug,
          slugId: l.slugId,
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
        })),
        users: users.map((u) => ({
          id: u.id,
          slug: u.slug,
          slugId: u.slugId,
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
        })),
        stats: {
          totalListings: listings.length,
          totalUsers: users.length,
        },
      };

      const backupFileName = `slug-backup-${Date.now()}.json`;
      const backupPath = join(process.cwd(), 'backups', backupFileName);

      // Ensure backups directory exists
      const backupDir = join(process.cwd(), 'backups');
      mkdirSync(backupDir, { recursive: true });

      writeFileSync(backupPath, JSON.stringify(backup, null, 2));

      this.stats.backupCreated = true;
      this.stats.backupPath = backupPath;

      this.log('info', `Backup created successfully`, {
        path: backupPath,
        listingsCount: listings.length,
        usersCount: users.length,
      });
    } catch (error) {
      this.log('error', 'Failed to create backup', error);
      throw new Error('Backup creation failed. Aborting rollback for safety.');
    }
  }

  /**
   * Rollback listings in batches
   */
  async rollbackListings(): Promise<void> {
    this.log('info', 'Starting listings rollback...');

    // Get total count
    const totalListings = await prisma.listing.count({
      where: {
        OR: [{ slug: { not: null } }, { slugId: { not: null } }],
      },
    });

    this.log('info', `Found ${totalListings} listings to rollback`);

    if (totalListings === 0) {
      this.log('info', 'No listings need rollback');
      return;
    }

    let processed = 0;
    let skip = 0;

    while (processed < totalListings) {
      const listings = await prisma.listing.findMany({
        where: {
          OR: [{ slug: { not: null } }, { slugId: { not: null } }],
        },
        select: {
          id: true,
          slug: true,
          slugId: true,
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

          // Update listing (or log for dry run)
          if (this.options.dryRun) {
            this.log('info', `[DRY RUN] Would remove slug fields from listing ${listing.id}`, {
              currentSlug: listing.slug,
              currentSlugId: listing.slugId,
            });
          } else {
            await prisma.listing.update({
              where: { id: listing.id },
              data: {
                slug: null,
                slugId: null,
              },
            });
            this.log('debug', `Removed slug fields from listing ${listing.id}`);
          }

          this.stats.listingsRolledBack++;
        } catch (error) {
          this.log('error', `Failed to rollback listing ${listing.id}`, error);
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
      this.log(
        'info',
        `Listings rollback progress: ${processed}/${totalListings} (${percentage}%)`,
      );
    }

    this.log(
      'info',
      `Completed listings rollback. Processed: ${this.stats.listingsProcessed}, Rolled back: ${this.stats.listingsRolledBack}`,
    );
  }

  /**
   * Rollback users in batches
   */
  async rollbackUsers(): Promise<void> {
    this.log('info', 'Starting users rollback...');

    // Get total count
    const totalUsers = await prisma.user.count({
      where: {
        OR: [{ slug: { not: null } }, { slugId: { not: null } }],
      },
    });

    this.log('info', `Found ${totalUsers} users to rollback`);

    if (totalUsers === 0) {
      this.log('info', 'No users need rollback');
      return;
    }

    let processed = 0;
    let skip = 0;

    while (processed < totalUsers) {
      const users = await prisma.user.findMany({
        where: {
          OR: [{ slug: { not: null } }, { slugId: { not: null } }],
        },
        select: {
          id: true,
          slug: true,
          slugId: true,
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

          // Update user (or log for dry run)
          if (this.options.dryRun) {
            this.log('info', `[DRY RUN] Would remove slug fields from user ${user.id}`, {
              currentSlug: user.slug,
              currentSlugId: user.slugId,
            });
          } else {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                slug: null,
                slugId: null,
              },
            });
            this.log('debug', `Removed slug fields from user ${user.id}`);
          }

          this.stats.usersRolledBack++;
        } catch (error) {
          this.log('error', `Failed to rollback user ${user.id}`, error);
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
      this.log('info', `Users rollback progress: ${processed}/${totalUsers} (${percentage}%)`);
    }

    this.log(
      'info',
      `Completed users rollback. Processed: ${this.stats.usersProcessed}, Rolled back: ${this.stats.usersRolledBack}`,
    );
  }

  /**
   * Validate rollback results
   */
  async validateRollback(): Promise<boolean> {
    this.log('info', 'Validating rollback results...');

    // Check for records with slug data
    const listingsWithSlugs = await prisma.listing.count({
      where: {
        OR: [{ slug: { not: null } }, { slugId: { not: null } }],
      },
    });

    const usersWithSlugs = await prisma.user.count({
      where: {
        OR: [{ slug: { not: null } }, { slugId: { not: null } }],
      },
    });

    const isValid = listingsWithSlugs === 0 && usersWithSlugs === 0;

    this.log('info', 'Rollback validation results:', {
      listingsWithSlugs,
      usersWithSlugs,
      isValid,
    });

    return isValid;
  }

  /**
   * Run the complete rollback process
   */
  async run(): Promise<void> {
    const startTime = Date.now();

    this.log('info', `Starting slug rollback...`, {
      dryRun: this.options.dryRun,
      batchSize: this.options.batchSize,
      createBackup: this.options.createBackup,
      logLevel: this.options.logLevel,
    });

    try {
      // Check database connectivity
      await prisma.$connect();
      this.log('info', 'Database connection established');

      // Create backup
      await this.createBackup();

      // Run rollback
      await this.rollbackListings();
      await this.rollbackUsers();

      // Post-rollback validation
      if (!this.options.dryRun) {
        const isValid = await this.validateRollback();
        if (!isValid) {
          throw new Error('Rollback validation failed');
        }
      }

      const duration = Date.now() - startTime;
      this.log('info', `Rollback completed successfully in ${duration}ms`, this.stats);
    } catch (error) {
      this.log('error', 'Rollback failed', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Get rollback statistics
   */
  getStats(): RollbackStats {
    return { ...this.stats };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  const options: Partial<RollbackOptions> = {
    dryRun: !args.includes('--execute'),
    batchSize: parseInt(
      args.find((arg) => arg.startsWith('--batch-size='))?.split('=')[1] || '100',
    ),
    createBackup: !args.includes('--no-backup'),
    logLevel:
      (args.find((arg) => arg.startsWith('--log-level='))?.split('=')[1] as
        | 'info'
        | 'debug'
        | 'error') || 'info',
  };

  if (options.dryRun) {
    console.log('🔍 RUNNING IN DRY-RUN MODE (no actual changes will be made)');
    console.log('💡 Use --execute flag to run the actual rollback');
  } else {
    console.log('⚠️  RUNNING IN EXECUTE MODE (changes will be made to the database)');
    console.log('🚨 THIS WILL REMOVE ALL SLUG DATA FROM THE DATABASE');
    console.log('⏱️  Starting in 10 seconds... Press Ctrl+C to cancel');
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }

  const rollbackService = new SlugRollbackService(options);
  await rollbackService.run();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Rollback failed:', error);
    process.exit(1);
  });
}

export { SlugRollbackService };
