import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { NotificationBell } from '@/components/NotificationBell';
import { PremiumBadgeWithDays } from '@/components/PremiumBadgeWithDays';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AppHeaderProps {
  showLogo?: boolean;
  title?: string;
  subtitle?: string;
  showLiveBadge?: boolean;
}

export function AppHeader({ showLogo = true, title, subtitle, showLiveBadge = false }: AppHeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-area-top">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left: Logo or Title */}
        <div className="flex items-center gap-2">
          {showLogo ? (
            <Logo size="md" />
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">{title}</h1>
                {showLiveBadge && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 text-success text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              {subtitle && <p className="text-xs text-muted-foreground -mt-0.5">{subtitle}</p>}
            </div>
          )}
        </div>

        {/* Right: Notification + Badge/SignIn */}
        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
          {user ? (
            <PremiumBadgeWithDays user={user} />
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/auth')}
              className="border-primary/30 text-primary hover:bg-primary/10 font-semibold"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
