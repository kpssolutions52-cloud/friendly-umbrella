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
    console.log('[supplier/profile] Route hit:', {
      method: req.method,
      path: req.path,
      tenantId: req.tenantId,
      tenantType: req.tenantType,
    });
    
    if (!req.tenantId) {
      throw createError(403, 'Tenant ID not found');
    }

    // Query tenant with Prisma (for standard fields)
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
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If tenant doesn't exist, return empty profile structure to allow creation
    if (!tenant) {
      // Get user's email for the empty profile
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { email: true },
      });

      // Return a minimal profile structure with the tenantId
      res.json({ 
        profile: {
          id: req.tenantId!,
          name: '',
          email: user?.email || '',
          phone: null,
          address: null,
          postalCode: null,
          logoUrl: null,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      });
      return;
    }

    // Query additional profile fields from direct columns (if they exist in the database)
    // These columns may exist even if not in Prisma schema
    let additionalFields: Record<string, any> = {};
    try {
      // Query direct columns that may exist in the database
      // req.tenantId is already validated as UUID from authenticated request
      const rawData = await prisma.$queryRaw<Array<{
        registration_number?: string | null;
        contact_person?: string | null;
        website?: string | null;
        tax_id?: string | null;
        business_license?: string | null;
        description?: string | null;
        city?: string | null;
        state?: string | null;
        country?: string | null;
      }>>`
        SELECT 
          registration_number,
          contact_person,
          website,
          tax_id,
          business_license,
          description,
          city,
          state,
          country
        FROM tenants
        WHERE id = ${req.tenantId}::uuid
      `;

      if (rawData && rawData.length > 0) {
        const row = rawData[0];
        // Map database column names to metadata field names
        if (row.registration_number) additionalFields.registrationNumber = row.registration_number;
        if (row.contact_person) additionalFields.contactPerson = row.contact_person;
        if (row.website) additionalFields.website = row.website;
        if (row.tax_id) additionalFields.taxId = row.tax_id;
        if (row.business_license) additionalFields.businessLicense = row.business_license;
        if (row.description) additionalFields.description = row.description;
        if (row.city) additionalFields.city = row.city;
        if (row.state) additionalFields.state = row.state;
        if (row.country) additionalFields.country = row.country;
      }
    } catch (error) {
      // If columns don't exist, that's okay - we'll just use metadata
      console.log('[supplier/profile] Could not query additional columns (they may not exist):', error);
    }

    // Merge metadata with additional fields from direct columns
    // Direct column values take precedence if they exist
    const existingMetadata = (tenant.metadata as Record<string, any>) || {};
    const mergedMetadata = {
      ...existingMetadata,
      ...additionalFields, // Direct columns override metadata
    };

    // Ensure metadata is always an object, not null
    const profile = {
      ...tenant,
      metadata: mergedMetadata,
    };

    console.log('[supplier/profile] Returning profile:', {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      hasMetadata: !!profile.metadata,
      metadataKeys: profile.metadata ? Object.keys(profile.metadata) : [],
      additionalFieldsFound: Object.keys(additionalFields).length,
    });

    res.json({ profile });
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
    body('registrationNumber').optional().isString().isLength({ max: 100 }),
    body('contactPerson').optional().isString().isLength({ max: 255 }),
    body('website').optional().custom((value) => {
      if (!value || value === '') return true; // Allow empty string
      // Validate URL format if provided
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('Website must be a valid URL');
      }
    }),
    body('taxId').optional().isString().isLength({ max: 100 }),
    body('businessLicense').optional().isString().isLength({ max: 100 }),
    body('description').optional().isString(),
    body('city').optional().isString().isLength({ max: 100 }),
    body('state').optional().isString().isLength({ max: 100 }),
    body('country').optional().isString().isLength({ max: 100 }),
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

      const { 
        name, 
        phone, 
        address, 
        postalCode,
        registrationNumber,
        contactPerson,
        website,
        taxId,
        businessLicense,
        description,
        city,
        state,
        country
      } = req.body;

      // Get current tenant to preserve existing metadata
      const currentTenant = await prisma.tenant.findUnique({
        where: { id: req.tenantId },
        select: { metadata: true },
      });

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (postalCode !== undefined) updateData.postalCode = postalCode;

      // Store extra fields in metadata JSON
      const metadata = (currentTenant?.metadata as Record<string, any>) || {};
      if (registrationNumber !== undefined) metadata.registrationNumber = registrationNumber;
      if (contactPerson !== undefined) metadata.contactPerson = contactPerson;
      if (website !== undefined) metadata.website = website;
      if (taxId !== undefined) metadata.taxId = taxId;
      if (businessLicense !== undefined) metadata.businessLicense = businessLicense;
      if (description !== undefined) metadata.description = description;
      if (city !== undefined) metadata.city = city;
      if (state !== undefined) metadata.state = state;
      if (country !== undefined) metadata.country = country;
      updateData.metadata = metadata;

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
          metadata: true,
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

