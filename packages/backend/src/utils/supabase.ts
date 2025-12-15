import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// In test environment, skip noisy warning about missing Supabase credentials
if (!supabaseUrl || !supabaseServiceKey) {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  Supabase credentials not configured. Logo uploads will not work.');
  }
}

export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export const SUPABASE_BUCKET_NAME = 'supplier-logos';
export const SUPABASE_PRODUCT_IMAGES_BUCKET = 'product-images';
export const SUPABASE_CATEGORY_IMAGES_BUCKET = 'category-images';

/**
 * Upload supplier logo to Supabase Storage
 */
export async function uploadSupplierLogo(
  supplierId: string,
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const filePath = `${supplierId}/${Date.now()}-${fileName}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET_NAME)
    .upload(filePath, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload logo: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(SUPABASE_BUCKET_NAME)
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL for uploaded logo');
  }

  return urlData.publicUrl;
}

/**
 * Delete supplier logo from Supabase Storage
 */
export async function deleteSupplierLogo(logoUrl: string): Promise<void> {
  if (!supabase || !logoUrl) {
    return;
  }

  try {
    // Extract file path from URL
    const urlParts = logoUrl.split('/');
    const filePath = urlParts.slice(urlParts.indexOf(SUPABASE_BUCKET_NAME) + 1).join('/');

    if (filePath) {
      await supabase.storage
        .from(SUPABASE_BUCKET_NAME)
        .remove([filePath]);
    }
  } catch (error) {
    console.error('Failed to delete logo:', error);
    // Don't throw - deletion is not critical
  }
}

/**
 * Upload product image to Supabase Storage
 */
export async function uploadProductImage(
  productId: string,
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const filePath = `${productId}/${Date.now()}-${fileName}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from(SUPABASE_PRODUCT_IMAGES_BUCKET)
    .upload(filePath, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(SUPABASE_PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL for uploaded image');
  }

  return urlData.publicUrl;
}

/**
 * Delete product image from Supabase Storage
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  if (!supabase || !imageUrl) {
    return;
  }

  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const filePath = urlParts.slice(urlParts.indexOf(SUPABASE_PRODUCT_IMAGES_BUCKET) + 1).join('/');

    if (filePath) {
      await supabase.storage
        .from(SUPABASE_PRODUCT_IMAGES_BUCKET)
        .remove([filePath]);
    }
  } catch (error) {
    console.error('Failed to delete product image:', error);
    // Don't throw - deletion is not critical
  }
}

/**
 * Upload category image to Supabase Storage
 */
export async function uploadCategoryImage(
  categoryId: string,
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const filePath = `${categoryId}/${Date.now()}-${fileName}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from(SUPABASE_CATEGORY_IMAGES_BUCKET)
    .upload(filePath, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload category image: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(SUPABASE_CATEGORY_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL for uploaded category image');
  }

  return urlData.publicUrl;
}

/**
 * Delete category image from Supabase Storage
 */
export async function deleteCategoryImage(imageUrl: string): Promise<void> {
  if (!supabase || !imageUrl) {
    return;
  }

  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const filePath = urlParts.slice(urlParts.indexOf(SUPABASE_CATEGORY_IMAGES_BUCKET) + 1).join('/');

    if (filePath) {
      await supabase.storage
        .from(SUPABASE_CATEGORY_IMAGES_BUCKET)
        .remove([filePath]);
    }
  } catch (error) {
    console.error('Failed to delete category image:', error);
    // Don't throw - deletion is not critical
  }
}

