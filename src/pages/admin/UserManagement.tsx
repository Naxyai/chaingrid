import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, CreditCard as Edit2, RefreshCw, X, Save, Ban, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { User, Rank } from '../../types';

interface EditState {
  withdrawable_balance: string;
  rollin_balance: string;
  saved_referrals: string;
  cycle_number: string;
  rank: Rank;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search.trim()) {
      query = query.ilike('wallet_address', `%${search.trim()}%`);
    }

    const { data } = await query;
    setUsers(data ?? []);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (u: User) => {
    setEditUser(u);
    setEditState({
      withdrawable_balance: String(u.withdrawable_balance ?? 0),
      rollin_balance: String(u.rollin_balance ?? 0),
      saved_referrals: String(u.saved_referrals ?? 0),
      cycle_number: String(u.cycle_number ?? 1),
      rank: u.rank,
    });
  };

  const saveEdit = async () => {
    if (!editUser || !editState) return;
    setSaving(true);
    await supabase.from('users').update({
      withdrawable_balance: parseFloat(editState.withdrawable_balance) || 0,
      rollin_balance: parseFloat(editState.rollin_balance) || 0,
      saved_referrals: parseInt(editState.saved_referrals) || 0,
      cycle_number: parseInt(editState.cycle_number) || 1,
      rank: editState.rank,
      updated_at: new Date().toISOString(),
    }).eq('id', editUser.id);
    setSaving(false);
    setEditUser(null);
    setEditState(null);
    load();
  };

  const banUser = async (u: User) => {
    if (!confirm(`Ban user ${u.wallet_address.slice(0, 10)}...?`)) return;
    await supabase.from('users').update({
      rank: 'none',
      withdrawable_balance: 0,
      rollin_balance: 0,
      updated_at: new Date().toISOString(),
    }).eq('id', u.id);
    load();
  };

  const resetCycle = async (u: User) => {
    if (!confirm(`Reset cycle for ${u.wallet_address.slice(0, 10)}...?`)) return;
    await supabase.from('users').update({
      cycle_number: 1,
      total_cycles_completed: 0,
      referral_credits: 0,
      saved_referrals: 0,
      current_slot: 0,
      updated_at: new Date().toISOString(),
    }).eq('id', u.id);
    load();
  };

  const rankColors: Record<Rank, string> = {
    none: 'text-gray-500',
    vip: 'text-blue-400',
    elite: 'text-cyan-400',
    president: 'text-yellow-400',
    founder: 'text-green-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
            <Users size={18} className="text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">User Management</h2>
            <p className="text-gray-400 text-xs">View, edit, and manage users</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search wallet..."
              className="pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/40 w-52"
            />
          </div>
          <button onClick={load} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-left text-gray-500 text-xs">
                  <th className="px-4 py-3 font-medium">Wallet</th>
                  <th className="px-4 py-3 font-medium text-center">Rank</th>
                  <th className="px-4 py-3 font-medium text-center">Cycles</th>
                  <th className="px-4 py-3 font-medium text-right">Withdrawable</th>
                  <th className="px-4 py-3 font-medium text-right">Rollin</th>
                  <th className="px-4 py-3 font-medium text-center">Refs</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-white/3 hover:bg-white/2 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-gray-300 text-xs">{u.wallet_address.slice(0, 14)}...</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold uppercase ${rankColors[u.rank]}`}>
                        {u.rank === 'none' ? '—' : u.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-white">{u.total_cycles_completed ?? 0}</td>
                    <td className="px-4 py-3 text-right text-green-400">${(u.withdrawable_balance ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-teal-400">${(u.rollin_balance ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{u.direct_referrals_count ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all" title="Edit user">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => resetCycle(u)} className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all" title="Reset cycle">
                          <RefreshCw size={12} />
                        </button>
                        <button onClick={() => banUser(u)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all" title="Ban user">
                          <Ban size={12} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="text-xs text-gray-400 hover:text-white disabled:opacity-30 transition-all">Previous</button>
          <span className="text-xs text-gray-500">Page {page + 1}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={users.length < PAGE_SIZE} className="text-xs text-gray-400 hover:text-white disabled:opacity-30 transition-all">Next</button>
        </div>
      </div>

      <AnimatePresence>
        {editUser && editState && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-card rounded-2xl p-6 w-full max-w-md border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold">Edit User</h3>
                <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
              </div>
              <p className="text-gray-400 text-xs font-mono mb-5">{editUser.wallet_address}</p>
              <div className="space-y-4">
                {([
                  { label: 'Withdrawable Balance ($)', key: 'withdrawable_balance' },
                  { label: 'Rollin Balance ($)', key: 'rollin_balance' },
                  { label: 'Saved Referrals', key: 'saved_referrals' },
                  { label: 'Cycle Number', key: 'cycle_number' },
                ] as { label: string; key: keyof EditState }[]).map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-gray-400 text-xs mb-1">{label}</label>
                    <input
                      type="number"
                      value={editState[key]}
                      onChange={e => setEditState(prev => prev ? { ...prev, [key]: e.target.value } : null)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/40"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Rank</label>
                  <div className="relative">
                    <select
                      value={editState.rank}
                      onChange={e => setEditState(prev => prev ? { ...prev, rank: e.target.value as Rank } : null)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none appearance-none"
                    >
                      {(['none', 'vip', 'elite', 'president', 'founder'] as Rank[]).map(r => (
                        <option key={r} value={r} className="bg-gray-900">{r.toUpperCase()}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditUser(null)} className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-sm hover:text-white transition-all">Cancel</button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm hover:bg-blue-500/30 transition-all disabled:opacity-50"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
