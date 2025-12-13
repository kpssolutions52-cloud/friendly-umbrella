'use client';

import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          {/* Powered By Text */}
          <div className="text-sm sm:text-base text-gray-600 font-medium">
            Powered By
          </div>
          
          {/* Logo and Company Name */}
          <Link 
            href="/" 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
              <Image
                src="/images/logo.jpg"
                alt="ALLIED DIGITAL & EVENTS PTE. LTD."
                width={48}
                height={48}
                className="object-contain"
                onError={(e) => {
                  // Fallback chain: JPG -> PNG -> SVG
                  const target = e.target as HTMLImageElement;
                  if (target.src.endsWith('.jpg') || target.src.endsWith('.jpeg')) {
                    target.src = '/images/logo.png';
                  } else if (target.src.endsWith('.png')) {
                    target.src = '/images/logo.svg';
                  } else {
                    // If all fail, hide image
                    target.style.display = 'none';
                  }
                }}
                unoptimized
              />
            </div>
            <div className="text-center sm:text-left">
              <div className="text-base sm:text-lg font-bold text-gray-900">
                ALLIED
              </div>
              <div className="text-xs sm:text-sm font-semibold text-gray-700 -mt-0.5">
                DIGITAL & EVENTS PTE. LTD.
              </div>
            </div>
          </Link>
        </div>
      </div>
    </footer>
  );
}

