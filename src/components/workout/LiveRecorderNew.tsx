import { useState, useRef, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Video, StopCircle, CheckCircle, Loader2, Info } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ProgressiveImage from '@/components/ui/progressive-image';

interface LiveRecorderProps {
  activityName: string;
  onBack: () => void;
  onComplete: (results: any) => void;
}

// Workout tips that cycle during recording
const WORKOUT_TIPS: { [key: string]: string[] } = {
  'Push-ups': [
    'Keep your core tight',
    'Lower chest to ground',
    'Full extension at top',
    'Elbows at 45 degrees',
    'Breathe steadily'
  ],
  'Pull-ups': [
    'Start from dead hang',
    'Pull chin over bar',
    'Control the descent',
    'No swinging',
    'Engage your lats'
  ],
  'Sit-ups': [
    'Keep knees bent',
    'Curl up smoothly',
    'Touch your knees',
    'Control the movement',
    'Breathe with rhythm'
  ]
};

// Workout demonstrations
const WORKOUT_DEMOS: { [key: string]: { 
  gifUrl: string; 
  instructions: string[];
}} = {
  'Push-ups': {
    gifUrl: '/pushup.gif',
    instructions: [
      'Start in plank position with hands shoulder-width apart',
      'Lower your body until chest nearly touches the ground',
      'Push back up to starting position',
      'Keep your body in a straight line throughout'
    ]
  },
  'Pull-ups': {
    gifUrl: '/pullup.gif',
    instructions: [
      'Hang from bar with arms fully extended',
      'Pull yourself up until chin is over the bar',
      'Lower yourself back down with control',
      'Repeat without swinging'
    ]
  },
  'Sit-ups': {
    gifUrl: '/situp.gif',
    instructions: [
      'Lie on your back with knees bent',
      'Place hands behind head or across chest',
      'Curl up to touch your knees',
      'Lower back down with control'
    ]
  }
};

