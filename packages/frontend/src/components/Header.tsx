'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { PWAInstallButton } from '@/components/PWAInstallButton';

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
              {/* Logo - Try JPG first (since we have logo.jpg), then PNG, then SVG */}
              <div className="relative h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                <Logo
                  src="/images/logo.jpg"
                  alt="ConstructionGuru"
                  width={48}
                  height={48}
                  priority
                  unoptimized
                />
              </div>
              {/* Company Name - Hidden on very small screens, shown on sm and up */}
              <div className="hidden sm:block">
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  ConstructionGuru
                </div>
              </div>
              {/* Mobile: Just show "ConstructionGuru" */}
              <div className="sm:hidden text-lg font-bold text-gray-900">
                ConstructionGuru
              </div>
            </Link>
          </div>
          
          {showAuthButtons && (
            <div className="flex items-center gap-2 sm:gap-4">
              <PWAInstallButton />
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

