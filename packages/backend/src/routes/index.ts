import { Express } from 'express';
// OLD ROUTES - Temporarily disabled for MVP 1 (use new schema)
// import { authRoutes } from './authRoutes';
// import { productRoutes } from './productRoutes';
// import { priceRoutes } from './priceRoutes';
// import { supplierRoutes } from './supplierRoutes';
// import supplierProfileRoutes from './supplierProfileRoutes';
// import productImageRoutes from './productImageRoutes';
// import superAdminRoutes from './superAdminRoutes';
// import categoryRoutes from './categoryRoutes';
// import serviceCategoryRoutes from './serviceCategoryRoutes';
// import { publicCategoryRoutes } from './publicCategoryRoutes';
// import { publicServiceCategoryRoutes } from './publicServiceCategoryRoutes';
// import tenantAdminRoutes from './tenantAdminRoutes';
// import publicRoutes from './publicRoutes';
// import companyRoutes from './companyRoutes';
// import quoteRoutes from './quoteRoutes';

// MVP 1 ROUTES - Use new simplified schema
import chatRoutes from './chatRoutes';
import supplierChatRoutes from './supplierChatRoutes';
import simplifiedAuthRoutes from './simplifiedAuthRoutes';
import simplifiedProductRoutes from './simplifiedProductRoutes';
import supplierProfileRoutes from './supplierProfileRoutes';
import { priceRoutes } from './priceRoutes';
import catalogRoutes from './catalogRoutes';

// Routes needed for QS professionals to browse products
import { publicCategoryRoutes } from './publicCategoryRoutes';
import { publicServiceCategoryRoutes } from './publicServiceCategoryRoutes';
import qsProductRoutes from './qsProductRoutes';
import publicRoutes from './publicRoutes';

// AI Procurement Agent routes
import procurementRoutes from './procurementRoutes';
import webhookRoutes from './webhookRoutes';

export function setupRoutes(app: Express) {
  // MVP 1: Simplified auth routes (2-step registration)
  app.use('/api/v1', simplifiedAuthRoutes);
  
  // MVP 1: AI Chat routes (QS and Supplier)
  app.use('/api/v1', chatRoutes); // QS chat
  app.use('/api/v1', supplierChatRoutes); // Supplier chat
  
  // MVP 1: Simplified Product routes (for suppliers)
  app.use('/api/v1', simplifiedProductRoutes);
  
  // Public routes for landing page (products, suppliers, service providers) - MUST be before authenticated routes
  app.use('/api/v1', publicRoutes);
  app.use('/api/v1', publicCategoryRoutes);
  app.use('/api/v1', publicServiceCategoryRoutes);
  
  // Supplier profile routes - register before qsProductRoutes to avoid route conflicts
  app.use('/api/v1', supplierProfileRoutes);
  console.log('✅ Supplier profile routes registered at /api/v1/supplier/profile');
  
  // Routes for QS professionals to browse products and suppliers (requires authentication)
  app.use('/api/v1', qsProductRoutes);
  
  // Price routes (for private prices and companies list)
  app.use('/api/v1', priceRoutes);
  
  // Catalog routes (for standardized categories and items)
  app.use('/api/v1', catalogRoutes);

  // AI Procurement Agent routes
  app.use('/api/v1', procurementRoutes);
  app.use('/api/v1', webhookRoutes);
  console.log('✅ Procurement Agent routes registered at /api/v1/procurement');
  
  // OLD ROUTES - Temporarily disabled (will be migrated to new schema later)
  // app.use('/api/v1', authRoutes);
  // app.use('/api/v1', quoteRoutes);
  // app.use('/api/v1/admin', superAdminRoutes);
  // app.use('/api/v1/admin', categoryRoutes);
  // app.use('/api/v1/admin', serviceCategoryRoutes);
  // app.use('/api/v1/tenant-admin', tenantAdminRoutes);
  // app.use('/api/v1', productImageRoutes);
  // app.use('/api/v1', productRoutes);
}

