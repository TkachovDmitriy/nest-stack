import { PrismaClient, EntityType, ListingStatus } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

async function updateStaycationPriceWithoutCommission(): Promise<void> {
  try {
    console.log('🚀 Starting staycation price migration...');

    // Find all active staycation listings that don't have priceWithoutCommission set
    const staycationListings = await prisma.listing.findMany({
      where: {
        entityType: EntityType.STAYCATION,
        status: ListingStatus.ACTIVE,
        priceWithoutCommission: null,
      },
      select: {
        id: true,
        price: true,
        priceWithoutCommission: true,
        slug: true,
        slugId: true,
        attributes: {
          select: {
            values: true,
            definition: {
              select: {
                key: true,
              },
            },
          },
        },
      },
    });

    console.log(
      `📊 Found ${staycationListings.length} active staycation listings without priceWithoutCommission`,
    );

    if (staycationListings.length === 0) {
      console.log('✅ No staycation listings need updating. All done!');
      return;
    }

    // Update each listing
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const listing of staycationListings) {
      try {
        let priceValue: number | null = null;

        // First, try to get price from the direct price field
        if (listing.price !== null) {
          priceValue = listing.price;
          console.log(`💰 Found price in direct field: ${priceValue} for listing ${listing.id}`);
        } else {
          // If no direct price, look for price in attributes
          const priceAttribute = listing.attributes.find((attr) => attr.definition.key === 'price');
          if (priceAttribute && priceAttribute.values.length > 0) {
            const priceString = priceAttribute.values[0];
            const parsedPrice = parseFloat(priceString);
            if (!isNaN(parsedPrice)) {
              priceValue = parsedPrice;
              console.log(`💰 Found price in attributes: ${priceValue} for listing ${listing.id}`);
            }
          }
        }

        if (priceValue === null) {
          skippedCount++;
          console.log(
            `⚠️  Skipping listing ${listing.id} (${listing.slugId || 'no-slug'}) - no price found in direct field or attributes`,
          );
          continue;
        }

        // Update both price and priceWithoutCommission fields
        const updateData: {
          priceWithoutCommission: number;
          price?: number;
        } = {
          priceWithoutCommission: priceValue,
        };

        // If price field is null but we found it in attributes, also update the price field
        if (listing.price === null) {
          updateData.price = priceValue;
        }

        await prisma.listing.update({
          where: { id: listing.id },
          data: updateData,
        });

        updatedCount++;
        console.log(
          `✅ Updated listing ${listing.id} (${listing.slugId || 'no-slug'}) - price: ${updateData.price || listing.price}, priceWithoutCommission: ${priceValue}`,
        );
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating listing ${listing.id}:`, error);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} listings`);
    console.log(`⚠️  Skipped (no price found): ${skippedCount} listings`);
    console.log(`❌ Errors: ${errorCount} listings`);
    console.log(`📊 Total processed: ${staycationListings.length} listings`);

    // Verify the update
    const remainingListings = await prisma.listing.count({
      where: {
        entityType: EntityType.STAYCATION,
        priceWithoutCommission: null,
      },
    });

    if (remainingListings === 0) {
      console.log('🎉 All staycation listings now have priceWithoutCommission set!');
    } else {
      console.log(
        `⚠️  ${remainingListings} staycation listings still need priceWithoutCommission (likely no price data available)`,
      );
    }
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  updateStaycationPriceWithoutCommission()
    .then(() => {
      console.log('🏁 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { updateStaycationPriceWithoutCommission };
