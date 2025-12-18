'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: {
    id: string;
    sku: string;
    name: string;
    description: string | null;
    type?: 'product' | 'service';
    category: string | null;
    unit: string;
    supplierId: string;
    supplierName: string;
    supplierLogoUrl: string | null;
    productImageUrl: string | null;
    ratePerHour?: number | null;
    rateType?: 'per_hour' | 'per_project' | 'fixed' | 'negotiable' | null;
    location?: string | null;
    defaultPrice: {
      price: number;
      currency: string;
    } | null;
    privatePrice: {
      price: number | null;
      discountPercentage: number | null;
      calculatedPrice: number | null;
      currency: string;
    } | null;
  };
  onViewDetails: () => void;
}

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const isService = product.type === 'service';
  
  // For services, use rate per hour; for products, use price
  const hasSpecialPrice = !isService && product.privatePrice !== null && 
    (product.privatePrice.price !== null || product.privatePrice.calculatedPrice !== null);
  
  const displayPrice = !isService && hasSpecialPrice && product.privatePrice !== null && product.privatePrice.calculatedPrice !== null
    ? product.privatePrice.calculatedPrice
    : !isService && hasSpecialPrice && product.privatePrice !== null && product.privatePrice.price !== null
    ? product.privatePrice.price
    : !isService ? (product.defaultPrice?.price || null) : null;
  
  const priceCurrency = !isService && hasSpecialPrice && product.privatePrice !== null && product.privatePrice.currency
    ? product.privatePrice.currency
    : !isService ? (product.defaultPrice?.currency || 'USD') : 'USD';

  const discountPercentage = !isService ? (product.privatePrice?.discountPercentage || null) : null;
  
  // Service-specific pricing
  const ratePerHour = isService ? (product.ratePerHour || null) : null;
  const rateType = isService ? (product.rateType || 'per_hour') : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col h-full min-h-[320px]">
      {/* Product Image - 50% */}
      <div className="relative w-full h-[50%] min-h-[160px] bg-gray-100 overflow-hidden flex-shrink-0">
        {product.productImageUrl ? (
          <Image
            src={product.productImageUrl}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-400 mt-2">No Image</p>
            </div>
          </div>
        )}
      </div>

      {/* Product Details - 50% */}
      <div className="w-full h-[50%] min-h-[160px] p-2.5 sm:p-3 flex flex-col flex-shrink-0">
        {/* Product Name */}
        <div className="mb-1.5 flex-shrink-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 mb-1 leading-tight">
            {product.name}
          </h3>
          {product.category && (
            <span className="text-xs text-gray-500 block">{product.category.split('>').pop()?.trim()}</span>
          )}
        </div>

        {/* Supplier Info and Location - Compact */}
        <div className="mb-1.5 space-y-0.5 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {product.supplierLogoUrl ? (
              <div className="relative h-3.5 w-3.5 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                <Image
                  src={product.supplierLogoUrl}
                  alt={product.supplierName}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="h-3.5 w-3.5 rounded-full bg-gray-200 flex items-center justify-center text-[7px] font-semibold text-gray-600 flex-shrink-0">
                {product.supplierName.charAt(0).toUpperCase()}
              </div>
            )}
            <p className="text-xs text-gray-600 truncate flex-1">{product.supplierName}</p>
          </div>
          {product.location && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-xs text-gray-500 truncate">{product.location}</p>
            </div>
          )}
          <p className="text-xs text-gray-400">{product.unit}</p>
        </div>

        {/* Pricing / Rate */}
        <div className="mb-2 mt-auto flex-shrink-0">
          {isService ? (
            // Service Card: Show rate per hour
            ratePerHour !== null ? (
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-blue-600">
                    {rateType === 'per_hour' && `$${ratePerHour.toFixed(2)}/hr`}
                    {rateType === 'per_project' && `$${ratePerHour.toFixed(2)}/proj`}
                    {rateType === 'fixed' && `$${ratePerHour.toFixed(2)}`}
                    {rateType === 'negotiable' && `From $${ratePerHour.toFixed(2)}/hr`}
                    {!rateType && `$${ratePerHour.toFixed(2)}/hr`}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Rate not set</p>
            )
          ) : (
            // Product Card: Show price
            displayPrice !== null ? (
              <div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  {hasSpecialPrice && product.defaultPrice && (
                    <span className="text-xs text-gray-400 line-through">
                      {product.defaultPrice.currency} {product.defaultPrice.price.toFixed(2)}
                    </span>
                  )}
                  <span className="text-lg font-bold text-gray-900">
                    {priceCurrency} {displayPrice.toFixed(2)}
                  </span>
                  {hasSpecialPrice && discountPercentage !== null && (
                    <span className="text-xs text-green-600 font-semibold">
                      ({discountPercentage.toFixed(0)}% off)
                    </span>
                  )}
                  {hasSpecialPrice && discountPercentage === null && (
                    <span className="text-xs text-green-600 font-semibold">Special</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Price not available</p>
            )
          )}
        </div>
        
        {/* View Details Button */}
        <Button
          onClick={onViewDetails}
          className={`w-full h-8 sm:h-9 text-xs font-medium flex-shrink-0 ${
            isService ? 'bg-blue-600 hover:bg-blue-700' : ''
          }`}
          variant={isService ? 'default' : 'default'}
        >
          {isService ? 'View Service' : 'View Details'}
        </Button>
      </div>
    </div>
  );
}

