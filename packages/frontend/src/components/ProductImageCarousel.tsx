'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface ProductImageCarouselProps {
  images: string[] | Array<{ id: string; imageUrl: string }>;
  productName?: string;
}

export function ProductImageCarousel({ images, productName = 'Product' }: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  // Normalize images array - handle both string[] and object[] formats
  const normalizedImages = images.map((img, idx) => {
    if (typeof img === 'string') {
      return { id: `img-${idx}`, imageUrl: img };
    }
    return img;
  });

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? normalizedImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === normalizedImages.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="w-full">
      {/* Main Image Display */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gray-100 rounded-lg overflow-hidden mb-4">
        <Image
          src={normalizedImages[currentIndex].imageUrl}
          alt={`${productName} - Image ${currentIndex + 1}`}
          fill
          className="object-contain"
          unoptimized
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not available%3C/text%3E%3C/svg%3E';
          }}
        />

        {/* Navigation Arrows */}
        {normalizedImages.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors touch-target"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors touch-target"
              aria-label="Next image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        {normalizedImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
            {currentIndex + 1} / {normalizedImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {normalizedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {normalizedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all relative ${
                index === currentIndex
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={image.imageUrl}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23ddd" width="80" height="80"/%3E%3C/svg%3E';
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Touch/Swipe Support Info */}
      {normalizedImages.length > 1 && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Swipe or use arrows to view more images
        </p>
      )}
    </div>
  );
}

