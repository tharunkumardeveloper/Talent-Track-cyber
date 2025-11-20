import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Trophy, Lock, Star } from 'lucide-react';
import { BADGES, getRarityColor, getCategoryColor, checkBadgeUnlock, getBadgeProgress, type Badge } from '@/utils/badgeSystem';
import { getUserStats, getUnlockedBadges } from '@/utils/workoutStorage';

interface BadgesScreenProps {
  onBack: () => void;
}

const BadgesScreen = ({ onBack }: BadgesScreenProps) => {
  const [userStats, setUserStats] = useState<any>({});
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    // Load user stats and unlocked badges
    setUserStats(getUserStats());
    setUnlockedBadges(getUnlockedBadges());
  }, []);

  const categories = [
    { id: 'all', name: 'All', icon: '🏆' },
    { id: 'strength', name: 'Strength', icon: '💪' },
    { id: 'endurance', name: 'Endurance', icon: '⚡' },
    { id: 'flexibility', name: 'Flexibility', icon: '🤸' },
    { id: 'consistency', name: 'Consistency', icon: '🔥' },
    { id: 'milestone', name: 'Milestone', icon: '⭐' },
    { id: 'elite', name: 'Elite', icon: '👑' }
  ];

  const filteredBadges = selectedCategory && selectedCategory !== 'all'
    ? BADGES.filter(b => b.category === selectedCategory)
    : BADGES;

  const unlockedCount = BADGES.filter(b => unlockedBadges.includes(b.id)).length;
  const totalBadges = BADGES.length;
  const completionPercentage = (unlockedCount / totalBadges) * 100;

  const getBadgeStatus = (badge: Badge) => {
    const isUnlocked = unlockedBadges.includes(badge.id);
    const progress = getBadgeProgress(badge, userStats);
    return { isUnlocked, progress };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-primary border-b border-primary-dark safe-top">
        <div className="px-4 py-4">
          <div className="flex items-center max-w-md mx-auto">
            <Button variant="ghost" size="sm" onClick={() => {
              window.scrollTo(0, 0);
              onBack();
            }} className="mr-3 text-white hover:bg-white/20">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-white">Badges</h1>
              <p className="text-sm text-white/80">{unlockedCount} of {totalBadges} unlocked</p>
            </div>
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Overall Progress */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">Your Progress</h3>
                <p className="text-sm text-muted-foreground">Keep working out to unlock more!</p>
              </div>
              <div className="text-3xl">🏆</div>
            </div>
            <Progress value={completionPercentage} className="h-3 mb-2" />
            <p className="text-sm text-center font-medium">{Math.round(completionPercentage)}% Complete</p>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id === selectedCategory ? null : category.id)}
              className="shrink-0"
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredBadges.map((badge) => {
            const { isUnlocked, progress } = getBadgeStatus(badge);

            return (
              <Card
                key={badge.id}
                className={`relative overflow-hidden transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700'
                    : 'bg-card opacity-75'
                }`}
              >
                <CardContent className="p-4">
                  {/* Badge Icon */}
                  <div className="relative mb-3">
                    <div
                      className={`text-5xl mx-auto w-fit ${
                        !isUnlocked && 'grayscale opacity-40'
                      }`}
                    >
                      {badge.icon}
                    </div>
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    {isUnlocked && (
                      <div className="absolute -top-1 -right-1">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      </div>
                    )}
                  </div>

                  {/* Badge Info */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-center line-clamp-1">
                      {badge.name}
                    </h4>
                    <p className="text-xs text-muted-foreground text-center line-clamp-2 min-h-[2rem]">
                      {badge.description}
                    </p>

                    {/* Rarity Badge */}
                    <div className="flex justify-center">
                      <BadgeUI className={`text-xs ${getRarityColor(badge.rarity)}`}>
                        {badge.rarity}
                      </BadgeUI>
                    </div>

                    {/* Progress Bar (if not unlocked) */}
                    {!isUnlocked && (
                      <div>
                        <Progress value={progress} className="h-1.5 mb-1" />
                        <p className="text-xs text-center text-muted-foreground">
                          {Math.round(progress)}%
                        </p>
                      </div>
                    )}

                    {/* Requirement */}
                    <p className="text-xs text-center text-muted-foreground italic">
                      {badge.requirement.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredBadges.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No badges found</h3>
              <p className="text-sm text-muted-foreground">
                Try selecting a different category
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Summary */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Your Stats
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Total Workouts</p>
                <p className="font-bold text-lg">{userStats.totalWorkouts || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Streak</p>
                <p className="font-bold text-lg">{userStats.currentStreak || 0} days</p>
              </div>
              <div>
                <p className="text-muted-foreground">Perfect Workouts</p>
                <p className="font-bold text-lg">{userStats.perfectWorkouts || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Max Reps</p>
                <p className="font-bold text-lg">{userStats.maxRepsInWorkout || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BadgesScreen;
