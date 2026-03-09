import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Filter, Search, RefreshCw, ArrowUpRight, ArrowDownLeft, RotateCcw, Users, DollarSign, Minus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Transaction } from '../../types';

type TxType = 'all' | 'deposit' | 'cycle_reward' | 'rollin' | 'referral_commission' | 'withdrawal' | 'withdrawal_fee';

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  deposit:             { icon: ArrowDownLeft, color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',     label: 'Deposit' },
  cycle_reward:        { icon: ArrowUpRight,  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',   label: 'Cycle Reward' },
  rollin:              { icon: RotateCcw,     color: 'text-teal-400',   bg: 'bg-teal-500/10 border-teal-500/20',     label: 'Roll-In' },
  referral_commission: { icon: Users,         color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', label: 'Commission' },
  withdrawal:          { icon: ArrowUpRight,  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Withdrawal' },
  withdrawal_fee:      { icon: Minus,         color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',       label: 'Fee' },
};

export default function TransactionLedger() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TxType>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (typeFilter !== 'all') query = query.eq('type', typeFilter);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');
    const { data } = await query;
    setTransactions((data ?? []) as Transaction[]);
    setLoading(false);
  }, [page, typeFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const filteredTx = userSearch.trim()
    ? transactions.filter(t => t.user_id.includes(userSearch.trim()))
    : transactions;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
            <BookOpen size={18} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Transaction Ledger</h2>
            <p className="text-gray-400 text-xs">Complete platform transaction history</p>
          </div>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Filter size={13} /><span>Filters</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-gray-500 text-xs mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value as TxType); setPage(0); }}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none"
            >
              <option value="all" className="bg-gray-900">All Types</option>
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <option key={key} value={key} className="bg-gray-900">{meta.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-500 text-xs mb-1">From Date</label>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }} className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none" />
          </div>
          <div>
            <label className="block text-gray-500 text-xs mb-1">To Date</label>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }} className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none" />
          </div>
          <div>
            <label className="block text-gray-500 text-xs mb-1">User ID</label>
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Filter by user..." className="w-full pl-6 pr-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none placeholder-gray-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-left text-gray-500 text-xs">
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((tx, i) => {
                  const meta = TYPE_META[tx.type] ?? { icon: DollarSign, color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20', label: tx.type };
                  const Icon = meta.icon;
                  return (
                    <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs ${meta.bg} ${meta.color}`}>
                          <Icon size={11} />{meta.label}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{tx.description}</td>
                      <td className={`px-4 py-3 text-right font-bold ${meta.color}`}>
                        {tx.type === 'withdrawal_fee' || tx.type === 'deposit' ? '-' : '+'}${tx.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 text-xs">
                        {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="text-xs text-gray-400 hover:text-white disabled:opacity-30 transition-all">Previous</button>
          <span className="text-xs text-gray-500">Page {page + 1} — {filteredTx.length} results</span>
          <button onClick={() => setPage(p => p + 1)} disabled={filteredTx.length < PAGE_SIZE} className="text-xs text-gray-400 hover:text-white disabled:opacity-30 transition-all">Next</button>
        </div>
      </div>
    </div>
  );
}
