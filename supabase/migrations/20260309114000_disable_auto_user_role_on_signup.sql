-- Disable automatic role assignment at signup.
-- Access must be granted explicitly by an admin in public.user_roles.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_role') THEN
    DROP TRIGGER on_auth_user_created_role ON auth.users;
  END IF;
END $$;

