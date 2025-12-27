'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiGet, apiPut, apiDelete } from '@/lib/api';
import Link from 'next/link';

interface ServiceProviderProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ServiceProviderProfilePage() {
  return (
    <ProtectedRoute requireTenantType="service_provider">
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ServiceProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    postalCode: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiGet<{ profile: ServiceProviderProfile }>('/api/v1/service-provider/profile');
      setProfile(response.profile);
      setFormData({
        name: response.profile.name || '',
        phone: response.profile.phone || '',
        address: response.profile.address || '',
        postalCode: response.profile.postalCode || '',
      });
      setPreviewUrl(response.profile.logoUrl);
    } catch (err: any) {
      setError(err.error?.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiPut<{ profile: ServiceProviderProfile; message: string }>(
        '/api/v1/service-provider/profile',
        formData
      );
      setProfile(response.profile);
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.error?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    uploadLogo(file);
  };

  const uploadLogo = async (file: File) => {
    setIsUploadingLogo(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/service-provider/profile/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(errorData.error?.message || 'Failed to upload logo');
      }

      const data = await response.json();
      setProfile(data.profile);
      setPreviewUrl(data.profile.logoUrl);
      setSuccess('Logo uploaded successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Are you sure you want to delete your logo?')) {
      return;
    }

    setIsUploadingLogo(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiDelete<{ profile: ServiceProviderProfile; message: string }>(
        '/api/v1/service-provider/profile/logo'
      );
      setProfile(response.profile);
      setPreviewUrl(null);
      setSuccess('Logo deleted successfully');
    } catch (err: any) {
      setError(err.error?.message || 'Failed to delete logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                Service Provider Profile
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 truncate">
                Manage your service provider profile and logo
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/service-provider/dashboard">
                <Button variant="outline" className="touch-target">
                  Back to Dashboard
                </Button>
              </Link>
              <Button onClick={logout} variant="outline" className="touch-target">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">{success}</h3>
                  </div>
                </div>
              </div>
            )}

            {/* Logo Upload Section */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <Label className="text-base font-semibold text-gray-900 mb-4 block">Company Logo / Icon</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-shrink-0">
                  {previewUrl ? (
                    <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={previewUrl}
                        alt="Company logo"
                        fill
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-lg bg-gray-200 flex items-center justify-center text-2xl font-semibold text-gray-600">
                      {profile?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer touch-target"
                    >
                      {isUploadingLogo ? 'Uploading...' : previewUrl ? 'Change Logo' : 'Upload Logo / Icon'}
                    </label>
                    {previewUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDeleteLogo}
                        disabled={isUploadingLogo}
                        className="touch-target"
                      >
                        {isUploadingLogo ? 'Deleting...' : 'Delete Logo'}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Upload a square logo or icon image (JPG, PNG, or GIF). Max size: 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="mt-1"
                    placeholder="12345"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <textarea
                  id="address"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Street address"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Link href="/service-provider/dashboard">
                  <Button type="button" variant="outline" className="touch-target">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSaving} className="touch-target">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}







