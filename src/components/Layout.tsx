import { ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export default function Layout({ children, fullWidth = false }: LayoutProps) {
  return (
    <div className="min-h-screen bg-cyber-dark text-white">
      <Navbar />
      <main className={`pt-16 pb-20 md:pb-0 ${fullWidth ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-8'}`}>
        {children}
      </main>
    </div>
  );
}
