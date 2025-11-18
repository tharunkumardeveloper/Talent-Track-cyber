// Notification service for web and mobile
import { Capacitor } from '@capacitor/core';

// Check if running on native platform
export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

// Request notification permissions (works in browser and mobile)
export const requestNotificationPermission = async (): Promise<boolean> => {
  // Native platform (Capacitor)
  if (isNativePlatform()) {
    try {
      const { display } = await (window as any).LocalNotifications?.checkPermissions() || { display: 'prompt' };
      
      if (display === 'granted') {
        return true;
      }

      const result = await (window as any).LocalNotifications?.requestPermissions();
      return result?.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Browser (Web Notifications API)
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Show processing notification (works in browser and mobile)
export const showProcessingNotification = async (
  activityName: string,
  progress: number
): Promise<number | null> => {
  // Native platform
  if (isNativePlatform()) {
    try {
      const notificationId = Date.now();
      
      await (window as any).LocalNotifications?.schedule({
        notifications: [
          {
            id: notificationId,
            title: 'Processing Workout',
            body: `${activityName}: ${Math.round(progress)}% complete`,
            ongoing: true,
            autoCancel: false,
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#FF6B6B',
          }
        ]
      });

      return notificationId;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  // Browser
  if (Notification.permission === 'granted') {
    try {
      new Notification('Processing Workout', {
        body: `${activityName}: ${Math.round(progress)}% complete`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'workout-processing',
        requireInteraction: false,
      });
      return Date.now();
    } catch (error) {
      console.error('Error showing browser notification:', error);
      return null;
    }
  }

  return null;
};

// Update processing notification
export const updateProcessingNotification = async (
  notificationId: number,
  activityName: string,
  progress: number
): Promise<void> => {
  if (!notificationId) {
    return;
  }

  // Native platform
  if (isNativePlatform()) {
    try {
      await (window as any).LocalNotifications?.schedule({
        notifications: [
          {
            id: notificationId,
            title: 'Processing Workout',
            body: `${activityName}: ${Math.round(progress)}% complete`,
            ongoing: true,
            autoCancel: false,
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#FF6B6B',
          }
        ]
      });
    } catch (error) {
      console.error('Error updating notification:', error);
    }
    return;
  }

  // Browser - show new notification (browsers don't support updating)
  if (Notification.permission === 'granted') {
    try {
      new Notification('Processing Workout', {
        body: `${activityName}: ${Math.round(progress)}% complete`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'workout-processing', // Same tag replaces previous notification
        requireInteraction: false,
      });
    } catch (error) {
      console.error('Error updating browser notification:', error);
    }
  }
};

// Show completion notification
export const showCompletionNotification = async (
  activityName: string,
  reps: number
): Promise<void> => {
  // Native platform
  if (isNativePlatform()) {
    try {
      await (window as any).LocalNotifications?.schedule({
        notifications: [
          {
            id: Date.now(),
            title: 'Workout Complete! 🎉',
            body: `${activityName}: ${reps} reps detected`,
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#4CAF50',
            sound: 'default',
          }
        ]
      });
    } catch (error) {
      console.error('Error showing completion notification:', error);
    }
    return;
  }

  // Browser
  if (Notification.permission === 'granted') {
    try {
      new Notification('Workout Complete! 🎉', {
        body: `${activityName}: ${reps} reps detected`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'workout-complete',
        requireInteraction: true, // Keep visible until user dismisses
      });
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }
};

// Cancel notification
export const cancelNotification = async (notificationId: number): Promise<void> => {
  if (!notificationId) {
    return;
  }

  // Native platform
  if (isNativePlatform()) {
    try {
      await (window as any).LocalNotifications?.cancel({
        notifications: [{ id: notificationId }]
      });
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  // Browser notifications auto-close, no need to cancel
};

// Request camera permission
export const requestCameraPermission = async (): Promise<boolean> => {
  // Native platform
  if (isNativePlatform()) {
    try {
      const { camera } = await (window as any).Camera?.checkPermissions() || { camera: 'prompt' };
      
      if (camera === 'granted') {
        return true;
      }

      const result = await (window as any).Camera?.requestPermissions();
      return result?.camera === 'granted';
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  // Browser - camera permission is requested when accessing getUserMedia
  // We'll just check if it's available
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasCamera = devices.some(device => device.kind === 'videoinput');
    return hasCamera;
  } catch (error) {
    console.error('Error checking camera:', error);
    return false;
  }
};

// Request file/storage permission
export const requestStoragePermission = async (): Promise<boolean> => {
  // Native platform
  if (isNativePlatform()) {
    try {
      const { publicStorage } = await (window as any).Filesystem?.checkPermissions() || { publicStorage: 'prompt' };
      
      if (publicStorage === 'granted') {
        return true;
      }

      const result = await (window as any).Filesystem?.requestPermissions();
      return result?.publicStorage === 'granted';
    } catch (error) {
      console.error('Error requesting storage permission:', error);
      return false;
    }
  }

  // Browser - file access is handled by file input dialogs
  return true;
};

// Request all necessary permissions
export const requestAllPermissions = async (): Promise<{
  camera: boolean;
  storage: boolean;
  notifications: boolean;
}> => {
  const [camera, storage, notifications] = await Promise.all([
    requestCameraPermission(),
    requestStoragePermission(),
    requestNotificationPermission(),
  ]);

  return { camera, storage, notifications };
};
