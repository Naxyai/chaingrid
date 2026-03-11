import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, ExternalLink, RefreshCw, ArrowDownToLine, Zap, DollarSign, Users } from 'lucide-react';
import Layout from '../components/Layout';
import WalletModal from '../components/WalletModal';
import { useApp } from '../context/AppContext';
import { getUserCycles, getUserWithdrawals, getUserTransactions } from '../lib/supabase';
import { BSCSCAN_BASE } from '../lib/constants';
import { Cycle, Withdrawal, Transaction } from '../types';

type Tab = 'cycles' | 'withdrawals' | 'transactions';

const TX_STYLES: Record<Transaction['type'], { label: string; color: string; bg: string; icon: React.ElementType }> = {
  deposit:             { label: 'Deposit',        color: 'text-blue-400',   bg: 'bg-blue-500/20',   icon: ArrowDownToLine },
  cycle_reward:        { label: 'Round Payout',    color: 'text-green-400',  bg: 'bg-green-500/20',  icon: RefreshCw },
  rollin:              { label: 'Auto-Renew',      color: 'text-teal-400',   bg: 'bg-teal-500/20',   icon: Zap },
  referral_commission: { label: 'Commission',     color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Users },
  withdrawal:          { label: 'Withdrawal',     color: 'text-orange-400', bg: 'bg-orange-500/20', icon: ArrowDownToLine },
  withdrawal_fee:      { label: 'Platform Fee',   color: 'text-red-400',    bg: 'bg-red-500/20',    icon: DollarSign },
};

export default function History() {
  const { wallet, user } = useApp();
  const [tab, setTab] = useState<Tab>('cycles');
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletOpen, setWalletOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      Promise.all([
        getUserCycles(user.id).then(setCycles),
        getUserWithdrawals(user.id).then(setWithdrawals),
        getUserTransactions(user.id).then(setTransactions),
      ]).finally(() => setLoading(false));
    }
  }, [user?.id]);

  if (!wallet.isConnected) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <HistoryIcon size={32} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Connect to View History</h2>
            <p className="text-gray-400 mb-6">Connect your wallet to view your complete history.</p>
            <button onClick={() => setWalletOpen(true)} className="btn-primary px-6 py-3">Connect Wallet</button>
          </div>
        </div>
        <WalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
      </Layout>
    );
  }

  const tabConfig: { key: Tab; label: string; count: number }[] = [
    { key: 'cycles', label: 'Rounds', count: cycles.length },
    { key: 'withdrawals', label: 'Withdrawals', count: withdrawals.length },
    { key: 'transactions', label: 'Transactions', count: transactions.length },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">History & Transparency</h1>
        <p className="text-gray-400">Complete record of your rounds, withdrawals, and transactions</p>
      </div>

      <div className="flex gap-2 mb-6 p-1 rounded-xl bg-slate-800/40 border border-white/5 w-fit">
        {tabConfig.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'cycles' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
          {cycles.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <RefreshCw size={32} className="mx-auto mb-3 opacity-30" />
              <p>No rounds completed yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/5">
                  <tr className="text-left text-gray-500 text-xs">
                    <th className="p-4 font-medium">Round #</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Deposit</th>
                    <th className="p-4 font-medium text-right">Gross</th>
                    <th className="p-4 font-medium text-right">Net Payout</th>
                    <th className="p-4 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {cycles.map((cycle, i) => (
                    <motion.tr
                      key={cycle.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/3 hover:bg-white/2 transition-colors"
                    >
                      <td className="p-4 text-white font-bold">Round #{cycle.cycle_number}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          cycle.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          cycle.status === 'active'    ? 'bg-blue-500/20 text-blue-400' :
                          cycle.status === 'paused'    ? 'bg-orange-500/20 text-orange-400' :
                          cycle.status === 'no_reward' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {cycle.status}
                        </span>
                      </td>
                      <td className="p-4 text-right text-gray-300">${cycle.deposit}</td>
                      <td className="p-4 text-right text-yellow-400">${cycle.gross_reward}</td>
                      <td className="p-4 text-right text-green-400 font-semibold">${cycle.net_reward}</td>
                      <td className="p-4 text-right text-gray-500 text-xs">
                        {new Date(cycle.started_at).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      ) : tab === 'withdrawals' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
          {withdrawals.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ArrowDownToLine size={32} className="mx-auto mb-3 opacity-30" />
              <p>No withdrawals yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/5">
                  <tr className="text-left text-gray-500 text-xs">
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Gross</th>
                    <th className="p-4 font-medium text-right">Fee</th>
                    <th className="p-4 font-medium text-right">Net</th>
                    <th className="p-4 font-medium text-center">Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w, i) => (
                    <motion.tr
                      key={w.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/3 hover:bg-white/2 transition-colors"
                    >
                      <td className="p-4 text-gray-300 text-xs">{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          w.status === 'completed'  ? 'bg-green-500/20 text-green-400' :
                          w.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                          w.status === 'pending'    ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="p-4 text-right text-gray-300">${w.gross_amount}</td>
                      <td className="p-4 text-right text-red-400">-${w.platform_fee}</td>
                      <td className="p-4 text-right text-green-400 font-semibold">${w.net_amount}</td>
                      <td className="p-4 text-center">
                        {w.tx_hash ? (
                          <a
                            href={`${BSCSCAN_BASE}/tx/${w.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 text-xs"
                          >
                            <ExternalLink size={12} />
                            View
                          </a>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <DollarSign size={32} className="mx-auto mb-3 opacity-30" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/5">
                  <tr className="text-left text-gray-500 text-xs">
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Description</th>
                    <th className="p-4 font-medium text-right">Amount</th>
                    <th className="p-4 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => {
                    const style = TX_STYLES[tx.type] ?? TX_STYLES.deposit;
                    const TxIcon = style.icon;
                    return (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-white/3 hover:bg-white/2 transition-colors"
                      >
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.color}`}>
                            <TxIcon size={11} />
                            {style.label}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400 text-xs max-w-[200px] truncate">{tx.description}</td>
                        <td className={`p-4 text-right font-semibold ${
                          tx.type === 'withdrawal_fee' ? 'text-red-400' :
                          tx.type === 'deposit' ? 'text-blue-400' :
                          'text-green-400'
                        }`}>
                          {tx.type === 'withdrawal_fee' ? '-' : '+'}${tx.amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-right text-gray-500 text-xs">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </Layout>
  );
}
