'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CatalogItem {
  product_id?: string;
  product_name?: string;
  product_sku?: string;
  catalog_item_id: string | null;
  catalog_item_name: string | null;
  category_id: string | null;
  category_name: string | null;
  category_code: string | null;
  subcategory_name: string | null;
  subcategory_code: string | null;
  main_category_name: string | null;
  main_category_code: string | null;
  unit: string;
  stock_availability: string | null;
  default_price: number | null;
  currency: string | null;
}

interface CatalogGridProps {
  onEditItem?: (item: CatalogItem) => void;
}

interface CategoryColumn {
  mainCategory: string;
  subcategory: string;
  itemGroup: string;
  categoryCode: string;
  items: CatalogItem[];
}

export function CatalogGrid({ onEditItem }: CatalogGridProps) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [columns, setColumns] = useState<CategoryColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSupplierItems();
  }, []);

  useEffect(() => {
    organizeItemsIntoColumns();
  }, [items, searchQuery]);

  const loadSupplierItems = async () => {
    try {
      setLoading(true);
      const response = await apiGet<{ items: CatalogItem[] }>('/api/v1/catalog/supplier-items');
      setItems(response.items || []);
    } catch (error) {
      console.error('Failed to load supplier items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const organizeItemsIntoColumns = () => {
    const filteredItems = searchQuery
      ? items.filter(
          (item) =>
            item.catalog_item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.main_category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.subcategory_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : items;

    // Group items by category hierarchy
    const columnMap = new Map<string, CategoryColumn>();

    filteredItems.forEach((item) => {
      const mainCat = item.main_category_name || 'Uncategorized';
      const subCat = item.subcategory_name || 'General';
      const itemGroup = item.category_name || 'Items';
      const categoryCode = item.category_code || item.category_id || '';

      const key = `${mainCat}|||${subCat}|||${itemGroup}`;

      if (!columnMap.has(key)) {
        columnMap.set(key, {
          mainCategory: mainCat,
          subcategory: subCat,
          itemGroup: itemGroup,
          categoryCode: categoryCode,
          items: [],
        });
      }

      columnMap.get(key)!.items.push(item);
    });

    // Sort columns by main category, then subcategory, then item group
    const sortedColumns = Array.from(columnMap.values()).sort((a, b) => {
      if (a.mainCategory !== b.mainCategory) {
        return a.mainCategory.localeCompare(b.mainCategory);
      }
      if (a.subcategory !== b.subcategory) {
        return a.subcategory.localeCompare(b.subcategory);
      }
      return a.itemGroup.localeCompare(b.itemGroup);
    });

    setColumns(sortedColumns);
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return '-';
    const currencySymbol = currency === 'USD' ? '$' : currency === 'SGD' ? 'S$' : currency || '';
    return `${currencySymbol}${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search items, categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <div className="inline-flex gap-4 min-w-full">
          {columns.length === 0 ? (
            <div className="w-full text-center py-12 text-gray-500">
              No items found. Add products to see them organized by category.
            </div>
          ) : (
            columns.map((column, colIndex) => (
              <div
                key={`${column.categoryCode}-${colIndex}`}
                className="flex-shrink-0 w-80 border border-gray-200 rounded-lg bg-white shadow-sm"
              >
                {/* Column Header */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 border-b border-gray-200 rounded-t-lg">
                  <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                    {column.mainCategory}
                  </div>
                  <div className="text-sm font-medium text-gray-700 mt-1">
                    {column.subcategory}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {column.itemGroup}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {column.items.length} item{column.items.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Column Items */}
                <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                  {column.items.map((item, itemIndex) => (
                    <div
                      key={`${item.product_id || item.catalog_item_id}-${itemIndex}`}
                      className="border border-gray-200 rounded p-3 hover:shadow-md transition-shadow bg-white"
                    >
                      {/* Item Name */}
                      <div className="font-medium text-sm text-gray-900 mb-2">
                        {item.product_name || item.catalog_item_name || 'Unnamed Item'}
                      </div>

                      {/* SKU */}
                      {item.product_sku && (
                        <div className="text-xs text-gray-500 mb-2">
                          SKU: {item.product_sku}
                        </div>
                      )}

                      {/* Price and Stock Row */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-gray-500">Price</div>
                          <div className="font-semibold text-gray-900">
                            {formatPrice(item.default_price, item.currency)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Stock</div>
                          <div
                            className={`font-semibold ${
                              item.stock_availability?.toLowerCase().includes('in stock') ||
                              item.stock_availability?.toLowerCase().includes('available')
                                ? 'text-green-600'
                                : item.stock_availability?.toLowerCase().includes('out of stock')
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {item.stock_availability || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Unit */}
                      <div className="text-xs text-gray-400 mt-1">
                        Unit: {item.unit}
                      </div>

                      {/* Edit Button */}
                      {onEditItem && item.product_id && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onEditItem(item)}
                            className="w-full text-xs"
                          >
                            Edit Product
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
