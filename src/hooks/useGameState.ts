import { useState, useEffect, useCallback } from 'react';
import { User, GlobalStats } from '../types';
import { supabase, getOrCreateUser, getGlobalStats } from '../lib/supabase';

export function useGameState(walletAddress: string | null) {
  const [user, setUser] = useState<User | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUser = useCallback(async () => {
    if (!walletAddress) { setUser(null); return; }
    setLoading(true);
    try {
      const u = await getOrCreateUser(walletAddress);
      setUser(u);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const loadStats = useCallback(async () => {
    const stats = await getGlobalStats();
    setGlobalStats(stats);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!walletAddress) return;
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .maybeSingle();
    if (data) setUser(data);
  }, [walletAddress]);

  useEffect(() => {
    loadUser();
    loadStats();
  }, [loadUser, loadStats]);

  useEffect(() => {
    const channel = supabase
      .channel('global_stats_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'global_stats' }, (payload) => {
        setGlobalStats(payload.new as GlobalStats);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { user, globalStats, loading, refreshUser, loadStats };
}
