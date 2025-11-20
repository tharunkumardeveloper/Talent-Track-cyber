import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, CheckCircle, Lock, Star, ArrowRight } from 'lucide-react';

interface Challenge {
  id: string;
  name: string;
  description: string;
  category: 'Strength' | 'Endurance' | 'Flexibility' | 'Calisthenics' | 'Para-Athlete';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  image?: string;
  workouts: {
    name: string;
    targetReps: number;
    completed: boolean;
    currentReps: number;
  }[];
  badge: {
    name: string;
    icon: string;
    description: string;
  };
  participants: number;
  isLocked: boolean;
  requiredLevel: number;
}

interface ChallengesTabProps {
  onStartWorkout: (workoutName: string, challenge: Challenge) => void;
}

const ChallengesTab = ({ onStartWorkout }: ChallengesTabProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const challenges: Challenge[] = [
    // Strength Challenges
    {
      id: 'strength-1',
      name: 'Push-up Power',
      description: 'Master the fundamental push-up with perfect form',
      category: 'Strength',
      difficulty: 'Beginner',
      image: '/challenges/pushup-power.webp',
      workouts: [
        { name: 'Push-ups', targetReps: 10, completed: false, currentReps: 0 },
        { name: 'Push-ups', targetReps: 15, completed: false, currentReps: 0 },
        { name: 'Push-ups', targetReps: 20, completed: false, currentReps: 0 },
        { name: 'Push-ups', targetReps: 25, completed: false, currentReps: 0 },
        { name: 'Push-ups', targetReps: 30, completed: false, currentReps: 0 },
      ],
      badge: {
        name: 'Push-up Master',
        icon: '💪',
        description: 'Completed 100 total push-ups with perfect form'
      },
      participants: 2340,
      isLocked: false,
      requiredLevel: 1
    },
    {
      id: 'strength-2',
      name: 'Pull-up Progression',
      description: 'Build upper body strength with pull-ups',
      category: 'Strength',
      difficulty: 'Intermediate',
      image: '/challenges/pullup-progression.jpg',
      workouts: [
        { name: 'Pull-ups', targetReps: 5, completed: false, currentReps: 0 },
        { name: 'Pull-ups', targetReps: 8, completed: false, currentReps: 0 },
        { name: 'Pull-ups', targetReps: 10, completed: false, currentReps: 0 },
        { name: 'Pull-ups', targetReps: 12, completed: false, currentReps: 0 },
        { name: 'Pull-ups', targetReps: 15, completed: false, currentReps: 0 },
      ],
      badge: {
        name: 'Pull-up Pro',
        icon: '🏋️',
        description: 'Achieved 50 total pull-ups'
      },
      participants: 1876,
      isLocked: false,
      requiredLevel: 1
    },
    {
      id: 'strength-3',
      name: 'Core Crusher',
      description: 'Strengthen your core with sit-ups',
      category: 'Strength',
      difficulty: 'Beginner',
      image: '/challenges/core-crusher.avif',
      workouts: [
        { name: 'Sit-ups', targetReps: 15, completed: false, currentReps: 0 },
        { name: 'Sit-ups', targetReps: 20, completed: false, currentReps: 0 },
        { name: 'Sit-ups', targetReps: 25, completed: false, currentReps: 0 },
        { name: 'Sit-ups', targetReps: 30, completed: false, currentReps: 0 },
        { name: 'Sit-ups', targetReps: 40, completed: false, currentReps: 0 },
      ],
      badge: {
        name: 'Core Champion',
        icon: '🔥',
        description: 'Completed 130 total sit-ups'
      },
      participants: 3210,
      isLocked: false,
      requiredLevel: 1
    },

    // Endurance Challenges
    {
      id: 'endurance-1',
      name: 'Sprint Master',
      description: 'Improve your speed and agility',
      image: '/challenges/sprint-master.jpg',
      category: 'Endurance',
      difficulty: 'Intermediate',
      workouts: [
        { name: 'Shuttle Run', targetReps: 5, completed: false, currentReps: 0 },
        { name: 'Shuttle Run', targetReps: 8, completed: false, currentReps: 0 },
        { name: 'Shuttle Run', targetReps: 10, completed: false, currentReps: 0 },
        { name: 'Shuttle Run', targetReps: 12, completed: false, currentReps: 0 },
        { name: 'Shuttle Run', targetReps: 15, completed: false, currentReps: 0 },
      ],
      badge: {
        name: 'Speed Demon',
        icon: '⚡',
        description: 'Completed 50 shuttle runs'
      },
      participants: 1543,
      isLocked: false,
      requiredLevel: 1
    },

    // Flexibility Challenges
    {
      id: 'flexibility-1',
      name: 'Flexibility Foundation',
      description: 'Improve your flexibility and range of motion',
      image: '/challenges/flexibility-foundation.webp',
      category: 'Flexibility',
      difficulty: 'Beginner',
      workouts: [
        { name: 'Sit Reach', targetReps: 5, completed: false, currentReps: 0 },
        { name: 'Sit Reach', targetReps: 8, completed: false, currentReps: 0 },
        { name: 'Sit Reach', targetReps: 10, completed: false, currentReps: 0 },
        { name: 'Sit Reach', targetReps: 12, completed: false, currentReps: 0 },
        { name: 'Sit Reach', targetReps: 15, completed: false, currentReps: 0 },
      ],
      badge: {
        name: 'Flexibility Master',
        icon: '🤸',
        description: 'Achieved 50 sit-and-reach exercises'
      },
      participants: 2890,
      isLocked: false,
      requiredLevel: 1
    },

    // Calisthenics Challenges
    {
      id: 'calisthenics-1',
      name: 'Jump Power',
      description: 'Develop explosive power with vertical jumps',
      image: '/challenges/jump-power.jpg',
      category: 'Calisthenics',
      difficulty: 'Intermediate',
      workouts: [
        { name: 'Vertical Jump', targetReps: 10, completed: false, currentReps: 0 },
        { name: 'Vertical Jump', targetReps: 15, completed: false, currentReps: 0 },
        { name: 'Vertical Jump', targetReps: 20, completed: false, currentReps: 0 },
        { name: 'Vertical Jump', targetReps: 25, completed: false, currentReps: 0 },
        { name: 'Vertical Jump', targetReps: 30, completed: false, currentReps: 0 },
      ],
      badge: {
        name: 'Jump Master',
        icon: '🦘',
        description: 'Completed 100 vertical jumps'
      },
      participants: 1234,
      isLocked: false,
      requiredLevel: 1
    },

    // Para-Athlete Challenges
    {
      id: 'para-1',
      name: 'Adaptive Strength',
      description: 'Build strength with modified exercises',
      image: '/challenges/adaptive-strength.jpg',
      category: 'Para-Athlete',
      difficulty: 'Beginner',
      workouts: [
        { name: 'Push-ups', targetReps: 8, completed: false, currentReps: 0 },
        { name: 'Push-ups', targetReps: 12, completed: false, currentReps: 0 },
        { name: 'Push-ups', targetReps: 15, completed: false, currentReps: 0 },
        { name: 'Push-ups', targetReps: 20, completed: false, currentReps: 0 },
        { name: 'Push-ups', targetReps: 25, completed: false, currentReps: 0 },
      ],
      badge: {
        name: 'Para Warrior',
        icon: '♿',
        description: 'Completed adaptive strength challenge'
      },
      participants: 987,
      isLocked: false,
      requiredLevel: 1
    },
  ];

  const categories = [
    { name: 'All', icon: '🎯', color: 'bg-primary' },
    { name: 'Strength', icon: '💪', color: 'bg-blue-500' },
    { name: 'Endurance', icon: '🏃', color: 'bg-purple-500' },
    { name: 'Flexibility', icon: '🤸', color: 'bg-cyan-500' },
    { name: 'Calisthenics', icon: '🔥', color: 'bg-orange-500' },
    { name: 'Para-Athlete', icon: '♿', color: 'bg-red-500' },
  ];

  const filteredChallenges = selectedCategory && selectedCategory !== 'All'
    ? challenges.filter(c => c.category === selectedCategory)
    : challenges;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Strength': 'bg-blue-500',
      'Endurance': 'bg-purple-500',
      'Flexibility': 'bg-cyan-500',
      'Calisthenics': 'bg-orange-500',
      'Para-Athlete': 'bg-red-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      'Beginner': 'bg-green-500',
      'Intermediate': 'bg-yellow-500',
      'Advanced': 'bg-red-500',
    };
    return colors[difficulty] || 'bg-gray-500';
  };

  const calculateProgress = (workouts: Challenge['workouts']) => {
    const completed = workouts.filter(w => w.completed).length;
    return (completed / workouts.length) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Challenges</h1>
        <p className="text-muted-foreground">Complete workouts and earn badges</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category.name}
            variant={selectedCategory === category.name ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.name === selectedCategory ? null : category.name)}
            className="shrink-0"
          >
            <span className="mr-1">{category.icon}</span>
            {category.name}
          </Button>
        ))}
      </div>

      {/* Challenges List */}
      <div className="space-y-4">
        {filteredChallenges.map((challenge) => {
          const progress = calculateProgress(challenge.workouts);
          const completedWorkouts = challenge.workouts.filter(w => w.completed).length;
          const totalWorkouts = challenge.workouts.length;

          return (
            <Card key={challenge.id} className="card-elevated overflow-hidden">
              {/* Challenge Cover Image */}
              {challenge.image && (
                <div className="h-32 relative">
                  <img 
                    src={challenge.image}
                    alt={challenge.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-2xl">{challenge.badge.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{challenge.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={`${getCategoryColor(challenge.category)} text-white`}>
                        {challenge.category}
                      </Badge>
                      <Badge className={`${getDifficultyColor(challenge.difficulty)} text-white`}>
                        {challenge.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        {challenge.participants} participants
                      </Badge>
                    </div>
                  </div>
                  {challenge.isLocked && (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Progress: {completedWorkouts}/{totalWorkouts} workouts
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Workouts */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Workout Plan
                  </h4>
                  {challenge.workouts.map((workout, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        workout.completed
                          ? 'bg-success/10 border-success/20'
                          : 'bg-secondary/50 border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {workout.completed ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {workout.name} × {workout.targetReps}
                          </p>
                          {workout.currentReps > 0 && !workout.completed && (
                            <p className="text-xs text-muted-foreground">
                              {workout.currentReps}/{workout.targetReps} completed
                            </p>
                          )}
                        </div>
                      </div>
                      {!workout.completed && !challenge.isLocked && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onStartWorkout(workout.name, challenge)}
                        >
                          Start
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Badge Reward */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{challenge.badge.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <h4 className="font-semibold text-sm">Reward Badge</h4>
                      </div>
                      <p className="text-sm font-medium">{challenge.badge.name}</p>
                      <p className="text-xs text-muted-foreground">{challenge.badge.description}</p>
                    </div>
                    {progress === 100 && (
                      <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredChallenges.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No challenges found</h3>
            <p className="text-sm text-muted-foreground">
              Try selecting a different category
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChallengesTab;
