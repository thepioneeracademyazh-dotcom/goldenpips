import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className={showNav ? 'flex-1 pb-20' : 'flex-1'}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
