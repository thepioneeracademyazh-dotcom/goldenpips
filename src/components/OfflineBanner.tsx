import { useEffect, useRef, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const wasOffline = useRef(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      wasOffline.current = true;
    };
    const handleOnline = () => {
      setIsOffline(false);
      if (wasOffline.current) {
        toast.success('Back online', { description: 'Your internet connection has been restored.' });
        wasOffline.current = false;
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-top">
      <WifiOff className="w-4 h-4" />
      No internet connection
    </div>
  );
}
