import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Service categories structure based on Civil Consultancy & Part-Time Job Categories
const serviceCategoriesData = [
  // A. Civil Consultancy Service Categories
  {
    name: 'Structural Design & Assessment',
    description: 'Structural design, assessment, and analysis services',
    subcategories: [
      'Site Visit & Initial Structural Assessment',
      'New House Structural Design (Low-Rise)',
      'Renovation & Extension Feasibility Study',
      'Retrofitting & Structural Strengthening Design',
      'Soil Testing & Foundation Recommendation (Coordination)',
      'Technical Second Opinion & Peer Review',
    ],
  },
  {
    name: 'Architecture & Visualisation',
    description: 'Architectural planning and visualization services',
    subcategories: [
      'Architectural Planning & 2D Layout Drawings',
      '3D Modeling & Visualisation (Exterior & Interior)',
    ],
  },
  {
    name: 'Estimation & Quantity Surveying',
    description: 'Cost estimation and quantity surveying services',
    subcategories: [
      'Estimation, BOQ & Costing',
    ],
  },
  {
    name: 'Site Supervision & Quality Control',
    description: 'Construction supervision and quality monitoring services',
    subcategories: [
      'Construction Supervision & Quality Monitoring',
    ],
  },
  {
    name: 'Approvals & Regulatory Services',
    description: 'Approval drawings and regulatory submission services',
    subcategories: [
      'Approval Drawings & Local Authority Submissions',
    ],
  },
  {
    name: 'Land Survey & Setting Out',
    description: 'Land surveying and setting out coordination services',
    subcategories: [
      'Land Surveying & Setting Out (Coordination Service)',
    ],
  },
  {
    name: 'Water, Drainage & Infrastructure Design',
    description: 'Water, drainage, and infrastructure design services',
    subcategories: [
      'Drainage, Stormwater & Septic System Design',
      'Road, Driveway & Pavement Design',
    ],
  },
  {
    name: 'Project Management & Planning',
    description: 'Project management and construction scheduling services',
    subcategories: [
      'Project Management & Construction Scheduling',
    ],
  },
  // B. Part-Time / Freelance Civil Job Categories
  {
    name: 'Site-Based Roles',
    description: 'Part-time and freelance site-based positions',
    subcategories: [
      'Part-Time Site Supervisor (House / Small Projects)',
      'Junior Site Engineer (Evening / Weekend Support)',
      'Part-Time Land Survey Assistant',
      'Health & Safety (HSE) Inspector – Part-Time',
      'Site Measurement & As-Built Drawing Assistant',
    ],
  },
  {
    name: 'Design & Draughting',
    description: 'Freelance design and drafting services',
    subcategories: [
      'Freelance AutoCAD / Revit Draughtsman',
      'Freelance Structural Design Assistant',
      'Freelance 3D Visualiser & Walkthrough Creator',
    ],
  },
  {
    name: 'Quantity Surveying & Estimation',
    description: 'Part-time quantity surveying and estimation services',
    subcategories: [
      'Part-Time Quantity Surveyor / Estimator',
    ],
  },
  {
    name: 'Coordination & Back-Office Support',
    description: 'Remote coordination and back-office support services',
    subcategories: [
      'Project Coordinator (Remote)',
      'Procurement & Material Sourcing Assistant',
      'Document & Drawing Controller (Remote)',
      'Customer Support & Technical Help Desk',
    ],
  },
  {
    name: 'Education & Content Creation',
    description: 'Education and content creation services',
    subcategories: [
      'Civil Engineering Tutor / Mentor (Online)',
      'Content Creator – Civil Tips & Guides',
    ],
  },
];

async function seedServiceCategories() {
  console.log('🌱 Seeding service categories...');

  for (const categoryData of serviceCategoriesData) {
    // Create main category
    const mainCategory = await prisma.serviceCategory.upsert({
      where: {
        name_parentId: {
          name: categoryData.name,
          parentId: null,
        },
      },
      update: {
        description: categoryData.description,
        isActive: true,
      },
      create: {
        name: categoryData.name,
        description: categoryData.description,
        isActive: true,
        displayOrder: 0,
      },
    });

    console.log(`✅ Created/Updated main category: ${mainCategory.name}`);

    // Create subcategories
    for (let i = 0; i < categoryData.subcategories.length; i++) {
      const subcategoryName = categoryData.subcategories[i];
      const subcategory = await prisma.serviceCategory.upsert({
        where: {
          name_parentId: {
            name: subcategoryName,
            parentId: mainCategory.id,
          },
        },
        update: {
          isActive: true,
          displayOrder: i,
        },
        create: {
          name: subcategoryName,
          parentId: mainCategory.id,
          isActive: true,
          displayOrder: i,
        },
      });

      console.log(`  ✅ Created/Updated subcategory: ${subcategory.name}`);
    }
  }

  console.log('✨ Service categories seeding completed!');
}

seedServiceCategories()
  .catch((e) => {
    console.error('❌ Error seeding service categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
