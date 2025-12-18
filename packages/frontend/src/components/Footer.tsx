'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';

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
              <Logo
                src="/images/logo.jpg"
                alt="ConstructionGuru"
                width={48}
                height={48}
                unoptimized
              />
            </div>
            <div className="text-center sm:text-left">
              <div className="text-base sm:text-lg font-bold text-gray-900">
                ConstructionGuru
              </div>
              <div className="text-xs sm:text-sm font-semibold text-gray-700 -mt-0.5">
                Real-Time Pricing for Construction Professionals
              </div>
            </div>
          </Link>
        </div>
      </div>
    </footer>
  );
}

