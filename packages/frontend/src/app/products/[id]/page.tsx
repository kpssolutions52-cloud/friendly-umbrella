'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import { ProductImageCarousel } from '@/components/ProductImageCarousel';
import Image from 'next/image';
import Link from 'next/link';

interface ProductDetails {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  supplierId: string;
  supplierName: string;
  supplierLogoUrl: string | null;
  productImageUrl: string | null;
  price: number | null;
  priceType: 'default' | 'private' | null;
  currency: string | null;
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
  images?: Array<{
    id: string;
    imageUrl: string;
    displayOrder: number;
  }>;
}

interface SupplierDetails {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  _count: {
    products: number;
  };
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supplierDetails, setSupplierDetails] = useState<SupplierDetails | null>(null);
  const [loadingSupplier, setLoadingSupplier] = useState(false);
  const [showSupplierDetails, setShowSupplierDetails] = useState(false);

  const fetchProductDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch product directly by ID using public endpoint
      const response = await apiGet<{ product: ProductDetails }>(
        `/api/v1/products/public/${productId}`
      );
      
      if (response.product) {
        // Use product images from response, or fallback to productImageUrl
        const productWithImages: ProductDetails = {
          ...response.product,
          images: response.product.images && response.product.images.length > 0
            ? response.product.images
            : response.product.productImageUrl
            ? [{
                id: 'main',
                imageUrl: response.product.productImageUrl,
                displayOrder: 0,
              }]
            : [],
        };
        setProduct(productWithImages);
      } else {
        setError('Product not found');
      }
    } catch (err: any) {
      console.error('Failed to fetch product:', err);
      setError(err?.error?.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      const returnUrl = `/products/${productId}`;
      router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    
    if (productId && user) {
      fetchProductDetails();
    }
  }, [productId, user, authLoading, router, fetchProductDetails]);

  const hasSpecialPrice = product?.privatePrice !== null && 
    (product?.privatePrice?.price !== null || product?.privatePrice?.calculatedPrice !== null);
  
  const displayPrice = hasSpecialPrice && product?.privatePrice && product.privatePrice.calculatedPrice !== null
    ? product.privatePrice.calculatedPrice
    : hasSpecialPrice && product?.privatePrice && product.privatePrice.price !== null
    ? product.privatePrice.price
    : product?.defaultPrice?.price || null;
  
  const priceCurrency = hasSpecialPrice && product?.privatePrice && product.privatePrice.currency
    ? product.privatePrice.currency
    : product?.defaultPrice?.currency || 'USD';

  const discountPercentage = product?.privatePrice?.discountPercentage || null;

  const fetchSupplierDetails = useCallback(async (supplierId: string) => {
    if (supplierDetails) {
      // Already loaded, just toggle display
      setShowSupplierDetails(!showSupplierDetails);
      return;
    }

    try {
      setLoadingSupplier(true);
      const response = await apiGet<{ supplier: SupplierDetails }>(
        `/api/v1/suppliers/public/${supplierId}`
      );
      if (response.supplier) {
        setSupplierDetails(response.supplier);
        setShowSupplierDetails(true);
      }
    } catch (err: any) {
      console.error('Failed to fetch supplier details:', err);
      setError(err?.error?.message || 'Failed to load supplier details');
    } finally {
      setLoadingSupplier(false);
    }
  }, [supplierDetails, showSupplierDetails]);

  const handleContactSupplier = () => {
    if (product?.supplierId) {
      fetchSupplierDetails(product.supplierId);
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <Button onClick={() => router.push('/')} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header - Mobile Optimized */}
      <header className="bg-white shadow-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex items-center gap-2 sm:gap-4">
              {!user && (
                <>
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">Sign In</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm" className="text-xs sm:text-sm">Register</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Product Details - Mobile Optimized */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
            {/* Product Images - Mobile Optimized */}
            <div className="lg:sticky lg:top-24">
              {product.images && product.images.length > 0 ? (
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <ProductImageCarousel images={product.images.map(img => img.imageUrl)} productName={product.name} />
                </div>
              ) : product.productImageUrl ? (
                <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-lg">
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
                </div>
              ) : (
                <div className="relative w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <svg className="w-20 h-20 sm:w-24 sm:h-24 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400 mt-4 text-sm sm:text-base">No Image Available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Product Information - Mobile Optimized */}
            <div className="flex flex-col">
              {/* Product Name and SKU */}
              <div className="mb-4 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h1>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">SKU: {product.sku}</p>
              </div>

              {/* Supplier Info */}
              <div className="flex items-center gap-3 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
                {product.supplierLogoUrl ? (
                  <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden border-2 border-gray-200">
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
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-base sm:text-lg font-bold text-white shadow-md">
                    {product.supplierName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Supplier</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{product.supplierName}</p>
                </div>
              </div>

              {/* Category and Unit */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                {product.category && (
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1.5">Category</p>
                    <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg text-xs sm:text-sm font-semibold text-blue-700">
                      {product.category}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1.5">Unit</p>
                  <span className="text-sm sm:text-base font-bold text-gray-900">{product.unit}</span>
                </div>
              </div>

              {/* Pricing - Mobile Optimized */}
              <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-200">
                <p className="text-xs sm:text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Pricing</p>
                {displayPrice !== null ? (
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mb-2">
                      {hasSpecialPrice && product.defaultPrice && (
                        <span className="text-sm sm:text-lg text-gray-400 line-through">
                          {product.defaultPrice.currency} {product.defaultPrice.price.toFixed(2)}
                        </span>
                      )}
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                        {priceCurrency} {displayPrice.toFixed(2)}
                      </span>
                    </div>
                    {hasSpecialPrice && discountPercentage !== null && (
                      <div className="flex items-center gap-2 mt-2">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm sm:text-base text-green-600 font-bold">
                          {discountPercentage.toFixed(1)}% savings applied
                        </p>
                      </div>
                    )}
                    {hasSpecialPrice && discountPercentage === null && (
                      <p className="text-sm sm:text-base text-green-600 font-semibold mt-2">Special rate available</p>
                    )}
                    {!hasSpecialPrice && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">Default price</p>
                    )}
                  </div>
                ) : (
                  <p className="text-lg sm:text-xl text-gray-400">Price not available</p>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-4 sm:mb-6">
                  <p className="text-xs sm:text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Description</p>
                  <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Call to Action - Mobile Optimized */}
              <div className="mt-auto pt-4 sm:pt-6 border-t border-gray-200 space-y-4">
                {!user && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm sm:text-base text-blue-900 font-semibold mb-1">
                          Want better prices?
                        </p>
                        <p className="text-xs sm:text-sm text-blue-700">
                          Register as a company to access special pricing and exclusive discounts.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  {user ? (
                    <Button 
                      onClick={handleContactSupplier}
                      className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all" 
                      size="lg"
                    >
                      Contact Supplier
                    </Button>
                  ) : (
                    <Link href="/auth/register" className="flex-1">
                      <Button 
                        className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all" 
                        size="lg"
                      >
                        Register for Better Prices
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Supplier Details Section */}
                {showSupplierDetails && supplierDetails && (
                  <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 sm:p-6 shadow-lg">
                    <div className="flex items-start gap-4 mb-4">
                      {supplierDetails.logoUrl ? (
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden border-2 border-blue-300 flex-shrink-0">
                          <Image
                            src={supplierDetails.logoUrl}
                            alt={supplierDetails.name}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-md flex-shrink-0">
                          {supplierDetails.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{supplierDetails.name}</h3>
                        {supplierDetails._count.products > 0 && (
                          <p className="text-sm sm:text-base text-gray-600">
                            {supplierDetails._count.products} {supplierDetails._count.products === 1 ? 'product' : 'products'} available
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4 pt-4 border-t border-blue-200">
                      {supplierDetails.email && (
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">Email</p>
                            <a 
                              href={`mailto:${supplierDetails.email}`}
                              className="text-sm sm:text-base text-blue-700 hover:text-blue-900 font-medium break-all"
                            >
                              {supplierDetails.email}
                            </a>
                          </div>
                        </div>
                      )}

                      {supplierDetails.phone && (
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">Phone</p>
                            <a 
                              href={`tel:${supplierDetails.phone}`}
                              className="text-sm sm:text-base text-blue-700 hover:text-blue-900 font-medium"
                            >
                              {supplierDetails.phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {supplierDetails.address && (
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">Address</p>
                            <p className="text-sm sm:text-base text-gray-700 font-medium whitespace-pre-line">
                              {supplierDetails.address}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {loadingSupplier && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-blue-700">Loading supplier details...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
