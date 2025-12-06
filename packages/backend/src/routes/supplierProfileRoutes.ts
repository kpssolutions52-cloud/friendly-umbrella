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

// Require supplier tenant type
const requireSupplier = requireTenantType('supplier');

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

// GET /api/v1/supplier/profile - Get supplier profile
router.get('/supplier/profile', requireSupplier, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
      throw createError(404, 'Supplier profile not found');
    }

    res.json({ profile: tenant });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/supplier/profile - Update supplier profile
router.put(
  '/supplier/profile',
  requireSupplier,
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

// POST /api/v1/supplier/profile/logo - Upload supplier logo
router.post(
  '/supplier/profile/logo',
  requireSupplier,
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

// DELETE /api/v1/supplier/profile/logo - Delete supplier logo
router.delete('/supplier/profile/logo', requireSupplier, async (req: AuthRequest, res: Response, next: NextFunction) => {
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

