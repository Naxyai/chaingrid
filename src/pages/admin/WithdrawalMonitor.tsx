import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownToLine, RefreshCw, ExternalLink, AlertTriangle, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Withdrawal } from '../../types';
import { BSCSCAN_BASE } from '../../lib/constants';

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed:  'bg-green-500/10 text-green-400 border-green-500/20',
  failed:     'bg-red-500/10 text-red-400 border-red-500/20',
};

type FilterStatus = 'all' | 'pending' | 'processing' | 'completed' | 'failed';

export default function WithdrawalMonitor() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }
    const { data } = await query;
    setWithdrawals((data ?? []) as Withdrawal[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const retryPayout = async (wd: Withdrawal) => {
    setRetrying(wd.id);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/process-withdrawal`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawal_id: wd.id, wallet_address: wd.wallet_address, amount: wd.net_amount }),
      });
      const result = await res.json();
      if (result.success) {
        await supabase.from('withdrawals').update({ status: 'completed', tx_hash: result.tx_hash, completed_at: new Date().toISOString() }).eq('id', wd.id);
      } else {
        await supabase.from('withdrawals').update({ status: 'failed' }).eq('id', wd.id);
      }
    } catch {
      await supabase.from('withdrawals').update({ status: 'failed' }).eq('id', wd.id);
    }
    setRetrying(null);
    load();
  };

  const totalPending = withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.net_amount, 0);
  const totalFailed = withdrawals.filter(w => w.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
            <ArrowDownToLine size={18} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Withdrawal Monitor</h2>
            <p className="text-gray-400 text-xs">On-chain payouts — no approval required</p>
          </div>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['all', 'pending', 'completed', 'failed'] as FilterStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${
              filter === s ? 'bg-white/10 text-white border-white/20' : 'bg-white/3 text-gray-500 border-white/5 hover:text-gray-300'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {totalPending > 0 && (
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2">
          <AlertTriangle size={15} className="text-yellow-400" />
          <p className="text-yellow-400 text-sm">${totalPending.toFixed(2)} pending across {withdrawals.filter(w => w.status === 'pending').length} withdrawal(s)</p>
        </div>
      )}
      {totalFailed > 0 && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-400" />
          <p className="text-red-400 text-sm">{totalFailed} failed payout(s) — retry available</p>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No withdrawals found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-left text-gray-500 text-xs">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium text-right">Requested</th>
                  <th className="px-4 py-3 font-medium text-right">Fee</th>
                  <th className="px-4 py-3 font-medium text-right">Payout</th>
                  <th className="px-4 py-3 font-medium text-center">TX Hash</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((wd, i) => (
                  <motion.tr
                    key={wd.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-white/3 hover:bg-white/2 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-gray-300 text-xs">{wd.wallet_address.slice(0, 12)}...</td>
                    <td className="px-4 py-3 text-right text-white">${wd.gross_amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-red-400">-${wd.platform_fee.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-green-400 font-bold">${wd.net_amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      {wd.tx_hash ? (
                        <a href={`${BSCSCAN_BASE}/tx/${wd.tx_hash}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 text-blue-400 hover:text-blue-300 text-xs">
                          {wd.tx_hash.slice(0, 8)}...<ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[wd.status]}`}>{wd.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">{new Date(wd.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {(wd.status === 'failed' || wd.status === 'pending') && (
                        <button
                          onClick={() => retryPayout(wd)}
                          disabled={retrying === wd.id}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 text-xs transition-all disabled:opacity-50 ml-auto"
                        >
                          {retrying === wd.id ? <div className="w-3 h-3 border border-orange-400 border-t-transparent rounded-full animate-spin" /> : <RotateCcw size={11} />}
                          Retry
                        </button>
                      )}
                    </td>
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
