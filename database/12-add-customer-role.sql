-- Add customer role to UserRole enum
-- Note: This requires dropping and recreating the enum if it's already in use
-- For PostgreSQL, we'll use ALTER TYPE to add the new value

-- First, check if the enum value already exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'customer' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')) THEN
        ALTER TYPE "UserRole" ADD VALUE 'customer';
    END IF;
END $$;

