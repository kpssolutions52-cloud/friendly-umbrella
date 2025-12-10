import { prisma } from '../utils/prisma';
import createError from 'http-errors';

export interface CreateCategoryInput {
  name: string;
  description?: string;
  iconUrl?: string;
  parentId?: string | null;
  displayOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  iconUrl?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface CategoryWithChildren {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  parentId: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  children?: CategoryWithChildren[];
  parent?: {
    id: string;
    name: string;
  } | null;
}

export class CategoryService {
  /**
   * Get all categories in hierarchical structure
   */
  async getAllCategories(includeInactive = false): Promise<CategoryWithChildren[]> {
    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    const categories = await prisma.productCategory.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
      orderBy: [
        { parentId: 'asc' }, // Main categories first (parentId is null)
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    // Organize into hierarchical structure
    const mainCategories = categories.filter((cat) => !cat.parentId);
    const subcategories = categories.filter((cat) => cat.parentId);

    return mainCategories.map((mainCat) => ({
      ...mainCat,
      children: subcategories
        .filter((sub) => sub.parentId === mainCat.id)
        .map((sub) => ({
          ...sub,
          children: [],
        })),
    })) as CategoryWithChildren[];
  }

  /**
   * Get all main categories only (no subcategories)
   */
  async getMainCategories(includeInactive = false): Promise<CategoryWithChildren[]> {
    const where: any = { parentId: null };
    if (!includeInactive) {
      where.isActive = true;
    }

    return prisma.productCategory.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    }) as Promise<CategoryWithChildren[]>;
  }

  /**
   * Get subcategories for a specific main category
   */
  async getSubcategories(parentId: string, includeInactive = false): Promise<CategoryWithChildren[]> {
    const where: any = { parentId };
    if (!includeInactive) {
      where.isActive = true;
    }

    return prisma.productCategory.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    }) as Promise<CategoryWithChildren[]>;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId: string) {
    const category = await prisma.productCategory.findUnique({
      where: { id: categoryId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });

    if (!category) {
      throw createError(404, 'Category not found');
    }

    return category;
  }

  /**
   * Create a new category (main or subcategory)
   */
  async createCategory(input: CreateCategoryInput) {
    // Validate parent exists if parentId is provided
    if (input.parentId) {
      const parent = await prisma.productCategory.findUnique({
        where: { id: input.parentId },
      });

      if (!parent) {
        throw createError(400, 'Parent category not found');
      }

      if (parent.parentId) {
        throw createError(400, 'Cannot create subcategory of a subcategory (only 2 levels allowed)');
      }
    }

    // Check for duplicate name at the same level
    const existing = await prisma.productCategory.findFirst({
      where: {
        name: input.name.trim(),
        parentId: input.parentId || null,
      },
    });

    if (existing) {
      throw createError(409, `Category "${input.name}" already exists at this level`);
    }

    // Get display order if not provided
    let displayOrder = input.displayOrder;
    if (displayOrder === undefined) {
      const lastCategory = await prisma.productCategory.findFirst({
        where: { parentId: input.parentId || null },
        orderBy: { displayOrder: 'desc' },
      });
      displayOrder = lastCategory ? lastCategory.displayOrder + 1 : 0;
    }

    return prisma.productCategory.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim(),
        iconUrl: input.iconUrl,
        parentId: input.parentId || null,
        displayOrder,
        isActive: true,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Update a category
   */
  async updateCategory(categoryId: string, input: UpdateCategoryInput) {
    const category = await this.getCategoryById(categoryId);

    // Validate parent exists if parentId is being changed
    if (input.parentId !== undefined && input.parentId !== null) {
      const parent = await prisma.productCategory.findUnique({
        where: { id: input.parentId },
      });

      if (!parent) {
        throw createError(400, 'Parent category not found');
      }

      if (parent.parentId) {
        throw createError(400, 'Cannot move category under a subcategory (only 2 levels allowed)');
      }

      // Prevent circular reference
      if (input.parentId === categoryId) {
        throw createError(400, 'Category cannot be its own parent');
      }

      // Prevent moving a category under its own child
      const isDescendant = await this.isDescendant(categoryId, input.parentId);
      if (isDescendant) {
        throw createError(400, 'Cannot move category under its own descendant');
      }
    }

    // Check for duplicate name if name is being updated
    if (input.name) {
      const parentId = input.parentId !== undefined ? input.parentId : category.parentId;
      const existing = await prisma.productCategory.findFirst({
        where: {
          name: input.name.trim(),
          parentId: parentId || null,
        },
      });

      if (existing && existing.id !== categoryId) {
        throw createError(409, `Category "${input.name}" already exists at this level`);
      }
    }

    return prisma.productCategory.update({
      where: { id: categoryId },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.description !== undefined && { description: input.description?.trim() || null }),
        ...(input.iconUrl !== undefined && { iconUrl: input.iconUrl }),
        ...(input.parentId !== undefined && { parentId: input.parentId }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });
  }

  /**
   * Delete a category
   */
  async deleteCategory(categoryId: string) {
    const category = await this.getCategoryById(categoryId);

    // Check if category has children
    const childCount = await prisma.productCategory.count({
      where: { parentId: categoryId },
    });

    if (childCount > 0) {
      throw createError(400, `Cannot delete category. It has ${childCount} subcategory(ies). Delete subcategories first.`);
    }

    // Check if category is used by any products
    const productCount = await prisma.product.count({
      where: { categoryId },
    });

    if (productCount > 0) {
      throw createError(400, `Cannot delete category. It is used by ${productCount} product(s).`);
    }

    await prisma.productCategory.delete({
      where: { id: categoryId },
    });
  }

  /**
   * Deactivate a category (soft delete)
   */
  async deactivateCategory(categoryId: string) {
    return this.updateCategory(categoryId, { isActive: false });
  }

  /**
   * Helper: Check if a category is a descendant of another
   */
  private async isDescendant(categoryId: string, ancestorId: string): Promise<boolean> {
    let currentId: string | null = categoryId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const category: { parentId: string | null } | null = await prisma.productCategory.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      if (!category) break;
      if (category.parentId === ancestorId) return true;
      currentId = category.parentId;
    }

    return false;
  }

  /**
   * Get flat list of all categories (for dropdowns)
   */
  async getFlatCategories(includeInactive = false): Promise<Array<{ id: string; name: string; parentName?: string }>> {
    const categories = await prisma.productCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        parent: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { parentId: 'asc' },
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.parent ? `${cat.parent.name} > ${cat.name}` : cat.name,
      parentName: cat.parent?.name,
    }));
  }
}

export const categoryService = new CategoryService();

