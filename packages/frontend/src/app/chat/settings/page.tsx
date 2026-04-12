'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPut } from '@/lib/api';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface QsProfile {
  email: string;
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
}

function profileErrorMessage(err: unknown): string {
  const e = err as {
    error?: string | { message?: string };
    message?: string;
    errors?: Array<{ msg?: string; message?: string } | string>;
  };
  if (typeof e?.error === 'string') return e.error;
  if (Array.isArray(e?.errors) && e.errors.length > 0) {
    const first = e.errors[0];
    if (typeof first === 'string') return first;
    return first?.msg || first?.message || 'Validation failed';
  }
  return e?.error?.message || e?.message || 'Something went wrong';
}

export default function ChatSettingsPage() {
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialEmail, setInitialEmail] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    currentPassword: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (user?.type === 'supplier' || user?.tenant?.type === 'supplier') {
      router.push('/supplier/chat');
      return;
    }
    if (user?.type !== 'qs') {
      router.push('/');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await apiGet<{ profile: QsProfile }>('/api/v1/qs/profile');
        if (cancelled) return;
        const p = res.profile;
        setInitialEmail(p.email);
        setForm((f) => ({
          ...f,
          name: p.name ?? '',
          email: p.email,
          phone: p.phone ?? '',
          whatsapp: p.whatsapp ?? '',
        }));
      } catch {
        if (!cancelled) {
          toast({
            variant: 'destructive',
            title: 'Could not load profile',
            description: 'Try again or return to chat.',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user, router, toast]);

  const emailChanged =
    form.email.trim().toLowerCase() !== initialEmail.trim().toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailChanged && !form.currentPassword) {
      toast({
        variant: 'destructive',
        title: 'Password required',
        description: 'Enter your current password to change your login email.',
      });
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string | null | undefined> = {
        name: form.name.trim() || null,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim(),
      };
      if (emailChanged) {
        body.currentPassword = form.currentPassword;
      }

      await apiPut<{ profile: QsProfile }>('/api/v1/qs/profile', body);
      setInitialEmail(form.email.trim());
      setForm((f) => ({ ...f, currentPassword: '' }));
      await refreshUser();
      toast({ title: 'Profile saved' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could not save',
        description: profileErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !isAuthenticated || user?.type !== 'qs') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-8">
        <Link
          href="/chat"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to QS dashboard
        </Link>

        <h1 className="text-2xl font-bold text-slate-900">Profile &amp; settings</h1>
        <p className="text-sm text-slate-600 mt-1 mb-8">
          Your login email and contact details are used when you reach out to suppliers (e.g. compose email).
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1"
                autoComplete="name"
              />
            </div>
            <div>
              <Label htmlFor="email">Login email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1"
                autoComplete="email"
              />
            </div>
            {emailChanged && (
              <div>
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  className="mt-1"
                  autoComplete="current-password"
                  placeholder="Required to change email"
                />
              </div>
            )}
            <div>
              <Label htmlFor="phone">Mobile</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1"
                autoComplete="tel"
                placeholder="+65 …"
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="mt-1"
                placeholder="International format, e.g. +65 …"
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
