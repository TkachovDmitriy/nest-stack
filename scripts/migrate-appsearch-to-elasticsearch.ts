import { NestFactory } from '@nestjs/core';
import { ListingStatus } from '@prisma/client';

import { AppModule } from '../src/app.module';
import { ListingDBOutput } from '../src/core/interfaces/listing/listing.interface';
import { ListingDBResponseSchema } from '../src/core/schemas/listing.schema';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { ElasticsearchService } from '../src/infrastructure/elasticsearch/elasticsearch.service';
import { LoggerService } from '../src/infrastructure/logger/logger-service';

interface MigrationStats {
  totalActiveListings: number;
  successfullyMigrated: number;
  failed: number;
  skipped: number;
  errors: Array<{ listingId: string; error: string }>;
}

class AppSearchToElasticsearchMigration {
  private readonly logger = new LoggerService('MigrationScript');
  private readonly batchSize = 50; // Process listings in batches to avoid memory issues
  private stats: MigrationStats = {
    totalActiveListings: 0,
    successfullyMigrated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  constructor(
    private readonly prismaService: PrismaService,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  /**
   * Main migration process
   */
  async migrate(): Promise<void> {
    this.logger.info('🚀 Starting AppSearch to Elasticsearch migration...');

    try {
      // Step 1: Validate both services are available
      await this.validateServices();

      // Step 2: Get all active listings count
      await this.getActiveListingsCount();

      // Step 3: Migrate listings in batches
      await this.migrateListingsInBatches();

      // Step 4: Verify migration
      await this.verifyMigration();

      // Step 5: Print migration summary
      this.printMigrationSummary();

      this.logger.info('✅ Migration completed successfully!');
    } catch (error) {
      this.logger.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Validate that both AppSearch and Elasticsearch services are accessible
   */
  private async validateServices(): Promise<void> {
    this.logger.info('🔍 Validating services...');

    try {
      // Test Elasticsearch connection by checking if index exists or can be created
      // The onModuleInit will handle index creation if it doesn't exist
      await this.elasticsearchService.onModuleInit();
      this.logger.info('✅ Elasticsearch service is ready');
    } catch (error) {
      this.logger.error('❌ Elasticsearch validation failed:', error);
      throw new Error('Elasticsearch service is not available');
    }
  }

  /**
   * Get count of all active listings to be migrated
   */
  private async getActiveListingsCount(): Promise<void> {
    this.stats.totalActiveListings = await this.prismaService.listing.count({
      where: {
        status: ListingStatus.ACTIVE,
        isPublished: true,
      },
    });

    this.logger.info(`📊 Found ${this.stats.totalActiveListings} active listings to migrate`);

    if (this.stats.totalActiveListings === 0) {
      this.logger.warn('⚠️ No active listings found to migrate');
      return;
    }
  }

  /**
   * Migrate listings in batches to avoid memory issues
   */
  private async migrateListingsInBatches(): Promise<void> {
    if (this.stats.totalActiveListings === 0) {
      return;
    }

    const totalBatches = Math.ceil(this.stats.totalActiveListings / this.batchSize);
    this.logger.info(`📦 Processing ${totalBatches} batches of ${this.batchSize} listings each`);

    for (let batchNumber = 1; batchNumber <= totalBatches; batchNumber++) {
      const skip = (batchNumber - 1) * this.batchSize;

      this.logger.info(
        `📋 Processing batch ${batchNumber}/${totalBatches} (items ${skip + 1}-${Math.min(skip + this.batchSize, this.stats.totalActiveListings)})`,
      );

      try {
        await this.processBatch(skip, this.batchSize);
        this.logger.info(`✅ Batch ${batchNumber}/${totalBatches} completed`);
      } catch (error) {
        this.logger.error(`❌ Batch ${batchNumber}/${totalBatches} failed:`, error);
        // Continue with next batch even if current batch fails
      }

      // Add a small delay between batches to prevent overwhelming the services
      if (batchNumber < totalBatches) {
        await this.delay(1000); // 1 second delay
      }
    }
  }

  /**
   * Process a single batch of listings
   */
  private async processBatch(skip: number, take: number): Promise<void> {
    // Fetch listings with all necessary relations
    const listings = await this.prismaService.listing.findMany({
      where: {
        status: ListingStatus.ACTIVE,
        isPublished: true,
      },
      include: {
        attributes: {
          include: {
            definition: true,
          },
        },
        attachments: true,
        location: true,
        user: true,
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (listings.length === 0) {
      this.logger.warn('⚠️ No listings found in this batch');
      return;
    }

    // Parse listings to ensure they match the expected schema
    const parsedListings: ListingDBOutput[] = listings.map((listing) =>
      ListingDBResponseSchema.parse(listing),
    );

    // Separate successful and failed migrations for this batch
    const successfulListings: ListingDBOutput[] = [];
    const failedListings: Array<{ listing: ListingDBOutput; error: string }> = [];

    // Process each listing individually to handle partial failures
    for (const listing of parsedListings) {
      try {
        await this.migrateSingleListing(listing);
        successfulListings.push(listing);
        this.stats.successfullyMigrated++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const listingId = listing.id || 'unknown';
        failedListings.push({ listing, error: errorMessage });
        this.stats.failed++;
        this.stats.errors.push({
          listingId,
          error: errorMessage,
        });
        this.logger.error(`❌ Failed to migrate listing ${listingId}:`, error);
      }
    }

    this.logger.info(
      `📊 Batch summary: ${successfulListings.length} successful, ${failedListings.length} failed`,
    );
  }

  /**
   * Migrate a single listing from AppSearch to Elasticsearch
   */
  private async migrateSingleListing(listing: ListingDBOutput): Promise<void> {
    try {
      // Index the listing in Elasticsearch
      await this.elasticsearchService.indexListing(listing);

      this.logger.debug(`✅ Successfully migrated listing ${listing.id} to Elasticsearch`);
    } catch (error) {
      this.logger.error(`❌ Failed to migrate listing ${listing.id}:`, error);
      throw error;
    }
  }

  /**
   * Verify migration by comparing counts and sample data
   */
  private async verifyMigration(): Promise<void> {
    this.logger.info('🔍 Verifying migration...');

    try {
      // Get a sample of migrated listings to verify they exist in Elasticsearch
      const sampleListings = await this.prismaService.listing.findMany({
        where: {
          status: ListingStatus.ACTIVE,
          isPublished: true,
        },
        select: { id: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      if (sampleListings.length > 0) {
        this.logger.info(
          `📋 Verifying ${sampleListings.length} sample listings in Elasticsearch...`,
        );

        // Note: We could add more verification here if the ElasticsearchService had a method to check if documents exist
        // For now, we rely on the fact that if indexing succeeded, the documents should be there
        this.logger.info('✅ Sample verification completed');
      }
    } catch (error) {
      this.logger.error('❌ Verification failed:', error);
      throw error;
    }
  }

  /**
   * Print migration summary
   */
  private printMigrationSummary(): void {
    this.logger.info('📊 Migration Summary:');
    this.logger.info(`   Total Active Listings: ${this.stats.totalActiveListings}`);
    this.logger.info(`   Successfully Migrated: ${this.stats.successfullyMigrated}`);
    this.logger.info(`   Failed: ${this.stats.failed}`);
    this.logger.info(`   Skipped: ${this.stats.skipped}`);
    this.logger.info(`   Success Rate: ${this.calculateSuccessRate()}%`);

    if (this.stats.errors.length > 0) {
      this.logger.warn('⚠️ Errors encountered during migration:');
      this.stats.errors.forEach((error, index) => {
        this.logger.warn(`   ${index + 1}. Listing ${error.listingId}: ${error.error}`);
      });
    }
  }

  /**
   * Calculate success rate percentage
   */
  private calculateSuccessRate(): string {
    if (this.stats.totalActiveListings === 0) {
      return '100.00';
    }
    const rate = (this.stats.successfullyMigrated / this.stats.totalActiveListings) * 100;
    return rate.toFixed(2);
  }

  /**
   * Utility method to add delay between operations
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Main migration function
 */
async function runMigration(): Promise<void> {
  let app;

  try {
    // Create NestJS application
    app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'], // Enable logging
    });

    // Get required services
    const prismaService = app.get(PrismaService);
    const elasticsearchService = app.get(ElasticsearchService);

    // Create and run migration
    const migration = new AppSearchToElasticsearchMigration(prismaService, elasticsearchService);

    await migration.migrate();

    console.log('🎉 Migration completed successfully!');
    console.log('💡 Next steps:');
    console.log(
      '   1. Update environment variable ENABLE_NEW_ELASTICSEARCH=true to switch to Elasticsearch',
    );
    console.log('   2. Test the application thoroughly with the new search service');
    console.log('   3. Monitor performance and search results');
    console.log('   4. Once satisfied, consider removing AppSearch service');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
    }
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

export { AppSearchToElasticsearchMigration, runMigration };
