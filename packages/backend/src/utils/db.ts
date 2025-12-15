/**
 * Database abstraction layer
 * Uses Prisma for all database operations
 * For E2E tests, TestContainers provides a real PostgreSQL database
 */

import { PrismaClient } from '@prisma/client';
import { prisma } from './prisma';

/**
 * Database abstraction interface
 */
export interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  isActive: boolean;
  tenantId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  tenant?: {
    id: string;
    name: string;
    type: string;
    email: string;
    status: string;
    isActive: boolean;
  } | null;
}

/**
 * Find a user by email
 */
export async function findUserByEmail(email: string, includeTenant = false): Promise<DbUser | null> {
  // Use Prisma (works with both real database and TestContainers)
  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: includeTenant },
  });
  
  if (!user) {
    return null;
  }
  
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    isActive: user.isActive,
    tenantId: user.tenantId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
    tenant: user.tenant ? {
      id: user.tenant.id,
      name: user.tenant.name,
      type: user.tenant.type,
      email: user.tenant.email,
      status: user.tenant.status,
      isActive: user.tenant.isActive,
    } : null,
  };
}

/**
 * Update user's last login time
 */
export async function updateUserLastLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date(), updatedAt: new Date() },
  });
}

/**
 * Find a tenant by ID
 */
export async function findTenantById(tenantId: string): Promise<{
  id: string;
  name: string;
  type: string;
  email: string;
  status: string;
  isActive: boolean;
} | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });
  
  if (!tenant) {
    return null;
  }
  
  return {
    id: tenant.id,
    name: tenant.name,
    type: tenant.type,
    email: tenant.email,
    status: tenant.status,
    isActive: tenant.isActive,
  };
}

/**
 * Create a new user
 */
export async function createUser(data: {
  email: string;
  passwordHash: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  status?: string;
  isActive?: boolean;
  tenantId?: string | null;
}): Promise<DbUser> {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role as any,
      status: (data.status || 'pending') as any,
      isActive: data.isActive !== undefined ? data.isActive : false,
      tenantId: data.tenantId,
    },
  });
  
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    isActive: user.isActive,
    tenantId: user.tenantId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
}

/**
 * Find a tenant by email
 */
export async function findTenantByEmail(email: string): Promise<{
  id: string;
  name: string;
  type: string;
  email: string;
  status: string;
  isActive: boolean;
} | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { email },
  });
  
  if (!tenant) {
    return null;
  }
  
  return {
    id: tenant.id,
    name: tenant.name,
    type: tenant.type,
    email: tenant.email,
    status: tenant.status,
    isActive: tenant.isActive,
  };
}

/**
 * Create a new tenant
 */
export async function createTenant(data: {
  name: string;
  type: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  postalCode?: string | null;
  status?: string;
  isActive?: boolean;
}): Promise<{
  id: string;
  name: string;
  type: string;
  email: string;
  status: string;
  isActive: boolean;
}> {
  const tenant = await prisma.tenant.create({
    data: {
      name: data.name,
      type: data.type as any,
      email: data.email,
      phone: data.phone,
      address: data.address,
      postalCode: data.postalCode,
      status: (data.status || 'pending') as any,
      isActive: data.isActive !== undefined ? data.isActive : false,
    },
  });
  
  return {
    id: tenant.id,
    name: tenant.name,
    type: tenant.type,
    email: tenant.email,
    status: tenant.status,
    isActive: tenant.isActive,
  };
}

/**
 * Find user by ID
 */
export async function findUserById(userId: string, includeTenant = false): Promise<DbUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenant: includeTenant },
  });
  
  if (!user) {
    return null;
  }
  
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    isActive: user.isActive,
    tenantId: user.tenantId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
    tenant: user.tenant ? {
      id: user.tenant.id,
      name: user.tenant.name,
      type: user.tenant.type,
      email: user.tenant.email,
      status: user.tenant.status,
      isActive: user.tenant.isActive,
    } : null,
  };
}


