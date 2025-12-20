-- Create QuoteStatus enum for quote requests
-- This enum defines the possible states of a quote request

DO $$ BEGIN
    CREATE TYPE "QuoteStatus" AS ENUM (
        'pending',
        'responded',
        'accepted',
        'rejected',
        'expired',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
