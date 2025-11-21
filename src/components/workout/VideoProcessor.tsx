import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Shield, Upload, CircleCheck as CheckCircle, Circle as XCircle, Trophy, Play } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { mediapipeProcessor } from '@/services/mediapipeProcessor';
import { backendProcessor } from '@/services/backendProcessor';
import { 
  showProcessingNotification, 
  updateProcessingNotification, 
  showCompletionNotification,
  cancelNotification,
  isNativePlatform 
} from '@/services/notificationService';
import CSVDataDisplay from './CSVDataDisplay';
import VideoPlayer from './VideoPlayer';
import FramePlayer from './FramePlayer';

interface VideoProcessorProps {
  videoFile: File | null;
  activityName: string;
  onBack: () => void;
  onRetry: () => void;
  onComplete: (results: any) => void;
  liveResults?: any; // Pre-computed results from live recording
}

interface ProcessingResult {
  type: 'good' | 'bad' | 'poor' | 'anomaly';
  posture?: 'Good' | 'Bad';
  setsCompleted?: number;
  badSets?: number;
  duration?: string;
  message?: string;
  videoUrl?: string;
  stats?: any;
  outputId?: string;
}

const VideoProcessor = ({ videoFile, activityName, onBack, onRetry, onComplete, liveResults }: VideoProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(!liveResults);
  const [progress, setProgress] = useState(liveResults ? 100 : 0);
  const [result, setResult] = useState<ProcessingResult | null>(liveResults || null);
  const [liveFrame, setLiveFrame] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [currentReps, setCurrentReps] = useState(0);
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [processingMessage, setProcessingMessage] = useState('Analyzing your workout...');
  const [useBackend, setUseBackend] = useState(false); // ALWAYS use browser processing (serverless)
  const [outputId, setOutputId] = useState<string>('');
  const [notificationId, setNotificationId] = useState<number | null>(null);

  // Force browser-only mode in production
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  useEffect(() => {
    // Cleanup function
    const cleanup = () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      // Cleanup MediaPipe
      mediapipeProcessor.cleanup();
    };

    // If live results are provided, skip processing
    if (liveResults) {
      console.log('Using live recording results:', liveResults);
      setIsProcessing(false);
      setProgress(100);
      setResult(liveResults);
      return cleanup;
    }

    // Reset state when new video is uploaded
    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    setLiveFrame('');
    setCurrentReps(0);
    setCurrentMetrics(null);
    setProcessingMessage('Analyzing your workout...');

    if (videoFile) {
      processVideo(videoFile);
    } else {
      // If no video file, show error and go back
      toast.error("No video file provided");
      setTimeout(() => {
        onBack();
      }, 1000);
    }

    // Cleanup on unmount
    return cleanup;
  }, [videoFile, liveResults]);

  const processVideo = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);

    // Add visibility change listener to notify user
    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.info('Processing continues in background. Keep this tab open!', {
          duration: 5000
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ALWAYS use browser processing in production (no backend needed)
    if (isProduction) {
      console.log('Production mode: Using browser-only processing');
      await processWithBrowser(file);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      return;
    }

    // In development, check if backend is available
    if (useBackend && !isProduction) {
      const serverAvailable = await backendProcessor.checkServerStatus();
      if (serverAvailable) {
        await processWithBackend(file);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        return;
      } else {
        console.warn('Backend server not available, falling back to browser processing');
        toast.info('Server not available, using browser processing');
        setUseBackend(false);
      }
    }

    // Fallback to browser processing
    await processWithBrowser(file);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  const processWithBackend = async (file: File) => {
    try {
      setProcessingMessage('Uploading to server...');
      console.log('Using Python backend for:', activityName);
      console.log('Backend URL:', backendProcessor['baseUrl']);

      const result = await backendProcessor.processVideo(
        file,
        activityName,
        (prog, message) => {
          setProgress(prog);
          setProcessingMessage(message);
          console.log('Backend progress:', prog, message);
        }
      );

      console.log('Backend result:', result);
      setProgress(100);

      // Store output ID for frame player
      setOutputId(result.outputId);

      // Get video URL
      const newVideoUrl = result.videoFile
        ? backendProcessor.getVideoUrl(result.outputId, result.videoFile)
        : '';

      // Revoke old video URL before setting new one
      if (videoUrl && videoUrl !== newVideoUrl) {
        URL.revokeObjectURL(videoUrl);
      }

      setVideoUrl(newVideoUrl);

      // Parse CSV data
      const csvData = result.csvData || [];
      const totalReps = csvData.length;
      const correctReps = csvData.filter((row: any) =>
        row.correct === 'True' || row.correct === true || row.correct === '1'
      ).length;

      // Calculate duration
      let duration = '0:00';
      if (csvData.length > 0) {
        const lastRow = csvData[csvData.length - 1];
        const totalSeconds = parseFloat(lastRow.up_time || lastRow.time_sec || lastRow.time_s || 0);
        const mins = Math.floor(totalSeconds / 60);
        const secs = Math.floor(totalSeconds % 60);
        duration = `${mins}:${secs.toString().padStart(2, '0')}`;
      }

      // Build stats
      const stats: any = {
        totalReps,
        correctReps,
        incorrectReps: totalReps - correctReps,
        csvData
      };

      // Extract metrics from CSV
      if (activityName.includes('Push') || activityName.includes('Pull')) {
        const angles = csvData.map((r: any) => parseFloat(r.min_elbow_angle)).filter((a: number) => !isNaN(a));
        if (angles.length > 0) {
          stats.minElbowAngle = Math.min(...angles);
          stats.avgRepDuration = csvData.reduce((sum: number, r: any) => sum + parseFloat(r.dip_duration_sec || 0), 0) / csvData.length;
        }
      }

      if (activityName.includes('Jump')) {
        const heights = csvData.map((r: any) => parseFloat(r.jump_height_m || r.reach_m || 0)).filter((h: number) => !isNaN(h));
        if (heights.length > 0) {
          stats.maxJumpHeight = Math.max(...heights);
          stats.avgJumpHeight = heights.reduce((a: number, b: number) => a + b, 0) / heights.length;
        }
      }

      const posture: 'Good' | 'Bad' = correctReps >= totalReps * 0.7 ? 'Good' : 'Bad';

      const processedResult: ProcessingResult = {
        type: posture === 'Good' ? 'good' : 'bad',
        posture,
        setsCompleted: totalReps,
        badSets: totalReps - correctReps,
        duration,
        videoUrl,
        stats
      };

      setResult(processedResult);
      setIsProcessing(false);
      toast.success('Processing complete!');

    } catch (error: any) {
      console.error('Backend processing failed:', error);
      console.error('Error details:', error.message, error.stack);
      toast.error('Backend processing failed: ' + (error.message || 'Unknown error'));
      toast.info('Falling back to browser mode...');
      await processWithBrowser(file);
    }
  };

  const processWithBrowser = async (file: File) => {
    try {
      setProcessingMessage('Loading MediaPipe AI models...');
      console.log('Starting browser-based video processing for:', activityName);
      console.log('Video file:', file.name, file.size, 'bytes', file.type);

      // Show initial notification (works on web and mobile)
      const notifId = await showProcessingNotification(activityName, 0);
      setNotificationId(notifId);

      // Validate video file
      if (!file.type.startsWith('video/')) {
        throw new Error('Invalid file type. Please upload a video file.');
      }

      // Get video duration for better messaging
      const videoElement = document.createElement('video');
      videoElement.src = URL.createObjectURL(file);
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          const duration = videoElement.duration;
          if (duration > 60) {
            setProcessingMessage(`Processing large video (${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s) - this may take a while...`);
          } else {
            setProcessingMessage('Analyzing your workout...');
          }
          URL.revokeObjectURL(videoElement.src);
          resolve(true);
        };
      });

      // Process video with MediaPipe in browser
      const processingResult = await mediapipeProcessor.processVideo(
        file,
        activityName,
        (prog, frame, reps, metrics) => {
          setProgress(prog);
          if (frame) {
            setLiveFrame(frame);
          }
          setCurrentReps(reps || 0);
          setCurrentMetrics(metrics || null);
          
          // Update notification (works on web and mobile)
          if (notificationId && prog % 10 === 0) {
            updateProcessingNotification(notificationId, activityName, prog);
          }
          
          // Update message based on progress
          if (prog < 25) {
            setProcessingMessage('Detecting body landmarks...');
          } else if (prog < 50) {
            setProcessingMessage('Tracking movements...');
          } else if (prog < 75) {
            setProcessingMessage('Counting reps...');
          } else if (prog < 90) {
            setProcessingMessage('Finalizing analysis...');
          } else if (prog < 95) {
            setProcessingMessage('Interpolating frames for smooth output...');
          } else {
            setProcessingMessage('Creating output video...');
          }
        }
      );

      console.log('Processing complete:', processingResult);

      setProgress(100);
      setProcessingMessage('Processing complete!');

      // Create video URL from blob
      const newVideoUrl = processingResult.videoBlob
        ? URL.createObjectURL(processingResult.videoBlob)
        : '';

      console.log('Created video URL:', newVideoUrl, 'Blob size:', processingResult.videoBlob?.size);

      // Revoke old video URL before setting new one
      if (videoUrl && videoUrl !== newVideoUrl) {
        URL.revokeObjectURL(videoUrl);
      }

      setVideoUrl(newVideoUrl);

      const formatDuration = (seconds: number): string => {
        if (!seconds || isNaN(seconds)) {
          return '0:00';
        }
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };

      const duration = formatDuration(processingResult.totalTime || 0);

      // Determine result type based on processing results
      const resultType: 'good' | 'bad' = processingResult.posture === 'Good' ? 'good' : 'bad';

      const processedResult: ProcessingResult = {
        type: resultType,
        posture: processingResult.posture,
        setsCompleted: processingResult.reps.length,
        badSets: processingResult.incorrectReps,
        duration: duration,
        videoUrl: newVideoUrl, // Use the NEW video URL, not the old state
        stats: {
          ...processingResult.stats,
          csvData: processingResult.csvData // Include CSV data for display
        }
      };

      console.log('Setting result with videoUrl:', processedResult.videoUrl);
      setResult(processedResult);
      setIsProcessing(false);
      setLiveFrame(''); // Clear live frame

      // Cancel processing notification and show completion notification
      if (notificationId) {
        await cancelNotification(notificationId);
      }
      await showCompletionNotification(activityName, processingResult.reps.length);

    } catch (error: any) {
      console.error('Error processing video:', error);
      console.error('Error stack:', error.stack);
      setIsProcessing(false);
      setLiveFrame('');

      // Show specific error message
      const errorMessage = error.message || "Failed to process video. Please try again.";
      toast.error(errorMessage);

      // Give user option to retry
      setTimeout(() => {
        onRetry();
      }, 3000);
    } finally {
      mediapipeProcessor.cleanup();
    }
  };





  const handleSubmitWorkout = async () => {
    if (result && (result.type === 'good' || result.type === 'bad')) {
      // Save to localStorage for Reports tab
      const workoutData = {
        id: Date.now(),
        activityName,
        posture: result.posture,
        setsCompleted: result.setsCompleted,
        badSets: result.badSets,
        duration: result.duration,
        timestamp: new Date().toISOString(),
        videoUrl: result.videoUrl,
        badgesEarned: ['Form Analyzer', 'Consistency Champion'],
        coinsEarned: result.type === 'good' ? 50 : 25
      };

      // Use utility function to add workout with thumbnail generation
      const { addWorkoutToHistory } = await import('@/utils/workoutStorage');
      
      // Pass video file or URL for thumbnail generation
      const videoSource = videoFile || result.videoUrl;
      await addWorkoutToHistory(workoutData, videoSource);

      onComplete(workoutData);
    }
  };

  const handleBackDuringProcessing = () => {
    // Cancel the processing
    mediapipeProcessor.cancelVideoProcessing();
    
    // Show cancellation message
    toast.info('Processing cancelled');
    
    // Go back
    onBack();
  };

  // Processing Screen with Live Preview
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-subtle border-b safe-top">
          <div className="px-4 py-4">
            <div className="flex items-center space-x-3 max-w-4xl mx-auto">
              <Button variant="ghost" size="sm" onClick={handleBackDuringProcessing} className="tap-target">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-semibold">Processing {activityName}</h1>
                <p className="text-sm text-muted-foreground">AI Analysis in Progress</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-20 max-w-4xl mx-auto pt-6 space-y-6">
          {/* Progress Card - MOVED TO TOP */}
          <Card className="card-elevated">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Processing Progress</h3>
                  <p className="text-sm text-muted-foreground">{processingMessage}</p>
                </div>
                <div className="text-2xl font-bold text-primary">{Math.round(progress)}%</div>
              </div>

              <Progress value={progress} className="h-3" />

              {/* Processing Steps */}
              <div className="space-y-2 text-sm">
                <div className={`flex items-center space-x-2 ${progress > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <CheckCircle className="w-4 h-4" />
                  <p>Detecting body landmarks with MediaPipe</p>
                </div>
                <div className={`flex items-center space-x-2 ${progress > 25 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <CheckCircle className="w-4 h-4" />
                  <p>Tracking joint angles and movements</p>
                </div>
                <div className={`flex items-center space-x-2 ${progress > 50 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <CheckCircle className="w-4 h-4" />
                  <p>Counting reps and validating form</p>
                </div>
                <div className={`flex items-center space-x-2 ${progress > 75 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <CheckCircle className="w-4 h-4" />
                  <p>Generating annotated video with skeleton overlay</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Processing Preview */}
          {liveFrame && (
            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Live Processing</span>
                  </div>
                  {currentReps > 0 && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {currentReps} {activityName.includes('Jump') ? 'Jumps' : 'Reps'}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <img
                    src={liveFrame}
                    alt="Processing frame"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Real-time skeleton tracking and rep counting
                </p>
              </CardContent>
            </Card>
          )}

          {/* Real-time Metrics (Loading State) */}
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-primary animate-pulse" />
                <span>Live Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-secondary/30">
                  <div className="text-2xl font-bold mb-1">
                    {currentReps > 0 ? currentReps : '...'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activityName.includes('Jump') ? 'Jumps' : 'Reps'} Detected
                  </p>
                </div>

                {activityName.includes('Jump') ? (
                  <>
                    <div className="text-center p-3 rounded-lg bg-secondary/30">
                      <div className="text-2xl font-bold mb-1">
                        {currentReps > 0 && currentMetrics?.maxJumpHeight
                          ? `${currentMetrics.maxJumpHeight.toFixed(2)}m`
                          : '...'}
                      </div>
                      <p className="text-xs text-muted-foreground">Max Height</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/30">
                      <div className="text-2xl font-bold mb-1">
                        {currentReps > 0 && currentMetrics?.avgJumpHeight !== undefined && currentMetrics.avgJumpHeight > 0
                          ? `${currentMetrics.avgJumpHeight.toFixed(2)}m`
                          : '...'}
                      </div>
                      <p className="text-xs text-muted-foreground">Avg Height</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center p-3 rounded-lg bg-secondary/30">
                      <div className="text-2xl font-bold mb-1 text-green-500">
                        {currentMetrics?.correctCount !== undefined ? currentMetrics.correctCount : '...'}
                      </div>
                      <p className="text-xs text-muted-foreground">Correct Form</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/30">
                      <div className="text-2xl font-bold mb-1 text-red-500">
                        {currentMetrics?.incorrectCount !== undefined ? currentMetrics.incorrectCount : '...'}
                      </div>
                      <p className="text-xs text-muted-foreground">Bad Form</p>
                    </div>
                  </>
                )}

                {!activityName.includes('Jump') && currentMetrics?.minAngle && (
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <div className="text-2xl font-bold mb-1">{Math.round(currentMetrics.minAngle)}°</div>
                    <p className="text-xs text-muted-foreground">Min Angle</p>
                  </div>
                )}

                {currentMetrics?.currentTime !== undefined && (
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <div className="text-2xl font-bold mb-1">{currentMetrics.currentTime.toFixed(1)}s</div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                  </div>
                )}
              </div>

              {progress < 100 && (
                <p className="text-xs text-center text-muted-foreground mt-3">
                  ⏳ Metrics updating in real-time...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm text-center">
                💡 Processing happens entirely in your browser - no data is sent to any server!
              </p>
              <p className="text-xs text-center text-muted-foreground">
                ⚡ Processing continues even when this tab is minimized or inactive
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Anomaly Detection Modal
  if (result?.type === 'anomaly') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive bg-destructive/5">
          <CardContent className="p-6 text-center">
            <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-4 text-destructive">🚨 Anomaly Detected</h2>
            <p className="text-muted-foreground mb-6">{result.message}</p>

            <div className="space-y-3">
              <Button onClick={onRetry} variant="outline" className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Upload Another Video
              </Button>
              <Button variant="ghost" onClick={() => {
                window.scrollTo(0, 0);
                onBack();
              }} className="w-full">
                Exit Workout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results Screen (for good/bad results)
  if (result && (result.type === 'good' || result.type === 'bad')) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-subtle border-b safe-top">
          <div className="px-4 py-4">
            <div className="flex items-center space-x-3 max-w-md mx-auto">
              <Button variant="ghost" size="sm" onClick={() => {
                window.scrollTo(0, 0);
                onBack();
              }} className="tap-target">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-lg font-semibold">Workout Results</h1>
                <p className="text-sm text-muted-foreground">{activityName}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-20 max-w-md mx-auto pt-6 space-y-6">
          {/* Annotated Video Preview - FIRST ELEMENT */}
          {result.videoUrl ? (
            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Play className="w-4 h-4 text-primary" />
                  <span>Annotated Analysis Video</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                  {outputId && result.videoUrl ? (
                    <>
                      <FramePlayer
                        outputId={outputId}
                        baseUrl="http://localhost:3001"
                      />
                      {/* Fallback video player if frames don't load */}
                      <div className="hidden">
                        <VideoPlayer
                          key={result.videoUrl}
                          src={result.videoUrl}
                          className="w-full h-full"
                        />
                      </div>
                    </>
                  ) : result.videoUrl ? (
                    <VideoPlayer
                      key={result.videoUrl}
                      src={result.videoUrl}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <p>Video not available</p>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-primary/90 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 pointer-events-none z-10">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>AI Processed</span>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Video shows MediaPipe skeleton tracking and rep counting
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(result.videoUrl!, '_blank');
                      }}
                      className="flex-1"
                    >
                      Open in New Tab
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = result.videoUrl!;
                        a.download = `${activityName.replace(/\s+/g, '_')}_analyzed.mp4`;
                        a.click();
                      }}
                      className="flex-1"
                    >
                      Download Video
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    💡 If video doesn't play, click "Download Video" and open in VLC
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="card-elevated">
              <CardContent className="p-4">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📹</div>
                    <h3 className="text-lg font-semibold mb-2">Live Recording Completed</h3>
                    <p className="text-sm text-muted-foreground">Analysis based on real-time processing</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Card */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {result.posture === 'Good' ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <XCircle className="w-5 h-5 text-warning" />
                )}
                <span>Analysis Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dynamic stats grid based on activity type */}
              <div className="grid grid-cols-2 gap-4">
                {/* Sit and Reach - Show max reach prominently */}
                {activityName === 'Sit Reach' && result.stats?.maxReach !== undefined ? (
                  <>
                    <div className="col-span-2 text-center p-4 rounded-lg bg-success/10 border border-success/20">
                      <div className="text-4xl font-bold mb-1 text-success">{result.stats.maxReach.toFixed(2)}m</div>
                      <p className="text-sm text-muted-foreground">Maximum Reach Distance</p>
                    </div>
                    {result.duration && (
                      <div className="col-span-2 text-center p-3 rounded-lg bg-secondary/30">
                        <div className="text-2xl font-bold mb-1">{result.duration}</div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {result.posture && (
                      <div className="text-center p-3 rounded-lg bg-secondary/30">
                        <div className="text-2xl font-bold mb-1">{result.posture}</div>
                        <p className="text-xs text-muted-foreground">Posture</p>
                      </div>
                    )}

                    {result.setsCompleted !== undefined && (
                      <div className="text-center p-3 rounded-lg bg-secondary/30">
                        <div className="text-2xl font-bold mb-1">{result.setsCompleted}</div>
                        <p className="text-xs text-muted-foreground">
                          {activityName.includes('Jump') ? 'Jumps' : 'Reps'}
                        </p>
                      </div>
                    )}

                    {result.badSets !== undefined && !activityName.includes('Jump') && (
                      <div className="text-center p-3 rounded-lg bg-secondary/30">
                        <div className="text-2xl font-bold mb-1 text-red-500">{result.badSets}</div>
                        <p className="text-xs text-muted-foreground">Bad Form</p>
                      </div>
                    )}
                    
                    {result.stats?.correctReps !== undefined && !activityName.includes('Jump') && (
                      <div className="text-center p-3 rounded-lg bg-secondary/30">
                        <div className="text-2xl font-bold mb-1 text-green-500">{result.stats.correctReps}</div>
                        <p className="text-xs text-muted-foreground">Correct Form</p>
                      </div>
                    )}

                    {result.duration && (
                      <div className="text-center p-3 rounded-lg bg-secondary/30">
                        <div className="text-2xl font-bold mb-1">{result.duration}</div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                    )}
                  </>
                )}

                {/* Activity-specific stats */}
                {result.stats?.maxJumpHeight && (
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <div className="text-2xl font-bold mb-1">{result.stats.maxJumpHeight.toFixed(2)}m</div>
                    <p className="text-xs text-muted-foreground">Max Height</p>
                  </div>
                )}

                {result.stats?.avgJumpHeight && (
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <div className="text-2xl font-bold mb-1">{result.stats.avgJumpHeight.toFixed(2)}m</div>
                    <p className="text-xs text-muted-foreground">Avg Height</p>
                  </div>
                )}

                {result.stats?.avgSplitTime && (
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <div className="text-2xl font-bold mb-1">{result.stats.avgSplitTime.toFixed(2)}s</div>
                    <p className="text-xs text-muted-foreground">Avg Split</p>
                  </div>
                )}

                {result.stats?.minElbowAngle && (
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <div className="text-2xl font-bold mb-1">{Math.round(result.stats.minElbowAngle)}°</div>
                    <p className="text-xs text-muted-foreground">Min Angle</p>
                  </div>
                )}

                {result.stats?.avgRepDuration && (
                  <div className="text-center p-3 rounded-lg bg-secondary/30">
                    <div className="text-2xl font-bold mb-1">{result.stats.avgRepDuration.toFixed(1)}s</div>
                    <p className="text-xs text-muted-foreground">Avg Rep Time</p>
                  </div>
                )}
              </div>

              {/* Posture Badge */}
              {result.posture && (
                <div className="flex justify-center">
                  <Badge
                    className={`${result.posture === 'Good' ? 'bg-success/10 text-success border-success' : 'bg-warning/10 text-warning border-warning'}`}
                    variant="outline"
                  >
                    {result.posture === 'Good' ? '✅ Excellent Form' : '⚠️ Form Needs Work'}
                  </Badge>
                </div>
              )}

              {/* Performance Summary */}
              {result.stats && (
                <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <h4 className="font-semibold mb-2 flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span>Performance Summary</span>
                  </h4>
                  <div className="text-sm space-y-1">
                    {activityName === 'Sit Reach' && result.stats.maxReach ? (
                      <>
                        <p>✅ Maximum forward reach: {result.stats.maxReach.toFixed(2)}m</p>
                        <p>📏 Flexibility measurement completed</p>
                      </>
                    ) : (
                      <>
                        {result.stats.correctReps !== undefined && result.stats.totalReps !== undefined && (
                          <p>✅ Correct reps: {result.stats.correctReps}/{result.stats.totalReps} ({result.stats.totalReps > 0 ? Math.round((result.stats.correctReps / result.stats.totalReps) * 100) : 0}%)</p>
                        )}
                        {result.stats.maxJumpHeight && (
                          <p>🏆 Best jump: {result.stats.maxJumpHeight.toFixed(2)}m</p>
                        )}
                        {result.stats.avgJumpHeight && (
                          <p>📊 Average jump: {result.stats.avgJumpHeight.toFixed(2)}m</p>
                        )}
                        {result.stats.avgSplitTime && (
                          <p>⏱️ Average split time: {result.stats.avgSplitTime.toFixed(2)}s</p>
                        )}
                        {result.stats.minElbowAngle && result.stats.minElbowAngle < 90 && (
                          <p>💪 Good depth achieved (min angle: {Math.round(result.stats.minElbowAngle)}°)</p>
                        )}
                        {result.stats.avgRepDuration && (
                          <p>⏲️ Average rep time: {result.stats.avgRepDuration.toFixed(1)}s</p>
                        )}
                        {result.stats.distance && (
                          <p>📏 Distance covered: {result.stats.distance.toFixed(2)}m</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CSV Data Display */}
          {result.stats?.csvData && result.stats.csvData.length > 0 && (
            <CSVDataDisplay csvData={result.stats.csvData} activityName={activityName} />
          )}

          {/* Submit Button */}
          <Button onClick={handleSubmitWorkout} className="w-full btn-hero" size="lg">
            <CheckCircle className="w-5 h-5 mr-2" />
            Submit Workout
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default VideoProcessor;