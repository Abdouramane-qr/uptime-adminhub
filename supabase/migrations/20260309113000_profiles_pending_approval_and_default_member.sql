-- Ensure new signups land in a non-privileged profile state.
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'member';

-- Approval status is explicit and decoupled from auth.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_approval_status_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_approval_status_check
      CHECK (approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]));
  END IF;
END $$;

