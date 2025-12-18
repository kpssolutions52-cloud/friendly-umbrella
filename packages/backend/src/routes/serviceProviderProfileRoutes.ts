import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest, requireTenantType } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import createError from 'http-errors';
import multer from 'multer';
import { uploadSupplierLogo, deleteSupplierLogo } from '../utils/supabase';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Require service_provider tenant type
const requireServiceProvider = requireTenantType('service_provider');

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// GET /api/v1/service-provider/profile - Get service provider profile
router.get('/service-provider/profile', requireServiceProvider, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.tenantId) {
      throw createError(403, 'Tenant ID not found');
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        postalCode: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tenant) {
      throw createError(404, 'Service provider profile not found');
    }

    res.json({ profile: tenant });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/service-provider/profile - Update service provider profile
router.put(
  '/service-provider/profile',
  requireServiceProvider,
  [
    body('name').optional().isString().isLength({ min: 1, max: 255 }),
    body('phone').optional().isString().isLength({ max: 50 }),
    body('address').optional().isString(),
    body('postalCode').optional().isString().isLength({ max: 20 }),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.tenantId) {
        throw createError(403, 'Tenant ID not found');
      }

      const { name, phone, address, postalCode } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (postalCode !== undefined) updateData.postalCode = postalCode;

      const updated = await prisma.tenant.update({
        where: { id: req.tenantId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          postalCode: true,
          logoUrl: true,
          updatedAt: true,
        },
      });

      res.json({ profile: updated, message: 'Profile updated successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/service-provider/profile/logo - Upload service provider logo
router.post(
  '/service-provider/profile/logo',
  requireServiceProvider,
  upload.single('logo'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.tenantId) {
        throw createError(403, 'Tenant ID not found');
      }

      if (!req.file) {
        throw createError(400, 'No file uploaded');
      }

      // Get current logo URL to delete old one
      const currentTenant = await prisma.tenant.findUnique({
        where: { id: req.tenantId },
        select: { logoUrl: true },
      });

      // Upload new logo
      const logoUrl = await uploadSupplierLogo(
        req.tenantId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Update tenant with new logo URL
      const updated = await prisma.tenant.update({
        where: { id: req.tenantId },
        data: { logoUrl },
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      });

      // Delete old logo if it exists
      if (currentTenant?.logoUrl) {
        await deleteSupplierLogo(currentTenant.logoUrl).catch((err) => {
          console.error('Failed to delete old logo:', err);
        });
      }

      res.json({
        profile: updated,
        message: 'Logo uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/service-provider/profile/logo - Delete service provider logo
router.delete('/service-provider/profile/logo', requireServiceProvider, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.tenantId) {
      throw createError(403, 'Tenant ID not found');
    }

    // Get current logo URL
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { logoUrl: true },
    });

    // Update tenant to remove logo
    const updated = await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { logoUrl: null },
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
    });

    // Delete logo from storage
    if (currentTenant?.logoUrl) {
      await deleteSupplierLogo(currentTenant.logoUrl).catch((err) => {
        console.error('Failed to delete logo:', err);
      });
    }

    res.json({
      profile: updated,
      message: 'Logo deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;



