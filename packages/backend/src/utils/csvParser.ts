import { parse } from 'csv-parse/sync';
import createError from 'http-errors';

// Note: csv-parse package needs to be installed: npm install csv-parse

export interface RFQCSVRow {
  title: string;
  description?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  requestedPrice?: number;
  currency?: string;
  expiresAt?: string; // ISO date string
  supplierId?: string; // Optional - UUID of supplier
}

export interface ParsedRFQData {
  valid: RFQCSVRow[];
  invalid: Array<{ row: number; data: any; errors: string[] }>;
}

/**
 * Parse CSV file and validate RFQ data
 */
export function parseRFQCSV(fileBuffer: Buffer): ParsedRFQData {
  const valid: RFQCSVRow[] = [];
  const invalid: Array<{ row: number; data: any; errors: string[] }> = [];

  try {
    // Parse CSV
    const records = parse(fileBuffer.toString('utf-8'), {
      columns: true, // Use first row as headers
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    // Validate each row
    records.forEach((record: any, index: number) => {
      const rowNumber = index + 2; // +2 because index is 0-based and we skip header
      const errors: string[] = [];

      // Required fields
      if (!record.title || !record.title.trim()) {
        errors.push('Title is required');
      } else if (record.title.trim().length < 3) {
        errors.push('Title must be at least 3 characters');
      } else if (record.title.trim().length > 200) {
        errors.push('Title must be less than 200 characters');
      }

      // Optional fields validation
      if (record.quantity && isNaN(parseFloat(record.quantity))) {
        errors.push('Quantity must be a valid number');
      }

      if (record.requestedPrice && isNaN(parseFloat(record.requestedPrice))) {
        errors.push('Requested Price must be a valid number');
      }

      if (record.currency && record.currency.length !== 3) {
        errors.push('Currency must be 3 characters (e.g., USD, SGD)');
      }

      if (record.expiresAt) {
        const date = new Date(record.expiresAt);
        if (isNaN(date.getTime())) {
          errors.push('Expires At must be a valid date (YYYY-MM-DD or ISO format)');
        } else if (date < new Date()) {
          errors.push('Expires At must be a future date');
        }
      }

      if (record.supplierId && !isValidUUID(record.supplierId)) {
        errors.push('Supplier ID must be a valid UUID');
      }

      // If there are errors, add to invalid
      if (errors.length > 0) {
        invalid.push({
          row: rowNumber,
          data: record,
          errors,
        });
      } else {
        // Add to valid
        valid.push({
          title: record.title.trim(),
          description: record.description?.trim() || undefined,
          category: record.category?.trim() || undefined,
          quantity: record.quantity ? parseFloat(record.quantity) : undefined,
          unit: record.unit?.trim() || undefined,
          requestedPrice: record.requestedPrice ? parseFloat(record.requestedPrice) : undefined,
          currency: record.currency?.trim().toUpperCase() || 'USD',
          expiresAt: record.expiresAt ? new Date(record.expiresAt).toISOString() : undefined,
          supplierId: record.supplierId?.trim() || undefined,
        });
      }
    });

    return { valid, invalid };
  } catch (error: any) {
    throw createError(400, `Failed to parse CSV: ${error.message}`);
  }
}

/**
 * Simple UUID validation
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}



