/**
 * Utility to preload images for better performance with offline support
 */

// Challenge images
export const CHALLENGE_IMAGES = {
  'push-up-power': '/challenges/pushup-power.webp',
  'pull-up-progression': '/challenges/pullup-progression.jpg',
  'core-crusher': '/challenges/core-crusher.avif',
  'sprint-master': '/challenges/sprint-master.jpg',
  'flexibility-foundation': '/challenges/flexibility-foundation.webp',
  'jump-power': '/challenges/jump-power.jpg',
  'adaptive-strength': '/challenges/adaptive-strength.jpg',
};

// Workout GIFs
export const WORKOUT_GIFS = {
  'Push-ups': '/pushup.gif',
  'Pull-ups': '/pullup.gif',
  'Sit-ups': '/situp.gif',
  'Vertical Jump': '/verticaljump.gif',
  'Shuttle Run': '/shuttlerun.gif',
  'Sit Reach': '/sit&reach.gif',
  'Knee Push-ups': '/kneepushup.gif',
};

// Image cache for instant access
const imageCache = new Map<string, string>();

export const preloadImage = (src: string, priority: 'high' | 'low' = 'low'): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already cached
    if (imageCache.has(src)) {
      resolve();
      return;
    }

    const img = new Image();
    
    // Set priority for browser optimization
    if ('fetchPriority' in img) {
      (img as any).fetchPriority = priority;
    }
    
    img.onload = () => {
      // Cache the loaded image
      imageCache.set(src, src);
      resolve();
    };
    
    img.onerror = () => {
      console.warn(`Failed to preload: ${src}`);
      reject(new Error(`Failed to load image: ${src}`));
    };
    
    img.src = src;
  });
};

export const preloadImages = async (sources: string[], priority: 'high' | 'low' = 'low'): Promise<void> => {
  try {
    // Load in parallel for speed
    await Promise.allSettled(sources.map(src => preloadImage(src, priority)));
    console.log('✅ Images preloaded');
  } catch (error) {
    console.warn('⚠️ Some images failed to preload:', error);
  }
};

// Preload critical assets immediately (high priority)
export const preloadCriticalAssets = async () => {
  const criticalImages = [
    ...Object.values(CHALLENGE_IMAGES).slice(0, 3), // First 3 challenges
  ];
  await preloadImages(criticalImages, 'high');
};

// Preload all assets (lower priority, background)
export const preloadAllAssets = async () => {
  const allImages = [
    ...Object.values(CHALLENGE_IMAGES),
    ...Object.values(WORKOUT_GIFS),
  ];
  await preloadImages(allImages, 'low');
};

// Check if image is cached
export const isImageCached = (src: string): boolean => {
  return imageCache.has(src);
};

// Get all cached images
export const getCachedImages = (): string[] => {
  return Array.from(imageCache.keys());
};
