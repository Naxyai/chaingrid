import { RankInfo, Rank } from '../types';

export const BNB_CHAIN_ID = 56;
export const BNB_CHAIN_ID_HEX = '0x38';

export const BNB_CHAIN_CONFIG = {
  chainId: BNB_CHAIN_ID_HEX,
  chainName: 'BNB Smart Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: ['https://bsc-dataseed.binance.org/'],
  blockExplorerUrls: ['https://bscscan.com/'],
};

export const PLATFORM_FEE_PERCENT = 10;
export const DEPOSIT_AMOUNT = 100;
export const SLOTS_COUNT = 100;
export const JOINS_PER_CYCLE = 99;
export const FREE_CYCLE_THRESHOLD = 100;
export const COMMISSION_UNLOCK_CYCLES = 25;

export const CYCLE1_GROSS = 300;
export const CYCLE1_WITHDRAWABLE = 200;
export const CYCLE1_AUTOROLL = 100;
export const CYCLE1_REFERRALS_REQUIRED = 2;

export const CYCLE2_GROSS = 200;
export const CYCLE2_WITHDRAWABLE = 100;
export const CYCLE2_AUTOROLL = 100;
export const CYCLE2_REFERRALS_REQUIRED = 1;

export const CYCLE_TABLE = [
  { cycle: 'Cycle 1', deposit: 100, referrals: 2, gross: 300, withdrawable: 200, autoRoll: 100 },
  { cycle: 'Cycle 2+', deposit: 100, referrals: 1, gross: 200, withdrawable: 100, autoRoll: 100 },
  { cycle: 'Post 100', deposit: 100, referrals: 0, gross: 200, withdrawable: 100, autoRoll: 100 },
];

export const RANK_INFO: Record<Rank, RankInfo> = {
  none: {
    rank: 'none',
    label: 'Unranked',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    commissionRate: 0,
    requirement: 'Complete 25 cycles to unlock VIP',
    cyclesRequired: 25,
  },
  vip: {
    rank: 'vip',
    label: 'VIP Club',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    commissionRate: 2,
    requirement: '5 direct VIP referrals unlock Elite',
    cyclesRequired: 25,
  },
  elite: {
    rank: 'elite',
    label: 'Elite Club',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    commissionRate: 3,
    requirement: '5 direct Elite referrals unlock President',
    cyclesRequired: 0,
  },
  president: {
    rank: 'president',
    label: 'President Club',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    commissionRate: 4,
    requirement: '5 direct President referrals unlock Founder',
    cyclesRequired: 0,
  },
  founder: {
    rank: 'founder',
    label: 'Founder Club',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    commissionRate: 5,
    requirement: 'Maximum rank achieved',
    cyclesRequired: 0,
  },
};

export const RANK_ORDER: Rank[] = ['none', 'vip', 'elite', 'president', 'founder'];

export function getRankInfo(rank: Rank): RankInfo {
  return RANK_INFO[rank] ?? RANK_INFO.none;
}

export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';
export const BSCSCAN_BASE = 'https://bscscan.com';