const LiveRecorderNew = ({ activityName, onBack, onComplete }: LiveRecorderProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);
  const lastLandmarksRef = useRef<any>(null);
  const detectorStateRef = useRef<any>({});
  
  const [stage, setStage] = useState<'setup' | 'recording'>('setup');
  const [isLoading, setIsLoading] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);

  const [currentTip, setCurrentTip] = useState(0);
  const [repCount, setRepCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [poseDetector, setPoseDetector] = useState<any>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [showDemoDialog, setShowDemoDialog] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPinching, setIsPinching] = useState(false);
  const initialPinchDistance = useRef<number>(0);
  const initialZoom = useRef<number>(1);

  const tips = WORKOUT_TIPS[activityName] || WORKOUT_TIPS['Push-ups'];
  const demo = WORKOUT_DEMOS[activityName] || WORKOUT_DEMOS['Push-ups'];

  // Initialize camera
  useEffect(() => {
    initCamera();
    
    return () => {
      cleanup();
    };
  }, []);



  // Cycle tips during recording
  useEffect(() => {
    if (stage === 'recording') {
      const interval = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % tips.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [stage, tips.length]);

  // Update recording time
  useEffect(() => {
    if (stage === 'recording') {
      const interval = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [stage]);

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: facingMode,
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error('Video play error:', e));
        };
      }

      await initMediaPipe();
      setIsLoading(false);
      toast.success('Camera ready', { duration: 2000 });
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Camera access denied', { duration: 3000 });
      setIsLoading(false);
    }
  };

  const initMediaPipe = async () => {
    try {
      const { mediapipeProcessor } = await import('@/services/mediapipeProcessor');
      await mediapipeProcessor.initialize();
      
      const { getVideoDetectorForActivity } = await import('@/services/videoDetectors');
      const detector = getVideoDetectorForActivity(activityName);
      setPoseDetector(detector);
    } catch (error) {
      console.error('MediaPipe init error:', error);
    }
  };

  const switchCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(newFacingMode);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: newFacingMode,
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error('Video play error:', e));
        };
      }

      toast.success(`${newFacingMode === 'user' ? 'Front' : 'Back'} camera`, { duration: 2000 });
    } catch (error) {
      console.error('Camera switch error:', error);
      toast.error('Switch failed', { duration: 2000 });
    }
  };

  const startRecording = async () => {
    try {
      if (!videoRef.current || !canvasRef.current || !streamRef.current) {
        toast.error('Camera not ready', { duration: 2000 });
        return;
      }

      // Check if device is in landscape orientation
      const isLandscape = window.innerWidth > window.innerHeight;
      if (!isLandscape) {
        toast.error('Please rotate your device to landscape mode', { 
          duration: 4000,
          description: 'Turn your phone sideways for best recording quality'
        });
        return;
      }

      isRecordingRef.current = true;
      setStage('recording');
      setRecordingTime(0);
      setRepCount(0);
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Force landscape dimensions
      const videoWidth = video.videoWidth || 1920;
      const videoHeight = video.videoHeight || 1080;
      
      // Ensure canvas is always landscape (width > height)
      if (videoWidth > videoHeight) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
      } else {
        // If video is portrait, swap dimensions to force landscape
        canvas.width = videoHeight;
        canvas.height = videoWidth;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      const canvasStream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') 
        ? 'video/webm;codecs=vp8'
        : 'video/webm';

      const recorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: 2500000
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        
        // Directly proceed to output screen
        const videoUrl = URL.createObjectURL(blob);
        const finalState = detectorStateRef.current;
        const correctReps = finalState.correctCount || 0;
        const incorrectReps = finalState.incorrectCount || 0;
        const totalReps = repCount;
        
        const hasReps = totalReps > 0;
        const goodPosture = hasReps && (correctReps >= incorrectReps);

        const results = {
          type: goodPosture ? 'good' : (hasReps ? 'poor' : 'bad'),
          posture: goodPosture ? 'Good' as const : 'Bad' as const,
          setsCompleted: totalReps,
          badSets: incorrectReps,
          duration: `${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`,
          videoUrl: videoUrl,
          videoBlob: blob,
          stats: {
            totalReps: totalReps,
            correctReps: correctReps,
            incorrectReps: incorrectReps,
            avgRepDuration: totalReps > 0 ? recordingTime / totalReps : 0,
            totalTime: recordingTime,
            csvData: []
          }
        };

        onComplete(results);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);

      renderWithMediaPipe();
      toast.success('Recording started', { duration: 2000 });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Recording failed', { duration: 3000 });
    }
  };

  const renderWithMediaPipe = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    const { mediapipeProcessor } = await import('@/services/mediapipeProcessor');
    
    if (!mediapipeProcessor.pose) {
      toast.error('Pose detection not ready', { duration: 2000 });
      return;
    }
    
    let isProcessing = false;
    let lastProcessTime = 0;
    const PROCESS_INTERVAL = 33;

    mediapipeProcessor.pose.onResults((results: any) => {
      isProcessing = false;
      
      if (!results.poseLandmarks) return;
      
      lastLandmarksRef.current = results.poseLandmarks;
      
      if (poseDetector) {
        try {
          const elapsedTime = isRecordingRef.current 
            ? (Date.now() - startTimeRef.current) / 1000 
            : 0;
          
          const reps = poseDetector.process(results.poseLandmarks, elapsedTime);
          
          if (reps && Array.isArray(reps) && reps.length > repCount) {
            setRepCount(reps.length);
          }
          
          const correct = poseDetector.getCorrectCount?.() ?? 0;
          const incorrect = poseDetector.getBadCount?.() ?? 0;
          
          if (correct !== correctCount || incorrect !== incorrectCount) {
            setCorrectCount(correct);
            setIncorrectCount(incorrect);
          }
          
          detectorStateRef.current = {
            state: poseDetector.getState?.() || 'unknown',
            currentAngle: poseDetector.getCurrentAngle?.() ?? undefined,
            correctCount: correct,
            incorrectCount: incorrect
          };
        } catch (err) {
          console.error('Detector processing error:', err);
        }
      }
    });

    const render = () => {
      if (!isRecordingRef.current || !videoRef.current || !canvasRef.current) return;

      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw video to fill canvas completely (no black bars)
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Calculate scaling to cover entire canvas
        const videoAspect = videoWidth / videoHeight;
        const canvasAspect = canvasWidth / canvasHeight;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (videoAspect > canvasAspect) {
          // Video is wider - fit to height
          drawHeight = canvasHeight;
          drawWidth = videoWidth * (canvasHeight / videoHeight);
          offsetX = (canvasWidth - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Video is taller - fit to width
          drawWidth = canvasWidth;
          drawHeight = videoHeight * (canvasWidth / videoWidth);
          offsetX = 0;
          offsetY = (canvasHeight - drawHeight) / 2;
        }
        
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

        if (lastLandmarksRef.current) {
          const mp = window as any;
          if (mp.drawConnectors && mp.POSE_CONNECTIONS) {
            mp.drawConnectors(ctx, lastLandmarksRef.current, mp.POSE_CONNECTIONS, {
              color: '#00FFFF',
              lineWidth: 4
            });
            mp.drawLandmarks(ctx, lastLandmarksRef.current, {
              color: '#FFFFFF',
              fillColor: '#00FFFF',
              radius: 6
            });
          }
        }

        drawOverlay(ctx);

        const now = performance.now();
        if (!isProcessing && mediapipeProcessor.pose && (now - lastProcessTime) >= PROCESS_INTERVAL) {
          isProcessing = true;
          lastProcessTime = now;
          mediapipeProcessor.pose.send({ image: video }).catch((err) => {
            console.error('MediaPipe send error:', err);
            isProcessing = false;
          });
        }
      } catch (e) {
        console.error('Render error:', e);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();
  };

  const drawOverlay = (ctx: CanvasRenderingContext2D) => {
    ctx.font = 'bold 32px Arial';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    
    const state = detectorStateRef.current?.state || 'unknown';
    const currentAngle = detectorStateRef.current?.currentAngle;
    const correctCount = detectorStateRef.current?.correctCount ?? 0;
    const incorrectCount = detectorStateRef.current?.incorrectCount ?? 0;
    
    const elapsedTime = isRecordingRef.current 
      ? (Date.now() - startTimeRef.current) / 1000 
      : recordingTime;
    
    // Start metrics lower down (around 280px from top)
    let yPosition = 280;
    
    if (currentAngle !== undefined && currentAngle !== null) {
      ctx.fillStyle = '#00FF00';
      const angleText = `Elbow: ${Math.round(currentAngle)}`;
      ctx.strokeText(angleText, 10, yPosition);
      ctx.fillText(angleText, 10, yPosition);
      yPosition += 35;
    }
    
    ctx.fillStyle = '#00FFFF';
    const repText = `${activityName}: ${repCount}`;
    ctx.strokeText(repText, 10, yPosition);
    ctx.fillText(repText, 10, yPosition);
    yPosition += 35;
    
    ctx.fillStyle = state === 'down' ? '#00FF00' : '#C8C800';
    const stateText = `State: ${state}`;
    ctx.strokeText(stateText, 10, yPosition);
    ctx.fillText(stateText, 10, yPosition);
    yPosition += 35;
    
    ctx.fillStyle = '#00FF00';
    const correctText = `Correct: ${correctCount}`;
    ctx.strokeText(correctText, 10, yPosition);
    ctx.fillText(correctText, 10, yPosition);
    yPosition += 35;
    
    ctx.fillStyle = '#FF0000';
    const incorrectText = `Bad: ${incorrectCount}`;
    ctx.strokeText(incorrectText, 10, yPosition);
    ctx.fillText(incorrectText, 10, yPosition);
    yPosition += 35;
    
    ctx.fillStyle = '#FFFF00';
    const timeText = `Time: ${elapsedTime.toFixed(1)}s`;
    ctx.strokeText(timeText, 10, yPosition);
    ctx.fillText(timeText, 10, yPosition);
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    toast.success('Recording stopped', { duration: 2000 });
  };





  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Pinch-to-zoom handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistance.current = distance;
      initialZoom.current = zoomLevel;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = distance / initialPinchDistance.current;
      const newZoom = Math.min(Math.max(initialZoom.current * scale, 1), 3);
      setZoomLevel(newZoom);
      applyZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    setIsPinching(false);
  };

  const applyZoom = async (zoom: number) => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities() as any;
      
      if (capabilities.zoom) {
        try {
          await videoTrack.applyConstraints({
            advanced: [{ zoom: zoom } as any]
          });
        } catch (err) {
          console.log('Zoom not supported on this device');
        }
      }
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.5, 3);
    setZoomLevel(newZoom);
    applyZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.5, 1);
    setZoomLevel(newZoom);
    applyZoom(newZoom);
  };

  return (
    <div className="fixed inset-0 bg-black z-50" style={{ 
      WebkitTransform: 'rotate(0deg)',
      transform: 'rotate(0deg)'
    }}>
      <div 
        className="relative w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}

        <video
          ref={videoRef}
          className={stage === 'setup' && !isLoading ? 'absolute inset-0 w-full h-full object-cover' : 'hidden'}
          playsInline
          muted
          autoPlay
          style={{ transform: 'scaleX(-1)' }}
        />

        <canvas
          ref={canvasRef}
          className={stage === 'recording' ? 'absolute inset-0 w-full h-full object-cover' : 'hidden'}
        />



        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-auto">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  window.scrollTo(0, 0);
                  onBack();
                }}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {(stage === 'setup' || stage === 'recording') && !isLoading && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleZoomOut}
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                      disabled={zoomLevel <= 1}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                      </svg>
                    </Button>
                    <span className="text-white text-xs font-medium">{zoomLevel.toFixed(1)}x</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleZoomIn}
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                      disabled={zoomLevel >= 3}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </Button>
                  </>
                )}
                {(stage === 'setup' || stage === 'recording') && !isLoading && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={switchCamera}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </Button>
                )}
                {stage === 'setup' && !isLoading && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowDemoDialog(true)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                )}
                {stage === 'recording' && (
                  <Badge variant="destructive" className="animate-pulse px-2 py-1 text-xs">
                    <div className="w-1.5 h-1.5 bg-white rounded-full mr-1"></div>
                    REC {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                  </Badge>
                )}
              </div>
            </div>
          </div>



          {stage === 'recording' && (
            <div className="absolute top-20 right-2 space-y-1 pointer-events-auto">
              <div className="bg-black/70 text-white px-2 py-1.5 rounded-lg backdrop-blur-sm">
                <div className="text-xl font-bold">{repCount}</div>
                <div className="text-[10px] opacity-80">Reps</div>
              </div>
              <div className="bg-black/70 text-white px-2 py-1.5 rounded-lg backdrop-blur-sm">
                <div className="text-sm font-bold">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-[10px] opacity-80">Time</div>
              </div>
            </div>
          )}

          {stage === 'recording' && (
            <div className="absolute bottom-20 left-2 right-2">
              <div className="bg-blue-500/90 text-white px-3 py-2 rounded-lg backdrop-blur-sm text-center">
                <p className="text-xs font-medium">💡 {tips[currentTip]}</p>
              </div>
            </div>
          )}

          {stage === 'setup' && !isLoading && (
            <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 pointer-events-auto max-w-md mx-auto">
              <Card className="bg-black/70 backdrop-blur-lg border-white/20">
                <CardContent className="p-4 text-white">
                  <h3 className="font-semibold mb-3 flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                    Setup Checklist
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="font-bold text-yellow-400">📱 ROTATE TO LANDSCAPE</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <span>Position full body in frame</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      <span>🤏 Pinch to zoom or use +/- buttons</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <span>Ensure good lighting</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent pointer-events-auto">
            <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
              {stage === 'setup' && !isLoading && (
                <Button 
                  onClick={startRecording} 
                  className="w-full h-12 text-base bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
              )}

              {stage === 'recording' && (
                <Button 
                  onClick={stopRecording} 
                  className="w-full h-12 text-base bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop Recording
                </Button>
              )}


            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] p-4 sm:p-6">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              How to Perform {activityName}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Watch the demo and follow the tips
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 overflow-y-auto max-h-[calc(85vh-140px)]">
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <ProgressiveImage
                src={demo.gifUrl}
                alt={`${activityName} demonstration`}
                className="w-full h-full object-contain bg-black"
                placeholderClassName="bg-gradient-to-br from-primary/20 to-primary/5"
                priority={true}
              />
              <Badge className="absolute top-2 right-2 bg-primary z-10 text-xs">
                Demo
              </Badge>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Instructions
              </h3>
              <ol className="space-y-1.5">
                {demo.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs">
                    <Badge variant="outline" className="mt-0.5 shrink-0 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {index + 1}
                    </Badge>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t">
            <Button 
              onClick={() => setShowDemoDialog(false)} 
              className="flex-1"
              size="sm"
            >
              Got It
            </Button>
            <Button 
              onClick={() => setShowDemoDialog(false)} 
              variant="outline"
              size="sm"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(LiveRecorderNew);
