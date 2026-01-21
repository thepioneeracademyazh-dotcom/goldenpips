import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AppHeaderProps {
  showLogo?: boolean;
  title?: string;
  subtitle?: string;
}

export function AppHeader({ showLogo = true, title, subtitle }: AppHeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Logo or Title */}
        <div className="flex items-center gap-2">
          {showLogo ? (
            <Logo size="md" />
          ) : (
            <div>
              <h1 className="text-lg font-bold text-foreground">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground -mt-0.5">{subtitle}</p>}
            </div>
          )}
        </div>

        {/* Right: Notification + Badge/SignIn */}
        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
          {user ? (
            <Badge 
              variant="outline" 
              className={user.isPremium 
                ? 'bg-primary/20 text-primary border-primary/30 font-semibold' 
                : 'bg-muted text-muted-foreground font-medium'
              }
            >
              {user.isPremium ? '👑 Premium' : 'Free'}
            </Badge>
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
