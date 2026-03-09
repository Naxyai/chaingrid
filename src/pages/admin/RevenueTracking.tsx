import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, RefreshCw, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RevenueDay {
  id: string;
  date: string;
  daily_fees: number;
  daily_withdrawals: number;
  daily_cycles: number;
  daily_new_users: number;
  cumulative_fees: number;
}

export default function RevenueTracking() {
  const [data, setData] = useState<RevenueDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30' | '90' | 'all'>('30');

  const load = async () => {
    setLoading(true);
    let query = supabase.from('revenue_tracking').select('*').order('date', { ascending: false });
    if (period !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));
      query = query.gte('date', daysAgo.toISOString().split('T')[0]);
    }
    const { data: rows } = await query;
    setData((rows ?? []) as RevenueDay[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [period]);

  const totalFees = data.reduce((s, d) => s + (d.daily_fees ?? 0), 0);
  const totalWithdrawals = data.reduce((s, d) => s + (d.daily_withdrawals ?? 0), 0);
  const totalCycles = data.reduce((s, d) => s + (d.daily_cycles ?? 0), 0);
  const totalNewUsers = data.reduce((s, d) => s + (d.daily_new_users ?? 0), 0);
  const latestCumulative = data[0]?.cumulative_fees ?? 0;
  const maxFee = Math.max(...data.map(d => d.daily_fees ?? 0), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-500/20 border border-green-500/40 flex items-center justify-center">
            <TrendingUp size={18} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Revenue Tracking</h2>
            <p className="text-gray-400 text-xs">Platform fee income analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(['7', '30', '90', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/3 text-gray-500 border border-white/5 hover:text-gray-300'
              }`}
            >
              {p === 'all' ? 'All' : `${p}d`}
            </button>
          ))}
          <button onClick={load} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Fees (Period)',  value: `$${totalFees.toFixed(2)}`,         color: 'text-green-400' },
          { label: 'Cumulative Fees',      value: `$${latestCumulative.toFixed(2)}`,  color: 'text-teal-400' },
          { label: 'Total Withdrawals',    value: `$${totalWithdrawals.toFixed(2)}`,  color: 'text-yellow-400' },
          { label: 'Cycles Completed',     value: totalCycles,                        color: 'text-blue-400' },
          { label: 'New Users',            value: totalNewUsers,                      color: 'text-orange-400' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card rounded-xl p-4 text-center">
            <div className={`font-black text-xl ${stat.color}`}>{stat.value}</div>
            <div className="text-gray-500 text-xs mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {data.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
          <h3 className="text-white font-bold text-sm mb-4">Daily Revenue (Fees)</h3>
          <div className="flex items-end gap-1 h-32">
            {[...data].reverse().slice(-30).map((day, i) => {
              const height = Math.max(4, ((day.daily_fees ?? 0) / maxFee) * 100);
              return (
                <div key={day.id} className="flex-1 flex flex-col items-center gap-1 group" title={`${day.date}: $${(day.daily_fees ?? 0).toFixed(2)}`}>
                  <div className="w-full rounded-sm bg-green-500/40 hover:bg-green-500/70 transition-all cursor-default" style={{ height: `${height}%` }} />
                  {i % 5 === 0 && (
                    <span className="text-gray-600 text-[9px] hidden sm:block truncate w-full text-center">
                      {new Date(day.date).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Calendar size={15} className="text-gray-400" />
          <h3 className="text-white font-bold text-sm">Daily Breakdown</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No revenue data available yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-left text-gray-500 text-xs">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Daily Fees</th>
                  <th className="px-4 py-3 font-medium text-right">Withdrawals</th>
                  <th className="px-4 py-3 font-medium text-center">Cycles</th>
                  <th className="px-4 py-3 font-medium text-center">New Users</th>
                  <th className="px-4 py-3 font-medium text-right">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {data.map((day, i) => (
                  <motion.tr key={day.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-gray-300 text-xs">{new Date(day.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                    <td className="px-4 py-3 text-right text-green-400 font-bold">${(day.daily_fees ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-yellow-400">${(day.daily_withdrawals ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-blue-400">{day.daily_cycles ?? 0}</td>
                    <td className="px-4 py-3 text-center text-orange-400">{day.daily_new_users ?? 0}</td>
                    <td className="px-4 py-3 text-right text-teal-400">${(day.cumulative_fees ?? 0).toFixed(2)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
