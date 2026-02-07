'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';

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

interface CatalogCategory {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  level: number;
  display_order: number;
  parent_name: string | null;
  parent_code: string | null;
}

interface CatalogGridProps {
  onEditItem?: (item: CatalogItem) => void;
  onAddProduct?: () => void;
}

interface CategoryColumn {
  mainCategory: string;
  subcategory: string;
  itemGroup: string;
  categoryCode: string;
  items: CatalogItem[];
}

interface FilterState {
  mainCategoryId: string;
  subcategoryId: string;
  itemGroupId: string;
  stockAvailability: string;
  minPrice: string;
  maxPrice: string;
  currency: string;
}

export function CatalogGrid({ onEditItem, onAddProduct }: CatalogGridProps) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [columns, setColumns] = useState<CategoryColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    mainCategoryId: '',
    subcategoryId: '',
    itemGroupId: '',
    stockAvailability: '',
    minPrice: '',
    maxPrice: '',
    currency: '',
  });

  useEffect(() => {
    loadSupplierItems();
    loadCatalogCategories();
  }, []);

  useEffect(() => {
    organizeItemsIntoColumns();
  }, [items, searchQuery, filters]);

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

  const loadCatalogCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await apiGet<{ categories: CatalogCategory[] }>('/api/v1/catalog/categories');
      setCatalogCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to load catalog categories:', error);
      setCatalogCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const getMainCategories = () => {
    return catalogCategories
      .filter(c => c.level === 1)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const getSubcategories = (mainCategoryId: string) => {
    if (!mainCategoryId) return [];
    return catalogCategories
      .filter(c => c.parent_id === mainCategoryId && c.level === 2)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const getItemGroups = (subcategoryId: string) => {
    if (!subcategoryId) return [];
    return catalogCategories
      .filter(c => c.parent_id === subcategoryId && c.level === 3)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const organizeItemsIntoColumns = () => {
    let filteredItems = items;

    // Apply search query (enhanced to include SKU, unit, price)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredItems = filteredItems.filter((item) => {
        const matchesName = 
          item.catalog_item_name?.toLowerCase().includes(query) ||
          item.product_name?.toLowerCase().includes(query);
        const matchesSKU = item.product_sku?.toLowerCase().includes(query);
        const matchesUnit = item.unit?.toLowerCase().includes(query);
        const matchesCategory = 
          item.main_category_name?.toLowerCase().includes(query) ||
          item.subcategory_name?.toLowerCase().includes(query) ||
          item.category_name?.toLowerCase().includes(query);
        const matchesPrice = item.default_price?.toString().includes(query);
        
        return matchesName || matchesSKU || matchesUnit || matchesCategory || matchesPrice;
      });
    }

    // Apply category filters
    if (filters.mainCategoryId) {
      filteredItems = filteredItems.filter(item => 
        item.main_category_code === catalogCategories.find(c => c.id === filters.mainCategoryId)?.code
      );
    }
    if (filters.subcategoryId) {
      filteredItems = filteredItems.filter(item => 
        item.subcategory_code === catalogCategories.find(c => c.id === filters.subcategoryId)?.code
      );
    }
    if (filters.itemGroupId) {
      filteredItems = filteredItems.filter(item => 
        item.category_id === filters.itemGroupId || item.category_code === catalogCategories.find(c => c.id === filters.itemGroupId)?.code
      );
    }

    // Apply stock availability filter
    if (filters.stockAvailability) {
      filteredItems = filteredItems.filter(item => {
        const stock = item.stock_availability?.toLowerCase() || '';
        switch (filters.stockAvailability) {
          case 'in_stock':
            return stock.includes('in stock') || stock.includes('available');
          case 'out_of_stock':
            return stock.includes('out of stock') || stock.includes('unavailable');
          case 'low_stock':
            return stock.includes('low stock');
          default:
            return true;
        }
      });
    }

    // Apply price range filter
    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      filteredItems = filteredItems.filter(item => 
        item.default_price !== null && item.default_price >= minPrice
      );
    }
    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      filteredItems = filteredItems.filter(item => 
        item.default_price !== null && item.default_price <= maxPrice
      );
    }

    // Apply currency filter
    if (filters.currency) {
      filteredItems = filteredItems.filter(item => 
        item.currency === filters.currency
      );
    }

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

  const clearFilters = () => {
    setFilters({
      mainCategoryId: '',
      subcategoryId: '',
      itemGroupId: '',
      stockAvailability: '',
      minPrice: '',
      maxPrice: '',
      currency: '',
    });
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return !!(
      filters.mainCategoryId ||
      filters.subcategoryId ||
      filters.itemGroupId ||
      filters.stockAvailability ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.currency ||
      searchQuery
    );
  };

  return (
    <div className="w-full">
      {/* Search and Filter Bar */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2 items-center">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search by name, SKU, unit, category, price..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            type="button"
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            size="sm"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          {hasActiveFilters() && (
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Main Category Filter */}
              <div>
                <Label htmlFor="filter-main-category" className="text-xs">Main Category</Label>
                <select
                  id="filter-main-category"
                  value={filters.mainCategoryId}
                  onChange={(e) => {
                    setFilters(prev => ({
                      ...prev,
                      mainCategoryId: e.target.value,
                      subcategoryId: '', // Reset subcategory when main changes
                      itemGroupId: '', // Reset item group when main changes
                    }));
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                >
                  <option value="">All Main Categories</option>
                  {getMainCategories().map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory Filter */}
              <div>
                <Label htmlFor="filter-subcategory" className="text-xs">Subcategory</Label>
                <select
                  id="filter-subcategory"
                  value={filters.subcategoryId}
                  onChange={(e) => {
                    setFilters(prev => ({
                      ...prev,
                      subcategoryId: e.target.value,
                      itemGroupId: '', // Reset item group when subcategory changes
                    }));
                  }}
                  disabled={!filters.mainCategoryId}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs disabled:opacity-50"
                >
                  <option value="">All Subcategories</option>
                  {getSubcategories(filters.mainCategoryId).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Group Filter */}
              <div>
                <Label htmlFor="filter-item-group" className="text-xs">Item Group</Label>
                <select
                  id="filter-item-group"
                  value={filters.itemGroupId}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, itemGroupId: e.target.value }));
                  }}
                  disabled={!filters.subcategoryId}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs disabled:opacity-50"
                >
                  <option value="">All Item Groups</option>
                  {getItemGroups(filters.subcategoryId).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Availability Filter */}
              <div>
                <Label htmlFor="filter-stock" className="text-xs">Stock Status</Label>
                <select
                  id="filter-stock"
                  value={filters.stockAvailability}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, stockAvailability: e.target.value }));
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                >
                  <option value="">All Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="low_stock">Low Stock</option>
                </select>
              </div>

              {/* Min Price Filter */}
              <div>
                <Label htmlFor="filter-min-price" className="text-xs">Min Price</Label>
                <Input
                  id="filter-min-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={filters.minPrice}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, minPrice: e.target.value }));
                  }}
                  className="h-9 text-xs"
                />
              </div>

              {/* Max Price Filter */}
              <div>
                <Label htmlFor="filter-max-price" className="text-xs">Max Price</Label>
                <Input
                  id="filter-max-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="999999.99"
                  value={filters.maxPrice}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, maxPrice: e.target.value }));
                  }}
                  className="h-9 text-xs"
                />
              </div>

              {/* Currency Filter */}
              <div>
                <Label htmlFor="filter-currency" className="text-xs">Currency</Label>
                <select
                  id="filter-currency"
                  value={filters.currency}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, currency: e.target.value }));
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                >
                  <option value="">All Currencies</option>
                  <option value="USD">USD</option>
                  <option value="SGD">SGD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <div className="inline-flex gap-4 min-w-full">
          {/* Add Product Column - First Column */}
          {onAddProduct && (
            <div className="flex-shrink-0 w-80 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-6">
                <div className="bg-blue-500 rounded-full p-4 mb-4">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New Product</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Create a new product and add it to your catalog
                </p>
                <Button
                  type="button"
                  onClick={onAddProduct}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>
          )}

          {columns.length === 0 ? (
            <div className="w-full text-center py-12 text-gray-500">
              {hasActiveFilters() 
                ? 'No items found matching your filters. Try adjusting your search criteria.'
                : 'No items found. Add products to see them organized by category.'}
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
