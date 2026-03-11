import { BNB_CHAIN_CONFIG, BNB_CHAIN_ID, USDT_BEP20_ADDRESS, USDT_DECIMALS } from './constants';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
      selectedAddress?: string;
      chainId?: string;
    };
  }
}

export function isMetaMaskAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
}

export async function connectMetaMask(): Promise<string> {
  if (!window.ethereum) throw new Error('MetaMask not found. Please install MetaMask.');

  const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
  if (!accounts.length) throw new Error('No accounts found.');

  await ensureBNBChain();
  return accounts[0];
}

export async function getConnectedAccount(): Promise<string | null> {
  if (!window.ethereum) return null;
  try {
    const accounts = (await window.ethereum.request({ method: 'eth_accounts' })) as string[];
    return accounts[0] || null;
  } catch {
    return null;
  }
}

export async function getChainId(): Promise<number | null> {
  if (!window.ethereum) return null;
  try {
    const chainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
    return parseInt(chainId, 16);
  } catch {
    return null;
  }
}

export async function ensureBNBChain(): Promise<void> {
  if (!window.ethereum) return;
  const chainId = await getChainId();
  if (chainId === BNB_CHAIN_ID) return;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BNB_CHAIN_CONFIG.chainId }],
    });
  } catch (switchError: unknown) {
    const err = switchError as { code?: number };
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [BNB_CHAIN_CONFIG],
      });
    } else {
      throw switchError;
    }
  }
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function onAccountsChanged(handler: (accounts: string[]) => void): () => void {
  if (!window.ethereum) return () => {};
  window.ethereum.on('accountsChanged', handler as (...args: unknown[]) => void);
  return () => window.ethereum?.removeListener('accountsChanged', handler as (...args: unknown[]) => void);
}

export function onChainChanged(handler: (chainId: string) => void): () => void {
  if (!window.ethereum) return () => {};
  window.ethereum.on('chainChanged', handler as (...args: unknown[]) => void);
  return () => window.ethereum?.removeListener('chainChanged', handler as (...args: unknown[]) => void);
}

function encodeERC20Transfer(toAddress: string, amountWei: bigint): string {
  const methodId = '0xa9059cbb';
  const paddedTo = toAddress.toLowerCase().replace('0x', '').padStart(64, '0');
  const paddedAmount = amountWei.toString(16).padStart(64, '0');
  return methodId + paddedTo + paddedAmount;
}

export async function getUSDTBalance(address: string): Promise<number> {
  if (!window.ethereum) return 0;
  try {
    const balanceOfData =
      '0x70a08231' + address.toLowerCase().replace('0x', '').padStart(64, '0');
    const result = (await window.ethereum.request({
      method: 'eth_call',
      params: [{ to: USDT_BEP20_ADDRESS, data: balanceOfData }, 'latest'],
    })) as string;
    const balanceWei = BigInt(result);
    return Number(balanceWei) / Math.pow(10, USDT_DECIMALS);
  } catch {
    return 0;
  }
}

export async function sendUSDTDeposit(
  fromAddress: string,
  toAddress: string,
  amountUSDT: number,
): Promise<string> {
  if (!window.ethereum) throw new Error('MetaMask not found. Please install MetaMask.');

  await ensureBNBChain();

  const amountWei = BigInt(Math.floor(amountUSDT * Math.pow(10, USDT_DECIMALS)));
  const data = encodeERC20Transfer(toAddress, amountWei);

  const txHash = (await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: fromAddress,
        to: USDT_BEP20_ADDRESS,
        data,
        gas: '0x186A0',
      },
    ],
  })) as string;

  return txHash;
}
