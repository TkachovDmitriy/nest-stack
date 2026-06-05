import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config();

interface UpdateResult {
  totalUpdated: number;
  errors: string[];
  details: {
    listingTypeUpdates: number;
    propertyTypeUpdates: number;
    entityTypeUpdates: number;
  };
}

class DatabaseFieldUpdater {
  private readonly prisma: PrismaClient;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.prisma = new PrismaClient();
  }

  async updateFields(): Promise<UpdateResult> {
    const result: UpdateResult = {
      totalUpdated: 0,
      errors: [],
      details: {
        listingTypeUpdates: 0,
        propertyTypeUpdates: 0,
        entityTypeUpdates: 0,
      },
    };

    try {
      console.log('🚀 Starting Database Field Updates');
      console.log('==================================');

      // 1. Update listing_type values
      await this.updateListingTypes(result);

      await this.updateEntityTypes(result);

      console.log(`✅ Update completed successfully!`);
      console.log(`📊 Summary:`);
      console.log(`   - Total documents updated: ${result.totalUpdated}`);
      console.log(`   - Listing type updates: ${result.details.listingTypeUpdates}`);
      console.log(`   - Property type updates: ${result.details.propertyTypeUpdates}`);
      console.log(`   - Entity type updates: ${result.details.entityTypeUpdates}`);

      if (result.errors.length > 0) {
        console.log(`❌ Errors encountered: ${result.errors.length}`);
        result.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
    } catch (error) {
      console.error('❌ Fatal error during update:', error);
      result.errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await this.prisma.$disconnect();
    }

    return result;
  }

  private async updateListingTypes(result: UpdateResult): Promise<void> {
    console.log('🔄 Updating listing_type values...');

    // First, let's see what values actually exist
    const listingTypeDef = await this.prisma.attributeDefinition.findFirst({
      where: { key: 'listing_type' },
    });

    if (!listingTypeDef) {
      console.log(`   ⚠️  No attribute definition found for 'listing_type'`);
      return;
    }

    // Check existing values
    const existingValues = await this.prisma.attributeValue.findMany({
      where: {
        attributeDefinitionId: listingTypeDef.id,
      },
    });

    console.log(`   📋 Found ${existingValues.length} existing listing_type values:`);
    existingValues.forEach((val, index) => {
      console.log(`      ${index + 1}. ${JSON.stringify(val.values)}`);
    });

    const listingTypeMappings = {
      'for rent': 'Rent Property',
      'for sale': 'Sell Property',
      'For rent': 'Rent Property',
      'For sale': 'Sell Property',
    };

    for (const [oldValue, newValue] of Object.entries(listingTypeMappings)) {
      try {
        // Update attribute values - try both exact match and array contains
        const updateResult = await this.prisma.attributeValue.updateMany({
          where: {
            attributeDefinitionId: listingTypeDef.id,
            OR: [
              { values: { has: oldValue } },
              { values: { equals: [oldValue] } }, // exact array match
            ],
          },
          data: {
            values: [newValue],
          },
        });

        const updatedCount = updateResult.count;
        result.details.listingTypeUpdates += updatedCount;
        result.totalUpdated += updatedCount;

        console.log(`   ✅ Updated ${updatedCount} documents: "${oldValue}" → "${newValue}"`);
      } catch (error) {
        const errorMsg = `Failed to update listing_type "${oldValue}": ${error instanceof Error ? error.message : String(error)}`;
        console.error(`   ❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }
  }

  private async updateEntityTypes(result: UpdateResult): Promise<void> {
    console.log('🔄 Updating entity_type for staycation conditions...');

    try {
      // Find listings where entity_type is RENT and lease_duration is Daily
      const listingsToUpdate = await this.prisma.listing.findMany({
        where: {
          entityType: 'RENT',
          leaseDuration: 'DAILY',
        },
        include: {
          attributes: {
            include: {
              definition: true,
            },
          },
        },
      });

      let updatedCount = 0;

      for (const listing of listingsToUpdate) {
        try {
          // Update entity_type to STAYCATION
          await this.prisma.listing.update({
            where: { id: listing.id },
            data: {
              entityType: 'STAYCATION',
            },
          });

          // Find and update listing_type attribute to "Staycation"
          const listingTypeAttr = listing.attributes.find(
            (attr) => attr.definition.key === 'listing_type',
          );

          if (listingTypeAttr) {
            await this.prisma.attributeValue.update({
              where: { id: listingTypeAttr.id },
              data: {
                values: ['staycation'],
              },
            });
          } else {
            // Create listing_type attribute if it doesn't exist
            const listingTypeDef = await this.prisma.attributeDefinition.findFirst({
              where: { key: 'listing_type' },
            });

            if (listingTypeDef) {
              await this.prisma.attributeValue.create({
                data: {
                  listingId: listing.id,
                  attributeDefinitionId: listingTypeDef.id,
                  values: ['staycation'],
                },
              });
            }
          }

          updatedCount++;
        } catch (error) {
          console.error(`   ❌ Failed to update listing ${listing.id}: ${error}`);
        }
      }

      result.details.entityTypeUpdates += updatedCount;
      result.totalUpdated += updatedCount;

      console.log(
        `   ✅ Updated ${updatedCount} documents: entity_type "RENT" → "STAYCATION" and listing_type → ["Staycation"] (where lease_duration = "Daily")`,
      );
    } catch (error) {
      const errorMsg = `Failed to update entity_type for staycation: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`   ❌ ${errorMsg}`);
      result.errors.push(errorMsg);
    }
  }

  async validateUpdates(): Promise<void> {
    console.log('🔍 Validating updates...');

    try {
      // Check listing_type updates
      const listingTypeDef = await this.prisma.attributeDefinition.findFirst({
        where: { key: 'listing_type' },
      });

      if (listingTypeDef) {
        const updatedListingTypes = await this.prisma.attributeValue.findMany({
          where: {
            attributeDefinitionId: listingTypeDef.id,
            OR: [
              { values: { has: 'Rent Property' } },
              { values: { has: 'Sell Property' } },
              { values: { has: 'Staycation' } },
            ],
          },
        });

        console.log(
          `   ✅ Found ${updatedListingTypes.length} documents with updated listing_type values`,
        );
      }

      // Check entity_type staycation
      const staycationListings = await this.prisma.listing.count({
        where: {
          entityType: 'STAYCATION',
        },
      });

      console.log(`   ✅ Found ${staycationListings} documents with entity_type "STAYCATION"`);
    } catch (error) {
      console.error('   ❌ Validation failed:', error);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Database Field Update Script');
  console.log('========================================');

  const updater = new DatabaseFieldUpdater();

  try {
    // Perform updates
    const _result = await updater.updateFields();

    // Validate updates
    await updater.validateUpdates();

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

export { DatabaseFieldUpdater };
