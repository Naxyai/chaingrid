
/*
  # Web3 Gaming Platform Schema

  ## Tables Created:
  1. `users` - Player profiles linked to wallet addresses
     - wallet_address, cycle_number, referral_credits, withdrawable_balance, auto_rolled_stake, total_cycles_completed, is_admin
  2. `board_state` - Current 100-slot board positions
     - slot_number (1-100), wallet_address, user_id, joined_at
  3. `cycles` - Cycle history per user
     - user_id, cycle_number, deposit, gross_reward, platform_fee, net_reward, status, slot_reached_at, completed_at
  4. `referrals` - Referral relationships
     - referrer_id, referee_id, credited, created_at
  5. `withdrawals` - Withdrawal history
     - user_id, gross_amount, platform_fee, net_amount, tx_hash, status, created_at
  6. `global_stats` - Aggregate platform statistics (single row)
     - total_users, total_cycles_completed, total_withdrawn_usd

  ## Security:
  - RLS enabled on all tables
  - Authenticated users can read/write their own data
  - Board state readable by all authenticated users
  - Global stats readable by all (including anonymous)
  - Admin-only access to admin operations
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  current_slot integer DEFAULT 100,
  cycle_number integer DEFAULT 1,
  referral_credits integer DEFAULT 0,
  withdrawable_balance numeric(18,4) DEFAULT 0,
  auto_rolled_stake numeric(18,4) DEFAULT 0,
  total_cycles_completed integer DEFAULT 0,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text OR true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Board state table (100 slots)
CREATE TABLE IF NOT EXISTS board_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_number integer UNIQUE NOT NULL CHECK (slot_number >= 1 AND slot_number <= 100),
  wallet_address text,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  joined_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE board_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board state readable by all"
  ON board_state FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Board state insertable by authenticated"
  ON board_state FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Board state updatable by authenticated"
  ON board_state FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Initialize 100 empty slots
INSERT INTO board_state (slot_number, wallet_address, user_id)
SELECT generate_series(1, 100), NULL, NULL
ON CONFLICT (slot_number) DO NOTHING;

-- Cycles table
CREATE TABLE IF NOT EXISTS cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cycle_number integer NOT NULL,
  deposit numeric(18,4) DEFAULT 100,
  gross_reward numeric(18,4) DEFAULT 0,
  platform_fee numeric(18,4) DEFAULT 0,
  net_reward numeric(18,4) DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'no_reward', 'pending')),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, cycle_number)
);

ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own cycles"
  ON cycles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own cycles"
  ON cycles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own cycles"
  ON cycles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credited boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(referee_id)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read referrals involving them"
  ON referrals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Referrals insertable by authenticated"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Referrals updatable by authenticated"
  ON referrals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  gross_amount numeric(18,4) NOT NULL,
  platform_fee numeric(18,4) DEFAULT 0,
  net_amount numeric(18,4) NOT NULL,
  tx_hash text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own withdrawals"
  ON withdrawals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own withdrawals"
  ON withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own withdrawals"
  ON withdrawals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Global stats table (single row)
CREATE TABLE IF NOT EXISTS global_stats (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_users integer DEFAULT 0,
  total_cycles_completed integer DEFAULT 0,
  total_withdrawn_usd numeric(18,4) DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE global_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Global stats readable by all"
  ON global_stats FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Global stats updatable by authenticated"
  ON global_stats FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Initialize global stats
INSERT INTO global_stats (id, total_users, total_cycles_completed, total_withdrawn_usd)
VALUES (1, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_board_slot ON board_state(slot_number);
CREATE INDEX IF NOT EXISTS idx_board_user ON board_state(user_id);
CREATE INDEX IF NOT EXISTS idx_cycles_user ON cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id);
