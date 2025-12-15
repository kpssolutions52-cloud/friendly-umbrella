import { prisma } from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { findUserByEmail, updateUserLastLogin, createUser, findTenantByEmail, findTenantById, createTenant, findUserById } from '../utils/db';
import createError from 'http-errors';

export interface RegisterInput {
  registrationType: 'new_company' | 'new_supplier' | 'new_service_provider' | 'new_company_user' | 'new_supplier_user' | 'new_service_provider_user' | 'customer';
  tenantName?: string; // Required for new_company, new_supplier, and new_service_provider
  tenantType?: 'supplier' | 'company' | 'service_provider'; // Required for new_company, new_supplier, and new_service_provider
  tenantId?: string; // Required for new_company_user, new_supplier_user, and new_service_provider_user
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string; // Required for new_company, new_supplier, and new_service_provider
  address?: string; // Required for new_company, new_supplier, and new_service_provider
  postalCode?: string; // Required for new_company, new_supplier, and new_service_provider
  role?: string;
  permissions?: Record<string, any>;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async register(input: RegisterInput) {
    // Validate email is unique
    const existingUser = await findUserByEmail(input.email);

    if (existingUser) {
      throw createError(409, 'Email already registered');
    }

    // Handle different registration types
    if (input.registrationType === 'new_company' || input.registrationType === 'new_supplier' || input.registrationType === 'new_service_provider') {
      return this.registerNewTenant(input);
    } else if (input.registrationType === 'new_company_user' || input.registrationType === 'new_supplier_user' || input.registrationType === 'new_service_provider_user') {
      return this.registerNewUser(input);
    } else if (input.registrationType === 'customer') {
      return this.registerCustomer(input);
    } else {
      throw createError(400, 'Invalid registration type');
    }
  }

  /**
   * Register a new company, supplier, or service provider (creates tenant + admin user)
   */
  private async registerNewTenant(input: RegisterInput) {
    if (!input.tenantName || !input.tenantType) {
      throw createError(400, 'Tenant name and type are required for new tenant registration');
    }

    // Check if tenant email already exists
    const existingTenant = await findTenantByEmail(input.email);

    if (existingTenant) {
      throw createError(409, 'Email already registered');
    }

    // Determine role - admin for new tenant creators
    let role: string;
    if (input.tenantType === 'supplier') {
      role = 'supplier_admin';
    } else if (input.tenantType === 'company') {
      role = 'company_admin';
    } else if (input.tenantType === 'service_provider') {
      role = 'service_provider_admin';
    } else {
      throw createError(400, 'Invalid tenant type');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create tenant with pending status
    const tenant = await createTenant({
      name: input.tenantName!,
      type: input.tenantType!,
      email: input.email,
      phone: input.phone || null,
      address: input.address || null,
      postalCode: input.postalCode || null,
      status: 'pending',
      isActive: false,
    });

    // Create user with pending status (but will become admin once tenant is approved)
    const user = await createUser({
      tenantId: tenant.id,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: role,
      status: 'pending',
      isActive: false,
    });

    const result = { user, tenant };

    return {
      message: 'Registration successful. Your account is pending approval by a super administrator.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        tenantId: user.tenantId,
        tenantType: tenant.type,
        tenantStatus: tenant.status,
      },
    };
  }

