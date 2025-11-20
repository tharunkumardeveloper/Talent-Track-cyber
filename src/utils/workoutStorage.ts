// Utility functions for managing workout history and video storage

const MAX_RECENT_WORKOUTS = 2;

export interface WorkoutData {
  id: number;
  activityName: string;
  posture: string;
  setsCompleted: number;
  badSets: number;
  duration: string;
  timestamp: string;
  videoUrl?: string;
  thumbnailUrl?: string; // Base64 encoded thumbnail
  badgesEarned?: string[];
  coinsEarned?: number;
  correctReps?: number;
  totalReps?: number;
}

/**
 * Generate a thumbnail from a video element or blob
 */
export const generateThumbnail = async (videoSource: HTMLVideoElement | Blob | string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    let objectUrl: string | null = null;

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      video.remove();
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Thumbnail generation timeout'));
    }, 10000); // 10 second timeout

    video.onloadeddata = () => {
      // Seek to 1 second or 10% of duration, whichever is smaller
      const seekTime = Math.min(1, video.duration * 0.1);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        clearTimeout(timeout);
        
        const canvas = document.createElement('canvas');
        const aspectRatio = video.videoWidth / video.videoHeight;
        
        // Set thumbnail dimensions (max 320px width)
        canvas.width = 320;
        canvas.height = Math.round(320 / aspectRatio);
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 with compression (JPEG quality 0.7)
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        
        cleanup();
        resolve(thumbnail);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    video.onerror = (e) => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error('Error loading video for thumbnail: ' + (e as any).message));
    };

    // Set video source
    try {
      if (videoSource instanceof HTMLVideoElement) {
        video.src = videoSource.src;
      } else if (videoSource instanceof Blob) {
        // Blob includes File type
        objectUrl = URL.createObjectURL(videoSource);
        video.src = objectUrl;
      } else if (typeof videoSource === 'string') {
        video.src = videoSource;
      } else {
        clearTimeout(timeout);
        reject(new Error('Invalid video source type'));
        return;
      }

      video.load();
    } catch (error) {
      clearTimeout(timeout);
      cleanup();
      reject(error);
    }
  });
};

/**
 * Get workout history from localStorage
 */
export const getWorkoutHistory = (): WorkoutData[] => {
  try {
    const history = localStorage.getItem('workout_history');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error reading workout history:', error);
    return [];
  }
};

/**
 * Get the last N workouts with their thumbnails
 */
export const getRecentWorkouts = (count: number = MAX_RECENT_WORKOUTS): WorkoutData[] => {
  const history = getWorkoutHistory();
  const recentWorkouts = history.slice(-count);
  
  // Load thumbnails from localStorage
  return recentWorkouts.map(workout => {
    const thumbnail = localStorage.getItem(`workout_thumbnail_${workout.id}`);
    return {
      ...workout,
      thumbnailUrl: thumbnail || workout.thumbnailUrl
    };
  });
};

/**
 * Clean up old workout thumbnails from localStorage
 * Keeps only the thumbnails for the last MAX_RECENT_WORKOUTS workouts
 */
const cleanupOldThumbnails = (workoutsToKeep: WorkoutData[]) => {
  const thumbnailIdsToKeep = new Set(workoutsToKeep.map(w => w.id));

  // Find all stored thumbnail keys
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('workout_thumbnail_')) {
      const thumbnailId = parseInt(key.replace('workout_thumbnail_', ''));
      if (!thumbnailIdsToKeep.has(thumbnailId)) {
        keysToRemove.push(key);
      }
    }
  }

  // Remove old thumbnails
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`Cleaned up old thumbnail: ${key}`);
    } catch (error) {
      console.error(`Error removing thumbnail ${key}:`, error);
    }
  });

  // Also revoke blob URLs that are no longer needed
  const allHistory = getWorkoutHistory();
  const oldWorkouts = allHistory.slice(0, -MAX_RECENT_WORKOUTS);
  oldWorkouts.forEach(workout => {
    if (workout.videoUrl && workout.videoUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(workout.videoUrl);
      } catch (error) {
        console.error('Error revoking blob URL:', error);
      }
    }
  });
};

