import { Express } from 'express';

import chatRoutes from './chatRoutes';
import supplierChatRoutes from './supplierChatRoutes';
import simplifiedAuthRoutes from './simplifiedAuthRoutes';
import simplifiedProductRoutes from './simplifiedProductRoutes';
import supplierProfileRoutes from './supplierProfileRoutes';
import { priceRoutes } from './priceRoutes';
import catalogRoutes from './catalogRoutes';
import { publicCategoryRoutes } from './publicCategoryRoutes';
import { publicServiceCategoryRoutes } from './publicServiceCategoryRoutes';
import publicRoutes from './publicRoutes';
import supplierHubRoutes from './supplierHubRoutes';
import qsProfileRoutes from './qsProfileRoutes';

export function setupRoutes(app: Express) {
  app.use('/api/v1', simplifiedAuthRoutes);
  app.use('/api/v1', qsProfileRoutes);

  app.use('/api/v1', chatRoutes);
  app.use('/api/v1', supplierChatRoutes);

  app.use('/api/v1', simplifiedProductRoutes);

  // Public routes — must be registered before authenticated routes
  app.use('/api/v1', publicRoutes);
  app.use('/api/v1', publicCategoryRoutes);
  app.use('/api/v1', publicServiceCategoryRoutes);

  app.use('/api/v1', supplierProfileRoutes);
  console.log('✅ Supplier profile routes registered at /api/v1/supplier/profile');

  app.use('/api/v1', priceRoutes);
  app.use('/api/v1', catalogRoutes);
  app.use('/api/v1', supplierHubRoutes);
  console.log('✅ Supplier Intelligence Hub routes registered at /api/v1/supplier-hub');
}
