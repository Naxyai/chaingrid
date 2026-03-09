import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, RefreshCw, ExternalLink, Copy, Check, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CONTRACT_ADDRESS, BSCSCAN_BASE } from '../../lib/constants';

interface ContractStats {
  contract_address: string;
  total_paid_out: number;
  total_transactions: number;
  total_users_paid: number;
  last_tx_hash: string;
  last_synced_at: string;
}

export default function ContractMonitor() {
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [contractBalance, setContractBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rpcError, setRpcError] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    const { data } = await supabase.from('contract_monitor').select('*').eq('id', 1).maybeSingle();
    if (data) setStats(data as ContractStats);
    setLoading(false);
  };

  const fetchContractBalance = async () => {
    setBalanceLoading(true);
    setRpcError(false);
    try {
      const res = await fetch('https://bsc-dataseed.binance.org/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getBalance', params: [CONTRACT_ADDRESS, 'latest'], id: 1 }),
      });
      const json = await res.json();
      if (json.result) {
        const bnb = Number(BigInt(json.result)) / 1e18;
        setContractBalance(bnb.toFixed(6));
      } else {
        setRpcError(true);
      }
    } catch {
      setRpcError(true);
    }
    setBalanceLoading(false);
  };

  useEffect(() => { loadStats(); fetchContractBalance(); }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Cpu size={18} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Smart Contract Monitor</h2>
            <p className="text-gray-400 text-xs">BSC on-chain stats</p>
          </div>
        </div>
        <button onClick={() => { loadStats(); fetchContractBalance(); }} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
          <RefreshCw size={15} />
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
        <p className="text-gray-400 text-xs mb-2">Contract Address</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-cyan-400 font-mono text-sm break-all">{CONTRACT_ADDRESS}</code>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={copyAddress} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
            <a href={`${BSCSCAN_BASE}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-blue-400 transition-all">
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Contract Balance',
            content: balanceLoading ? null : rpcError ? <span className="text-red-400 font-bold text-sm">RPC Error</span> : <span className="text-cyan-400 font-black text-xl">{contractBalance ?? '—'} BNB</span>,
            icon: rpcError ? <WifiOff size={14} className="text-red-400" /> : <Wifi size={14} className="text-green-400" />,
            spinner: balanceLoading,
            spinnerColor: 'border-cyan-400',
          },
          { label: 'Total Paid Out',     content: <span className="text-green-400 font-black text-xl">${(stats?.total_paid_out ?? 0).toFixed(2)}</span>,  spinner: loading, spinnerColor: 'border-green-400',  icon: null },
          { label: 'Total Transactions', content: <span className="text-blue-400 font-black text-xl">{stats?.total_transactions ?? 0}</span>,              spinner: loading, spinnerColor: 'border-blue-400',   icon: null },
          { label: 'Users Paid',         content: <span className="text-yellow-400 font-black text-xl">{stats?.total_users_paid ?? 0}</span>,              spinner: loading, spinnerColor: 'border-yellow-400', icon: null },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="glass-card rounded-xl p-4 text-center">
            {card.icon && <div className="flex items-center justify-center gap-1.5 mb-1">{card.icon}</div>}
            <p className="text-gray-400 text-xs mb-2">{card.label}</p>
            {card.spinner ? (
              <div className="flex justify-center"><div className={`w-4 h-4 border-2 ${card.spinnerColor} border-t-transparent rounded-full animate-spin`} /></div>
            ) : card.content}
          </motion.div>
        ))}
      </div>

      {stats?.last_tx_hash && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
          <p className="text-gray-400 text-xs mb-2">Last Transaction</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-blue-400 font-mono text-xs break-all">{stats.last_tx_hash}</code>
            <a href={`${BSCSCAN_BASE}/tx/${stats.last_tx_hash}`} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/20 transition-all">
              <ExternalLink size={12} />BscScan
            </a>
          </div>
          {stats.last_synced_at && <p className="text-gray-600 text-xs mt-2">Last synced: {new Date(stats.last_synced_at).toLocaleString()}</p>}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
        <h3 className="text-white font-bold text-sm mb-3">Contract Details</h3>
        <div className="space-y-0">
          {[
            { label: 'Network',               value: 'BNB Smart Chain (BSC)', cls: 'text-white' },
            { label: 'Chain ID',              value: '56',                     cls: 'text-white' },
            { label: 'Withdrawal Function',   value: 'withdraw(address, uint256)', cls: 'text-cyan-400 font-mono text-xs' },
            { label: 'Platform Fee',          value: '10%',                    cls: 'text-yellow-400' },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 text-sm">
              <span className="text-gray-400">{row.label}</span>
              <span className={row.cls}>{row.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
