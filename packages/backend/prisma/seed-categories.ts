import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categoriesData = [
  {
    name: 'Cement & Concrete Materials',
    description: 'Cement, concrete, and related materials',
    subcategories: [
      'Cement',
      'Ready-mix concrete',
      'Sand, gravel, aggregates',
      'Mortar mix, plaster mix',
    ],
  },
  {
    name: 'Steel & Metal Materials',
    description: 'Steel and metal construction materials',
    subcategories: [
      'Reinforcement steel (rebar)',
      'Structural steel (I-beam, H-beam, channels, angles)',
      'Steel plates, sheets',
      'GI sheets',
    ],
  },
  {
    name: 'Bricks, Blocks & Masonry',
    description: 'Bricks, blocks, and masonry products',
    subcategories: [
      'Clay bricks',
      'Cement blocks',
      'AAC blocks',
      'Paving blocks',
      'Stone / masonry blocks',
    ],
  },
  {
    name: 'Timber & Wood Products',
    description: 'Timber and wood-based products',
    subcategories: [
      'Timber / lumber',
      'Plywood',
      'MDF, chipboard',
      'Formwork wood',
      'Doors / frames',
    ],
  },
  {
    name: 'Roofing Materials',
    description: 'Roofing materials and accessories',
    subcategories: [
      'Roof sheets (metal, zinc, GI, aluminum)',
      'Roof tiles',
      'Shingles',
      'Purlins',
    ],
  },
  {
    name: 'Plumbing & Sanitary',
    description: 'Plumbing and sanitary products',
    subcategories: [
      'PVC pipes & fittings',
      'GI pipes',
      'Water tanks',
      'Taps, sinks, WC, bathroom items',
    ],
  },
  {
    name: 'Electrical Materials',
    description: 'Electrical materials and components',
    subcategories: [
      'Cables & wiring',
      'Switches, sockets',
      'Breakers, DB box',
      'Conduits, trunking',
    ],
  },
  {
    name: 'Flooring Materials',
    description: 'Flooring materials and products',
    subcategories: [
      'Floor tiles',
      'Ceramic / porcelain tiles',
      'Vinyl flooring',
      'Wood flooring',
    ],
  },
  {
    name: 'Paints & Finishing Materials',
    description: 'Paints and finishing materials',
    subcategories: [
      'Paint, primer, putty',
      'Varnish',
      'Adhesives & chemicals',
    ],
  },
  {
    name: 'Glass, Windows & Doors',
    description: 'Glass, windows, and door products',
    subcategories: [
      'Glass panels',
      'Aluminum frames',
      'Doors, windows',
      'Shower screens',
    ],
  },
  {
    name: 'Hardware & Tools',
    description: 'Hardware and construction tools',
    subcategories: [
      'Nails, screws, bolts',
      'Hand tools',
      'Power tools',
      'Safety gear',
    ],
  },
  {
    name: 'Waterproofing & Insulation',
    description: 'Waterproofing and insulation materials',
    subcategories: [
      'Membranes',
      'Waterproof coatings',
      'Insulation boards',
      'Rockwool / glasswool',
    ],
  },
  {
    name: 'Landscaping & Outdoor Materials',
    description: 'Landscaping and outdoor construction materials',
    subcategories: [
      'Pavers',
      'Garden stones',
      'Fencing materials',
    ],
  },
];

async function seedCategories() {
  console.log('🌱 Starting category seed...');

  // Clear existing categories (optional - comment out if you want to keep existing)
  // await prisma.productCategory.deleteMany({});

  let displayOrder = 0;

  for (const categoryData of categoriesData) {
    // Find or create main category
    let mainCategory = await prisma.productCategory.findFirst({
      where: {
        name: categoryData.name,
        parentId: null,
      },
    });

    if (mainCategory) {
      // Update existing main category
      mainCategory = await prisma.productCategory.update({
        where: { id: mainCategory.id },
        data: {
          description: categoryData.description,
          displayOrder: displayOrder++,
          isActive: true,
        },
      });
      console.log(`✅ Updated main category: ${mainCategory.name}`);
    } else {
      // Create new main category
      mainCategory = await prisma.productCategory.create({
        data: {
          name: categoryData.name,
          description: categoryData.description,
          displayOrder: displayOrder++,
          isActive: true,
          parentId: null,
        },
      });
      console.log(`✅ Created main category: ${mainCategory.name}`);
    }

    // Create subcategories
    let subDisplayOrder = 0;
    for (const subcategoryName of categoryData.subcategories) {
      let subcategory = await prisma.productCategory.findFirst({
        where: {
          name: subcategoryName,
          parentId: mainCategory.id,
        },
      });

      if (subcategory) {
        // Update existing subcategory
        subcategory = await prisma.productCategory.update({
          where: { id: subcategory.id },
          data: {
            displayOrder: subDisplayOrder++,
            isActive: true,
          },
        });
        console.log(`  ✅ Updated subcategory: ${subcategoryName}`);
      } else {
        // Create new subcategory
        subcategory = await prisma.productCategory.create({
          data: {
            name: subcategoryName,
            parentId: mainCategory.id,
            displayOrder: subDisplayOrder++,
            isActive: true,
          },
        });
        console.log(`  ✅ Created subcategory: ${subcategoryName}`);
      }
    }
  }

  console.log('✅ Category seed completed!');
}

seedCategories()
  .catch((e) => {
    console.error('❌ Error seeding categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

