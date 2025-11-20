/**
 * Challenge System - Manages featured challenges with badge rewards
 */

export interface Challenge {
  id: string;
  name: string;
  description: string;
  category: 'strength' | 'endurance' | 'flexibility' | 'calisthenics' | 'para-athlete';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  participants: number;
  rating: number;
  image: string;
  workouts: {
    exercise: string;
    targetReps: number;
    sets?: number;
  }[];
  badge: {
    id: string;
    name: string;
    icon: string;
    description: string;
  };
  rewards: {
    coins: number;
    xp: number;
  };
}

export const FEATURED_CHALLENGES: Challenge[] = [
  // Strength Challenges
  {
    id: 'strength-pushup-master',
    name: 'Push-up Master Challenge',
    description: 'Build upper body strength with progressive push-up training',
    category: 'strength',
    difficulty: 'beginner',
    duration: '1 week',
    participants: 2340,
    rating: 4.8,
    image: '💪',
    workouts: [
      { exercise: 'Push-ups', targetReps: 10, sets: 3 },
      { exercise: 'Push-ups', targetReps: 15, sets: 3 },
    ],
    badge: {
      id: 'pushup-warrior',
      name: 'Push-up Warrior',
      icon: '🦾',
      description: 'Completed Push-up Master Challenge'
    },
    rewards: {
      coins: 150,
      xp: 500
    }
  },
  {
    id: 'strength-pullup-power',
    name: 'Pull-up Power Challenge',
    description: 'Master the pull-up with progressive training',
    category: 'strength',
    difficulty: 'intermediate',
    duration: '1 week',
    participants: 1876,
    rating: 4.9,
    image: '🏋️',
    workouts: [
      { exercise: 'Pull-ups', targetReps: 5, sets: 3 },
      { exercise: 'Pull-ups', targetReps: 8, sets: 3 },
    ],
    badge: {
      id: 'pullup-master',
      name: 'Pull-up Master',
      icon: '💎',
      description: 'Completed Pull-up Power Challenge'
    },
    rewards: {
      coins: 200,
      xp: 750
    }
  },
  {
    id: 'strength-core-crusher',
    name: 'Core Crusher Challenge',
    description: 'Strengthen your core with intense sit-up training',
    category: 'strength',
    difficulty: 'beginner',
    duration: '1 week',
    participants: 3210,
    rating: 4.7,
    image: '🔥',
    workouts: [
      { exercise: 'Sit-ups', targetReps: 20, sets: 3 },
      { exercise: 'Sit-ups', targetReps: 30, sets: 3 },
    ],
    badge: {
      id: 'core-crusher',
      name: 'Core Crusher',
      icon: '🔥',
      description: 'Completed Core Crusher Challenge'
    },
    rewards: {
      coins: 150,
      xp: 500
    }
  },

  // Endurance Challenges
  {
    id: 'endurance-sprint-master',
    name: 'Sprint Master Challenge',
    description: 'Improve speed and agility with shuttle run training',
    category: 'endurance',
    difficulty: 'intermediate',
    duration: '1 week',
    participants: 1543,
    rating: 4.6,
    image: '⚡',
    workouts: [
      { exercise: 'Shuttle Run', targetReps: 10, sets: 2 },
      { exercise: 'Shuttle Run', targetReps: 15, sets: 2 },
    ],
    badge: {
      id: 'speed-demon',
      name: 'Speed Demon',
      icon: '⚡',
      description: 'Completed Sprint Master Challenge'
    },
    rewards: {
      coins: 175,
      xp: 600
    }
  },
  {
    id: 'endurance-jump-power',
    name: 'Jump Power Challenge',
    description: 'Develop explosive power with vertical jump training',
    category: 'endurance',
    difficulty: 'beginner',
    duration: '1 week',
    participants: 1234,
    rating: 4.5,
    image: '🦘',
    workouts: [
      { exercise: 'Vertical Jump', targetReps: 15, sets: 3 },
      { exercise: 'Vertical Jump', targetReps: 25, sets: 3 },
    ],
    badge: {
      id: 'jump-master',
      name: 'Jump Master',
      icon: '🦘',
      description: 'Completed Jump Power Challenge'
    },
    rewards: {
      coins: 150,
      xp: 500
    }
  },

  // Flexibility Challenges
  {
    id: 'flexibility-foundation',
    name: 'Flexibility Foundation',
    description: 'Improve flexibility and range of motion',
    category: 'flexibility',
    difficulty: 'beginner',
    duration: '1 week',
    participants: 2890,
    rating: 4.8,
    image: '🤸',
    workouts: [
      { exercise: 'Sit Reach', targetReps: 10, sets: 2 },
      { exercise: 'Sit Reach', targetReps: 15, sets: 2 },
    ],
    badge: {
      id: 'flexibility-pro',
      name: 'Flexibility Pro',
      icon: '🤸',
      description: 'Completed Flexibility Foundation Challenge'
    },
    rewards: {
      coins: 150,
      xp: 500
    }
  },

  // Calisthenics Challenges
  {
    id: 'calisthenics-bodyweight',
    name: 'Bodyweight Mastery',
    description: 'Master bodyweight exercises for total fitness',
    category: 'calisthenics',
    difficulty: 'intermediate',
    duration: '1 week',
    participants: 1987,
    rating: 4.7,
    image: '🤸‍♂️',
    workouts: [
      { exercise: 'Push-ups', targetReps: 20, sets: 3 },
      { exercise: 'Sit-ups', targetReps: 30, sets: 3 },
    ],
    badge: {
      id: 'all-rounder',
      name: 'All-Rounder',
      icon: '🌟',
      description: 'Completed Bodyweight Mastery Challenge'
    },
    rewards: {
      coins: 250,
      xp: 1000
    }
  },

  // Para-Athlete Challenges
  {
    id: 'para-adaptive-strength',
    name: 'Adaptive Strength Challenge',
    description: 'Build strength with modified exercises',
    category: 'para-athlete',
    difficulty: 'beginner',
    duration: '1 week',
    participants: 987,
    rating: 4.9,
    image: '♿',
    workouts: [
      { exercise: 'Knee Push-ups', targetReps: 10, sets: 3 },
      { exercise: 'Knee Push-ups', targetReps: 15, sets: 3 },
    ],
    badge: {
      id: 'para-warrior',
      name: 'Para Warrior',
      icon: '♿',
      description: 'Completed Adaptive Strength Challenge'
    },
    rewards: {
      coins: 150,
      xp: 500
    }
  },

  // Elite Challenges
  {
    id: 'elite-century-club',
    name: 'Century Club Challenge',
    description: 'Complete 100 reps in a single workout session',
    category: 'strength',
    difficulty: 'advanced',
    duration: '1 day',
    participants: 456,
    rating: 5.0,
    image: '💯',
    workouts: [
      { exercise: 'Push-ups', targetReps: 100, sets: 1 },
    ],
    badge: {
      id: 'century-club',
      name: 'Century Club',
      icon: '💯',
      description: 'Completed 100 reps in one workout'
    },
    rewards: {
      coins: 500,
      xp: 2000
    }
  },
  {
    id: 'elite-perfect-form',
    name: 'Perfect Form Challenge',
    description: 'Complete workouts with 100% correct form',
    category: 'strength',
    difficulty: 'advanced',
    duration: '1 week',
    participants: 678,
    rating: 4.9,
    image: '✨',
    workouts: [
      { exercise: 'Push-ups', targetReps: 20, sets: 3 },
      { exercise: 'Pull-ups', targetReps: 10, sets: 3 },
    ],
    badge: {
      id: 'form-master',
      name: 'Form Master',
      icon: '⭐',
      description: 'Completed Perfect Form Challenge'
    },
    rewards: {
      coins: 300,
      xp: 1500
    }
  }
];

