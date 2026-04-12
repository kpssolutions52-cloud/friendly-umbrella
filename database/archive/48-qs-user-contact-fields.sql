-- QS user profile: mobile and WhatsApp (login email remains users.email)
-- Safe to run multiple times (IF NOT EXISTS).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50) NULL;
