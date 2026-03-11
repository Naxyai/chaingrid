import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

function TwitterIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TelegramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function MediumIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
    </svg>
  );
}

function YouTubeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { label: 'Twitter',  href: 'https://twitter.com/100cycle',  icon: TwitterIcon,  color: 'hover:text-sky-400 hover:bg-sky-400/10 hover:border-sky-400/30' },
  { label: 'Telegram', href: 'https://t.me/100cycle',         icon: TelegramIcon, color: 'hover:text-blue-400 hover:bg-blue-400/10 hover:border-blue-400/30' },
  { label: 'Medium',   href: 'https://medium.com/@100cycle',  icon: MediumIcon,   color: 'hover:text-gray-100 hover:bg-white/10 hover:border-white/30' },
  { label: 'YouTube',  href: 'https://youtube.com/@100cycle', icon: YouTubeIcon,  color: 'hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/30' },
];

const NAV_LINKS = [
  { label: 'Board',      to: '/board' },
  { label: 'Dashboard',  to: '/dashboard' },
  { label: 'History',    to: '/history' },
  { label: 'Referrals',  to: '/referrals' },
  { label: 'Withdraw',   to: '/withdraw' },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                <Zap size={16} className="text-blue-400" />
              </div>
              <span className="text-white font-black text-xl tracking-tight">100Cycle</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-6">
              A decentralized donation platform on BNB Smart Chain. 100 positions, transparent on-chain mechanics, automatic payouts — no middlemen.
            </p>
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map(s => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.label}
                    className={`w-9 h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 transition-all ${s.color}`}
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-white font-bold text-sm mb-4">Platform</p>
            <ul className="space-y-2.5">
              {NAV_LINKS.map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-gray-400 text-sm hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white font-bold text-sm mb-4">Network</p>
            <div className="space-y-2.5 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span>BNB Smart Chain</span>
              </div>
              <div>Chain ID: <span className="text-white">56</span></div>
              <div>Token: <span className="text-white">USDT (BEP-20)</span></div>
              <div>Entry: <span className="text-yellow-400 font-bold">$100 USDT</span></div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <a
                  href={`https://bscscan.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View on BscScan
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>&copy; {new Date().getFullYear()} 100Cycle. All rights reserved.</p>
          <p>Decentralized donation platform on BNB Smart Chain — not financial advice.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Contracts Live
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
