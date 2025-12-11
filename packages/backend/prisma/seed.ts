import { PrismaClient, TenantType, UserRole, TenantStatus, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create super admin first
  const superAdminPasswordHash = await bcrypt.hash('admin123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@system.com' },
    update: {},
    create: {
      email: 'admin@system.com',
      passwordHash: superAdminPasswordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.super_admin,
      status: UserStatus.active,
      isActive: true,
      tenantId: null, // Super admin has no tenant
    },
  });

  console.log('✅ Created super admin user');

  // Create a sample supplier (active, pre-approved for seed)
  const supplier = await prisma.tenant.upsert({
    where: { email: 'supplier@example.com' },
    update: {},
    create: {
      name: 'ABC Materials Supplier',
      type: TenantType.supplier,
      email: 'supplier@example.com',
      phone: '+1234567890',
      address: '123 Supplier St, City, State',
      status: TenantStatus.active,
      isActive: true,
    },
  });

  console.log('✅ Created supplier tenant:', supplier.name);

  // Create supplier admin user (active, pre-approved for seed)
  const supplierPasswordHash = await bcrypt.hash('password123', 12);
  const supplierAdmin = await prisma.user.upsert({
    where: { email: 'supplier@example.com' },
    update: {},
    create: {
      tenantId: supplier.id,
      email: 'supplier@example.com',
      passwordHash: supplierPasswordHash,
      firstName: 'Supplier',
      lastName: 'Admin',
      role: UserRole.supplier_admin,
      status: UserStatus.active,
      isActive: true,
    },
  });

  console.log('✅ Created supplier admin user');

  // Create a sample company (active, pre-approved for seed)
  const company = await prisma.tenant.upsert({
    where: { email: 'company@example.com' },
    update: {},
    create: {
      name: 'XYZ Construction Company',
      type: TenantType.company,
      email: 'company@example.com',
      phone: '+1234567891',
      address: '456 Company Ave, City, State',
      status: TenantStatus.active,
      isActive: true,
    },
  });

  console.log('✅ Created company tenant:', company.name);

  // Create company admin user (active, pre-approved for seed)
  const companyPasswordHash = await bcrypt.hash('password123', 12);
  const companyAdmin = await prisma.user.upsert({
    where: { email: 'company@example.com' },
    update: {},
    create: {
      tenantId: company.id,
      email: 'company@example.com',
      passwordHash: companyPasswordHash,
      firstName: 'Company',
      lastName: 'Admin',
      role: UserRole.company_admin,
      status: UserStatus.active,
      isActive: true,
    },
  });

  console.log('✅ Created company admin user');

  // Get product categories for sample products
  const cementCategory = await prisma.productCategory.findFirst({
    where: { name: { contains: 'Cement', mode: 'insensitive' } },
  });

  const steelCategory = await prisma.productCategory.findFirst({
    where: { name: { contains: 'Steel', mode: 'insensitive' } },
  });

  // Create sample products
  const product1 = await prisma.product.upsert({
    where: {
      supplierId_sku: {
        supplierId: supplier.id,
        sku: 'CEMENT-50KG-001',
      },
    },
    update: {},
    create: {
      supplierId: supplier.id,
      sku: 'CEMENT-50KG-001',
      name: 'Portland Cement 50kg',
      description: 'Standard Portland cement bag',
      categoryId: cementCategory?.id || null,
      unit: 'bag',
      type: 'product',
      isActive: true,
    },
  });

  const product2 = await prisma.product.upsert({
    where: {
      supplierId_sku: {
        supplierId: supplier.id,
        sku: 'STEEL-REBAR-004',
      },
    },
    update: {},
    create: {
      supplierId: supplier.id,
      sku: 'STEEL-REBAR-004',
      name: 'Steel Rebar #4',
      description: 'Steel reinforcement bar #4',
      categoryId: steelCategory?.id || null,
      unit: 'piece',
      type: 'product',
      isActive: true,
    },
  });

  console.log('✅ Created sample products');

  // Create default prices
  await prisma.defaultPrice.create({
    data: {
      productId: product1.id,
      price: 25.99,
      currency: 'USD',
      isActive: true,
    },
  });

  await prisma.defaultPrice.create({
    data: {
      productId: product2.id,
      price: 45.00,
      currency: 'USD',
      isActive: true,
    },
  });

  console.log('✅ Created default prices');

  // Create a private price for the company
  await prisma.privatePrice.create({
    data: {
      productId: product1.id,
      companyId: company.id,
      price: 22.50,
      currency: 'USD',
      notes: 'Negotiated volume discount',
      isActive: true,
    },
  });

  console.log('✅ Created private price');

  // Create a sample service provider (active, pre-approved for seed)
  const serviceProvider = await prisma.tenant.upsert({
    where: { email: 'serviceprovider@example.com' },
    update: {},
    create: {
      name: 'Civil Engineering Solutions Ltd',
      type: TenantType.service_provider,
      email: 'serviceprovider@example.com',
      phone: '+65 6123 4567',
      address: '123 Engineering Street, Singapore 123456',
      postalCode: '123456',
      status: TenantStatus.active,
      isActive: true,
      metadata: {
        description: 'Professional civil engineering consultancy services',
        website: 'https://civilengsolutions.com',
      },
    },
  });

  console.log('✅ Created service provider tenant:', serviceProvider.name);

  // Create service provider admin user (active, pre-approved for seed)
  const serviceProviderPasswordHash = await bcrypt.hash('password123', 12);
  const serviceProviderAdmin = await prisma.user.upsert({
    where: { email: 'admin@serviceprovider.com' },
    update: {},
    create: {
      tenantId: serviceProvider.id,
      email: 'admin@serviceprovider.com',
      passwordHash: serviceProviderPasswordHash,
      firstName: 'John',
      lastName: 'Engineer',
      role: UserRole.service_provider_admin,
      status: UserStatus.active,
      isActive: true,
      permissions: { view: true, create: true, admin: true },
    },
  });

  console.log('✅ Created service provider admin user');

  // Get service categories (assuming they exist from service category seed)
  const structuralDesign = await prisma.serviceCategory.findFirst({
    where: { name: 'Structural Design & Assessment', parentId: null },
  });

  const architecture = await prisma.serviceCategory.findFirst({
    where: { name: 'Architecture & Visualisation', parentId: null },
  });

  const estimation = await prisma.serviceCategory.findFirst({
    where: { name: 'Estimation & Quantity Surveying', parentId: null },
  });

  const siteSupervision = await prisma.serviceCategory.findFirst({
    where: { name: 'Site Supervision & Quality Control', parentId: null },
  });

  const projectManagement = await prisma.serviceCategory.findFirst({
    where: { name: 'Project Management & Planning', parentId: null },
  });

  // Get subcategories
  const siteVisitSub = structuralDesign ? await prisma.serviceCategory.findFirst({
    where: { 
      name: 'Site Visit & Initial Structural Assessment',
      parentId: structuralDesign.id,
    },
  }) : null;

  const houseDesignSub = structuralDesign ? await prisma.serviceCategory.findFirst({
    where: { 
      name: 'New House Structural Design (Low-Rise)',
      parentId: structuralDesign.id,
    },
  }) : null;

  const archPlanningSub = architecture ? await prisma.serviceCategory.findFirst({
    where: { 
      name: 'Architectural Planning & 2D Layout Drawings',
      parentId: architecture.id,
    },
  }) : null;

  const estimationSub = estimation ? await prisma.serviceCategory.findFirst({
    where: { 
      name: 'Estimation, BOQ & Costing',
      parentId: estimation.id,
    },
  }) : null;

  const supervisionSub = siteSupervision ? await prisma.serviceCategory.findFirst({
    where: { 
      name: 'Construction Supervision & Quality Monitoring',
      parentId: siteSupervision.id,
    },
  }) : null;

  const projectMgmtSub = projectManagement ? await prisma.serviceCategory.findFirst({
    where: { 
      name: 'Project Management & Construction Scheduling',
      parentId: projectManagement.id,
    },
  }) : null;

  // Create sample services
  const services = [
    {
      sku: 'SVC-001',
      name: 'Site Visit & Initial Structural Assessment',
      description: 'Professional on-site structural assessment for residential and commercial buildings. Includes visual inspection, preliminary report, and recommendations.',
      serviceCategoryId: siteVisitSub?.id || structuralDesign?.id || null,
      unit: 'per visit',
      ratePerHour: 150.00,
      rateType: 'per_hour' as const,
    },
    {
      sku: 'SVC-002',
      name: 'New House Structural Design (Low-Rise)',
      description: 'Complete structural design services for new low-rise residential buildings. Includes foundation design, structural calculations, and detailed drawings.',
      serviceCategoryId: houseDesignSub?.id || structuralDesign?.id || null,
      unit: 'per project',
      ratePerHour: 200.00,
      rateType: 'per_project' as const,
    },
    {
      sku: 'SVC-003',
      name: 'Architectural Planning & 2D Layout Drawings',
      description: 'Professional architectural planning and 2D layout drawings for residential and commercial projects. Includes floor plans, elevations, and sections.',
      serviceCategoryId: archPlanningSub?.id || architecture?.id || null,
      unit: 'per project',
      ratePerHour: 120.00,
      rateType: 'per_hour' as const,
    },
    {
      sku: 'SVC-004',
      name: 'Estimation, BOQ & Costing Services',
      description: 'Detailed quantity takeoff, bill of quantities (BOQ) preparation, and cost estimation for construction projects. Includes material and labor cost analysis.',
      serviceCategoryId: estimationSub?.id || estimation?.id || null,
      unit: 'per project',
      ratePerHour: 100.00,
      rateType: 'per_hour' as const,
    },
    {
      sku: 'SVC-005',
      name: 'Construction Supervision & Quality Monitoring',
      description: 'On-site construction supervision and quality control services. Regular site visits, progress monitoring, and quality assurance reports.',
      serviceCategoryId: supervisionSub?.id || siteSupervision?.id || null,
      unit: 'per hour',
      ratePerHour: 80.00,
      rateType: 'per_hour' as const,
    },
    {
      sku: 'SVC-006',
      name: 'Project Management & Construction Scheduling',
      description: 'Comprehensive project management services including construction scheduling, resource planning, and progress tracking. Suitable for small to medium projects.',
      serviceCategoryId: projectMgmtSub?.id || projectManagement?.id || null,
      unit: 'per project',
      ratePerHour: 5000.00,
      rateType: 'fixed' as const,
    },
  ];

  for (const serviceData of services) {
    await prisma.product.upsert({
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
        type: 'service',
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
        type: 'service',
        isActive: true,
        metadata: {},
      },
    });
  }

  console.log('✅ Created sample services');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('Super Admin: admin@system.com / admin123');
  console.log('Supplier: supplier@example.com / password123');
  console.log('Company: company@example.com / password123');
  console.log('Service Provider: admin@serviceprovider.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });







