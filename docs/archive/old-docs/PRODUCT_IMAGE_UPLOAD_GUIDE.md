# Product Image Upload Guide

## Where to Find Image Upload

### ✅ Edit Product Modal
The image upload option is available in the **Edit Product** modal:

1. **Go to Supplier Dashboard**
2. **Click on any product** → Click **"Edit"** button
3. **Scroll down** in the Edit Product modal
4. You'll see **"Product Images"** section (after Special Prices section, before Submit buttons)
5. Click **"+ Upload Images"** button to upload multiple images

### ✅ After Creating New Product
When you create a new product:
1. Fill in product details and click **"Create Product"**
2. The modal will **automatically switch to Edit mode**
3. The **Product Images** section will appear
4. You can immediately upload images

## What You'll See

### In Edit Product Modal:
```
┌─────────────────────────────────────┐
│ Edit Product                        │
├─────────────────────────────────────┤
│ [Product Form Fields]               │
│ [Special Prices Section]             │
│                                     │
│ ─────────────────────────────────── │
│ Product Images                      │
│ Upload multiple images...           │
│ [+ Upload Images] ← Click here!     │
│                                     │
│ [No images uploaded yet]            │
│ or                                  │
│ [Image Grid with uploaded images]   │
│                                     │
│ [Cancel] [Update Product]           │
└─────────────────────────────────────┘
```

## Features

- ✅ **Multiple Image Upload**: Select multiple images at once
- ✅ **Image Preview**: See uploaded images in a grid
- ✅ **Delete Images**: Hover over image and click delete button
- ✅ **Primary Image**: First image is marked as "Primary" and shown in listings
- ✅ **File Validation**: Only images, max 10MB per image

## Troubleshooting

### Don't see "Product Images" section?

1. **Make sure you're in Edit mode**:
   - Click "Edit" on an existing product
   - Or create a new product (auto-switches to edit)

2. **Scroll down in the modal**:
   - The section is after "Special Prices"
   - Before the "Cancel/Update Product" buttons

3. **Hard refresh browser**:
   - `Ctrl+Shift+R` (Windows/Linux)
   - `Cmd+Shift+R` (Mac)

4. **Check if frontend is deployed**:
   - Wait 1-2 minutes for Vercel to rebuild
   - Check Vercel deployment logs

5. **Check browser console**:
   - Press F12 → Console tab
   - Look for any errors

### Component Location in Code:
- **File**: `packages/frontend/src/app/supplier/dashboard/page.tsx`
- **Line**: ~2046 (in Edit Product Modal)
- **Component**: `ProductImageManager`

## Next Steps

1. **Run database migration**:
   ```sql
   -- Execute in Supabase SQL Editor
   -- Run: database/10-create-product-images.sql
   ```

2. **Set up Supabase Storage**:
   - Create bucket: `product-images` (public)
   - Configure RLS policies (see SUPABASE_STORAGE_SETUP.md)

3. **Test the feature**:
   - Edit an existing product
   - Scroll to "Product Images" section
   - Click "+ Upload Images"
   - Select images and upload

The image upload feature is fully implemented and ready to use! 🎉

