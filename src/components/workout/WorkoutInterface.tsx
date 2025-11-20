import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import WorkoutUploadScreen from './WorkoutUploadScreen';
import VideoProcessor from './VideoProcessor';
import LiveCameraProcessor from './LiveCameraProcessor';
import LiveRecorder from './LiveRecorder';
import { BADGES, checkBadgeUnlock, updateUserStats } from '@/utils/badgeSystem';
import { getUserStats, saveUserStats, getUnlockedBadges, unlockBadge } from '@/utils/workoutStorage';

interface WorkoutInterfaceProps {
  activity: {
    name: string;
    rating: number;
    muscles: string;
  };
  mode: 'upload' | 'live';
  onBack: () => void;
}

const WorkoutInterface = ({ activity, mode, onBack }: WorkoutInterfaceProps) => {
  const [stage, setStage] = useState<'upload' | 'processing' | 'live' | 'liveRecording' | 'liveResults'>(
    mode === 'live' ? 'liveRecording' : 'upload'
  );
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [liveResults, setLiveResults] = useState<any>(null);

  // Activities with available Python scripts
  const supportedActivities = [
    'Push-ups', 
    'Pull-ups', 
    'Sit-ups', 
    'Vertical Jump', 
    'Shuttle Run',
    'Modified Shuttle Run',
    'Sit Reach',
    'Vertical Broad Jump',
    'Standing Broad Jump'
  ];
  const isSupported = supportedActivities.includes(activity.name);
  
  // Activities with live recording support
  const liveRecordingSupported = [
    'Push-ups',
    'Pull-ups',
    'Sit-ups',
    'Vertical Jump',
    'Shuttle Run',
    'Modified Shuttle Run'
  ];
  const hasLiveRecording = liveRecordingSupported.includes(activity.name);

  const handleVideoSelected = (file: File) => {
    setSelectedVideo(file);
    setStage('processing');
  };

  const handleLiveRecordingStart = () => {
    setStage('live');
  };
  
  const handleLiveRecordingComplete = (file: File) => {
    setSelectedVideo(file);
    setStage('processing');
  };

  const handleRetry = () => {
    setSelectedVideo(null);
    setLiveResults(null);
    setStage(mode === 'live' ? 'liveRecording' : 'upload');
  };

  const handleWorkoutComplete = async (results: any) => {
    // Update user stats
    const currentStats = getUserStats();
    const updatedStats = updateUserStats(currentStats, {
      activityName: activity.name,
      setsCompleted: results.setsCompleted,
      badSets: results.badSets,
      posture: results.posture
    });
    saveUserStats(updatedStats);

    // Check for newly unlocked badges
    const previouslyUnlocked = getUnlockedBadges();
    const newlyUnlocked: string[] = [];

    BADGES.forEach(badge => {
      if (!previouslyUnlocked.includes(badge.id) && checkBadgeUnlock(badge, updatedStats)) {
        unlockBadge(badge.id);
        newlyUnlocked.push(badge.id);
      }
    });

    // Show toast for newly unlocked badges
    if (newlyUnlocked.length > 0) {
      const badgeNames = newlyUnlocked
        .map(id => BADGES.find(b => b.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      
      toast.success(`🏆 Badge${newlyUnlocked.length > 1 ? 's' : ''} Unlocked!`, {
        description: badgeNames,
        duration: 5000,
      });
    }

    // Save workout to localStorage for Reports tab
    const workoutData = {
      id: Date.now(),
      activityName: activity.name,
      posture: results.posture,
      setsCompleted: results.setsCompleted,
      badSets: results.badSets,
      duration: results.duration,
      timestamp: new Date().toISOString(),
      videoUrl: results.videoUrl,
      badgesEarned: newlyUnlocked,
      coinsEarned: results.posture === 'Good' ? 50 : 25,
      correctReps: results.stats?.correctReps || 0,
      totalReps: results.stats?.totalReps || results.setsCompleted,
      ...results
    };

    // Use utility function to add workout with thumbnail generation
    const { addWorkoutToHistory } = await import('@/utils/workoutStorage');
    
    // Pass video blob, file, or URL for thumbnail generation (in order of preference)
    const videoSource = results.videoBlob || selectedVideo || results.videoUrl;
    await addWorkoutToHistory(workoutData, videoSource);

    // Return to home/training tab
    onBack();
  };

  if (stage === 'processing') {
    return (
      <VideoProcessor
        videoFile={selectedVideo}
        activityName={activity.name}
        onBack={onBack}
        onRetry={handleRetry}
        onComplete={handleWorkoutComplete}
      />
    );
  }

  if (stage === 'live') {
    return (
      <LiveCameraProcessor
        activityName={activity.name}
        onBack={() => setStage('upload')}
        onComplete={handleLiveRecordingComplete}
      />
    );
  }

  if (stage === 'liveRecording') {
    return (
      <LiveRecorder
        activityName={activity.name}
        onBack={onBack}
        onComplete={(results) => {
          // Store live recording results
          setLiveResults(results);
          setStage('liveResults');
        }}
      />
    );
  }

  if (stage === 'liveResults') {
    return (
      <VideoProcessor
        videoFile={null}
        activityName={activity.name}
        onBack={onBack}
        onRetry={() => setStage('liveRecording')}
        onComplete={handleWorkoutComplete}
        liveResults={liveResults}
      />
    );
  }

  if (stage === 'upload') {
    return (
      <WorkoutUploadScreen
        activityName={activity.name}
        onBack={onBack}
        onVideoSelected={handleVideoSelected}
        onLiveRecordingStart={handleLiveRecordingStart}
        hasLiveRecording={hasLiveRecording}
      />
    );
  }

  return null;
};

export default WorkoutInterface;