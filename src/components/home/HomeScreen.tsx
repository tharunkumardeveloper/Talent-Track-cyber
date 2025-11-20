import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Settings, 
  User, 
  Target, 
  Trophy, 
  Calendar,
  Zap,
  Star
} from 'lucide-react';

// Import challenge images from root challenges folder
const pushupPowerImage = '/challenges/pushup-power.webp';
const pullupProgressionImage = '/challenges/pullup-progression.jpg';
const coreCrusherImage = '/challenges/core-crusher.avif';
const sprintMasterImage = '/challenges/sprint-master.jpg';
const flexibilityFoundationImage = '/challenges/flexibility-foundation.webp';
const jumpPowerImage = '/challenges/jump-power.jpg';
const adaptiveStrengthImage = '/challenges/adaptive-strength.jpg';

// Import activity images
import modifiedShuttleRunImage from '@/assets/activities/modified-shuttle-run.jpg';
import wideArmPushupImage from '@/assets/activities/wide-arm-pushup.jpg';
import kneePushupImage from '@/assets/activities/knee-pushup.jpg';
import inclinedPushupImage from '@/assets/activities/inclined-pushup.jpg';
import sitReachImage from '@/assets/activities/sit-reach.jpg';
import sitUpsImage from '@/assets/activities/sit-ups.jpg';
import shuttleRunGeneralImage from '@/assets/activities/shuttle-run.jpg';
import verticalJumpImage from '@/assets/activities/vertical-jump.jpg';
import pushupImage from '@/assets/activities/pushup.jpg';
import pullupImage from '@/assets/activities/pullup.webp';

interface HomeScreenProps {
  userRole: 'athlete' | 'coach' | 'admin';
  userName: string;
  onTabChange: (tab: string) => void;
  activeTab: string;
  onProfileOpen?: () => void;
  onSettingsOpen?: () => void;
  onChallengeRedirect?: (challengeId: string) => void;
  onActivitySelect?: (activity: any) => void;
}

