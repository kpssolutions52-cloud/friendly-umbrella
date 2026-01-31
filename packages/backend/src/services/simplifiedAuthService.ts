/**
 * Simplified Auth Service for MVP 1
 * 2-step registration: Choose user type → Choose/create organization
 */

import { prisma } from '../utils/prisma';
import { hashPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import createError from 'http-errors';

export interface SimplifiedRegisterInput {
  userType: 'qs' | 'supplier';
  organizationId?: string; // If joining existing organization
  organizationName?: string; // If creating new organization
  email: string;
  password: string;
  name?: string;
}

export interface SimplifiedLoginInput {
  email: string;
  password: string;
}

export class SimplifiedAuthService {
  /**
   * Register a new user (2-step: user type → organization)
   */
  async register(input: SimplifiedRegisterInput) {
    try {
      // Validate email is unique
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw createError(409, 'Email already registered');
      }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    let organization;

    // Step 1: Get or create organization
    if (input.organizationId) {
      // Joining existing organization
      organization = await prisma.organization.findUnique({
        where: { id: input.organizationId },
      });

      if (!organization) {
        throw createError(404, 'Organization not found');
      }

      // Verify organization type matches user type
      if (
        (input.userType === 'qs' && organization.type !== 'company') ||
        (input.userType === 'supplier' && organization.type !== 'supplier')
      ) {
        throw createError(
          400,
          `User type ${input.userType} does not match organization type ${organization.type}`
        );
      }
    } else if (input.organizationName) {
      // Creating new organization
      // Check if organization email already exists
      const existingOrg = await prisma.organization.findUnique({
        where: { email: input.email },
      });

      if (existingOrg) {
        throw createError(409, 'Organization with this email already exists');
      }

      // Create organization based on user type
      organization = await prisma.organization.create({
        data: {
          name: input.organizationName,
          type: input.userType === 'qs' ? 'company' : 'supplier',
          email: input.email, // Use user email as organization email
        },
      });
    } else {
      throw createError(
        400,
        'Either organizationId or organizationName is required'
      );
    }

    // Step 2: Create user
    const user = await prisma.user.create({
      data: {
        organizationId: organization.id,
        email: input.email,
        passwordHash,
        name: input.name || null,
        type: input.userType,
      },
      include: {
        organization: true,
      },
    });

    // Generate tokens (compatible with JWT utility)
    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: user.organizationId, // Map organizationId to tenantId for compatibility
      role: user.type === 'qs' ? 'company_staff' : 'supplier_staff', // Map type to role
      tenantType: user.organization.type, // Map organization type
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tenantId: user.organizationId,
      role: user.type === 'qs' ? 'company_staff' : 'supplier_staff',
      tenantType: user.organization.type,
    });

    return {
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          type: user.organization.type,
        },
      },
      accessToken,
      refreshToken,
    };
    } catch (error: any) {
      console.error('[SimplifiedAuthService] Registration error:', error);
      // Re-throw createError instances as-is
      if (error.statusCode || error.status) {
        throw error;
      }
      // Wrap other errors
      throw createError(500, `Registration failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Login user
   * Supports both old schema (tenant, role) and new schema (organization, type)
   */
  async login(input: SimplifiedLoginInput) {
    try {
      // Try to find user - check if we have new schema (organization) or old schema (tenant)
      let user: any = null;
      let organization: any = null;
      let userType: 'qs' | 'supplier' | null = null;
      let organizationId: string | null = null;
      let organizationType: 'company' | 'supplier' | null = null;

      try {
        // Try new schema first (with organization relation)
        user = await prisma.user.findUnique({
          where: { email: input.email },
          include: {
            organization: true,
          },
        });

        if (user && user.organization) {
          // New schema
          organization = user.organization;
          userType = user.type;
          organizationId = user.organizationId;
          organizationType = user.organization.type;
        } else if (user) {
          // User exists but no organization - might be old schema
          throw new Error('No organization found - checking old schema');
        }
      } catch (error: any) {
        // Try old schema using raw SQL (more reliable than Prisma when relation doesn't exist)
        try {
          console.log('[SimplifiedAuthService] Trying old schema with raw SQL...');
          
          // Use raw SQL to query user with tenant (old schema)
          const result = await prisma.$queryRaw<any[]>`
            SELECT 
              u.id,
              u.email,
              u.password_hash as "passwordHash",
              u.first_name as "firstName",
              u.last_name as "lastName",
              u.role,
              u.status,
              u.is_active as "isActive",
              u.tenant_id as "userTenantId",
              t.id as "tenantId",
              t.name as "tenantName",
              t.type as "tenantType",
              t.status as "tenantStatus",
              t.is_active as "tenantIsActive"
            FROM users u
            LEFT JOIN tenants t ON u.tenant_id = t.id
            WHERE u.email = ${input.email}
            LIMIT 1
          `;

          if (result && result.length > 0) {
            const row = result[0];
            user = {
              id: row.id,
              email: row.email,
              passwordHash: row.passwordHash,
              firstName: row.firstName,
              lastName: row.lastName,
              role: row.role,
              status: row.status,
              isActive: row.isActive,
              tenantId: row.tenantId,
            };

            if (row.tenantId && row.tenantType) {
              // Old schema - map to new schema format
              organization = {
                id: row.tenantId,
                name: row.tenantName,
                type: row.tenantType,
                status: row.tenantStatus,
                isActive: row.tenantIsActive,
              };
              
              // Map role to type
              if (user.role === 'company_staff' || user.role === 'company_admin') {
                userType = 'qs';
              } else if (user.role === 'supplier_staff' || user.role === 'supplier_admin') {
                userType = 'supplier';
              } else {
                throw createError(401, 'Invalid user role for demo login');
              }
              
              organizationId = row.tenantId;
              organizationType = row.tenantType;
            } else {
              throw createError(401, 'Invalid email or password - no tenant found');
            }
          } else {
            throw createError(401, 'Invalid email or password');
          }
        } catch (oldSchemaError: any) {
          console.error('[SimplifiedAuthService] Old schema query failed:', oldSchemaError);
          // If it's a table not found error, the old schema doesn't exist
          if (oldSchemaError.message?.includes('relation "tenants" does not exist')) {
            throw createError(401, 'Invalid email or password');
          }
          // Re-throw createError instances
          if (oldSchemaError.statusCode || oldSchemaError.status) {
            throw oldSchemaError;
          }
          // Neither schema worked
          throw createError(401, 'Invalid email or password');
        }
      }

      if (!user || !userType || !organizationId || !organizationType || !organization) {
        throw createError(401, 'Invalid email or password');
      }

      // Check if user is active (old schema has isActive, new schema doesn't need it)
      if ((user as any).isActive === false) {
        throw createError(403, 'Account is inactive');
      }

      if ((user as any).status === 'pending') {
        throw createError(403, 'Account is pending approval');
      }

      // Verify password
      const { comparePassword } = await import('../utils/password');
      const isValid = await comparePassword(input.password, user.passwordHash);

      if (!isValid) {
        console.error('[SimplifiedAuthService] Password verification failed for:', input.email);
        console.error('[SimplifiedAuthService] Hash starts with:', user.passwordHash?.substring(0, 20));
        throw createError(401, 'Invalid email or password');
      }
      
      console.log('[SimplifiedAuthService] Password verified successfully for:', input.email);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() },
      });

      // Generate tokens (compatible with JWT utility)
      const role = userType === 'qs' ? 'company_staff' : 'supplier_staff';
      const accessToken = generateAccessToken({
        userId: user.id,
        tenantId: organizationId, // Map organizationId to tenantId for compatibility
        role,
        tenantType: organizationType,
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
        tenantId: organizationId,
        role,
        tenantType: organizationType,
      });

      return {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name || `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || null,
          type: userType,
          organization: {
            id: organization.id,
            name: organization.name,
            type: organizationType,
          },
        },
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      console.error('[SimplifiedAuthService] Login error:', error);
      // Re-throw createError instances as-is
      if (error.statusCode || error.status) {
        throw error;
      }
      // Wrap other errors
      throw createError(500, `Login failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get organizations for registration (for joining existing)
   */
  async getOrganizations(type: 'company' | 'supplier') {
    try {
      // Map 'company'/'supplier' to OrgType enum
      const orgType = type === 'company' ? 'company' : 'supplier';
      
      const organizations = await prisma.organization.findMany({
        where: { type: orgType },
        select: {
          id: true,
          name: true,
          type: true,
          email: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return { organizations };
    } catch (error: any) {
      console.error('[SimplifiedAuthService] Error fetching organizations:', error);
      throw createError(500, `Failed to fetch organizations: ${error.message || 'Unknown error'}`);
    }
  }
}

export const simplifiedAuthService = new SimplifiedAuthService();
