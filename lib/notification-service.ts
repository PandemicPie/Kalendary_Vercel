// Notification Service for Web Push API

/**
 * Check if notifications are supported
 */
export function areNotificationsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!areNotificationsSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!areNotificationsSupported()) {
    console.error('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.error('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

/**
 * Subscribe to push notifications
 * Note: This is a placeholder for demo purposes
 * For production push notifications, you'd need:
 * 1. VAPID keys generated
 * 2. A push server backend
 * 3. applicationServerKey configured
 *
 * For now, we only use local notifications via Service Worker
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    // Check if already subscribed
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('Already subscribed to push notifications');
      return subscription;
    }

    // Skip actual subscription without VAPID keys
    // Local notifications will work fine without this
    console.log('Push subscription skipped (no VAPID keys configured)');
    console.log('Local notifications via Service Worker will still work!');

    return null;
  } catch (error) {
    console.warn('Push subscription not available:', error);
    return null;
  }
}

/**
 * Show a local notification (for testing/demo)
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!areNotificationsSupported()) {
    console.error('Notifications not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.error('Notification permission not granted');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    } as NotificationOptions);
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

/**
 * Schedule a notification (using setTimeout - for demo purposes)
 * In production, you'd use a backend scheduler
 */
export function scheduleNotification(
  title: string,
  body: string,
  delayMs: number
): NodeJS.Timeout {
  return setTimeout(async () => {
    await showLocalNotification(title, { body });
  }, delayMs);
}

/**
 * Schedule daily reminder notification
 */
export function scheduleDailyReminder(hour: number, minute: number): void {
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hour, minute, 0, 0);

  // If time has passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const delay = scheduledTime.getTime() - now.getTime();

  scheduleNotification(
    'Kalendary - Pianifica la tua giornata',
    'Buongiorno! È ora di pianificare le tue attività di oggi.',
    delay
  );

  // Re-schedule for next day
  setTimeout(() => {
    scheduleDailyReminder(hour, minute);
  }, delay + 1000);
}

/**
 * Notify about upcoming activity
 */
export async function notifyUpcomingActivity(
  activityTitle: string,
  minutesBefore: number
): Promise<void> {
  await showLocalNotification('Attività in arrivo', {
    body: `${activityTitle} inizia tra ${minutesBefore} minuti`,
    tag: 'upcoming-activity',
    requireInteraction: true,
  } as any);
}

/**
 * Notify about AI suggestions
 */
export async function notifyAISuggestions(suggestions: string[]): Promise<void> {
  if (suggestions.length === 0) return;

  await showLocalNotification('💡 Suggerimenti AI', {
    body: suggestions[0],
    tag: 'ai-suggestion',
    data: { suggestions },
  });
}

/**
 * Notify about dead time
 */
export async function notifyDeadTime(
  start: string,
  end: string,
  duration: number
): Promise<void> {
  await showLocalNotification('⏰ Tempo Libero Disponibile', {
    body: `Hai ${Math.round(duration)} minuti liberi dalle ${start} alle ${end}. Vuoi pianificare qualcosa?`,
    tag: 'dead-time',
    requireInteraction: true,
  });
}

/**
 * Celebrate streak milestone
 */
export async function notifyStreakMilestone(days: number): Promise<void> {
  await showLocalNotification('🔥 Streak Milestone!', {
    body: `Incredibile! Hai mantenuto una streak di ${days} giorni!`,
    tag: 'streak-milestone',
  } as any);
}

/**
 * Initialize notification system
 */
export async function initializeNotifications(): Promise<boolean> {
  if (!areNotificationsSupported()) {
    console.log('Notifications not supported on this device');
    return false;
  }

  try {
    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      return false;
    }

    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Notification permission denied');
      return false;
    }

    // Subscribe to push
    await subscribeToPush(registration);

    console.log('Notifications initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
}
