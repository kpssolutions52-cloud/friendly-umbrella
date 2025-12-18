'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Detect iOS devices
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // For iOS, show install button (with custom instructions)
    if (iOS) {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed, 10);
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        // Show again after 7 days
        if (daysSinceDismissed < 7) {
          return;
        }
      }
      setShowInstallButton(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if user has already dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setShowInstallButton(false);
      }
    }

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    } else {
      // User dismissed, remember for 7 days
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleDismiss = () => {
    setShowInstallButton(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleIOSInstall = () => {
    setShowIOSInstructions(true);
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // iOS-specific UI with instructions
  if (isIOS && showInstallButton) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleIOSInstall}
            size="sm"
            variant="outline"
            className="text-xs sm:text-sm flex items-center gap-1.5"
            title="Add to Home Screen"
          >
            <Share className="w-4 h-4" />
            <span className="hidden sm:inline">Install App</span>
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="Dismiss install prompt"
            title="Dismiss"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        {/* iOS Instructions Modal */}
        {showIOSInstructions && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-[100] animate-in fade-in"
              onClick={() => setShowIOSInstructions(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 z-[110] bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[70vh] flex flex-col">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 rounded-t-3xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Install App</h3>
                  <button
                    onClick={() => setShowIOSInstructions(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Add ConstructionGuru to your home screen for quick access:
                  </p>
                  <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
                    <li>Tap the <strong>Share</strong> button <Share className="w-4 h-4 inline mx-1" /> at the bottom of Safari</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Tap <strong>"Add"</strong> in the top right corner</li>
                    <li>The app icon will appear on your home screen</li>
                  </ol>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <p className="text-xs text-blue-800">
                      <strong>Tip:</strong> Once installed, you can open the app like any other app on your iPhone!
                    </p>
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4 rounded-b-3xl">
                <Button
                  onClick={() => setShowIOSInstructions(false)}
                  className="w-full h-11"
                >
                  Got it!
                </Button>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  // Android/Desktop install button
  if (!showInstallButton || !deferredPrompt) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleInstallClick}
        size="sm"
        variant="outline"
        className="text-xs sm:text-sm flex items-center gap-1.5"
        title="Install as desktop app"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Install App</span>
      </Button>
      <button
        onClick={handleDismiss}
        className="p-1 rounded hover:bg-gray-100 transition-colors"
        aria-label="Dismiss install prompt"
        title="Dismiss"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}
