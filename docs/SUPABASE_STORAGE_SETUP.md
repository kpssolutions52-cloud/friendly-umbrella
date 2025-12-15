# Supabase Storage Setup for Supplier Logos

This guide explains how to set up Supabase Storage for storing supplier logos.

## Prerequisites

- Supabase project with Storage enabled
- Service role key from Supabase (for backend uploads)

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `supplier-logos`
   - **Public bucket**: ✅ **Enable** (logos need to be publicly accessible)
   - **File size limit**: 5 MB (recommended)
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`
5. Click **Create bucket**

## Step 2: Set Up Storage Policies

After creating the bucket, set up RLS (Row Level Security) policies:

### Policy 1: Allow Public Read Access
```sql
-- Allow anyone to read files from the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'supplier-logos');
```

### Policy 2: Allow Authenticated Suppliers to Upload
```sql
-- Allow authenticated suppliers to upload their own logos
CREATE POLICY "Suppliers can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'supplier-logos' AND
  auth.role() = 'authenticated'
);
```

### Policy 3: Allow Suppliers to Update Their Own Logos
```sql
-- Allow suppliers to update their own logos
CREATE POLICY "Suppliers can update own logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'supplier-logos' AND
  auth.role() = 'authenticated'
);
```

### Policy 4: Allow Suppliers to Delete Their Own Logos
```sql
-- Allow suppliers to delete their own logos
CREATE POLICY "Suppliers can delete own logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'supplier-logos' AND
  auth.role() = 'authenticated'
);
```

## Step 3: Configure Environment Variables

Add these environment variables to your backend (Railway/Vercel):

### Backend Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### How to Get Your Supabase Credentials

1. **SUPABASE_URL**:
   - Go to Supabase Dashboard → Settings → API
   - Copy the **Project URL**

2. **SUPABASE_SERVICE_ROLE_KEY**:
   - Go to Supabase Dashboard → Settings → API
   - Copy the **service_role** key (⚠️ Keep this secret!)
   - This key bypasses RLS and is used for server-side operations

## Step 4: Run Database Migration

Execute the SQL migration script:

```bash
# In Supabase SQL Editor, run:
database/09-add-tenant-logo-url.sql
```

Or manually:

```sql
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "logo_url" VARCHAR(500);
```

## Step 5: Test the Setup

1. **Upload a logo**:
   - Log in as a supplier
   - Go to Supplier Dashboard → Profile
   - Upload a logo image

2. **Verify the logo appears**:
   - Check that the logo displays in the supplier profile
   - Check that the logo appears in company dashboard when viewing products

## Storage Structure

Logos are stored in the following structure:
```
supplier-logos/
  └── {supplier-id}/
      └── {timestamp}-{filename}
```

Example:
```
supplier-logos/
  └── 123e4567-e89b-12d3-a456-426614174000/
      └── 1704067200000-logo.png
```

## Troubleshooting

### Issue: "Failed to upload logo"
- **Check**: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set correctly
- **Check**: Bucket name matches `supplier-logos` exactly
- **Check**: Bucket is set to public

### Issue: "Logo not displaying"
- **Check**: Logo URL is stored in database (`logo_url` column)
- **Check**: Bucket has public read access policy
- **Check**: Image URL is accessible (try opening in browser)

### Issue: "Permission denied"
- **Check**: Storage policies are set up correctly
- **Check**: Service role key has proper permissions

## Security Notes

- ⚠️ **Service Role Key**: Never expose this in frontend code
- ✅ **Public Bucket**: Logos are public, which is fine for branding
- ✅ **File Validation**: Backend validates file type and size before upload
- ✅ **RLS Policies**: Additional security layer for authenticated operations

## File Size and Format Recommendations

- **Max Size**: 5 MB
- **Recommended Size**: < 1 MB for faster loading
- **Formats**: JPEG, PNG, GIF, WebP
- **Dimensions**: Square images (1:1 ratio) work best
- **Resolution**: 200x200 to 500x500 pixels recommended

