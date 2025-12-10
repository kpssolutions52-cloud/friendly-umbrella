/**
 * In-memory caching for category-related data
 * Used to avoid redundant database queries on every request
 */

// Cache for category column existence check
let categoryCheckCache: { exists: boolean; timestamp: number } | null = null;
const CATEGORY_CHECK_TTL = 5 * 60 * 1000; // 5 minutes

// Cache for category image map (includes parent icons for fallback)
interface CategoryImageInfo {
  iconUrl: string | null;
  parentId: string | null;
  parentIconUrl: string | null;
}

let categoryImageMapCache: {
  map: Map<string, CategoryImageInfo>;
  timestamp: number;
} | null = null;
const CATEGORY_MAP_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Check if category_id column exists in products table
 * Results are cached for 5 minutes to avoid repeated queries
 */
export async function checkCategoryColumnExists(prisma: any): Promise<boolean> {
  const now = Date.now();

  // Return cached result if still valid
  if (categoryCheckCache && (now - categoryCheckCache.timestamp) < CATEGORY_CHECK_TTL) {
    return categoryCheckCache.exists;
  }

  // Perform the check
  try {
    await prisma.$queryRaw`SELECT category_id FROM products LIMIT 1`;
    categoryCheckCache = { exists: true, timestamp: now };
    return true;
  } catch (error: any) {
    if (error.code === 'P2022' || error.message?.includes('category_id')) {
      categoryCheckCache = { exists: false, timestamp: now };
      return false;
    }
    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Get category image map with parent icons
 * Results are cached for 10 minutes to avoid loading all categories on every request
 */
export async function getCategoryImageMap(
  prisma: any
): Promise<Map<string, CategoryImageInfo>> {
  const now = Date.now();

  // Return cached result if still valid
  if (categoryImageMapCache && (now - categoryImageMapCache.timestamp) < CATEGORY_MAP_TTL) {
    return categoryImageMapCache.map;
  }

  // Load categories from database
  try {
    // Test if Prisma Client supports productCategory
    await prisma.productCategory.findFirst({ take: 1 });

    const categories = await prisma.productCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        iconUrl: true,
        parentId: true,
        parent: {
          select: {
            id: true,
            iconUrl: true,
          },
        },
      },
    });

    // Build the map
    const map = new Map<string, CategoryImageInfo>(
      categories.map((cat: any) => [
        cat.id,
        {
          iconUrl: cat.iconUrl,
          parentId: cat.parentId,
          parentIconUrl: cat.parent?.iconUrl || null,
        },
      ])
    );

    // Cache the result
    categoryImageMapCache = { map, timestamp: now };
    return map;
  } catch (error: any) {
    // Categories table might not exist yet or Prisma Client not regenerated
    console.warn('Failed to load categories for images:', error.message);
    // Return empty map instead of throwing
    return new Map();
  }
}

/**
 * Clear all category caches
 * Call this when categories are created, updated, or deleted
 */
export function clearCategoryCache(): void {
  categoryCheckCache = null;
  categoryImageMapCache = null;
}

/**
 * Get cache statistics (for debugging/monitoring)
 */
export function getCacheStats(): {
  categoryCheckCached: boolean;
  categoryMapCached: boolean;
  categoryCheckAge?: number;
  categoryMapAge?: number;
} {
  const now = Date.now();
  return {
    categoryCheckCached: categoryCheckCache !== null,
    categoryMapCached: categoryImageMapCache !== null,
    categoryCheckAge: categoryCheckCache
      ? now - categoryCheckCache.timestamp
      : undefined,
    categoryMapAge: categoryImageMapCache
      ? now - categoryImageMapCache.timestamp
      : undefined,
  };
}

