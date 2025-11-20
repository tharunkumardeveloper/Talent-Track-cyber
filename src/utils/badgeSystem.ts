/**
 * Badge System - Manages badge unlocking and tracking
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'strength' | 'endurance' | 'flexibility' | 'consistency' | 'milestone' | 'elite';
  requirement: {
    type: 'reps' | 'workouts' | 'streak' | 'perfect' | 'time';
    exercise?: string;
    count: number;
    description: string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress?: number;
}

export const BADGES: Badge[] = [
  // Strength Badges
  {
    id: 'pushup-starter',
    name: 'Push-up Starter',
    description: 'Complete your first push-up',
    icon: '💪',
    category: 'strength',
    requirement: {
      type: 'reps',
      exercise: 'Push-ups',
      count: 1,
      description: 'Complete 1 push-up'
    },
    rarity: 'common'
  },
  {
    id: 'pushup-warrior',
    name: 'Push-up Warrior',
    description: 'Complete 50 total push-ups',
    icon: '🦾',
    category: 'strength',
    requirement: {
      type: 'reps',
      exercise: 'Push-ups',
      count: 50,
      description: 'Complete 50 total push-ups'
    },
    rarity: 'rare'
  },
  {
    id: 'pushup-legend',
    name: 'Push-up Legend',
    description: 'Complete 200 total push-ups',
    icon: '👑',
    category: 'strength',
    requirement: {
      type: 'reps',
      exercise: 'Push-ups',
      count: 200,
      description: 'Complete 200 total push-ups'
    },
    rarity: 'legendary'
  },
  {
    id: 'pullup-beginner',
    name: 'Pull-up Beginner',
    description: 'Complete your first pull-up',
    icon: '🏋️',
    category: 'strength',
    requirement: {
      type: 'reps',
      exercise: 'Pull-ups',
      count: 1,
      description: 'Complete 1 pull-up'
    },
    rarity: 'common'
  },
  {
    id: 'pullup-master',
    name: 'Pull-up Master',
    description: 'Complete 30 total pull-ups',
    icon: '💎',
    category: 'strength',
    requirement: {
      type: 'reps',
      exercise: 'Pull-ups',
      count: 30,
      description: 'Complete 30 total pull-ups'
    },
    rarity: 'epic'
  },
  {
    id: 'core-crusher',
    name: 'Core Crusher',
    description: 'Complete 100 total sit-ups',
    icon: '🔥',
    category: 'strength',
    requirement: {
      type: 'reps',
      exercise: 'Sit-ups',
      count: 100,
      description: 'Complete 100 total sit-ups'
    },
    rarity: 'rare'
  },

  // Endurance Badges
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete 20 shuttle runs',
    icon: '⚡',
    category: 'endurance',
    requirement: {
      type: 'reps',
      exercise: 'Shuttle Run',
      count: 20,
      description: 'Complete 20 shuttle runs'
    },
    rarity: 'rare'
  },
  {
    id: 'jump-master',
    name: 'Jump Master',
    description: 'Complete 50 vertical jumps',
    icon: '🦘',
    category: 'endurance',
    requirement: {
      type: 'reps',
      exercise: 'Vertical Jump',
      count: 50,
      description: 'Complete 50 vertical jumps'
    },
    rarity: 'rare'
  },

  // Flexibility Badges
  {
    id: 'flexibility-pro',
    name: 'Flexibility Pro',
    description: 'Complete 25 sit-and-reach exercises',
    icon: '🤸',
    category: 'flexibility',
    requirement: {
      type: 'reps',
      exercise: 'Sit Reach',
      count: 25,
      description: 'Complete 25 sit-and-reach exercises'
    },
    rarity: 'rare'
  },

  // Consistency Badges
  {
    id: 'first-workout',
    name: 'First Step',
    description: 'Complete your first workout',
    icon: '🎯',
    category: 'consistency',
    requirement: {
      type: 'workouts',
      count: 1,
      description: 'Complete 1 workout'
    },
    rarity: 'common'
  },
  {
    id: 'dedicated-athlete',
    name: 'Dedicated Athlete',
    description: 'Complete 10 workouts',
    icon: '🏆',
    category: 'consistency',
    requirement: {
      type: 'workouts',
      count: 10,
      description: 'Complete 10 workouts'
    },
    rarity: 'rare'
  },
  {
    id: 'workout-veteran',
    name: 'Workout Veteran',
    description: 'Complete 25 workouts',
    icon: '🎖️',
    category: 'consistency',
    requirement: {
      type: 'workouts',
      count: 25,
      description: 'Complete 25 workouts'
    },
    rarity: 'epic'
  },
  {
    id: 'fitness-legend',
    name: 'Fitness Legend',
    description: 'Complete 50 workouts',
    icon: '👑',
    category: 'consistency',
    requirement: {
      type: 'workouts',
      count: 50,
      description: 'Complete 50 workouts'
    },
    rarity: 'legendary'
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Workout 7 days in a row',
    icon: '🔥',
    category: 'consistency',
    requirement: {
      type: 'streak',
      count: 7,
      description: 'Maintain a 7-day streak'
    },
    rarity: 'epic'
  },

  // Perfect Form Badges
  {
    id: 'perfect-form',
    name: 'Perfect Form',
    description: 'Complete a workout with 100% correct reps',
    icon: '✨',
    category: 'milestone',
    requirement: {
      type: 'perfect',
      count: 1,
      description: 'Complete 1 workout with perfect form'
    },
    rarity: 'epic'
  },
  {
    id: 'form-master',
    name: 'Form Master',
    description: 'Complete 5 workouts with 100% correct reps',
    icon: '⭐',
    category: 'milestone',
    requirement: {
      type: 'perfect',
      count: 5,
      description: 'Complete 5 workouts with perfect form'
    },
    rarity: 'legendary'
  },

  // Elite Badges
  {
    id: 'century-club',
    name: 'Century Club',
    description: 'Complete 100 reps in a single workout',
    icon: '💯',
    category: 'elite',
    requirement: {
      type: 'reps',
      count: 100,
      description: 'Complete 100 reps in one workout'
    },
    rarity: 'legendary'
  },
  {
    id: 'all-rounder',
    name: 'All-Rounder',
    description: 'Complete at least one workout of each type',
    icon: '🌟',
    category: 'elite',
    requirement: {
      type: 'workouts',
      count: 7,
      description: 'Complete all workout types'
    },
    rarity: 'legendary'
  }
];

export const getRarityColor = (rarity: Badge['rarity']) => {
  const colors = {
    common: 'text-gray-500 bg-gray-100 dark:bg-gray-800',
    rare: 'text-blue-500 bg-blue-100 dark:bg-blue-900',
    epic: 'text-purple-500 bg-purple-100 dark:bg-purple-900',
    legendary: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900'
  };
  return colors[rarity];
};

export const getCategoryColor = (category: Badge['category']) => {
  const colors = {
    strength: 'bg-red-500',
    endurance: 'bg-blue-500',
    flexibility: 'bg-green-500',
    consistency: 'bg-purple-500',
    milestone: 'bg-yellow-500',
    elite: 'bg-gradient-to-r from-yellow-500 to-orange-500'
  };
  return colors[category];
};

// Check if badge should be unlocked based on user stats
export const checkBadgeUnlock = (badge: Badge, userStats: any): boolean => {
  const { requirement } = badge;

  switch (requirement.type) {
    case 'reps':
      if (requirement.exercise) {
        const exerciseReps = userStats.exerciseReps?.[requirement.exercise] || 0;
        return exerciseReps >= requirement.count;
      }
      // For single workout reps (like century club)
      return (userStats.maxRepsInWorkout || 0) >= requirement.count;

    case 'workouts':
      return (userStats.totalWorkouts || 0) >= requirement.count;

    case 'streak':
      return (userStats.currentStreak || 0) >= requirement.count;

    case 'perfect':
      return (userStats.perfectWorkouts || 0) >= requirement.count;

    default:
      return false;
  }
};

// Get user's badge progress
export const getBadgeProgress = (badge: Badge, userStats: any): number => {
  const { requirement } = badge;

  switch (requirement.type) {
    case 'reps':
      if (requirement.exercise) {
        const exerciseReps = userStats.exerciseReps?.[requirement.exercise] || 0;
        return Math.min(100, (exerciseReps / requirement.count) * 100);
      }
      return Math.min(100, ((userStats.maxRepsInWorkout || 0) / requirement.count) * 100);

    case 'workouts':
      return Math.min(100, ((userStats.totalWorkouts || 0) / requirement.count) * 100);

    case 'streak':
      return Math.min(100, ((userStats.currentStreak || 0) / requirement.count) * 100);

    case 'perfect':
      return Math.min(100, ((userStats.perfectWorkouts || 0) / requirement.count) * 100);

    default:
      return 0;
  }
};

// Update user stats after workout
export const updateUserStats = (currentStats: any, workoutData: any) => {
  const stats = { ...currentStats };

  // Initialize if needed
  if (!stats.exerciseReps) stats.exerciseReps = {};
  if (!stats.totalWorkouts) stats.totalWorkouts = 0;
  if (!stats.perfectWorkouts) stats.perfectWorkouts = 0;
  if (!stats.maxRepsInWorkout) stats.maxRepsInWorkout = 0;
  if (!stats.workoutDates) stats.workoutDates = [];

  // Update total workouts
  stats.totalWorkouts += 1;

  // Update exercise-specific reps
  const exercise = workoutData.activityName;
  const reps = workoutData.setsCompleted || 0;
  stats.exerciseReps[exercise] = (stats.exerciseReps[exercise] || 0) + reps;

  // Update max reps in single workout
  if (reps > stats.maxRepsInWorkout) {
    stats.maxRepsInWorkout = reps;
  }

  // Check for perfect workout (100% correct form)
  if (workoutData.posture === 'Good' && workoutData.badSets === 0 && reps > 0) {
    stats.perfectWorkouts += 1;
  }

  // Update workout dates for streak calculation
  const today = new Date().toDateString();
  if (!stats.workoutDates.includes(today)) {
    stats.workoutDates.push(today);
  }

  // Calculate current streak
  stats.currentStreak = calculateStreak(stats.workoutDates);

  return stats;
};

// Calculate workout streak
const calculateStreak = (workoutDates: string[]): number => {
  if (!workoutDates || workoutDates.length === 0) return 0;

  const sortedDates = workoutDates
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if last workout was today or yesterday
  const lastWorkout = sortedDates[0];
  lastWorkout.setHours(0, 0, 0, 0);
  const daysDiff = Math.floor((today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff > 1) return 0; // Streak broken

  // Count consecutive days
  for (let i = 1; i < sortedDates.length; i++) {
    const current = sortedDates[i];
    const previous = sortedDates[i - 1];
    current.setHours(0, 0, 0, 0);
    previous.setHours(0, 0, 0, 0);

    const diff = Math.floor((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};
