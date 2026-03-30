import { useState, useEffect, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Capture the event globally so it's not lost if it fires before React mounts
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalInstalled = false;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
  });
  window.addEventListener('appinstalled', () => {
    globalInstalled = true;
    globalDeferredPrompt = null;
  });
  if (window.matchMedia('(display-mode: standalone)').matches) {
    globalInstalled = true;
  }
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [showInstallBanner, setShowInstallBanner] = useState(!!globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(globalInstalled);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Pick up any prompt captured before mount
    if (globalDeferredPrompt && !deferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
      setShowInstallBanner(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = evt;
      setDeferredPrompt(evt);
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      globalInstalled = true;
      globalDeferredPrompt = null;
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
    globalDeferredPrompt = null;
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
  };

  if (isInstalled || !showInstallBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-primary text-primary-foreground p-3 shadow-lg animate-slide-down">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Download className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Install GoldenPips</p>
            <p className="text-xs opacity-90">Get the full app experience</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleInstallClick}
            className="text-xs h-8"
          >
            Install
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export const InstallButton = forwardRef<HTMLButtonElement>((_, ref) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(globalInstalled);
  const [canInstall, setCanInstall] = useState(!!globalDeferredPrompt);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    if (globalDeferredPrompt && !deferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
      setCanInstall(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = evt;
      setDeferredPrompt(evt);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      globalInstalled = true;
      globalDeferredPrompt = null;
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('App installed');
    }
    setDeferredPrompt(null);
    globalDeferredPrompt = null;
  };

  if (isInstalled || !canInstall) return null;

  return (
    <Button ref={ref} onClick={handleInstallClick} className="w-full">
      <Download className="w-4 h-4 mr-2" />
      Install App
    </Button>
  );
});

InstallButton.displayName = 'InstallButton';
