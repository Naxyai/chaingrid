import { BNB_CHAIN_CONFIG, BNB_CHAIN_ID } from './constants';

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
