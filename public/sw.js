// Service Worker for Push Notifications
const CACHE_NAME = 'notel-notifications-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (error) {
    console.error('Error parsing push data:', error);
    return;
  }

  const options = {
    body: data.body || data.message,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'event-reminder',
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'View Event',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png'
      }
    ],
    requireInteraction: true, // Keep notification visible until user interacts
    silent: false,
    vibrate: [200, 100, 200], // Vibration pattern for mobile
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    // Just close the notification
    return;
  }

  // Default action or 'view' action
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // If no existing window/tab, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline notification scheduling
self.addEventListener('sync', (event) => {
  if (event.tag === 'schedule-notifications') {
    event.waitUntil(scheduleOfflineNotifications());
  }
});

// Function to handle offline notification scheduling
async function scheduleOfflineNotifications() {
  try {
    // This would typically fetch pending notifications from IndexedDB
    // and schedule them when back online
    console.log('Scheduling offline notifications...');
  } catch (error) {
    console.error('Error scheduling offline notifications:', error);
  }
}

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    // Handle notification scheduling from main thread
    scheduleNotification(event.data.payload);
  }
});

// Function to schedule a notification
function scheduleNotification(payload) {
  const { title, body, scheduledFor, data } = payload;
  const now = new Date().getTime();
  const scheduleTime = new Date(scheduledFor).getTime();
  const delay = scheduleTime - now;

  if (delay > 0) {
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `scheduled-${data.eventId}`,
        data,
        requireInteraction: true
      });
    }, delay);
  }
}
