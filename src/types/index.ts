export interface User {
  id: string;
  wallet_address: string;
  current_slot: number;
  cycle_number: number;
  referral_credits: number;
  withdrawable_balance: number;
  auto_rolled_stake: number;
  total_cycles_completed: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface BoardSlot {
  id: string;
  slot_number: number;
  wallet_address: string | null;
  user_id: string | null;
  joined_at: string;
  updated_at: string;
}

export interface Cycle {
  id: string;
  user_id: string;
  cycle_number: number;
  deposit: number;
  gross_reward: number;
  platform_fee: number;
  net_reward: number;
  status: 'active' | 'completed' | 'no_reward' | 'pending';
  started_at: string;
  completed_at: string | null;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  credited: boolean;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  wallet_address: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  tx_hash: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
}

export interface GlobalStats {
  total_users: number;
  total_cycles_completed: number;
  total_withdrawn_usd: number;
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  error: string | null;
}
