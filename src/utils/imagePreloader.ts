/**
 * Utility to preload images for better performance
 */

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

export const preloadImages = async (sources: string[]): Promise<void> => {
  try {
    await Promise.all(sources.map(src => preloadImage(src)));
    console.log('✅ All images preloaded successfully');
  } catch (error) {
    console.warn('⚠️ Some images failed to preload:', error);
  }
};

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

// Preload all assets
export const preloadAllAssets = async () => {
  const allImages = [
    ...Object.values(CHALLENGE_IMAGES),
    ...Object.values(WORKOUT_GIFS),
  ];
  await preloadImages(allImages);
};
