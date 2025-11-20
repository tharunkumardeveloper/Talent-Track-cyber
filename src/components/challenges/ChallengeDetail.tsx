import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Trophy, Target, CheckCircle, Star, ArrowRight } from 'lucide-react';
import ProgressiveImage from '@/components/ui/progressive-image';

// Challenge cover images from public/challenges folder
const pushupPowerImage = '/challenges/pushup-power.webp';
const pullupProgressionImage = '/challenges/pullup-progression.jpg';
const coreCrusherImage = '/challenges/core-crusher.avif';
const sprintMasterImage = '/challenges/sprint-master.jpg';
const flexibilityFoundationImage = '/challenges/flexibility-foundation.webp';
const jumpPowerImage = '/challenges/jump-power.jpg';
const adaptiveStrengthImage = '/challenges/adaptive-strength.jpg';

interface Workout {
  name: string;
  targetReps: number;
  completed: boolean;
  currentReps: number;
}

interface ChallengeDetailProps {
  challengeId: string;
  onBack: () => void;
  onStartWorkout: (workoutName: string) => void;
}

const CHALLENGES: Record<string, {
  name: string;
  description: string;
  category: string;
  difficulty: string;
  workouts: Workout[];
  badge: {
    name: string;
    icon: string;
    description: string;
  };
  participants: number;
}> = {
  'push-up-power': {
    name: 'Push-up Power',
    description: 'Master the fundamental push-up with perfect form',
    category: 'Strength',
    difficulty: 'Beginner',
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
    participants: 2340
  },
  'pull-up-progression': {
    name: 'Pull-up Progression',
    description: 'Build upper body strength with pull-ups',
    category: 'Strength',
    difficulty: 'Intermediate',
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
    participants: 1876
  },
  'core-crusher': {
    name: 'Core Crusher',
    description: 'Strengthen your core with sit-ups',
    category: 'Strength',
    difficulty: 'Beginner',
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
    participants: 3210
  },
  'sprint-master': {
    name: 'Sprint Master',
    description: 'Improve your speed and agility',
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
    participants: 1543
  },
  'flexibility-foundation': {
    name: 'Flexibility Foundation',
    description: 'Improve your flexibility and range of motion',
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
    participants: 2890
  },
  'jump-power': {
    name: 'Jump Power',
    description: 'Develop explosive power with vertical jumps',
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
    participants: 1234
  },
  'adaptive-strength': {
    name: 'Adaptive Strength',
    description: 'Build strength with modified exercises',
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
    participants: 987
  },
};

const ChallengeDetail = ({ challengeId, onBack, onStartWorkout }: ChallengeDetailProps) => {
  const challenge = CHALLENGES[challengeId];

  if (!challenge) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold mb-2">Challenge not found</h2>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  const getChallengeImage = () => {
    switch (challengeId) {
      case 'push-up-power': return pushupPowerImage;
      case 'pull-up-progression': return pullupProgressionImage;
      case 'core-crusher': return coreCrusherImage;
      case 'sprint-master': return sprintMasterImage;
      case 'flexibility-foundation': return flexibilityFoundationImage;
      case 'jump-power': return jumpPowerImage;
      case 'adaptive-strength': return adaptiveStrengthImage;
      default: return pushupPowerImage;
    }
  };

  const calculateProgress = () => {
    const completed = challenge.workouts.filter(w => w.completed).length;
    return (completed / challenge.workouts.length) * 100;
  };

  const progress = calculateProgress();
  const completedWorkouts = challenge.workouts.filter(w => w.completed).length;
  const totalWorkouts = challenge.workouts.length;

  const getCategoryColor = () => {
    const colors: Record<string, string> = {
      'Strength': 'bg-blue-500',
      'Endurance': 'bg-purple-500',
      'Flexibility': 'bg-cyan-500',
      'Calisthenics': 'bg-orange-500',
      'Para-Athlete': 'bg-red-500',
    };
    return colors[challenge.category] || 'bg-gray-500';
  };

  const getDifficultyColor = () => {
    const colors: Record<string, string> = {
      'Beginner': 'bg-green-500',
      'Intermediate': 'bg-yellow-500',
      'Advanced': 'bg-red-500',
    };
    return colors[challenge.difficulty] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Challenge Cover Image */}
      <Card className="overflow-hidden">
        <div className="h-48 relative">
          <ProgressiveImage
            src={getChallengeImage()}
            alt={challenge.name}
            className="absolute inset-0 w-full h-full object-cover"
            placeholderClassName="bg-gradient-to-br from-primary/20 to-primary/5"
            priority={true}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="flex items-center gap-3">
              <div className="text-5xl">{challenge.badge.icon}</div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{challenge.name}</h1>
                <p className="text-white/90 text-sm">{challenge.description}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Challenge Info */}
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-2">
            <Badge className={`${getCategoryColor()} text-white`}>
              {challenge.category}
            </Badge>
            <Badge className={`${getDifficultyColor()} text-white`}>
              {challenge.difficulty}
            </Badge>
            <Badge variant="outline">
              {challenge.participants} participants
            </Badge>
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
        </CardContent>
      </Card>

      {/* Workouts */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5" />
          Workout Plan
        </h3>
        {challenge.workouts.map((workout, index) => (
          <Card
            key={index}
            className={`${
              workout.completed
                ? 'bg-success/10 border-success/20'
                : 'bg-card'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {workout.completed ? (
                    <CheckCircle className="w-6 h-6 text-success" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {workout.name} × {workout.targetReps}
                    </p>
                    {workout.currentReps > 0 && !workout.completed && (
                      <p className="text-sm text-muted-foreground">
                        {workout.currentReps}/{workout.targetReps} completed
                      </p>
                    )}
                  </div>
                </div>
                {!workout.completed && (
                  <Button
                    size="sm"
                    onClick={() => onStartWorkout(workout.name)}
                  >
                    Start
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Badge Reward */}
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{challenge.badge.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-lg">Reward Badge</h3>
              </div>
              <p className="font-medium mb-1">{challenge.badge.name}</p>
              <p className="text-sm text-muted-foreground">{challenge.badge.description}</p>
            </div>
            {progress === 100 && (
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChallengeDetail;
