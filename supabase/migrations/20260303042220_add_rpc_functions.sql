
/*
  # Add RPC Helper Functions

  ## Functions Added:
  1. `increment_referral_credits(p_user_id)` - Increments referral_credits by 1 for a user
  2. `increment_global_users()` - Increments total_users counter in global_stats
  3. `increment_global_cycles()` - Increments total_cycles_completed in global_stats
  4. `add_global_withdrawn(amount)` - Adds to total_withdrawn_usd in global_stats

  These are called from the application to update counts atomically.
*/

CREATE OR REPLACE FUNCTION increment_referral_credits(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET referral_credits = referral_credits + 1,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_global_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO global_stats (id, total_users, total_cycles_completed, total_withdrawn_usd)
  VALUES (1, 1, 0, 0)
  ON CONFLICT (id) DO UPDATE
  SET total_users = global_stats.total_users + 1,
      updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION increment_global_cycles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE global_stats
  SET total_cycles_completed = total_cycles_completed + 1,
      updated_at = now()
  WHERE id = 1;
END;
$$;

CREATE OR REPLACE FUNCTION add_global_withdrawn(p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE global_stats
  SET total_withdrawn_usd = total_withdrawn_usd + p_amount,
      updated_at = now()
  WHERE id = 1;
END;
$$;
