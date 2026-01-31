/**
 * Data Retrieval Service
 * Handles all database queries for supplier and product data
 */

import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';
import {
  getCachedSupplierData,
  setCachedSupplierData,
} from './cacheService';

export interface SupplierPriceData {
  supplier: string;
  product: string;
  price: number;
  unit: string;
  supplierId: string;
  productId: string;
}

/**
 * Get supplier prices for a product
 * Uses cache if available
 * NEW SCHEMA ONLY
 */
export async function getSupplierPrices(
  productName: string
): Promise<SupplierPriceData[]> {
  // Check cache first
  const cached = await getCachedSupplierData(productName);
  if (cached) {
    return cached;
  }

  // Query database - NEW SCHEMA ONLY
  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: productName,
        mode: 'insensitive',
      },
    },
    include: {
      supplier: true,
    },
    orderBy: {
      price: 'asc', // Best price first
    },
    take: 10, // Top 10 suppliers
  });

  const result = products.map((p) => ({
    supplier: p.supplier.name,
    product: p.name,
    price: Number(p.price),
    unit: p.unit,
    supplierId: p.supplierId,
    productId: p.id,
  }));

  // Cache the result
  await setCachedSupplierData(productName, result, 30); // 30 seconds cache

  return result;
}

/**
 * Search products by name (fuzzy search)
 */
export async function searchProducts(query: string): Promise<SupplierPriceData[]> {
  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive',
      },
    },
    include: {
      supplier: true,
    },
    orderBy: {
      price: 'asc',
    },
    take: 20,
  });

  return products.map((p) => ({
    supplier: p.supplier.name,
    product: p.name,
    price: Number(p.price),
    unit: p.unit,
    supplierId: p.supplierId,
    productId: p.id,
  }));
}

/**
 * Get all products from a specific supplier
 */
export async function getSupplierProducts(supplierId: string) {
  return await prisma.product.findMany({
    where: {
      supplierId,
    },
    include: {
      supplier: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

/**
 * Get best price for a product across all suppliers
 */
export async function getBestPrice(productName: string): Promise<SupplierPriceData | null> {
  const prices = await getSupplierPrices(productName);
  return prices.length > 0 ? prices[0] : null; // Already sorted by price ascending
}

/**
 * Calculate total cost for multiple products
 */
export async function calculateTotalCost(
  items: Array<{ productName: string; quantity: number }>
): Promise<{
  items: Array<{
    productName: string;
    quantity: number;
    bestPrice: SupplierPriceData | null;
    total: number;
  }>;
  grandTotal: number;
}> {
  const calculations = await Promise.all(
    items.map(async (item) => {
      const bestPrice = await getBestPrice(item.productName);
      const total = bestPrice ? bestPrice.price * item.quantity : 0;

      return {
        productName: item.productName,
        quantity: item.quantity,
        bestPrice,
        total,
      };
    })
  );

  const grandTotal = calculations.reduce((sum, item) => sum + item.total, 0);

  return {
    items: calculations,
    grandTotal,
  };
}
