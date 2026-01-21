import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  showHeader?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  showLogo?: boolean;
}

export function AppLayout({ 
  children, 
  showNav = true, 
  showHeader = true,
  headerTitle,
  headerSubtitle,
  showLogo = true
}: AppLayoutProps) {
  return (
    <div className="min-h-screen gradient-bg-premium flex flex-col">
      {showHeader && (
        <AppHeader 
          showLogo={showLogo} 
          title={headerTitle} 
          subtitle={headerSubtitle} 
        />
      )}
      <main className={showNav ? 'flex-1 pb-20' : 'flex-1'}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
