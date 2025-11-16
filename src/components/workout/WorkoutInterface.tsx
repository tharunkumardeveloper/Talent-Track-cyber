import { useState } from 'react';
import WorkoutUploadScreen from './WorkoutUploadScreen';
import VideoProcessor from './VideoProcessor';
import LiveCameraProcessor from './LiveCameraProcessor';
import LiveRecorder from './LiveRecorder';

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

  const handleWorkoutComplete = (results: any) => {
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
      badgesEarned: ['Form Analyzer', 'Consistency Champion'],
      coinsEarned: results.posture === 'Good' ? 50 : 25,
      ...results
    };

    const existingHistory = JSON.parse(localStorage.getItem('workout_history') || '[]');
    existingHistory.push(workoutData);
    localStorage.setItem('workout_history', JSON.stringify(existingHistory));

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