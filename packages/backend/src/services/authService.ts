import { prisma } from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import createError from 'http-errors';

export interface RegisterInput {
  tenantName: string;
  tenantType: 'supplier' | 'company';
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async register(input: RegisterInput) {
    // Validate email is unique
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw createError(409, 'Email already registered');
    }

    // Determine role based on tenant type if not provided
    let role = input.role;
    if (!role) {
      role = input.tenantType === 'supplier' ? 'supplier_admin' : 'company_admin';
    }

    // Create tenant and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          type: input.tenantType,
          email: input.email,
          isActive: true,
        },
      });

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Create user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          role: role as any,
          isActive: true,
        },
        include: {
          tenant: true,
        },
      });

      return { user, tenant };
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: result.user.id,
      tenantId: result.user.tenantId,
      role: result.user.role,
      tenantType: result.tenant.type,
    });

    const refreshToken = generateRefreshToken({
      userId: result.user.id,
      tenantId: result.user.tenantId,
      role: result.user.role,
      tenantType: result.tenant.type,
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        tenantId: result.user.tenantId,
        tenantType: result.tenant.type,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async login(input: LoginInput) {
    // Find user with tenant
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { tenant: true },
    });

    if (!user) {
      throw createError(401, 'Invalid email or password');
    }

    if (!user.isActive || !user.tenant.isActive) {
      throw createError(403, 'Account is inactive');
    }

    // Verify password
    const isValid = await comparePassword(input.password, user.passwordHash);

    if (!isValid) {
      throw createError(401, 'Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      tenantType: user.tenant.type,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tenantId: user.tenantId,
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
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { tenant: true },
      });

      if (!user || !user.isActive || !user.tenant.isActive) {
        throw createError(401, 'User or tenant is inactive');
      }

      // Generate new access token
      const accessToken = generateToken({
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        tenantType: user.tenant.type,
      });

      return { accessToken };
    } catch (error) {
      throw createError(401, 'Invalid refresh token');
    }
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            type: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!user) {
      throw createError(404, 'User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenant: user.tenant,
    };
  }
}

export const authService = new AuthService();






