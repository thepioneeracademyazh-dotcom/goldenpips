import { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOnline, setShowOnline] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowOnline(false);
      wasOffline.current = true;
    };
    const handleOnline = () => {
      setIsOffline(false);
      if (wasOffline.current) {
        setShowOnline(true);
        wasOffline.current = false;
        setTimeout(() => setShowOnline(false), 3000);
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !showOnline) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium text-white animate-in slide-in-from-top ${
        isOffline ? 'bg-destructive' : 'bg-green-600'
      }`}
    >
      {isOffline ? (
        <><WifiOff className="w-4 h-4" /> No internet connection</>
      ) : (
        <><Wifi className="w-4 h-4" /> Connection restored</>
      )}
    </div>
  );
}
