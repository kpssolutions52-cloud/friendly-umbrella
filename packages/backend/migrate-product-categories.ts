import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateProductCategories() {
  try {
    console.log('🔄 Starting migration of product categories to categories table...\n');

    // Get all distinct categories from products
    const products = await prisma.product.findMany({
      where: {
        category: { not: null },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    const productCategories = products
      .map((p) => p.category)
      .filter((c): c is string => c !== null && c.trim() !== '');

    if (productCategories.length === 0) {
      console.log('✅ No product categories found to migrate.');
      await prisma.$disconnect();
      return;
    }

    console.log(`📋 Found ${productCategories.length} unique categories in products:\n`);
    productCategories.forEach((cat, idx) => {
      console.log(`   ${idx + 1}. ${cat}`);
    });
    console.log('');

    // Get existing categories from categories table
    const existingCategories = await prisma.category.findMany({
      select: {
        name: true,
      },
    });

    const existingCategoryNames = new Set(existingCategories.map((c) => c.name.toLowerCase()));

    // Filter out categories that already exist (case-insensitive)
    const categoriesToAdd = productCategories.filter(
      (cat) => !existingCategoryNames.has(cat.toLowerCase())
    );

    if (categoriesToAdd.length === 0) {
      console.log('✅ All product categories already exist in the categories table.');
      await prisma.$disconnect();
      return;
    }

    console.log(`📝 Adding ${categoriesToAdd.length} new categories to categories table...\n`);

    // Add categories to the categories table
    let addedCount = 0;
    let skippedCount = 0;

    for (const categoryName of categoriesToAdd) {
      try {
        await prisma.category.create({
          data: {
            name: categoryName,
          },
        });
        console.log(`   ✅ Added: ${categoryName}`);
        addedCount++;
      } catch (error: any) {
        // Handle race condition or duplicate key errors
        if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
          console.log(`   ⚠️  Skipped (already exists): ${categoryName}`);
          skippedCount++;
        } else {
          console.error(`   ❌ Error adding "${categoryName}":`, error.message);
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Added: ${addedCount} categories`);
    console.log(`   ⚠️  Skipped: ${skippedCount} categories (already exist)`);
    console.log(`   📋 Total categories in database: ${(await prisma.category.count())} categories`);

    console.log('\n🎉 Migration completed successfully!');
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateProductCategories()
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
