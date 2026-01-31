'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-8">
          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/docs/product-overview" className="hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/docs/pricing" className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/docs/complete-roadmap" className="hover:text-white transition-colors">
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/docs/about" className="hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/docs/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/docs/careers" className="hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/docs/support" className="hover:text-white transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="hover:text-white transition-colors">
                  API
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/docs/privacy" className="hover:text-white transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/docs/terms" className="hover:text-white transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="relative h-10 w-10 flex-shrink-0">
                <Logo
                  src="/images/logo.jpg"
                  alt="ConstructionGuru"
                  width={40}
                  height={40}
                  unoptimized
                />
              </div>
              <div>
                <div className="text-base font-bold text-white">
                  ConstructionGuru
                </div>
                <div className="text-xs text-gray-400">
                  AI Assistant for Construction
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              © 2024 ConstructionGuru. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

