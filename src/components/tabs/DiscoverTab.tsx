import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, Clock, Star, Trophy, ArrowRight, CheckCircle } from 'lucide-react';
import { FEATURED_CHALLENGES, getChallengeProgress, getCategoryColor, getDifficultyColor, type Challenge } from '@/utils/challengeSystem';
import ChallengeDetailModal from '@/components/challenges/ChallengeDetailModal';

interface DiscoverTabProps {
  onStartWorkout?: (exerciseName: string) => void;
}

const DiscoverTab = ({ onStartWorkout }: DiscoverTabProps) => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  const filterCategories = [
    { id: 'all', name: 'All', icon: '🏆' },
    { id: 'strength', name: 'Strength', icon: '💪' },
    { id: 'endurance', name: 'Endurance', icon: '⚡' },
    { id: 'flexibility', name: 'Flexibility', icon: '🤸' },
    { id: 'calisthenics', name: 'Calisthenics', icon: '🤸‍♂️' },
    { id: 'para-athlete', name: 'Para-Athlete', icon: '♿' }
  ];

  const filteredChallenges = selectedFilter && selectedFilter !== 'all'
    ? FEATURED_CHALLENGES.filter(c => c.category === selectedFilter)
    : FEATURED_CHALLENGES;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Discover Challenges</h1>
        <p className="text-muted-foreground">Join featured challenges and earn exclusive badges</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filterCategories.map((category) => (
          <Button
            key={category.id}
            variant={selectedFilter === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter(category.id === selectedFilter ? null : category.id)}
            className="shrink-0"
          >
            <span className="mr-1">{category.icon}</span>
            {category.name}
          </Button>
        ))}
      </div>

      {/* Featured Challenges */}
      <div className="space-y-4">
        {filteredChallenges.map((challenge) => {
          const progress = getChallengeProgress(challenge.id);

          return (
            <Card
              key={challenge.id}
              className={`card-elevated cursor-pointer transition-all hover:scale-[1.02] ${
                progress.completed ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700' : ''
              }`}
              onClick={() => setSelectedChallenge(challenge)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Challenge Icon */}
                  <div className="shrink-0">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl">
                      {challenge.image}
                    </div>
                  </div>

                  {/* Challenge Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base line-clamp-1">{challenge.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{challenge.description}</p>
                      </div>
                      {progress.completed && (
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={`${getCategoryColor(challenge.category)} text-white text-xs`}>
                        {challenge.category}
                      </Badge>
                      <Badge className={`${getDifficultyColor(challenge.difficulty)} text-white text-xs`}>
                        {challenge.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {challenge.duration}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {challenge.participants.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {challenge.rating}
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-yellow-500" />
                        {challenge.rewards.coins} coins
                      </div>
                    </div>

                    {/* Progress */}
                    {!progress.completed && progress.workoutsCompleted > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{progress.workoutsCompleted}/{progress.totalWorkouts} workouts</span>
                        </div>
                        <Progress value={progress.progress} className="h-1.5" />
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      size="sm"
                      variant={progress.completed ? 'outline' : 'default'}
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChallenge(challenge);
                      }}
                    >
                      {progress.completed ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Completed
                        </>
                      ) : progress.workoutsCompleted > 0 ? (
                        <>
                          Continue Challenge
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Start Challenge
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredChallenges.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No challenges found</h3>
            <p className="text-sm text-muted-foreground">
              Try selecting a different category
            </p>
          </CardContent>
        </Card>
      )}

      {/* Challenge Detail Modal */}
      {selectedChallenge && (
        <ChallengeDetailModal
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
          onStartWorkout={onStartWorkout}
        />
      )}
    </div>
  );
};

export default DiscoverTab;
