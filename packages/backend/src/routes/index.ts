import { Express } from 'express';
import { authRoutes } from './authRoutes';
import { productRoutes } from './productRoutes';
import { priceRoutes } from './priceRoutes';
import { supplierRoutes } from './supplierRoutes';
import supplierProfileRoutes from './supplierProfileRoutes';
import productImageRoutes from './productImageRoutes';
import superAdminRoutes from './superAdminRoutes';
import categoryRoutes from './categoryRoutes';
import { publicCategoryRoutes } from './publicCategoryRoutes';
import tenantAdminRoutes from './tenantAdminRoutes';
import publicRoutes from './publicRoutes';
import companyRoutes from './companyRoutes';

export function setupRoutes(app: Express) {
  // Public routes (no authentication required, but optional auth for customer prices)
  app.use('/api/v1', publicRoutes);
  app.use('/api/v1', publicCategoryRoutes); // Public category routes
  
  // API version prefix
  app.use('/api/v1', authRoutes);
  
  // Super admin routes (requires super_admin role)
  app.use('/api/v1/admin', superAdminRoutes);
  app.use('/api/v1/admin', categoryRoutes);
  
  // Tenant admin routes (requires tenant admin role)
  app.use('/api/v1/tenant-admin', tenantAdminRoutes);
  
  // Supplier profile routes (requires supplier tenant type)
  app.use('/api/v1', supplierProfileRoutes);
  
  // Product image routes
  app.use('/api/v1', productImageRoutes);
  
  // Register company routes (supplierRoutes) BEFORE supplier-specific routes
  // to ensure /products/search matches correctly for companies
  app.use('/api/v1', supplierRoutes);
  // Register supplier-specific routes after company routes
  app.use('/api/v1', productRoutes);
  app.use('/api/v1', priceRoutes);
}

