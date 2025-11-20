import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target, CheckCircle, Lock, Star, Users, Clock, ArrowRight } from 'lucide-react';
import { type Challenge, getChallengeProgress, getCategoryColor, getDifficultyColor } from '@/utils/challengeSystem';
import { toast } from '@/components/ui/sonner';

interface ChallengeDetailModalProps {
  challenge: Challenge;
  onClose: () => void;
  onStartWorkout?: (exerciseName: string) => void;
}

const ChallengeDetailModal = ({ challenge, onClose, onStartWorkout }: ChallengeDetailModalProps) => {
  const progress = getChallengeProgress(challenge.id);

  const handleStartWorkout = (index: number) => {
    // Store challenge context for workout completion
    localStorage.setItem('active_challenge', JSON.stringify({
      challengeId: challenge.id,
      workoutIndex: index
    }));

    const workout = challenge.workouts[index];
    
    // Close modal first
    onClose();
    
    // Navigate to workout screen
    if (onStartWorkout) {
      onStartWorkout(workout.exercise);
    }
    
    toast.success('Challenge workout started!', {
      description: `Complete ${workout.targetReps} ${workout.exercise}`,
      duration: 3000
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">{challenge.image}</div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{challenge.name}</DialogTitle>
              <DialogDescription>{challenge.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Challenge Info */}
          <div className="flex flex-wrap gap-2">
            <Badge className={`${getCategoryColor(challenge.category)} text-white`}>
              {challenge.category}
            </Badge>
            <Badge className={`${getDifficultyColor(challenge.difficulty)} text-white`}>
              {challenge.difficulty}
            </Badge>
            <Badge variant="outline">
              <Clock className="w-3 h-3 mr-1" />
              {challenge.duration}
            </Badge>
            <Badge variant="outline">
              <Users className="w-3 h-3 mr-1" />
              {challenge.participants.toLocaleString()}
            </Badge>
            <Badge variant="outline">
              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
              {challenge.rating}
            </Badge>
          </div>

          {/* Progress */}
          {!progress.completed && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Your Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {progress.workoutsCompleted}/{progress.totalWorkouts} completed
                  </span>
                </div>
                <Progress value={progress.progress} className="h-2" />
              </CardContent>
            </Card>
          )}

          {/* Workouts */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Workout Plan
            </h3>
            <div className="space-y-2">
              {challenge.workouts.map((workout, index) => {
                const isCompleted = index < progress.workoutsCompleted;
                const isNext = index === progress.workoutsCompleted;
                const isLocked = index > progress.workoutsCompleted;

                return (
                  <Card
                    key={index}
                    className={`${
                      isCompleted
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : isNext
                        ? 'bg-primary/5 border-primary/20'
                        : 'opacity-60'
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : isLocked ? (
                            <Lock className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">
                              {index + 1}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {workout.exercise}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {workout.targetReps} reps {workout.sets && `× ${workout.sets} sets`}
                            </p>
                          </div>
                        </div>
                        {!isCompleted && !isLocked && (
                          <Button
                            size="sm"
                            onClick={() => handleStartWorkout(index)}
                          >
                            Start
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Rewards */}
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{challenge.badge.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <h4 className="font-semibold text-sm">Challenge Rewards</h4>
                  </div>
                  <p className="text-sm font-medium">{challenge.badge.name}</p>
                  <p className="text-xs text-muted-foreground">{challenge.badge.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="font-medium">🪙 {challenge.rewards.coins} coins</span>
                    <span className="font-medium">⭐ {challenge.rewards.xp} XP</span>
                  </div>
                </div>
                {progress.completed && (
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {progress.completed ? (
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleStartWorkout(progress.workoutsCompleted)}
                >
                  {progress.workoutsCompleted > 0 ? 'Continue' : 'Start Challenge'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeDetailModal;
