'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { SITE_BRAND_NAME } from '@/lib/siteBrand';
import { apiGet, apiPost } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  type: 'company' | 'supplier';
  email: string;
}

interface RegisterFormData {
  userType: 'qs' | 'supplier';
  organizationId?: string;
  organizationName?: string;
  email: string;
  password: string;
  name?: string;
}

function RegisterSimpleForm() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [userType, setUserType] = useState<'qs' | 'supplier' | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      userType: 'qs',
    },
  });

  const selectedUserType = watch('userType');
  const joinExisting = watch('organizationId');

  // Load organizations when step 2 and user type selected
  useEffect(() => {
    if (step === 2 && userType) {
      loadOrganizations();
    }
  }, [step, userType]);

  const loadOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const orgType = userType === 'qs' ? 'company' : 'supplier';
      const response = await apiGet<{ organizations: Organization[] }>(
        `/api/v1/auth/organizations?type=${orgType}`
      );
      setOrganizations(response.organizations || []);
    } catch (err: any) {
      console.error('Failed to load organizations:', err);
      setOrganizations([]);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const onStep1Submit = (data: Partial<RegisterFormData>) => {
    if (!data.userType) {
      setError('Please select a user type');
      return;
    }
    setUserType(data.userType);
    setStep(2);
    setError(null);
  };

  const onStep2Submit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!data.organizationId && !data.organizationName) {
        setError('Please either select an existing organization or create a new one');
        return;
      }

      const payload = {
        userType: userType!,
        organizationId: data.organizationId,
        organizationName: data.organizationName,
        email: data.email,
        password: data.password,
        name: data.name,
      };

      const response = await apiPost<{
        message: string;
        user: any;
        accessToken: string;
        refreshToken: string;
      }>('/api/v1/auth/register', payload);

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Refresh user context
      await refreshUser();

      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => {
        router.push(userType === 'qs' ? '/chat' : '/supplier/chat');
      }, 1500);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(
        err?.error?.message ||
          err?.error?.errors?.[0]?.msg ||
          'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-start sm:items-center justify-center bg-gray-50 px-4 py-6 sm:py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 sm:space-y-8 pb-8">
        {/* Logo and Back to Home */}
        <div className="flex flex-col items-center space-y-4">
          <Link href="/" className="flex flex-col items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="relative h-10 w-[min(260px,85vw)] sm:h-11">
              <Logo priority unoptimized width={260} height={70} className="h-full w-full object-contain object-center" />
            </div>
            <span className="sr-only">{SITE_BRAND_NAME}</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {step === 1 ? 'Choose Your Role' : 'Complete Registration'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 1
              ? 'Select whether you are a QS Professional or Supplier'
              : 'Join an existing organization or create a new one'}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Step 1: Choose User Type */}
        {step === 1 && (
          <form
            onSubmit={handleSubmit(onStep1Submit)}
            className="mt-8 space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                <input
                  type="radio"
                  id="userType-qs"
                  value="qs"
                  {...register('userType', { required: 'Please select a user type' })}
                  className="h-4 w-4 text-blue-600"
                />
                <label htmlFor="userType-qs" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-gray-900">QS Professional</div>
                  <div className="text-sm text-gray-500">
                    Get instant pricing, quotes, and project management
                  </div>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 cursor-pointer">
                <input
                  type="radio"
                  id="userType-supplier"
                  value="supplier"
                  {...register('userType')}
                  className="h-4 w-4 text-green-600"
                />
                <label htmlFor="userType-supplier" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-gray-900">Supplier</div>
                  <div className="text-sm text-gray-500">
                    Manage products, prices, and respond to quotes
                  </div>
                </label>
              </div>
            </div>

            {errors.userType && (
              <p className="text-sm text-red-600">{errors.userType.message}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              Continue
            </Button>
          </form>
        )}

        {/* Step 2: Choose/Create Organization */}
        {step === 2 && (
          <form
            onSubmit={handleSubmit(onStep2Submit)}
            className="mt-8 space-y-6"
          >
            <div className="space-y-4">
              {/* Join Existing Organization */}
              <div>
                <Label className="text-base font-semibold mb-2 block">
                  Join Existing {userType === 'qs' ? 'Company' : 'Supplier'}
                </Label>
                {loadingOrgs ? (
                  <div className="text-sm text-gray-500 p-4 text-center">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Loading organizations...
                  </div>
                ) : organizations.length === 0 ? (
                  <div className="rounded-md bg-yellow-50 p-3">
                    <p className="text-sm text-yellow-800">
                      No existing {userType === 'qs' ? 'companies' : 'suppliers'} found.
                    </p>
                  </div>
                ) : (
                  <select
                    {...register('organizationId')}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an organization...</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">OR</span>
                </div>
              </div>

              {/* Create New Organization */}
              <div>
                <Label className="text-base font-semibold mb-2 block">
                  Create New {userType === 'qs' ? 'Company' : 'Supplier'}
                </Label>
                <Input
                  {...register('organizationName')}
                  placeholder={`Enter ${userType === 'qs' ? 'company' : 'supplier'} name`}
                  className="w-full"
                />
              </div>
            </div>

            {/* User Details */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <Label htmlFor="name">Full Name (Optional)</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  placeholder="you@example.com"
                  className="mt-1"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                  placeholder="••••••••"
                  className="mt-1"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setError(null);
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterSimplePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      <RegisterSimpleForm />
    </Suspense>
  );
}
