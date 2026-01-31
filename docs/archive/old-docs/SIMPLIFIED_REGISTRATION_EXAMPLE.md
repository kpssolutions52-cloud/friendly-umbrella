# Simplified Registration Form - Code Example

## 🎨 New Registration UI Design

### Visual Layout

```
┌─────────────────────────────────────────────┐
│         ConstructionGuru Logo               │
│    AI Assistant for Quantity Surveyors      │
│                                             │
│              [Back to Home]                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         Create your account                 │
│   Or sign in to existing account            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Step 1: What are you?                     │
│                                             │
│  ○ I'm a QS Professional                  │
│    (Use AI chat for construction pricing)  │
│                                             │
│  ● I'm a Supplier                          │
│    (Add products and update prices)        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Step 2: Organization                      │
│                                             │
│  ○ Create new supplier                    │
│  ● Join existing supplier                 │
│                                             │
│  Select Supplier:                          │
│  [Dropdown: ABC Supplies ▼]               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Your Information                           │
│                                             │
│  Email address *                           │
│  [________________________]                │
│                                             │
│  Password *                                │
│  [________________________]                │
│                                             │
│  Your Name (Optional)                      │
│  [________________________]                │
└─────────────────────────────────────────────┘

              [Create account]
```

---

## 💻 Code Implementation

### Simplified Registration Component

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

type UserType = 'qs' | 'supplier';
type OrgAction = 'create' | 'join';

interface RegisterFormData {
  userType: UserType;
  orgAction: OrgAction;
  organizationName?: string;
  organizationId?: string;
  email: string;
  password: string;
  name?: string;
}

