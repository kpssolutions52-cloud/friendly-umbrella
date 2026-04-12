-- Script 1: Create Enums
-- Execute this first
-- This script is safe to run multiple times - it checks if types exist first

DO $$ 
BEGIN
    -- Create TenantType enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TenantType') THEN
        CREATE TYPE "TenantType" AS ENUM ('supplier', 'company');
    END IF;

    -- Create TenantStatus enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TenantStatus') THEN
        CREATE TYPE "TenantStatus" AS ENUM ('pending', 'active', 'rejected');
    END IF;

    -- Create UserRole enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('super_admin', 'supplier_admin', 'supplier_staff', 'company_admin', 'company_staff');
    END IF;

    -- Create UserStatus enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
        CREATE TYPE "UserStatus" AS ENUM ('pending', 'active', 'rejected', 'inactive');
    END IF;

    -- Create PriceType enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PriceType') THEN
        CREATE TYPE "PriceType" AS ENUM ('default', 'private');
    END IF;
END $$;

