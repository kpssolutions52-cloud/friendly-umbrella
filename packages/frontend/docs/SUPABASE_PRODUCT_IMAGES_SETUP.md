# Supabase Product Images Storage Setup

## Error: "Bucket not found"

This error means the `product-images` storage bucket hasn't been created in Supabase yet.

## Quick Fix Steps

### Step 1: Create Storage Bucket

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"** button
5. Configure the bucket:
   - **Name**: `product-images` (must match exactly)
   - **Public bucket**: ✅ **Enable** (images need to be publicly accessible)
   - **File size limit**: 10 MB (recommended)
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`
6. Click **"Create bucket"**

### Step 2: Set Up Storage Policies (RLS)

After creating the bucket, set up Row Level Security policies:

1. Go to **Storage** → Click on `product-images` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"** and create these policies:

#### Policy 1: Public Read Access
```sql
-- Allow anyone to read images (for public display)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');
```

#### Policy 2: Authenticated Upload
```sql
-- Allow authenticated suppliers to upload images
CREATE POLICY "Suppliers can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);
```

#### Policy 3: Authenticated Update
```sql
-- Allow authenticated suppliers to update images
CREATE POLICY "Suppliers can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);
```

#### Policy 4: Authenticated Delete
```sql
-- Allow authenticated suppliers to delete images
CREATE POLICY "Suppliers can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);
```

**OR** use the SQL Editor to run all at once:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this script:

```sql
-- Product Images Storage Policies

-- Public read access
CREATE POLICY IF NOT EXISTS "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Authenticated upload
CREATE POLICY IF NOT EXISTS "Suppliers can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);

-- Authenticated update
CREATE POLICY IF NOT EXISTS "Suppliers can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);

-- Authenticated delete
CREATE POLICY IF NOT EXISTS "Suppliers can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);
```

### Step 3: Verify Setup

1. **Check bucket exists**:
   - Go to Storage → You should see `product-images` bucket
   - Status should be "Public"

2. **Check policies**:
   - Go to Storage → `product-images` → Policies tab
   - You should see 4 policies listed

3. **Test upload**:
   - Go to Supplier Dashboard
   - Edit a product
   - Try uploading an image
   - Should work without 500 error

## Complete Setup Checklist

- [ ] Database migration run (`database/10-create-product-images.sql`)
- [ ] Storage bucket created (`product-images`, public)
- [ ] RLS policies configured (4 policies)
- [ ] Environment variables set in Railway:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Backend redeployed (Railway auto-redeploys)

## Troubleshooting

### Still getting "Bucket not found"?
- ✅ Verify bucket name is exactly `product-images` (case-sensitive)
- ✅ Check bucket is created in the correct Supabase project
- ✅ Verify `SUPABASE_URL` in Railway points to the correct project

### Getting "Permission denied"?
- ✅ Check RLS policies are created
- ✅ Verify policies allow `authenticated` role
- ✅ Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly

### Images upload but don't display?
- ✅ Verify bucket is set to **Public**
- ✅ Check public read policy is enabled
- ✅ Verify image URLs are accessible (try opening in browser)

## Storage Structure

Images are stored as:
```
product-images/
  └── {product-id}/
      └── {timestamp}-{filename}
```

Example:
```
product-images/
  └── 7c5a4d75-dbf8-48ae-9034-ef5e66967701/
      └── 1704067200000-product-photo.jpg
```

## Security Notes

- ✅ **Public Bucket**: Product images are public, which is fine for product catalogs
- ✅ **Service Role Key**: Never expose in frontend code
- ✅ **File Validation**: Backend validates file type and size before upload
- ✅ **RLS Policies**: Additional security layer for authenticated operations

