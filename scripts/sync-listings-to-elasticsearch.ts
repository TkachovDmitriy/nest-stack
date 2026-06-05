import { Client } from '@elastic/elasticsearch';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

import { ListingMapper } from '@core/mappers/listing.mapper';

// Load environment variables
config();

interface SyncResult {
  totalListings: number;
  successfullyIndexed: number;
  failedIndexings: number;
  errors: string[];
  details: {
    activeListings: number;
    draftListings: number;
    publishedListings: number;
  };
}

class ElasticsearchListingsSync {
  private readonly esClient: Client;
  private readonly prisma: PrismaClient;
  private readonly listingMapper: ListingMapper;
  private readonly indexName: string;
  private readonly batchSize: number = 100;

  constructor() {
    if (!process.env.ELASTICSEARCH_NODE || !process.env.ELASTICSEARCH_API_KEY) {
      throw new Error(
        'ELASTICSEARCH_NODE and ELASTICSEARCH_API_KEY environment variables are required',
      );
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.esClient = new Client({
      node: process.env.ELASTICSEARCH_NODE,
      auth: {
        apiKey: process.env.ELASTICSEARCH_API_KEY,
      },
    });

    this.prisma = new PrismaClient();
    this.listingMapper = new ListingMapper();
    this.indexName = process.env.ELASTICSEARCH_INDEX_NAME || 'listings';
  }

  async syncAllListings(skipMappingUpdate: boolean = false): Promise<SyncResult> {
    const result: SyncResult = {
      totalListings: 0,
      successfullyIndexed: 0,
      failedIndexings: 0,
      errors: [],
      details: {
        activeListings: 0,
        draftListings: 0,
        publishedListings: 0,
      },
    };

    try {
      console.log('🚀 Starting Elasticsearch Listings Sync');
      console.log('========================================');

      // Get total count first
      const totalCount = await this.prisma.listing.count();
      result.totalListings = totalCount;

      console.log(`📊 Total listings in database: ${totalCount}`);

      if (totalCount === 0) {
        console.log('✅ No listings found in database. Sync completed.');
        return result;
      }

      // Get listing statistics
      await this.getListingStatistics(result);

      // Update Elasticsearch mapping to include slug fields (unless skipped)
      if (!skipMappingUpdate) {
        await this.updateSlugFieldsMapping();
      }

      // Clear existing index if requested
      if (process.env.CLEAR_INDEX === 'true') {
        await this.clearIndex();
      }

      // Sync listings in batches
      await this.syncListingsInBatches(result);

      // Get slug field statistics
      const listingsWithSlugs = await this.prisma.listing.count({
        where: {
          AND: [{ slug: { not: null } }, { slugId: { not: null } }],
        },
      });

      console.log('\n🎉 Sync completed successfully!');
      console.log('📊 Final Summary:');
      console.log(`   - Total listings processed: ${result.totalListings}`);
      console.log(`   - Successfully indexed: ${result.successfullyIndexed}`);
      console.log(`   - Failed indexings: ${result.failedIndexings}`);
      console.log(
        `   - Success rate: ${((result.successfullyIndexed / result.totalListings) * 100).toFixed(2)}%`,
      );
      console.log(`   - Listings with slug fields: ${listingsWithSlugs}/${result.totalListings}`);
      console.log(
        `   - Slug field coverage: ${((listingsWithSlugs / result.totalListings) * 100).toFixed(2)}%`,
      );

      if (result.errors.length > 0) {
        console.log(`❌ Errors encountered: ${result.errors.length}`);
        result.errors.slice(0, 10).forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
        if (result.errors.length > 10) {
          console.log(`   ... and ${result.errors.length - 10} more errors`);
        }
      }
    } catch (error) {
      console.error('💥 Fatal error during sync:', error);
      result.errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await this.prisma.$disconnect();
    }

    return result;
  }

  private async getListingStatistics(result: SyncResult): Promise<void> {
    console.log('📈 Getting listing statistics...');

    const [activeCount, draftCount, publishedCount] = await Promise.all([
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.listing.count({ where: { status: 'DRAFT' } }),
      this.prisma.listing.count({ where: { isPublished: true } }),
    ]);

    result.details.activeListings = activeCount;
    result.details.draftListings = draftCount;
    result.details.publishedListings = publishedCount;

    console.log(`   - Active listings: ${activeCount}`);
    console.log(`   - Draft listings: ${draftCount}`);
    console.log(`   - Published listings: ${publishedCount}`);
  }

  private async updateSlugFieldsMapping(): Promise<void> {
    console.log('🔧 Updating Elasticsearch mapping to include slug fields...');

    try {
      const indexExists = await this.esClient.indices.exists({
        index: this.indexName,
      });

      if (!indexExists) {
        console.log(`   ℹ️  Index ${this.indexName} does not exist, will be created during sync`);
        return;
      }

      // Define the slug fields mapping
      const slugFieldsMapping = {
        properties: {
          slug: {
            type: 'text' as const,
            fields: { keyword: { type: 'keyword' as const } },
          },
          slug_id: {
            type: 'text' as const,
            fields: { keyword: { type: 'keyword' as const } },
          },
        },
      };

      // Update the index mapping
      await this.esClient.indices.putMapping({
        index: this.indexName,
        properties: slugFieldsMapping.properties,
      });

      console.log('   ✅ Successfully updated index mapping with slug fields');
    } catch (error) {
      console.error(
        `   ❌ Failed to update mapping: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Don't throw error, continue with sync as the fields might already exist
      console.log(
        '   ⚠️  Continuing with sync - slug fields may already exist or will be added during indexing',
      );
    }
  }

  private async clearIndex(): Promise<void> {
    console.log('🗑️  Clearing existing Elasticsearch index...');

    try {
      const indexExists = await this.esClient.indices.exists({
        index: this.indexName,
      });

      if (indexExists) {
        await this.esClient.indices.delete({
          index: this.indexName,
        });
        console.log(`   ✅ Deleted existing index: ${this.indexName}`);
      } else {
        console.log(`   ℹ️  Index ${this.indexName} does not exist, skipping deletion`);
      }
    } catch (error) {
      console.error(
        `   ❌ Failed to clear index: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private async syncListingsInBatches(result: SyncResult): Promise<void> {
    console.log(`🔄 Starting batch sync (batch size: ${this.batchSize})...`);

    // Get all listing IDs from database
    const dbListingIds = await this.getAllDatabaseListingIds();
    console.log(`   📊 Found ${dbListingIds.length} listings in database`);

    // Get all document IDs from Elasticsearch
    const esDocumentIds = await this.getAllElasticsearchDocumentIds();
    console.log(`   📊 Found ${esDocumentIds.length} documents in Elasticsearch`);

    // Find orphaned documents (exist in ES but not in DB)
    const orphanedIds = esDocumentIds.filter((id) => !dbListingIds.includes(id));
    if (orphanedIds.length > 0) {
      console.log(`   🗑️  Found ${orphanedIds.length} orphaned documents to remove`);
      await this.removeOrphanedDocuments(orphanedIds, result);
    }

    // Sync database listings to Elasticsearch
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const listings = await this.fetchListingsBatch(skip, this.batchSize);

        if (listings.length === 0) {
          hasMore = false;
          break;
        }

        console.log(
          `   📦 Processing batch ${Math.floor(skip / this.batchSize) + 1}: ${listings.length} listings`,
        );

        // Log slug field statistics for this batch
        const listingsWithSlugs = listings.filter((l) => l.slug && l.slugId);
        if (listingsWithSlugs.length > 0) {
          console.log(
            `   🔗 ${listingsWithSlugs.length}/${listings.length} listings have slug fields`,
          );
        }

        // Transform listings to Elasticsearch format
        const documents = await this.transformListingsToElasticsearch(listings);

        // Index batch
        await this.indexBatch(documents, result);

        skip += this.batchSize;
        hasMore = listings.length === this.batchSize;
      } catch (error) {
        const errorMsg = `Failed to process batch starting at ${skip}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`   ❌ ${errorMsg}`);
        result.errors.push(errorMsg);
        result.failedIndexings += this.batchSize;

        // Continue with next batch
        skip += this.batchSize;
      }
    }
  }

  private async getAllDatabaseListingIds(): Promise<string[]> {
    const listings = await this.prisma.listing.findMany({
      select: { id: true },
    });
    return listings.map((listing) => listing.id);
  }

  private async getAllElasticsearchDocumentIds(): Promise<string[]> {
    const response = await this.esClient.search({
      index: this.indexName,
      size: 10000, // Adjust if you have more than 10k documents
      _source: false, // Don't fetch the actual documents, just IDs
      query: {
        match_all: {},
      },
    });

    return response.hits.hits.map((hit) => hit._id).filter((id): id is string => id !== undefined);
  }

  private async removeOrphanedDocuments(orphanedIds: string[], result: SyncResult): Promise<void> {
    console.log(`   🗑️  Removing ${orphanedIds.length} orphaned documents...`);

    try {
      // Process deletions in batches to avoid overwhelming Elasticsearch
      const batchSize = 100;
      for (let i = 0; i < orphanedIds.length; i += batchSize) {
        const batch = orphanedIds.slice(i, i + batchSize);

        const operations = batch.flatMap((id) => [{ delete: { _index: this.indexName, _id: id } }]);

        const response = await this.esClient.bulk({
          refresh: true,
          operations,
        });

        // Check for errors in bulk response
        if (response.errors) {
          const errors = response.items
            .filter((item: unknown) => (item as { delete?: { error?: unknown } }).delete?.error)
            .map((item: unknown) => {
              const deleteItem = item as { delete?: { _id?: string; error?: { reason?: string } } };
              return `ID ${deleteItem.delete?._id}: ${deleteItem.delete?.error?.reason}`;
            });

          result.errors.push(...errors);
          console.error(`   ❌ Failed to delete some documents: ${errors.length} errors`);
        }
      }

      console.log(`   ✅ Successfully removed ${orphanedIds.length} orphaned documents`);
    } catch (error) {
      const errorMsg = `Failed to remove orphaned documents: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`   ❌ ${errorMsg}`);
      result.errors.push(errorMsg);
    }
  }

  private async fetchListingsBatch(skip: number, take: number): Promise<any[]> {
    return this.prisma.listing.findMany({
      skip,
      take,
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
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  private async transformListingsToElasticsearch(listings: any[]): Promise<any[]> {
    return listings.map((listing) => {
      // Use the existing ListingMapper to transform to Elasticsearch format
      return this.listingMapper.toElasticsearchFormat(listing);
    });
  }

  private async indexBatch(documents: any[], result: SyncResult): Promise<void> {
    if (documents.length === 0) return;

    try {
      const operations = documents.flatMap((doc) => [
        { index: { _index: this.indexName, _id: doc.id } },
        doc,
      ]);

      const response = await this.esClient.bulk({
        refresh: true,
        operations,
      });

      // Check for errors in bulk response
      if (response.errors) {
        const errors = response.items
          .filter((item: any) => item.index?.error)
          .map((item: any) => `ID ${item.index?._id}: ${item.index?.error?.reason}`);

        result.errors.push(...errors);
        result.failedIndexings += errors.length;
        result.successfullyIndexed += documents.length - errors.length;
      } else {
        result.successfullyIndexed += documents.length;
      }
    } catch (error) {
      const errorMsg = `Bulk indexing failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`   ❌ ${errorMsg}`);
      result.errors.push(errorMsg);
      result.failedIndexings += documents.length;
    }
  }

  async validateSync(): Promise<void> {
    console.log('🔍 Validating sync results...');

    try {
      // Check total documents in Elasticsearch
      const esCount = await this.esClient.count({
        index: this.indexName,
      });

      const dbCount = await this.prisma.listing.count();

      console.log(`   📊 Database listings: ${dbCount}`);
      console.log(`   📊 Elasticsearch documents: ${esCount.count}`);

      if (esCount.count === dbCount) {
        console.log('   ✅ Sync validation successful - counts match!');
      } else {
        console.log(
          `   ⚠️  Sync validation warning - counts don't match (diff: ${Math.abs(esCount.count - dbCount)})`,
        );
      }

      // Check sample documents
      const sampleResponse = await this.esClient.search({
        index: this.indexName,
        size: 5,
        query: {
          match_all: {},
        },
      });

      console.log(`   📋 Sample documents found: ${sampleResponse.hits.hits.length}`);

      // Check for slug fields in sample documents
      if (sampleResponse.hits.hits.length > 0) {
        const sampleDoc = sampleResponse.hits.hits[0]._source as any;
        if (sampleDoc.slug || sampleDoc.slug_id) {
          console.log('   ✅ Slug fields found in indexed documents');
          console.log(`   📋 Sample slug: ${sampleDoc.slug || 'N/A'}`);
          console.log(`   📋 Sample slug_id: ${sampleDoc.slug_id || 'N/A'}`);
        } else {
          console.log('   ⚠️  Slug fields not found in sample documents');
        }
      }
    } catch (error) {
      console.error('   ❌ Validation failed:', error);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Elasticsearch Listings Sync Script');
  console.log('==============================================');

  // Check command line arguments
  const args = process.argv.slice(2);
  const skipMappingUpdate = args.includes('--skip-mapping-update');
  const showHelp = args.includes('--help') || args.includes('-h');

  if (showHelp) {
    console.log('Usage: npm run sync:elasticsearch-listings [options]');
    console.log('');
    console.log('Options:');
    console.log('  --skip-mapping-update  Skip updating Elasticsearch mapping with slug fields');
    console.log('  --help, -h            Show this help message');
    console.log('');
    console.log('Environment Variables:');
    console.log('  CLEAR_INDEX=true      Clear existing index before syncing');
    console.log('  ELASTICSEARCH_NODE    Elasticsearch node URL');
    console.log('  ELASTICSEARCH_API_KEY Elasticsearch API key');
    console.log('  ELASTICSEARCH_INDEX_NAME Index name (default: listings)');
    console.log('  DATABASE_URL          Database connection URL');
    console.log('');
    console.log('Examples:');
    console.log('  npm run sync:elasticsearch-listings');
    console.log('  CLEAR_INDEX=true npm run sync:elasticsearch-listings');
    console.log('  npm run sync:elasticsearch-listings -- --skip-mapping-update');
    process.exit(0);
  }

  if (skipMappingUpdate) {
    console.log('⚠️  Skipping mapping update (--skip-mapping-update flag provided)');
  }

  const sync = new ElasticsearchListingsSync();

  try {
    // Perform sync
    const _result = await sync.syncAllListings(skipMappingUpdate);

    // Validate sync
    await sync.validateSync();

    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

export { ElasticsearchListingsSync };
