import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getOrCreateUser(walletAddress: string) {
  const addr = walletAddress.toLowerCase();
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', addr)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from('users')
    .insert({ wallet_address: addr })
    .select()
    .maybeSingle();

  if (error) throw error;
  return created;
}

export async function getGlobalStats() {
  const { data } = await supabase
    .from('global_stats')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  return data;
}

export async function getBoardState() {
  const { data } = await supabase
    .from('board_state')
    .select('*')
    .order('slot_number', { ascending: true });
  return data || [];
}

export async function getUserCycles(userId: string) {
  const { data } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', userId)
    .order('cycle_number', { ascending: false });
  return data || [];
}

export async function getUserWithdrawals(userId: string) {
  const { data } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getUserReferrals(userId: string) {
  const { data } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function joinBoard(userId: string, walletAddress: string, referrerId?: string) {
  const addr = walletAddress.toLowerCase();

  const { data: slots } = await supabase
    .from('board_state')
    .select('slot_number, wallet_address, user_id')
    .order('slot_number', { ascending: true });

  if (!slots) throw new Error('Could not load board state');

  const updates: Array<{ slot_number: number; wallet_address: string | null; user_id: string | null }> = [];

  for (let i = 0; i < slots.length - 1; i++) {
    if (slots[i + 1].wallet_address !== null || slots[i + 1].user_id !== null) {
      updates.push({
        slot_number: slots[i].slot_number,
        wallet_address: slots[i + 1].wallet_address,
        user_id: slots[i + 1].user_id,
      });
    }
  }

  for (const update of updates) {
    await supabase
      .from('board_state')
      .update({ wallet_address: update.wallet_address, user_id: update.user_id, updated_at: new Date().toISOString() })
      .eq('slot_number', update.slot_number);
  }

  await supabase
    .from('board_state')
    .update({ wallet_address: addr, user_id: userId, updated_at: new Date().toISOString() })
    .eq('slot_number', 100);

  await supabase.from('users').update({ current_slot: 100, updated_at: new Date().toISOString() }).eq('id', userId);

  if (referrerId) {
    await supabase.from('referrals').insert({ referrer_id: referrerId, referee_id: userId });
    await supabase.rpc('increment_referral_credits', { p_user_id: referrerId });
  }

  await supabase.rpc('increment_global_users');

  return true;
}

export async function requestWithdrawal(userId: string, walletAddress: string, grossAmount: number) {
  const feePercent = 10;
  const platformFee = grossAmount * (feePercent / 100);
  const netAmount = grossAmount - platformFee;

  const { data, error } = await supabase
    .from('withdrawals')
    .insert({
      user_id: userId,
      wallet_address: walletAddress.toLowerCase(),
      gross_amount: grossAmount,
      platform_fee: platformFee,
      net_amount: netAmount,
      status: 'pending',
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  await supabase
    .from('users')
    .update({ withdrawable_balance: 0, updated_at: new Date().toISOString() })
    .eq('id', userId);

  return data;
}
