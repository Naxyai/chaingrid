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
export const CYCLE1_REWARD = 300;
export const CYCLE2_PLUS_REWARD = 200;
export const CYCLE_AFTER_100_REWARD = 200;
export const AUTO_ROLL_AMOUNT = 100;
export const SLOTS_COUNT = 100;
export const JOINS_PER_CYCLE = 99;
export const FREE_CYCLE_THRESHOLD = 100;

export const CYCLE_TABLE = [
  { cycle: 'Cycle 1', deposit: 100, referrals: 2, gross: 300, withdrawable: 200, autoRoll: 100 },
  { cycle: 'Cycle 2+', deposit: 100, referrals: 1, gross: 200, withdrawable: 100, autoRoll: 100 },
  { cycle: 'Post 100', deposit: 100, referrals: 0, gross: 200, withdrawable: 100, autoRoll: 100 },
];

export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

export const BSCSCAN_BASE = 'https://bscscan.com';
