'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  showAuthButtons?: boolean;
  className?: string;
}

export function Header({ showAuthButtons = true, className = '' }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <header className={`bg-white shadow-md sticky top-0 z-40 border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              {/* Logo - Try SVG first, fallback to PNG */}
              <div className="relative h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                <Image
                  src="/images/logo.svg"
                  alt="ALLIED DIGITAL & EVENTS"
                  width={48}
                  height={48}
                  className="object-contain"
                  onError={(e) => {
                    // Fallback to PNG if SVG doesn't exist
                    const target = e.target as HTMLImageElement;
                    if (target.src.endsWith('.svg')) {
                      target.src = '/images/logo.png';
                    } else {
                      // If both fail, hide image and show text
                      target.style.display = 'none';
                    }
                  }}
                  priority
                />
              </div>
              {/* Company Name - Hidden on very small screens, shown on sm and up */}
              <div className="hidden sm:block">
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  ALLIED
                </div>
                <div className="text-xs sm:text-sm font-semibold text-gray-700 -mt-1">
                  DIGITAL & EVENTS
                </div>
              </div>
              {/* Mobile: Just show "ALLIED" */}
              <div className="sm:hidden text-lg font-bold text-gray-900">
                ALLIED
              </div>
            </Link>
          </div>
          
          {showAuthButtons && (
            <div className="flex items-center gap-2 sm:gap-4">
              {user ? (
                <>
                  <span className="hidden sm:inline text-sm text-gray-600">
                    {user.firstName} {user.lastName}
                  </span>
                  {user.role === 'customer' ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push('/auth/logout')} 
                      className="text-xs sm:text-sm"
                    >
                      Logout
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        if (user.role === 'super_admin') {
                          router.push('/admin/dashboard');
                        } else if (user.tenant?.type === 'supplier') {
                          router.push('/supplier/dashboard');
                        } else if (user.tenant?.type === 'service_provider') {
                          router.push('/service-provider/dashboard');
                        } else {
                          router.push('/company/dashboard');
                        }
                      }} 
                      className="text-xs sm:text-sm"
                    >
                      Dashboard
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm" className="text-xs sm:text-sm">
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