  /**
   * Register a new customer (individual user, no tenant)
   */
  private async registerCustomer(input: RegisterInput) {
    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create customer user - customers are auto-approved and active
    const user = await createUser({
      tenantId: null, // Customers don't have tenants
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: 'customer',
      status: 'active', // Customers are auto-approved
      isActive: true,
    });

    // Generate tokens for customer (similar to login flow)
    const { generateAccessToken, generateRefreshToken } = await import('../utils/jwt');
    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: null,
      role: user.role,
      tenantType: 'customer',
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tenantId: null,
      role: user.role,
      tenantType: 'customer',
    });

    return {
      message: 'Registration successful. You can now browse products and see special prices.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        tenantId: null,
        tenantType: 'customer',
        tenantStatus: null,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Register a new user for existing company or supplier
   */
  private async registerNewUser(input: RegisterInput) {
    if (!input.tenantId) {
      throw createError(400, 'Tenant ID is required for new user registration');
    }

    // Verify tenant exists and is active
    const tenant = await findTenantById(input.tenantId);

    if (!tenant) {
      throw createError(404, 'Tenant not found');
    }

    if (tenant.status !== 'active' || !tenant.isActive) {
      throw createError(403, 'Cannot register users for inactive or pending tenants');
    }

    // Determine role based on tenant type
    let defaultRole: string;
    if (tenant.type === 'supplier') {
      defaultRole = 'supplier_staff';
    } else if (tenant.type === 'company') {
      defaultRole = 'company_staff';
    } else if (tenant.type === 'service_provider') {
      defaultRole = 'service_provider_staff';
    } else {
      throw createError(400, 'Invalid tenant type');
    }
    const role = input.role || defaultRole;

    // Validate role matches tenant type
    if (tenant.type === 'supplier' && !['supplier_admin', 'supplier_staff'].includes(role)) {
      throw createError(400, 'Invalid role for supplier tenant');
    }
    if (tenant.type === 'company' && !['company_admin', 'company_staff'].includes(role)) {
      throw createError(400, 'Invalid role for company tenant');
    }
    if (tenant.type === 'service_provider' && !['service_provider_admin', 'service_provider_staff'].includes(role)) {
      throw createError(400, 'Invalid role for service provider tenant');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user with pending status - needs admin approval
    const user = await createUser({
      tenantId: input.tenantId,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: role,
      status: 'pending',
      isActive: false,
    });

    return {
      message: 'Registration successful. Your account is pending approval by your organization administrator.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        tenantId: user.tenantId,
        tenantType: tenant.type,
        tenantStatus: tenant.status,
      },
    };
  }

  async login(input: LoginInput) {
    // Find user (with optional tenant for super admins)
    const user = await findUserByEmail(input.email, true);

    if (!user) {
      throw createError(401, 'Invalid email or password');
    }

    // Verify password first before checking status
    const isValid = await comparePassword(input.password, user.passwordHash);

    if (!isValid) {
      throw createError(401, 'Invalid email or password');
    }

    // Check if user is a super admin (no tenant)
    if (user.role === 'super_admin') {
      if (user.status !== 'active' || !user.isActive) {
        throw createError(403, 'Account is pending approval or inactive');
      }

      // Update last login
      await updateUserLastLogin(user.id);

      // Generate tokens for super admin (tenantId is null)
      const accessToken = generateAccessToken({
        userId: user.id,
        tenantId: user.tenantId || '',
        role: user.role,
        tenantType: 'system', // Special type for super admins
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
        tenantId: user.tenantId || '',
        role: user.role,
        tenantType: 'system',
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
          tenantType: 'system',
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    }

    // Handle customer (no tenant)
    if (user.role === 'customer') {
      if (user.status === 'pending') {
        throw createError(403, 'Your account is pending admin approval. Please wait for approval before logging in.');
      }
      if (user.status !== 'active' || !user.isActive) {
        throw createError(403, 'Your account is inactive');
      }

      // Update last login
      await updateUserLastLogin(user.id);

      // Generate tokens for customer (tenantId is null)
      const accessToken = generateAccessToken({
        userId: user.id,
        tenantId: null,
        role: user.role,
        tenantType: 'customer',
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
        tenantId: null,
        role: user.role,
        tenantType: 'customer',
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: null,
          tenantType: 'customer',
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    }

    // Regular user - must have tenant
    if (!user.tenant) {
      throw createError(403, 'User account is invalid');
    }

    // Check tenant and user status
    if (user.tenant.status !== 'active' || !user.tenant.isActive) {
      const tenantTypeName = user.tenant.type === 'service_provider' ? 'service provider' : 
                             user.tenant.type === 'supplier' ? 'supplier' : 'company';
      throw createError(403, `Your ${tenantTypeName} account is pending approval by a super administrator`);
    }

    if (user.status !== 'active' || !user.isActive) {
      throw createError(403, 'Your user account is pending approval by your organization administrator');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: user.tenantId!,
      role: user.role,
      tenantType: user.tenant.type,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tenantId: user.tenantId!,
      role: user.role,
      tenantType: user.tenant.type,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenantType: user.tenant.type,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const { verifyRefreshToken, generateAccessToken: generateToken } = await import(
      '../utils/jwt'
    );

    try {
      const payload = verifyRefreshToken(refreshToken);

      // Verify user still exists and is active
      const user = await findUserById(payload.userId, true);

      if (!user || !user.isActive || user.status !== 'active') {
        throw createError(401, 'User is inactive or pending approval');
      }

      // Handle super admin refresh
      if (user.role === 'super_admin') {
        const accessToken = generateToken({
          userId: user.id,
          tenantId: user.tenantId || '',
          role: user.role,
          tenantType: 'system',
        });
        return { accessToken };
      }

      // Handle customer refresh
      if (user.role === 'customer') {
        const accessToken = generateToken({
          userId: user.id,
          tenantId: null,
          role: user.role,
          tenantType: 'customer',
        });
        return { accessToken };
      }

      // Regular user - must have active tenant
      if (!user.tenant || !user.tenant.isActive || user.tenant.status !== 'active') {
        throw createError(401, 'Tenant is inactive or pending approval');
      }

      // Generate new access token
      const accessToken = generateToken({
        userId: user.id,
        tenantId: user.tenantId!,
        role: user.role,
        tenantType: user.tenant.type,
      });

      return { accessToken };
    } catch (error) {
      throw createError(401, 'Invalid refresh token');
    }
  }

  async getCurrentUser(userId: string) {
    const user = await findUserById(userId, true);

    if (!user) {
      throw createError(404, 'User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        type: user.tenant.type,
        email: user.tenant.email,
        phone: null, // Not stored in abstraction
        address: null, // Not stored in abstraction
      } : null,
    };
  }
}

export const authService = new AuthService();







