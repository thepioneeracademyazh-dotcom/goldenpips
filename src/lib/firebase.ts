import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { toast } from 'sonner';

const firebaseConfig = {
  apiKey: "AIzaSyBdF8k3SEdt_knE74DJXOMYco97Dw1K4Ww",
  authDomain: "golden-pips.firebaseapp.com",
  projectId: "golden-pips",
  storageBucket: "golden-pips.firebasestorage.app",
  messagingSenderId: "995054352500",
  appId: "1:995054352500:web:9fca3b29f1b970f8a7b921",
  measurementId: "G-21HM6EXZ15"
};

const VAPID_KEY = "BIhtctDX1GUgjP6JMIuh9yI97CzdbdrLDjgTYZKQQH85nZ1FVvyiYAsUTVlG77Iw-lplyHcm3HzCdJ3ELEIMK7M";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Set up foreground message handler
async function setupForegroundHandler() {
  try {
    const supported = await isSupported();
    if (!supported) return;

    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      console.log('Foreground notification received:', payload);
      const title = payload.notification?.title || 'GoldenPips';
      const body = payload.notification?.body || 'New notification';
      
      // Show as a toast instead of raw JSON
      toast(title, {
        description: body,
        duration: 6000,
      });
    });
  } catch (error) {
    console.error('Error setting up foreground handler:', error);
  }
}

// Initialize foreground handler
setupForegroundHandler();

// Get FCM token for the current user
export async function getFCMToken(): Promise<string | null> {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log('Firebase Messaging is not supported in this browser');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    const messaging = getMessaging(app);

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('FCM Token obtained:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.log('No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

export { app };
