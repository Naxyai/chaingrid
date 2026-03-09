import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Search, ChevronRight, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Rank } from '../../types';

interface ReferralNode {
  id: string;
  wallet_address: string;
  rank: Rank;
  direct_referrals_count: number;
  saved_referrals: number;
  commission_earned: number;
  total_cycles_completed: number;
  referrer_id: string | null;
  created_at: string;
}

interface ReferralRelation {
  id: string;
  referrer_id: string;
  referee_id: string;
  credited: boolean;
  created_at: string;
  referee?: ReferralNode;
}

const rankColors: Record<Rank, string> = {
  none: 'text-gray-500',
  vip: 'text-blue-400',
  elite: 'text-cyan-400',
  president: 'text-yellow-400',
  founder: 'text-green-400',
};

export default function ReferralNetwork() {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<ReferralNode | null>(null);
  const [referrals, setReferrals] = useState<ReferralRelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ReferralNode[]>([]);
  const [searching, setSearching] = useState(false);

  const searchUsers = async () => {
    if (!search.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from('users')
      .select('id, wallet_address, rank, direct_referrals_count, saved_referrals, commission_earned, total_cycles_completed, referrer_id, created_at')
      .ilike('wallet_address', `%${search.trim()}%`)
      .limit(10);
    setSearchResults((data ?? []) as ReferralNode[]);
    setSearching(false);
  };

  const loadReferrals = async (u: ReferralNode) => {
    setSelectedUser(u);
    setSearchResults([]);
    setLoading(true);
    const { data: rels } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', u.id)
      .order('created_at', { ascending: false });

    if (rels && rels.length > 0) {
      const refereeIds = rels.map(r => r.referee_id);
      const { data: referees } = await supabase
        .from('users')
        .select('id, wallet_address, rank, direct_referrals_count, saved_referrals, commission_earned, total_cycles_completed, referrer_id, created_at')
        .in('id', refereeIds);
      const refereeMap = new Map((referees ?? []).map(r => [r.id, r as ReferralNode]));
      setReferrals(rels.map(rel => ({ ...rel, referee: refereeMap.get(rel.referee_id) })));
    } else {
      setReferrals([]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
          <GitBranch size={18} className="text-orange-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Referral Network</h2>
          <p className="text-gray-400 text-xs">Explore hierarchical referral structures</p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchUsers()}
              placeholder="Search wallet address..."
              className="w-full pl-8 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500/40"
            />
          </div>
          <button
            onClick={searchUsers}
            disabled={searching}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30 transition-all"
          >
            {searching ? <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /> : <Search size={14} />}
            Search
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {searchResults.map(u => (
              <button
                key={u.id}
                onClick={() => loadReferrals(u)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/3 border border-white/5 hover:bg-white/6 transition-all text-left"
              >
                <span className="font-mono text-gray-300 text-xs">{u.wallet_address.slice(0, 20)}...</span>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className={`font-bold uppercase ${rankColors[u.rank]}`}>{u.rank}</span>
                  <span>{u.direct_referrals_count ?? 0} refs</span>
                  <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-xs mb-1">Selected User</p>
                <p className="text-white font-mono text-sm">{selectedUser.wallet_address}</p>
              </div>
              <button onClick={() => loadReferrals(selectedUser)} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-all">
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-white/3 border border-white/5 text-center">
                <div className={`font-black text-lg ${rankColors[selectedUser.rank]}`}>{selectedUser.rank.toUpperCase()}</div>
                <div className="text-gray-500 text-xs">Rank</div>
              </div>
              <div className="p-3 rounded-lg bg-white/3 border border-white/5 text-center">
                <div className="text-white font-black text-lg">{selectedUser.direct_referrals_count ?? 0}</div>
                <div className="text-gray-500 text-xs">Direct Refs</div>
              </div>
              <div className="p-3 rounded-lg bg-white/3 border border-white/5 text-center">
                <div className="text-yellow-400 font-black text-lg">{selectedUser.saved_referrals ?? 0}</div>
                <div className="text-gray-500 text-xs">Saved Refs</div>
              </div>
              <div className="p-3 rounded-lg bg-white/3 border border-white/5 text-center">
                <div className="text-green-400 font-black text-lg">${(selectedUser.commission_earned ?? 0).toFixed(2)}</div>
                <div className="text-gray-500 text-xs">Commission</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-white font-bold text-sm">Direct Referrals ({referrals.length})</h3>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No referrals found</div>
            ) : (
              <div className="divide-y divide-white/3">
                {referrals.map(rel => (
                  <div key={rel.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/2 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${rel.credited ? 'bg-green-400' : 'bg-gray-500'}`} />
                      <span className="font-mono text-gray-300 text-xs">
                        {rel.referee?.wallet_address.slice(0, 18) ?? rel.referee_id.slice(0, 14)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {rel.referee && (
                        <span className={`font-bold uppercase ${rankColors[rel.referee.rank]}`}>{rel.referee.rank}</span>
                      )}
                      <span className="text-gray-500">{new Date(rel.created_at).toLocaleDateString()}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs border ${rel.credited ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                        {rel.credited ? 'credited' : 'pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