// Get challenge progress for a user
export const getChallengeProgress = (challengeId: string): {
  completed: boolean;
  workoutsCompleted: number;
  totalWorkouts: number;
  progress: number;
} => {
  try {
    const progressData = localStorage.getItem('challenge_progress');
    const progress = progressData ? JSON.parse(progressData) : {};
    
    const challenge = FEATURED_CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) {
      return { completed: false, workoutsCompleted: 0, totalWorkouts: 0, progress: 0 };
    }

    const challengeProgress = progress[challengeId] || { workoutsCompleted: 0, completed: false };
    const totalWorkouts = challenge.workouts.length;
    const progressPercent = (challengeProgress.workoutsCompleted / totalWorkouts) * 100;

    return {
      completed: challengeProgress.completed || false,
      workoutsCompleted: challengeProgress.workoutsCompleted || 0,
      totalWorkouts,
      progress: progressPercent
    };
  } catch (error) {
    console.error('Error getting challenge progress:', error);
    return { completed: false, workoutsCompleted: 0, totalWorkouts: 0, progress: 0 };
  }
};

// Update challenge progress
export const updateChallengeProgress = (challengeId: string, workoutIndex: number): boolean => {
  try {
    const progressData = localStorage.getItem('challenge_progress');
    const progress = progressData ? JSON.parse(progressData) : {};

    if (!progress[challengeId]) {
      progress[challengeId] = { workoutsCompleted: 0, completed: false };
    }

    const challenge = FEATURED_CHALLENGES.find(c => c.id === challengeId);
    if (!challenge) return false;

    // Mark workout as completed
    progress[challengeId].workoutsCompleted = Math.max(
      progress[challengeId].workoutsCompleted,
      workoutIndex + 1
    );

    // Check if challenge is complete
    if (progress[challengeId].workoutsCompleted >= challenge.workouts.length) {
      progress[challengeId].completed = true;
    }

    localStorage.setItem('challenge_progress', JSON.stringify(progress));
    return progress[challengeId].completed;
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return false;
  }
};

// Get category color
export const getCategoryColor = (category: Challenge['category']) => {
  const colors = {
    strength: 'bg-red-500',
    endurance: 'bg-blue-500',
    flexibility: 'bg-green-500',
    calisthenics: 'bg-orange-500',
    'para-athlete': 'bg-purple-500'
  };
  return colors[category];
};

// Get difficulty color
export const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
  const colors = {
    beginner: 'bg-green-500',
    intermediate: 'bg-yellow-500',
    advanced: 'bg-red-500'
  };
  return colors[difficulty];
};
