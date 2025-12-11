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
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col">
      {/* Product Image */}
      <div className="relative w-full h-48 sm:h-56 bg-gray-100 overflow-hidden">
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

      {/* Product Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Product Name and SKU */}
        <div className="mb-3 flex-1">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 mb-1.5 leading-tight">
            {product.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">SKU: {product.sku}</p>
        </div>

        {/* Supplier Info */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
          {product.supplierLogoUrl ? (
            <div className="relative h-6 w-6 rounded-full overflow-hidden border border-gray-200">
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
            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
              {product.supplierName.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="text-xs text-gray-600 truncate flex-1">{product.supplierName}</p>
        </div>

        {/* Category and Unit */}
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
          {product.category && (
            <span className="px-2 py-1 bg-gray-100 rounded">{product.category}</span>
          )}
          <span>{product.unit}</span>
        </div>

        {/* Pricing / Rate */}
        <div className="mb-4">
          {isService ? (
            // Service Card: Show rate per hour
            ratePerHour !== null ? (
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xl sm:text-2xl font-bold text-blue-600">
                    {rateType === 'per_hour' && `$${ratePerHour.toFixed(2)}/hr`}
                    {rateType === 'per_project' && `$${ratePerHour.toFixed(2)}/project`}
                    {rateType === 'fixed' && `$${ratePerHour.toFixed(2)}`}
                    {rateType === 'negotiable' && `From $${ratePerHour.toFixed(2)}/hr`}
                    {!rateType && `$${ratePerHour.toFixed(2)}/hr`}
                  </span>
                </div>
                {rateType === 'negotiable' && (
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1.5">Negotiable rates available</p>
                )}
                {rateType === 'per_project' && (
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1.5">Project-based pricing</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Rate not set</p>
            )
          ) : (
            // Product Card: Show price
            displayPrice !== null ? (
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  {hasSpecialPrice && product.defaultPrice && (
                    <span className="text-xs sm:text-sm text-gray-400 line-through">
                      {product.defaultPrice.currency} {product.defaultPrice.price.toFixed(2)}
                    </span>
                  )}
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">
                    {priceCurrency} {displayPrice.toFixed(2)}
                  </span>
                </div>
                {hasSpecialPrice && discountPercentage !== null && (
                  <p className="text-xs sm:text-sm text-green-600 font-semibold mt-1.5 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {discountPercentage.toFixed(1)}% savings
                  </p>
                )}
                {hasSpecialPrice && discountPercentage === null && (
                  <p className="text-xs sm:text-sm text-green-600 font-semibold mt-1.5">Special rate</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Price not available</p>
            )
          )}
        </div>
        
        {/* Service Description */}
        {isService && product.description && (
          <div className="mb-3">
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{product.description}</p>
          </div>
        )}

        {/* View Details Button */}
        <Button
          onClick={onViewDetails}
          className={`w-full touch-target h-11 sm:h-12 text-sm sm:text-base font-semibold ${
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

