import { Express } from 'express';
import { authRoutes } from './authRoutes';

export function setupRoutes(app: Express) {
  // API version prefix
  app.use('/api/v1', authRoutes);
  
  // Placeholder for other routes
  // app.use('/api/v1/products', productRoutes);
  // app.use('/api/v1/prices', priceRoutes);
  // app.use('/api/v1/suppliers', supplierRoutes);
}