export default function SimplifiedRegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      userType: 'qs',
      orgAction: 'create',
    },
  });

  const userType = watch('userType');
  const orgAction = watch('orgAction');

  // Load organizations when "join" is selected
  useEffect(() => {
    if (orgAction === 'join') {
      loadOrganizations();
    }
  }, [orgAction, userType]);

  const loadOrganizations = async () => {
    try {
      const response = await fetch(`/api/v1/organizations?type=${userType === 'qs' ? 'company' : 'supplier'}`);
      const data = await response.json();
      setOrganizations(data.organizations || []);
    } catch (err) {
      console.error('Failed to load organizations:', err);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Validate
      if (data.orgAction === 'create' && !data.organizationName) {
        setError('Organization name is required');
        return;
      }
      if (data.orgAction === 'join' && !data.organizationId) {
        setError('Please select an organization');
        return;
      }

      // Register
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: data.userType,
          orgAction: data.orgAction,
          organizationName: data.organizationName,
          organizationId: data.organizationId,
          email: data.email,
          password: data.password,
          name: data.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const result = await response.json();
      
      // Auto-login and redirect
      router.push(data.userType === 'qs' ? '/qs/chat' : '/supplier/products');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-500">
              sign in to existing account
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Step 1: User Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What are you?
            </label>
            <div className="space-y-3">
              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  {...register('userType', { required: true })}
                  value="qs"
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    I'm a QS Professional
                  </div>
                  <div className="text-sm text-gray-500">
                    Use AI chat for construction pricing and quotes
                  </div>
                </div>
              </label>

              <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  {...register('userType', { required: true })}
                  value="supplier"
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    I'm a Supplier
                  </div>
                  <div className="text-sm text-gray-500">
                    Add products and update prices
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Step 2: Organization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {userType === 'qs' ? 'Company' : 'Supplier'}
            </label>
            <div className="space-y-3 mb-4">
              <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  {...register('orgAction', { required: true })}
                  value="create"
                  className="mr-3"
                />
                <span>Create new {userType === 'qs' ? 'company' : 'supplier'}</span>
              </label>

              <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  {...register('orgAction', { required: true })}
                  value="join"
                  className="mr-3"
                />
                <span>Join existing {userType === 'qs' ? 'company' : 'supplier'}</span>
              </label>
            </div>

            {/* Organization Name (if create) */}
            {orgAction === 'create' && (
              <div>
                <input
                  type="text"
                  {...register('organizationName', {
                    required: orgAction === 'create',
                  })}
                  placeholder={`Enter ${userType === 'qs' ? 'company' : 'supplier'} name`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.organizationName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.organizationName.message}
                  </p>
                )}
              </div>
            )}

            {/* Organization Selection (if join) */}
            {orgAction === 'join' && (
              <div>
                <select
                  {...register('organizationId', {
                    required: orgAction === 'join',
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select {userType === 'qs' ? 'company' : 'supplier'}...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                {errors.organizationId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.organizationId.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Step 3: User Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address *
              </label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name (Optional)
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## 🔧 Backend API Endpoint

### Simplified Registration Endpoint

```typescript
// packages/backend/src/routes/authRoutes.ts

router.post('/auth/register', async (req, res, next) => {
  try {
    const {
      userType,        // 'qs' | 'supplier'
      orgAction,       // 'create' | 'join'
      organizationName,
      organizationId,
      email,
      password,
      name,
    } = req.body;

    // Validate
    if (!userType || !['qs', 'supplier'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    if (!orgAction || !['create', 'join'].includes(orgAction)) {
      return res.status(400).json({ error: 'Invalid organization action' });
    }

    if (orgAction === 'create' && !organizationName) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    if (orgAction === 'join' && !organizationId) {
      return res.status(400).json({ error: 'Organization selection is required' });
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    let organization;

    // Create or find organization
    if (orgAction === 'create') {
      // Check if organization email exists
      const existingOrg = await prisma.organization.findUnique({
        where: { email },
      });

      if (existingOrg) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      organization = await prisma.organization.create({
        data: {
          name: organizationName,
          type: userType === 'qs' ? 'company' : 'supplier',
          email, // Use user email as organization contact email
        },
      });
    } else {
      organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // Verify organization type matches user type
      const expectedType = userType === 'qs' ? 'company' : 'supplier';
      if (organization.type !== expectedType) {
        return res.status(400).json({ error: 'Organization type mismatch' });
      }
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        organizationId: organization.id,
        email,
        passwordHash,
        name,
        type: userType,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      organizationId: user.organizationId,
      userType: user.type,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      organizationId: user.organizationId,
      userType: user.type,
    });

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        organizationId: user.organizationId,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});
```

---

## 🔐 Permission Middleware

### Simple Type-Based Access Control

```typescript
// packages/backend/src/middleware/permissions.ts

export function requireQS(req: Request, res: Response, next: NextFunction) {
  if (req.user?.type !== 'qs') {
    return res.status(403).json({
      error: 'QS access required',
    });
  }
  next();
}

export function requireSupplier(req: Request, res: Response, next: NextFunction) {
  if (req.user?.type !== 'supplier') {
    return res.status(403).json({
      error: 'Supplier access required',
    });
  }
  next();
}

// Usage in routes
router.post('/chat', requireAuth, requireQS, chatController);
router.post('/products', requireAuth, requireSupplier, createProduct);
```

---

## 📋 Key Changes Summary

### Removed
- ❌ 7 registration types → 2 user types
- ❌ Complex dropdown → Simple radio buttons
- ❌ Approval workflows → Instant access
- ❌ Role-based permissions → Type-based permissions
- ❌ Phone, address, postal code → Not needed for MVP

### Added
- ✅ Clear user type selection
- ✅ Simple organization choice (create/join)
- ✅ Instant access after registration
- ✅ Auto-login after registration
- ✅ Direct redirect to appropriate dashboard

---

## 🎯 Benefits

1. **Simpler for Users**
   - Clear choices (QS or Supplier)
   - No confusion
   - Instant access

2. **Simpler for Developers**
   - Less code
   - Easier to maintain
   - Fewer edge cases

3. **Faster Onboarding**
   - No approval waiting
   - Immediate value
   - Better user experience

---

**This simplified registration aligns perfectly with the AI QS Assistant vision: simple, fast, and focused on the core value.**
