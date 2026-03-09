import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Users, TrendingUp, RefreshCw, Award, DollarSign,
  LayoutGrid, GitBranch, ArrowDownToLine, Cpu, BookOpen, BarChart2
} from 'lucide-react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import BoardControl from './admin/BoardControl';
import UserManagement from './admin/UserManagement';
import ReferralNetwork from './admin/ReferralNetwork';
import WithdrawalMonitor from './admin/WithdrawalMonitor';
import ContractMonitor from './admin/ContractMonitor';
import TransactionLedger from './admin/TransactionLedger';
import RevenueTracking from './admin/RevenueTracking';

type AdminTab = 'overview' | 'board' | 'users' | 'referrals' | 'withdrawals' | 'contract' | 'ledger' | 'revenue';

const TABS: { id: AdminTab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'overview',    label: 'Overview',    icon: Shield,          desc: '' },
  { id: 'board',       label: 'Board',       icon: LayoutGrid,      desc: 'Monitor and control board entries' },
  { id: 'users',       label: 'Users',       icon: Users,           desc: 'View, edit, and manage all users' },
  { id: 'referrals',   label: 'Referrals',   icon: GitBranch,       desc: 'Explore referral network hierarchy' },
  { id: 'withdrawals', label: 'Withdrawals', icon: ArrowDownToLine, desc: 'Monitor on-chain payouts' },
  { id: 'contract',    label: 'Contract',    icon: Cpu,             desc: 'Smart contract stats from BSC' },
  { id: 'ledger',      label: 'Ledger',      icon: BookOpen,        desc: 'Full transaction history' },
  { id: 'revenue',     label: 'Revenue',     icon: BarChart2,       desc: 'Daily and cumulative fee tracking' },
];

export default function Admin() {
  const { wallet, user, globalStats } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const isAdmin =
    user?.is_admin ||
    wallet.address?.toLowerCase() === import.meta.env.VITE_ADMIN_WALLET?.toLowerCase();

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

  const overviewStats = [
    { label: 'Total Users',      value: globalStats?.total_users ?? 0,                               icon: Users,      color: 'blue' },
    { label: 'Cycles Completed', value: globalStats?.total_cycles_completed ?? 0,                    icon: RefreshCw,  color: 'yellow' },
    { label: 'Total Withdrawn',  value: `$${(globalStats?.total_withdrawn_usd ?? 0).toFixed(0)}`,    icon: TrendingUp, color: 'green' },
    { label: 'Company Fees',     value: `$${(globalStats?.total_company_fees ?? 0).toFixed(2)}`,     icon: DollarSign, color: 'teal' },
    { label: 'Commissions Paid', value: `$${(globalStats?.total_commissions_paid ?? 0).toFixed(2)}`, icon: Award,      color: 'orange' },
  ];

  return (
    <Layout>
      <div className="mb-6 mt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
            <Shield size={20} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Admin Panel</h1>
            <p className="text-gray-400 text-sm">Platform management &amp; analytics</p>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-white/3 text-gray-500 border border-white/5 hover:text-gray-300 hover:bg-white/6'
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {overviewStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="glass-card rounded-xl p-5"
                >
                  <div className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center ${
                    stat.color === 'blue'   ? 'bg-blue-500/20 text-blue-400' :
                    stat.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                    stat.color === 'green'  ? 'bg-green-500/20 text-green-400' :
                    stat.color === 'teal'   ? 'bg-teal-500/20 text-teal-400' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>
                    <stat.icon size={18} />
                  </div>
                  <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
                  <div className="text-gray-400 text-xs">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TABS.slice(1).map((tab, i) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    onClick={() => setActiveTab(tab.id)}
                    className="glass-card rounded-xl p-5 text-left hover:border-yellow-500/20 border border-white/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-3 group-hover:bg-yellow-500/20 transition-all">
                      <Icon size={18} className="text-yellow-400" />
                    </div>
                    <p className="text-white font-bold text-sm">{tab.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{tab.desc}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'board'       && <BoardControl />}
        {activeTab === 'users'       && <UserManagement />}
        {activeTab === 'referrals'   && <ReferralNetwork />}
        {activeTab === 'withdrawals' && <WithdrawalMonitor />}
        {activeTab === 'contract'    && <ContractMonitor />}
        {activeTab === 'ledger'      && <TransactionLedger />}
        {activeTab === 'revenue'     && <RevenueTracking />}
      </motion.div>
    </Layout>
  );
}
