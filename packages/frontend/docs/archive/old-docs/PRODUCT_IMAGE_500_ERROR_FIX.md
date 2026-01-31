# Fix: Product Image Upload 500 Error

## Common Causes of 500 Error

### 1. Database Table Missing (Most Likely)
The `product_images` table hasn't been created yet.

**Fix:**
```sql
-- Run this in Supabase SQL Editor
-- File: database/10-create-product-images.sql

CREATE TABLE IF NOT EXISTS "product_images" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "image_url" VARCHAR(500) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "product_images_product_id_idx" ON "product_images"("product_id");
CREATE INDEX IF NOT EXISTS "product_images_product_id_display_order_idx" ON "product_images"("product_id", "display_order");
```

### 2. Supabase Storage Bucket Missing
The `product-images` bucket doesn't exist.

**Fix:**
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `product-images`
4. Public bucket: ✅ **Enable**
5. File size limit: 10 MB
6. Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp`
7. Click "Create bucket"

### 3. Supabase Storage Policies Missing
RLS policies not configured.

**Fix:**
Run these SQL policies in Supabase SQL Editor:

```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated suppliers to upload
CREATE POLICY "Suppliers can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);

-- Allow suppliers to update their own images
CREATE POLICY "Suppliers can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);

-- Allow suppliers to delete their own images
CREATE POLICY "Suppliers can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);
```

### 4. Environment Variables Missing
Supabase credentials not set in Railway.

**Fix:**
Add to Railway backend service Variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

See `RAILWAY_ENV_VARS_SETUP.md` for details.

### 5. Prisma Client Not Regenerated
Prisma types are out of date.

**Fix:**
```bash
cd packages/backend
npm run db:generate
```

## How to Check the Error

1. **Check Railway Logs**:
   - Go to Railway Dashboard → Your Backend Service
   - Click "Deploy Logs" or "HTTP Logs"
   - Look for error messages

2. **Check Browser Console**:
   - Press F12 → Network tab
   - Try uploading an image
   - Click on the failed request
   - Check "Response" tab for error details

3. **Common Error Messages**:
   - `relation "product_images" does not exist` → Run migration
   - `Supabase not configured` → Set environment variables
   - `Bucket not found` → Create storage bucket
   - `Permission denied` → Configure RLS policies

## Step-by-Step Fix

1. ✅ **Run database migration** (database/10-create-product-images.sql)
2. ✅ **Create Supabase Storage bucket** (`product-images`, public)
3. ✅ **Set up RLS policies** (see above)
4. ✅ **Set environment variables** in Railway (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
5. ✅ **Redeploy backend** (Railway will auto-redeploy)
6. ✅ **Test upload** again

## Verification

After fixing, test the upload:
1. Go to Supplier Dashboard
2. Edit a product
3. Scroll to "Product Images" section
4. Click "+ Upload Images"
5. Select an image
6. Should upload successfully without 500 error

