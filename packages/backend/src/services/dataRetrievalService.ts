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
  // Filter at database level to ensure supplierId is not null and supplier exists
  // Use raw query to handle cases where supplierId might be null in database but required in schema
  const searchPattern = `%${productName}%`;
  const products = await prisma.$queryRaw<Array<{
    id: string;
    supplier_id: string;
    name: string;
    price: any; // Decimal from DB
    unit: string;
    supplier_name: string;
  }>>`
    SELECT 
      p.id,
      p.supplier_id,
      p.name,
      p.price,
      p.unit,
      o.name as supplier_name
    FROM products p
    INNER JOIN organizations o ON p.supplier_id = o.id
    WHERE 
      p.name ILIKE ${searchPattern}
      AND p.price IS NOT NULL
      AND p.supplier_id IS NOT NULL
      AND o.type = 'supplier'
    ORDER BY p.price ASC
    LIMIT 10
  `;

  // Map to result format
  const result = products.map((p) => ({
    supplier: p.supplier_name,
    product: p.name,
    price: Number(p.price),
    unit: p.unit,
    supplierId: p.supplier_id,
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
  // Use raw query to filter at database level
  const searchPattern = `%${query}%`;
  const products = await prisma.$queryRaw<Array<{
    id: string;
    supplier_id: string;
    name: string;
    price: any; // Decimal from DB
    unit: string;
    supplier_name: string;
  }>>`
    SELECT 
      p.id,
      p.supplier_id,
      p.name,
      p.price,
      p.unit,
      o.name as supplier_name
    FROM products p
    INNER JOIN organizations o ON p.supplier_id = o.id
    WHERE 
      p.name ILIKE ${searchPattern}
      AND p.price IS NOT NULL
      AND p.supplier_id IS NOT NULL
      AND o.type = 'supplier'
    ORDER BY p.price ASC
    LIMIT 20
  `;

  return products.map((p) => ({
    supplier: p.supplier_name,
    product: p.name,
    price: Number(p.price),
    unit: p.unit,
    supplierId: p.supplier_id,
    productId: p.id,
  }));
}

/**
 * Get all products from a specific supplier
 */
export async function getSupplierProducts(supplierId: string) {
  // Use raw query to ensure supplier exists and filter null prices
  const products = await prisma.$queryRaw<Array<{
    id: string;
    supplier_id: string;
    name: string;
    price: any; // Decimal from DB
    unit: string;
    supplier_name: string;
  }>>`
    SELECT 
      p.id,
      p.supplier_id,
      p.name,
      p.price,
      p.unit,
      o.name as supplier_name
    FROM products p
    INNER JOIN organizations o ON p.supplier_id = o.id
    WHERE 
      p.supplier_id = ${supplierId}::uuid
      AND p.price IS NOT NULL
      AND o.type = 'supplier'
    ORDER BY p.name ASC
  `;

  return products;
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
