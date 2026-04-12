-- Script: Add logo_url column to tenants table
-- Execute this in Supabase SQL Editor

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "logo_url" VARCHAR(500);

-- Add comment
COMMENT ON COLUMN "tenants"."logo_url" IS 'URL to supplier/company logo stored in Supabase Storage';

