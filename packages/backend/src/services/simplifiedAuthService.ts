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
      // Validate email is unique - use select to avoid selecting 'name' if it doesn't exist
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
        select: {
          id: true,
          email: true,
        },
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

    // Step 2: Create user - use select to avoid selecting 'name' if it doesn't exist
    const userData: any = {
      organizationId: organization.id,
      email: input.email,
      passwordHash,
      type: input.userType,
    };
    
    // Only add name if provided (column may not exist in DB yet)
    if (input.name) {
      userData.name = input.name;
    }
    
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        type: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
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
        name: (user as any).name || null, // name field may not exist in database yet
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
   * NEW SCHEMA ONLY
   */
  async login(input: SimplifiedLoginInput) {
    try {
      // Find user - NEW SCHEMA ONLY
      // Use select to avoid selecting 'name' column if it doesn't exist in database
      const user = await prisma.user.findUnique({
        where: { email: input.email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          type: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              email: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      if (!user) {
        throw createError(401, 'Invalid email or password');
      }

      if (!user.organization) {
        throw createError(403, 'User organization not found');
      }

      // Check if user type is valid (not null)
      if (!user.type || (user.type !== 'qs' && user.type !== 'supplier')) {
        throw createError(403, 'User account is not properly configured. Please contact support.');
      }

      const userType = user.type;
      const organizationId = user.organizationId;
      const organizationType = user.organization.type;
      const organization = user.organization;

      // Verify password
      const { comparePassword } = await import('../utils/password');
      const isValid = await comparePassword(input.password, user.passwordHash);

      if (!isValid) {
        console.error('[SimplifiedAuthService] Password verification failed for:', input.email);
        console.error('[SimplifiedAuthService] Hash starts with:', user.passwordHash?.substring(0, 20));
        throw createError(401, 'Invalid email or password');
      }
      
      console.log('[SimplifiedAuthService] Password verified successfully for:', input.email);

      // Update last login - handle both old and new schemas
      try {
        // Try new schema update first
        await prisma.user.update({
          where: { id: user.id },
          data: { updatedAt: new Date() },
        });
      } catch (updateError: any) {
        // If update fails (e.g., old schema), try raw SQL update
        if (updateError.message?.includes('column') && updateError.message?.includes('does not exist')) {
          console.log('[SimplifiedAuthService] Using raw SQL for update (old schema)');
          await prisma.$executeRaw`
            UPDATE users 
            SET updated_at = NOW()
            WHERE id = ${user.id}
          `;
        } else {
          // Re-throw if it's a different error
          throw updateError;
        }
      }

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
          name: (user as any).name || null, // name field may not exist in database yet
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