const HomeScreen = ({ userRole, userName, onTabChange, activeTab, onProfileOpen, onSettingsOpen, onChallengeRedirect, onActivitySelect }: HomeScreenProps) => {
  const [searchFocus, setSearchFocus] = useState(false);
  const [selectedChallengeFilter, setSelectedChallengeFilter] = useState<string | null>(null);

  const getChallengeImage = (challengeId: string) => {
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

  const challenges = [
    {
      id: 'push-up-power',
      title: 'Push-up Power',
      type: 'challenge-blue',
      difficulty: 'Beginner',
      duration: '5 workouts',
      participants: 2340,
      category: 'Strength'
    },
    {
      id: 'pull-up-progression',
      title: 'Pull-up Progression',
      type: 'challenge-purple',
      difficulty: 'Intermediate',
      duration: '5 workouts',
      participants: 1876,
      category: 'Strength'
    },
    {
      id: 'core-crusher',
      title: 'Core Crusher',
      type: 'challenge-blue',
      difficulty: 'Beginner',
      duration: '5 workouts',
      participants: 3210,
      category: 'Strength'
    },
    {
      id: 'sprint-master',
      title: 'Sprint Master',
      type: 'challenge-purple',
      difficulty: 'Intermediate',
      duration: '5 workouts',
      participants: 1543,
      category: 'Endurance'
    },
    {
      id: 'flexibility-foundation',
      title: 'Flexibility Foundation',
      type: 'challenge-light-blue',
      difficulty: 'Beginner',
      duration: '5 workouts',
      participants: 2890,
      category: 'Flexibility'
    },
    {
      id: 'jump-power',
      title: 'Jump Power',
      type: 'challenge-gray',
      difficulty: 'Intermediate',
      duration: '5 workouts',
      participants: 1234,
      category: 'Calisthenics'
    },
    {
      id: 'adaptive-strength',
      title: 'Adaptive Strength',
      type: 'challenge-maroon',
      difficulty: 'Beginner',
      duration: '5 workouts',
      participants: 987,
      category: 'Para-Athlete'
    }
  ];

  const challengeTags = ['Strength', 'Endurance', 'Flexibility', 'Calisthenics', 'Para-Athlete'];

  const getFilteredChallenges = () => {
    if (!selectedChallengeFilter) return challenges;
    return challenges.filter(challenge => challenge.category === selectedChallengeFilter);
  };

  const activityTags = [
    'Flexibility', 'Endurance', 'Arm', 'Chest', 'Leg', 'Para-Athlete'
  ];

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const allActivities = [
    // Arm exercises
    { name: 'Push-ups', rating: 4.8, image: pushupImage, muscles: 'Chest, Arms', tags: ['Arm', 'Chest'] },
    { name: 'Pull-ups', rating: 4.9, image: pullupImage, muscles: 'Back, Arms', tags: ['Arm'] },
    { name: 'Inclined Push-up', rating: 4.5, image: inclinedPushupImage, muscles: 'Chest, Arms', tags: ['Arm', 'Chest'] },
    { name: 'Knee Push-up', rating: 4.3, image: kneePushupImage, muscles: 'Chest, Arms', tags: ['Arm', 'Chest', 'Para-Athlete'] },
    { name: 'Wide Arm Push-up', rating: 4.6, image: wideArmPushupImage, muscles: 'Chest, Arms', tags: ['Arm', 'Chest'] },
    
    // Leg exercises
    { name: 'Vertical Jump', rating: 4.6, image: verticalJumpImage, muscles: 'Legs', tags: ['Leg'] },
    
    // Endurance exercises
    { name: 'Shuttle Run', rating: 4.8, image: shuttleRunGeneralImage, muscles: 'Full Body', tags: ['Endurance', 'Leg'] },
    { name: 'Modified Shuttle Run', rating: 4.2, image: modifiedShuttleRunImage, muscles: 'Full Body', tags: ['Endurance', 'Para-Athlete'] },
    
    // Flexibility exercises
    { name: 'Sit Reach', rating: 4.5, image: sitReachImage, muscles: 'Hamstrings & Lower Back', tags: ['Flexibility'] },
    { name: 'Sit-ups', rating: 4.7, image: sitUpsImage, muscles: 'Core', tags: ['Flexibility'] }
  ];

  const getFilteredActivities = () => {
    if (selectedTags.length === 0) return allActivities;
    return allActivities.filter(activity => 
      selectedTags.some(tag => activity.tags.includes(tag))
    );
  };

  const activities = getFilteredActivities();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-primary border-b border-primary-dark safe-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div>
              <h1 className="text-lg font-semibold text-white">Welcome, {userName}</h1>
              <p className="text-sm text-white/80 capitalize">{userRole}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="tap-target text-white hover:bg-white/20" onClick={() => {
                window.scrollTo(0, 0);
                onSettingsOpen?.();
              }}>
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="tap-target text-white hover:bg-white/20" onClick={() => {
                window.scrollTo(0, 0);
                onProfileOpen?.();
              }}>
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-20 max-w-md mx-auto">
        {/* Search Bar */}
        <div className="mb-6 relative mt-8">
          <div className={`relative transition-all duration-300 ${
            searchFocus ? 'transform scale-105' : ''
          }`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search workouts, challenges..."
              className="pl-10 h-12 rounded-xl border-2 border-violet-800 bg-violet-950/20 focus:border-violet-600 focus:bg-violet-900/30"
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
            />
          </div>
          {searchFocus && (
            <Card className="absolute top-full mt-2 w-full z-10 animate-slide-up">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Search recommendations will appear here</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Weekly Goal Progress */}
        <Card className="mb-6 animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Weekly Progress</CardTitle>
              <Badge variant="secondary" className="bg-success/20 text-success">
                🔥 5 day streak
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-3">
              {['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'].map((day, index) => {
                // Get current day (0 = Sunday, 1 = Monday, etc.)
                const today = new Date().getDay();
                // Convert to Monday-first (0 = Monday, 6 = Sunday)
                const currentDayIndex = today === 0 ? 6 : today - 1;
                const isToday = index === currentDayIndex;
                
                return (
                  <div
                    key={`${day}-${index}`}
                    className="relative"
                  >
                    {isToday && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-[ping_2s_ease-in-out_infinite]" />
                        <div className="absolute inset-0 rounded-full bg-primary/30 animate-[ping_2s_ease-in-out_infinite_0.5s]" />
                      </>
                    )}
                    <div
                      className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isToday
                          ? 'bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground scale-110 shadow-lg shadow-primary/50'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {day}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">5/7 days this week</span>
              <span className="text-primary font-medium">71% complete</span>
            </div>
          </CardContent>
        </Card>

        {/* Activity Focus */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Activity Focus</h2>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {activityTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedTags(prev => 
                    prev.includes(tag) 
                      ? [] // Deselect if already selected
                      : [tag] // Select only this tag, deselect others
                  );
                }}
                className="rounded-full h-8 text-xs"
              >
                {tag}
              </Button>
            ))}
          </div>

          {/* Activities - Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {activities.slice(0, 12).map((activity) => (
              <Card 
                key={activity.name} 
                className="overflow-hidden cursor-pointer hover:scale-105 transition-transform active:scale-95"
                onClick={() => {
                  onActivitySelect?.(activity);
                }}
              >
                {activity.image ? (
                  <div 
                    className="h-24 sm:h-28 md:h-32 bg-cover bg-center relative"
                    style={{
                      backgroundImage: `url(${activity.image})`
                    }}
                  >
                  </div>
                ) : (
                  <div className="h-24 sm:h-28 md:h-32 bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-3xl">
                    💪
                  </div>
                )}
                <CardContent className="p-2 sm:p-3 bg-card text-card-foreground">
                  <h3 className="font-semibold text-xs sm:text-sm mb-1 line-clamp-2">{activity.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{activity.muscles}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{activity.rating}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Challenges Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Challenges</h2>
          </div>
          
          
          {/* Horizontal Scrollable Challenge Cards */}
          <div className="flex space-x-4 overflow-x-auto pb-3 scrollbar-hide">
            {getFilteredChallenges().map((challenge) => (
              <Card 
                key={challenge.id} 
                className={`flex-shrink-0 w-48 overflow-hidden cursor-pointer hover:scale-105 transition-transform relative`}
                onClick={() => onChallengeRedirect?.(challenge.id)}
              >
                <div 
                  className="h-24 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${getChallengeImage(challenge.id)})`
                  }}
                >
                </div>
                <CardContent className={`p-3 ${challenge.type} text-white`}>
                  <h3 className="font-semibold text-sm text-white leading-tight mb-2">
                    {challenge.title}
                  </h3>
                  <p className="text-xs opacity-90 mb-2">{challenge.difficulty}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span>{challenge.duration}</span>
                    <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/30">
                      {challenge.participants}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <Card className="mb-6 animate-fade-in">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">24</div>
                <div className="text-xs text-muted-foreground">Workouts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">1,240</div>
                <div className="text-xs text-muted-foreground">Calories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">45m</div>
                <div className="text-xs text-muted-foreground">Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-subtle border-t safe-bottom">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex justify-around">
            {[
              { id: 'training', label: 'Training', icon: Zap },
              { id: 'discover', label: 'Discover', icon: Search },
              { id: 'report', label: 'Report', icon: Target },
              { id: 'roadmap', label: 'Roadmap', icon: Calendar }
            ].map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(id)}
                className={`flex flex-col items-center space-y-1 tap-target ${
                  activeTab === id ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;