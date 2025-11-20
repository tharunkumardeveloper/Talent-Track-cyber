import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, Coins } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import LoadingScreen from '@/components/LoadingScreen';
import AuthFlow from '@/components/auth/AuthFlow';
import SetupFlow from '@/components/setup/SetupFlow';
import HomeScreen from '@/components/home/HomeScreen';
import CoachDashboard from '@/components/home/CoachDashboard';
import SAIAdminDashboard from '@/components/home/SAIAdminDashboard';
import DiscoverTab from '@/components/tabs/DiscoverTab';
import ReportTab from '@/components/tabs/ReportTab';
import RoadmapTab from '@/components/tabs/RoadmapTab';
import ChallengesTab from '@/components/tabs/ChallengesTab';
import ChallengeDetail from '@/components/challenges/ChallengeDetail';
import ActivityDetail from '@/components/activities/ActivityDetail';
import WorkoutInterface from '@/components/workout/WorkoutInterface';
import ProfilePage from '@/components/profile/ProfilePage';
import SettingsPage from '@/components/settings/SettingsPage';
import BadgesScreen from '@/components/badges/BadgesScreen';
import { preloadAllAssets } from '@/utils/imagePreloader';

type AppState = 'loading' | 'auth' | 'setup' | 'home' | 'profile' | 'settings' | 'badges' | 'challenges' | 'challenge-detail';
type UserRole = 'athlete' | 'coach' | 'admin';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [userRole, setUserRole] = useState<UserRole>('athlete');
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('training');
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showWorkout, setShowWorkout] = useState(false);
  const [workoutMode, setWorkoutMode] = useState<'upload' | 'live'>('upload');
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [userSetupData, setUserSetupData] = useState<any>(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);

  // Simulate checking for returning user and preload assets
  useEffect(() => {
    const isReturningUser = localStorage.getItem('talenttrack_user');
    if (isReturningUser) {
      const userData = JSON.parse(isReturningUser);
      setUserRole(userData.role);
      setUserName(userData.name);
      setIsFirstTime(false);
    }
    
    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.warn('⚠️ Service Worker registration failed:', error);
        });
    }
    
    // Preload critical images immediately (high priority)
    import('@/utils/imagePreloader').then(({ preloadCriticalAssets, preloadAllAssets }) => {
      // Load critical assets first
      preloadCriticalAssets().then(() => {
        console.log('✅ Critical assets loaded');
        // Then load remaining assets in background
        preloadAllAssets().catch(err => {
          console.warn('⚠️ Failed to preload some assets:', err);
        });
      });
    });
  }, []);

  const handleLoadingComplete = () => {
    // If returning user, skip to home
    if (!isFirstTime) {
      setAppState('home');
    } else {
      setAppState('auth');
    }
  };

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    // Set demo names based on role
    const names = {
      athlete: 'Ratheesh',
      coach: 'Rajesh Menon',
      admin: 'Arjun Krishnan'
    };
    setUserName(names[role]);
    
    // Check if user needs setup (simulate first-time login)
    if (isFirstTime) {
      setAppState('setup');
    } else {
      setAppState('home');
    }
  };

  const handleSetupComplete = (userData: any) => {
    // Save user data
    setUserSetupData(userData);
    localStorage.setItem('talenttrack_user', JSON.stringify({
      role: userRole,
      name: userName,
      setupComplete: true,
      ...userData
    }));
    setIsFirstTime(false);
    setAppState('home');
  };

  const handleActivitySelect = (activity: any) => {
    setSelectedActivity(activity);
  };

  const handleActivityBack = () => {
    setSelectedActivity(null);
    setShowWorkout(false);
    // Return to training tab when coming back from workout
    setActiveTab('training');
  };

  const handleStartWorkout = (mode: 'upload' | 'live') => {
    setWorkoutMode(mode);
    setShowWorkout(true);
  };

  const handleProfileOpen = () => {
    setAppState('profile');
  };

  const handleSettingsOpen = () => {
    setAppState('settings');
  };

  const handleBadgesOpen = () => {
    setAppState('badges');
  };

  const handleBackToHome = () => {
    setAppState('home');
  };

  const handleChallengeRedirect = (challengeId: string) => {
    // Navigate to specific challenge detail page
    setSelectedChallengeId(challengeId);
    setAppState('challenge-detail');
  };

  const handleStartChallengeWorkout = (workoutName: string) => {
    // Find the activity by name
    const activity = { name: workoutName };
    setSelectedActivity(activity);
    // Don't auto-start, let user choose mode
    setShowWorkout(false);
  };

  const renderTabContent = () => {
    // For coach and admin, use different content structure
    if (userRole === 'coach' || userRole === 'admin') {
      return null; // CoachDashboard handles its own content
    }
    
    switch (activeTab) {
      case 'discover':
        return <DiscoverTab />;
      case 'report':
        return <ReportTab userSetupData={userSetupData} />;
      case 'roadmap':
        return <RoadmapTab onViewAllBadges={handleBadgesOpen} />;
      default:
        return (
          <HomeScreen 
            userRole={userRole} 
            userName={userName}
            onTabChange={setActiveTab}
            activeTab={activeTab}
            onProfileOpen={handleProfileOpen}
            onSettingsOpen={handleSettingsOpen}
            onChallengeRedirect={handleChallengeRedirect}
          />
        );
    }
  };

  // Show activity detail if selected
  if (selectedActivity) {
    if (showWorkout) {
      return (
        <WorkoutInterface
          activity={selectedActivity}
          mode={workoutMode}
          onBack={() => setShowWorkout(false)}
        />
      );
    }
    
    return (
      <ActivityDetail
        activity={selectedActivity}
        onBack={handleActivityBack}
        onStartWorkout={handleStartWorkout}
      />
    );
  }

  // Show special pages
  if (appState === 'profile') {
    return <ProfilePage userName={userName} onBack={handleBackToHome} onLogout={() => setAppState('auth')} />;
  }

  if (appState === 'settings') {
    return <SettingsPage onBack={handleBackToHome} />;
  }

  if (appState === 'badges') {
    return <BadgesScreen onBack={handleBackToHome} />;
  }

  if (appState === 'challenge-detail' && selectedChallengeId) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-primary border-b border-primary-dark safe-top">
          <div className="px-4 py-4">
            <div className="flex items-center space-x-3 max-w-md mx-auto">
              <Button variant="ghost" size="sm" onClick={handleBackToHome} className="text-white hover:bg-white/20">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-white">Challenge</h1>
                <p className="text-sm text-white/80">Complete all workouts to earn badge</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-6 max-w-md mx-auto">
          <ChallengeDetail 
            challengeId={selectedChallengeId}
            onBack={handleBackToHome}
            onStartWorkout={handleStartChallengeWorkout}
          />
        </div>
      </div>
    );
  }

  // Main app state rendering
  switch (appState) {
    case 'loading':
      return <LoadingScreen onComplete={handleLoadingComplete} />;
    
    case 'auth':
      return <AuthFlow onLogin={handleLogin} />;
    
    case 'setup':
      return <SetupFlow onComplete={handleSetupComplete} onSkip={() => setAppState('home')} />;
    
    case 'home':
      return (
        <div className="min-h-screen bg-background">
          {activeTab === 'training' && userRole === 'athlete' ? (
            <HomeScreen 
              userRole={userRole} 
              userName={userName}
              onTabChange={setActiveTab}
              activeTab={activeTab}
              onProfileOpen={handleProfileOpen}
              onSettingsOpen={handleSettingsOpen}
              onChallengeRedirect={handleChallengeRedirect}
              onActivitySelect={handleActivitySelect}
            />
          ) : userRole === 'coach' ? (
            <CoachDashboard
              userName={userName}
              onTabChange={setActiveTab}
              activeTab={activeTab}
              onProfileOpen={handleProfileOpen}
              onSettingsOpen={handleSettingsOpen}
            />
          ) : userRole === 'admin' ? (
            <SAIAdminDashboard
              userName={userName}
              onTabChange={setActiveTab}
              activeTab={activeTab}
              onProfileOpen={handleProfileOpen}
              onSettingsOpen={handleSettingsOpen}
            />
          ) : (
            <div className="min-h-screen bg-background">
              {/* Top Bar for other tabs */}
              <div className="sticky top-0 z-50 bg-primary border-b border-primary-dark safe-top">
                <div className="px-4 py-4">
                  <div className="flex items-center justify-between max-w-md mx-auto">
                    <div>
                      <h1 className="text-lg font-semibold text-white">Welcome, {userName}</h1>
                      <p className="text-sm text-white/80 capitalize">{userRole}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleSettingsOpen}
                        className="tap-target p-2 rounded-lg hover:bg-white/20 transition-colors text-white text-lg"
                      >
                        ⚙️
                      </button>
                      <button
                        onClick={handleProfileOpen}
                        className="tap-target p-2 rounded-lg hover:bg-white/20 transition-colors text-white text-lg"
                      >
                        👤
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="px-4 pb-20 max-w-md mx-auto pt-6">
                {renderTabContent()}
              </div>

              {/* Bottom Navigation */}
              <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-subtle border-t safe-bottom">
                <div className="max-w-md mx-auto px-4 py-2">
                  <div className="flex justify-around">
                    {[
                      { id: 'training', label: 'Training', icon: '⚡' },
                      { id: 'discover', label: 'Discover', icon: '🔍' },
                      { id: 'report', label: 'Report', icon: '📊' },
                      { id: 'roadmap', label: 'Roadmap', icon: '🗺️' }
                    ].map(({ id, label, icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex flex-col items-center space-y-1 tap-target p-2 rounded-lg transition-colors ${
                          activeTab === id ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="text-lg">{icon}</span>
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    
    default:
      return <LoadingScreen onComplete={handleLoadingComplete} />;
  }
};

export default Index;
