'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect to appropriate dashboard
      const dashboardPath =
        user.tenant?.type === 'supplier'
          ? '/supplier/dashboard'
          : '/company/dashboard';
      router.push(dashboardPath);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-center">
        <h1 className="text-4xl font-bold mb-4">Construction Pricing Platform</h1>
        <p className="text-lg mb-8 text-gray-600">
          Real-time pricing platform connecting suppliers with construction companies
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/login">
            <Button>Login</Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="outline">Register</Button>
          </Link>
          <Link href="/docs">
            <Button variant="outline">Documentation</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

