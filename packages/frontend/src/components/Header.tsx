'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { MessageSquare, Package, LayoutDashboard, LogOut } from 'lucide-react';

interface HeaderProps {
  showAuthButtons?: boolean;
  className?: string;
}

export function Header({ showAuthButtons = true, className = '' }: HeaderProps) {
  const { user, logout } = useAuth();
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
            <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-4 flex-shrink-0">
              <div className="hidden sm:block">
                <PWAInstallButton />
              </div>
              {user ? (
                <>
                  <span className="hidden lg:inline text-xs sm:text-sm text-gray-600 truncate max-w-[120px]">
                    {user.firstName} {user.lastName}
                  </span>
                  
                  {/* MVP 1: Show navigation links based on user type */}
                  {user.type === 'qs' && (
                    <Link href="/chat" className="flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs sm:text-sm touch-target px-2 sm:px-3"
                      >
                        <MessageSquare className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">AI Chat</span>
                        <span className="sm:hidden">Chat</span>
                      </Button>
                    </Link>
                  )}
                  
                  {(user.type === 'supplier' || user.tenant?.type === 'supplier') && (
                    <>
                      <Link href="/supplier/chat" className="flex-shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs sm:text-sm touch-target px-2 sm:px-3"
                        >
                          <MessageSquare className="h-4 w-4 sm:mr-1.5" />
                          <span className="hidden sm:inline">AI Chat</span>
                          <span className="sm:hidden">Chat</span>
                        </Button>
                      </Link>
                      <Link href="/supplier/products" className="flex-shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs sm:text-sm touch-target px-2 sm:px-3"
                        >
                          <Package className="h-4 w-4 sm:mr-1.5" />
                          <span className="hidden sm:inline">Products</span>
                          <span className="sm:hidden">Items</span>
                        </Button>
                      </Link>
                    </>
                  )}
                  
                  {/* Always show logout button - ensure it's visible */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={logout} 
                    className="text-xs sm:text-sm touch-target px-2 sm:px-3 flex-shrink-0"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline sm:ml-1.5">Logout</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs sm:text-sm touch-target px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline">Sign In</span>
                      <span className="sm:hidden">In</span>
                    </Button>
                  </Link>
                  <Link href="/auth/register-simple">
                    <Button 
                      size="sm" 
                      className="text-xs sm:text-sm touch-target px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline">Register</span>
                      <span className="sm:hidden">Join</span>
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

