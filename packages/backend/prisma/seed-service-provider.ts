import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function seedServiceProvider() {
  console.log('🌱 Seeding dummy service provider and services...');

  try {
    // Create dummy service provider tenant
    const serviceProvider = await prisma.tenant.upsert({
      where: { email: 'serviceprovider@example.com' },
      update: {},
      create: {
        name: 'Civil Engineering Solutions Ltd',
        type: 'service_provider',
        email: 'serviceprovider@example.com',
        phone: '+65 6123 4567',
        address: '123 Engineering Street, Singapore 123456',
        postalCode: '123456',
        status: 'active',
        isActive: true,
        metadata: {
          description: 'Professional civil engineering consultancy services',
          website: 'https://civilengsolutions.com',
        },
      },
    });

    console.log('✅ Created service provider:', serviceProvider.name);

    // Create admin user for service provider
    const passwordHash = await hashPassword('password123');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@serviceprovider.com' },
      update: {},
      create: {
        tenantId: serviceProvider.id,
        email: 'admin@serviceprovider.com',
        passwordHash,
        firstName: 'John',
        lastName: 'Engineer',
        role: 'service_provider_admin',
        status: 'active',
        isActive: true,
        permissions: { view: true, create: true, admin: true },
      },
    });

    console.log('✅ Created admin user:', adminUser.email);

    // Get service categories (assuming they're already seeded)
    const structuralDesign = await prisma.serviceCategory.findFirst({
      where: { name: 'Structural Design & Assessment' },
    });

    const architecture = await prisma.serviceCategory.findFirst({
      where: { name: 'Architecture & Visualisation' },
    });

    const estimation = await prisma.serviceCategory.findFirst({
      where: { name: 'Estimation & Quantity Surveying' },
    });

    const siteSupervision = await prisma.serviceCategory.findFirst({
      where: { name: 'Site Supervision & Quality Control' },
    });

    const projectManagement = await prisma.serviceCategory.findFirst({
      where: { name: 'Project Management & Planning' },
    });

    // Get subcategories
    const siteVisitSub = await prisma.serviceCategory.findFirst({
      where: { 
        name: 'Site Visit & Initial Structural Assessment',
        parentId: structuralDesign?.id,
      },
    });

    const houseDesignSub = await prisma.serviceCategory.findFirst({
      where: { 
        name: 'New House Structural Design (Low-Rise)',
        parentId: structuralDesign?.id,
      },
    });

    const archPlanningSub = await prisma.serviceCategory.findFirst({
      where: { 
        name: 'Architectural Planning & 2D Layout Drawings',
        parentId: architecture?.id,
      },
    });

    const estimationSub = await prisma.serviceCategory.findFirst({
      where: { 
        name: 'Estimation, BOQ & Costing',
        parentId: estimation?.id,
      },
    });

    const supervisionSub = await prisma.serviceCategory.findFirst({
      where: { 
        name: 'Construction Supervision & Quality Monitoring',
        parentId: siteSupervision?.id,
      },
    });

    const projectMgmtSub = await prisma.serviceCategory.findFirst({
      where: { 
        name: 'Project Management & Construction Scheduling',
        parentId: projectManagement?.id,
      },
    });

    // Create dummy services
    const services = [
      {
        sku: 'SVC-001',
        name: 'Site Visit & Initial Structural Assessment',
        description: 'Professional on-site structural assessment for residential and commercial buildings. Includes visual inspection, preliminary report, and recommendations.',
        serviceCategoryId: siteVisitSub?.id || null,
        unit: 'per visit',
        ratePerHour: 150.00,
        rateType: 'per_hour',
        type: 'service' as const,
      },
      {
        sku: 'SVC-002',
        name: 'New House Structural Design (Low-Rise)',
        description: 'Complete structural design services for new low-rise residential buildings. Includes foundation design, structural calculations, and detailed drawings.',
        serviceCategoryId: houseDesignSub?.id || null,
        unit: 'per project',
        ratePerHour: 200.00,
        rateType: 'per_project',
        type: 'service' as const,
      },
      {
        sku: 'SVC-003',
        name: 'Architectural Planning & 2D Layout Drawings',
        description: 'Professional architectural planning and 2D layout drawings for residential and commercial projects. Includes floor plans, elevations, and sections.',
        serviceCategoryId: archPlanningSub?.id || null,
        unit: 'per project',
        ratePerHour: 120.00,
        rateType: 'per_hour',
        type: 'service' as const,
      },
      {
        sku: 'SVC-004',
        name: 'Estimation, BOQ & Costing Services',
        description: 'Detailed quantity takeoff, bill of quantities (BOQ) preparation, and cost estimation for construction projects. Includes material and labor cost analysis.',
        serviceCategoryId: estimationSub?.id || null,
        unit: 'per project',
        ratePerHour: 100.00,
        rateType: 'per_hour',
        type: 'service' as const,
      },
      {
        sku: 'SVC-005',
        name: 'Construction Supervision & Quality Monitoring',
        description: 'On-site construction supervision and quality control services. Regular site visits, progress monitoring, and quality assurance reports.',
        serviceCategoryId: supervisionSub?.id || null,
        unit: 'per hour',
        ratePerHour: 80.00,
        rateType: 'per_hour',
        type: 'service' as const,
      },
      {
        sku: 'SVC-006',
        name: 'Project Management & Construction Scheduling',
        description: 'Comprehensive project management services including construction scheduling, resource planning, and progress tracking. Suitable for small to medium projects.',
        serviceCategoryId: projectMgmtSub?.id || null,
        unit: 'per project',
        ratePerHour: 5000.00,
        rateType: 'fixed',
        type: 'service' as const,
      },
      {
        sku: 'SVC-007',
        name: 'Renovation & Extension Feasibility Study',
        description: 'Detailed feasibility study for building renovations and extensions. Includes structural assessment, design recommendations, and cost estimates.',
        serviceCategoryId: structuralDesign?.id || null,
        unit: 'per project',
        ratePerHour: 2500.00,
        rateType: 'fixed',
        type: 'service' as const,
      },
      {
        sku: 'SVC-008',
        name: '3D Modeling & Visualisation Services',
        description: 'Professional 3D modeling and visualization for architectural and structural projects. Includes exterior and interior renderings, walkthroughs.',
        serviceCategoryId: architecture?.id || null,
        unit: 'per project',
        ratePerHour: 180.00,
        rateType: 'per_hour',
        type: 'service' as const,
      },
      {
        sku: 'SVC-009',
        name: 'Retrofitting & Structural Strengthening Design',
        description: 'Specialized design services for structural retrofitting and strengthening of existing buildings. Includes detailed engineering calculations and drawings.',
        serviceCategoryId: structuralDesign?.id || null,
        unit: 'per project',
        ratePerHour: 300.00,
        rateType: 'per_hour',
        type: 'service' as const,
      },
      {
        sku: 'SVC-010',
        name: 'Technical Second Opinion & Peer Review',
        description: 'Independent technical review and second opinion services for structural designs and construction projects. Expert analysis and recommendations.',
        serviceCategoryId: structuralDesign?.id || null,
        unit: 'per review',
        ratePerHour: 200.00,
        rateType: 'negotiable',
        type: 'service' as const,
      },
    ];

    // Create services
    for (const serviceData of services) {
      const service = await prisma.product.upsert({
        where: {
          supplierId_sku: {
            supplierId: serviceProvider.id,
            sku: serviceData.sku,
          },
        },
        update: {
          name: serviceData.name,
          description: serviceData.description,
          serviceCategoryId: serviceData.serviceCategoryId,
          unit: serviceData.unit,
          ratePerHour: serviceData.ratePerHour,
          rateType: serviceData.rateType,
          type: serviceData.type,
        },
        create: {
          supplierId: serviceProvider.id,
          sku: serviceData.sku,
          name: serviceData.name,
          description: serviceData.description,
          serviceCategoryId: serviceData.serviceCategoryId,
          unit: serviceData.unit,
          ratePerHour: serviceData.ratePerHour,
          rateType: serviceData.rateType,
          type: serviceData.type,
          isActive: true,
          metadata: {},
        },
      });

      console.log(`✅ Created service: ${service.name} (${service.sku})`);
    }

    console.log('✅ Successfully seeded service provider and services!');
  } catch (error) {
    console.error('❌ Error seeding service provider:', error);
    throw error;
  }
}

seedServiceProvider()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
