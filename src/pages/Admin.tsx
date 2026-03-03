import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Pause, Play, AlertTriangle, Users, RefreshCw, TrendingUp, Settings } from 'lucide-react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Withdrawal, User } from '../types';

export default function Admin() {
  const { wallet, user, globalStats } = useApp();
  const [withdrawalsPaused, setWithdrawalsPaused] = useState(false);
  const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.is_admin || wallet.address?.toLowerCase() === import.meta.env.VITE_ADMIN_WALLET?.toLowerCase();

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      const [{ data: wds }, { data: usrs }] = await Promise.all([
        supabase.from('withdrawals').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('users').select('*').order('created_at', { ascending: false }).limit(20),
      ]);
      setRecentWithdrawals(wds ?? []);
      setRecentUsers(usrs ?? []);
      setLoading(false);
    };
    load();
  }, [isAdmin]);

  const toggleWithdrawal = (wd: Withdrawal) => {
    supabase.from('withdrawals').update({ status: 'processing' }).eq('id', wd.id);
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Shield size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">Access Denied</h2>
            <p className="text-gray-400">You don't have admin privileges.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const pendingWithdrawals = recentWithdrawals.filter(w => w.status === 'pending');
  const totalPendingAmount = pendingWithdrawals.reduce((sum, w) => sum + w.net_amount, 0);

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
            <Shield size={20} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Admin Panel</h1>
            <p className="text-gray-400 text-sm">Platform management & analytics</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: globalStats?.total_users ?? 0, icon: Users, color: 'blue' },
          { label: 'Cycles Completed', value: globalStats?.total_cycles_completed ?? 0, icon: RefreshCw, color: 'yellow' },
          { label: 'Total Withdrawn', value: `$${(globalStats?.total_withdrawn_usd ?? 0).toFixed(0)}`, icon: TrendingUp, color: 'green' },
          { label: 'Pending Withdrawals', value: pendingWithdrawals.length, icon: AlertTriangle, color: 'red' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-xl p-5"
          >
            <div className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center ${
              stat.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
              stat.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
              stat.color === 'green' ? 'bg-green-500/20 text-green-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              <stat.icon size={18} />
            </div>
            <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
            <div className="text-gray-400 text-xs">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-xl p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Settings size={16} className="text-yellow-400" />
            Platform Controls
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5">
              <div>
                <p className="text-white text-sm font-medium">Withdrawals</p>
                <p className="text-gray-400 text-xs">{withdrawalsPaused ? 'Currently paused' : 'Currently active'}</p>
              </div>
              <button
                onClick={() => setWithdrawalsPaused(!withdrawalsPaused)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  withdrawalsPaused
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                }`}
              >
                {withdrawalsPaused ? <><Play size={14} /> Resume</> : <><Pause size={14} /> Pause</>}
              </button>
            </div>

            {totalPendingAmount > 0 && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-yellow-400 text-sm font-medium">Pending Payout: ${totalPendingAmount.toFixed(2)}</p>
                <p className="text-gray-400 text-xs mt-0.5">{pendingWithdrawals.length} withdrawal{pendingWithdrawals.length !== 1 ? 's' : ''} awaiting processing</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-xl p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            Pending Withdrawals
          </h3>
          {pendingWithdrawals.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">No pending withdrawals</div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pendingWithdrawals.map(wd => (
                <div key={wd.id} className="flex items-center justify-between p-2 rounded-lg bg-white/3 border border-white/5 text-xs">
                  <div>
                    <p className="text-gray-300 font-mono">{wd.wallet_address.slice(0, 10)}...</p>
                    <p className="text-green-400">${wd.net_amount.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => toggleWithdrawal(wd)}
                    className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all"
                  >
                    Process
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6 mb-6">
        <h3 className="text-white font-bold mb-5 flex items-center gap-2">
          <Users size={16} className="text-blue-400" />
          Recent Users
        </h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-left text-gray-500 text-xs">
                  <th className="pb-3 font-medium">Wallet</th>
                  <th className="pb-3 font-medium text-center">Cycle</th>
                  <th className="pb-3 font-medium text-center">Slot</th>
                  <th className="pb-3 font-medium text-center">Referrals</th>
                  <th className="pb-3 font-medium text-right">Balance</th>
                  <th className="pb-3 font-medium text-right">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map(u => (
                  <tr key={u.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                    <td className="py-3 font-mono text-gray-300 text-xs">{u.wallet_address.slice(0, 12)}...</td>
                    <td className="py-3 text-center text-blue-400">#{u.cycle_number}</td>
                    <td className="py-3 text-center text-white">{u.current_slot}</td>
                    <td className="py-3 text-center text-gray-300">{u.referral_credits}</td>
                    <td className="py-3 text-right text-green-400">${u.withdrawable_balance}</td>
                    <td className="py-3 text-right text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