/**
 * Add a new workout to history with thumbnail and clean up old data
 */
export const addWorkoutToHistory = async (workoutData: WorkoutData, videoSource?: HTMLVideoElement | Blob | string): Promise<void> => {
  try {
    // Generate thumbnail if video source is provided
    if (videoSource) {
      try {
        const thumbnail = await generateThumbnail(videoSource);
        workoutData.thumbnailUrl = thumbnail;
        
        // Store thumbnail separately for better management
        localStorage.setItem(`workout_thumbnail_${workoutData.id}`, thumbnail);
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        // Continue without thumbnail
      }
    }
    
    // Remove videoUrl to save space (we only keep thumbnail)
    const workoutToSave = { ...workoutData };
    delete workoutToSave.videoUrl;
    
    const history = getWorkoutHistory();
    history.push(workoutToSave);
    
    // Save updated history
    localStorage.setItem('workout_history', JSON.stringify(history));
    
    // Clean up old thumbnails, keeping only the last MAX_RECENT_WORKOUTS
    const recentWorkouts = history.slice(-MAX_RECENT_WORKOUTS);
    cleanupOldThumbnails(recentWorkouts);
    
    console.log(`Workout added. Total workouts: ${history.length}, Recent: ${recentWorkouts.length}`);
  } catch (error) {
    console.error('Error adding workout to history:', error);
  }
};

/**
 * Clear all workout history and thumbnails
 */
export const clearWorkoutHistory = (): void => {
  try {
    // Remove all thumbnails and recorded videos
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('workout_thumbnail_') || key.startsWith('recorded_video_'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear workout history
    localStorage.removeItem('workout_history');
    
    console.log('Workout history cleared');
  } catch (error) {
    console.error('Error clearing workout history:', error);
  }
};

/**
 * Get storage usage information
 */
export const getStorageInfo = () => {
  let totalSize = 0;
  let thumbnailCount = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('workout_thumbnail_')) {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length;
        thumbnailCount++;
      }
    }
  }
  
  return {
    videoCount: thumbnailCount, // For backward compatibility
    thumbnailCount,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    workoutCount: getWorkoutHistory().length
  };
};

/**
 * Get user stats for badge tracking
 */
export const getUserStats = (): any => {
  try {
    const stats = localStorage.getItem('user_stats');
    return stats ? JSON.parse(stats) : {
      exerciseReps: {},
      totalWorkouts: 0,
      perfectWorkouts: 0,
      maxRepsInWorkout: 0,
      workoutDates: [],
      currentStreak: 0
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      exerciseReps: {},
      totalWorkouts: 0,
      perfectWorkouts: 0,
      maxRepsInWorkout: 0,
      workoutDates: [],
      currentStreak: 0
    };
  }
};

/**
 * Save user stats
 */
export const saveUserStats = (stats: any): void => {
  try {
    localStorage.setItem('user_stats', JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving user stats:', error);
  }
};

/**
 * Get unlocked badges
 */
export const getUnlockedBadges = (): string[] => {
  try {
    const badges = localStorage.getItem('unlocked_badges');
    return badges ? JSON.parse(badges) : [];
  } catch (error) {
    console.error('Error getting unlocked badges:', error);
    return [];
  }
};

/**
 * Save unlocked badges
 */
export const saveUnlockedBadges = (badges: string[]): void => {
  try {
    localStorage.setItem('unlocked_badges', JSON.stringify(badges));
  } catch (error) {
    console.error('Error saving unlocked badges:', error);
  }
};

/**
 * Add newly unlocked badge
 */
export const unlockBadge = (badgeId: string): void => {
  const unlocked = getUnlockedBadges();
  if (!unlocked.includes(badgeId)) {
    unlocked.push(badgeId);
    saveUnlockedBadges(unlocked);
  }
};
