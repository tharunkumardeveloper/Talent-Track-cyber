import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Video, StopCircle, CheckCircle, RotateCcw, Loader2, X, Info } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  ],
  'Vertical Jump': [
    'Bend knees deeply',
    'Swing arms up',
    'Explode upward',
    'Land softly',
    'Reset between jumps'
  ],
  'Shuttle Run': [
    'Sprint at max speed',
    'Turn explosively',
    'Stay low',
    'Touch the line',
    'Quick direction changes'
  ]
};

// Workout demonstrations with instructions
const WORKOUT_DEMOS: { [key: string]: { 
  gifUrl: string; 
  instructions: string[];
  keyPoints: string[];
}} = {
  'Push-ups': {
    gifUrl: '/pushup.gif',
    instructions: [
      'Start in plank position with hands shoulder-width apart',
      'Lower your body until chest nearly touches the ground',
      'Push back up to starting position',
      'Keep your body in a straight line throughout'
    ],
    keyPoints: [
      'Full body visible in frame',
      'Side view works best',
      'Maintain steady pace',
      'Complete full range of motion'
    ]
  },
  'Pull-ups': {
    gifUrl: '/pullup.gif',
    instructions: [
      'Hang from bar with arms fully extended',
      'Pull yourself up until chin is over the bar',
      'Lower yourself back down with control',
      'Repeat without swinging'
    ],
    keyPoints: [
      'Full body visible in frame',
      'Front or side view',
      'No kipping or swinging',
      'Full extension at bottom'
    ]
  },
  'Sit-ups': {
    gifUrl: '/situp.gif',
    instructions: [
      'Lie on your back with knees bent',
      'Place hands behind head or across chest',
      'Curl up to touch your knees',
      'Lower back down with control'
    ],
    keyPoints: [
      'Side view recommended',
      'Full body visible',
      'Touch knees each rep',
      'Controlled movement'
    ]
  },
  'Vertical Jump': {
    gifUrl: '/verticaljump.gif',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Bend knees and swing arms back',
      'Explode upward, reaching as high as possible',
      'Land softly and reset'
    ],
    keyPoints: [
      'Side view works best',
      'Full body visible',
      'Jump as high as you can',
      'Land in same spot'
    ]
  },
  'Shuttle Run': {
    gifUrl: '/shuttlerun.gif',
    instructions: [
      'Sprint to the line as fast as possible',
      'Touch the line with your hand',
      'Turn quickly and sprint back',
      'Repeat for required distance'
    ],
    keyPoints: [
      'Side or angled view',
      'Full running path visible',
      'Touch lines clearly',
      'Maximum speed'
    ]
  },
  'Sit Reach': {
    gifUrl: '/sit&reach.gif',
    instructions: [
      'Sit with legs extended straight',
      'Reach forward as far as possible',
      'Hold the stretch briefly',
      'Return to starting position'
    ],
    keyPoints: [
      'Side view recommended',
      'Full body visible',
      'Reach as far as you can',
      'Keep legs straight'
    ]
  },
  'Standing Broad Jump': {
    gifUrl: '/verticaljump.gif',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Swing arms back and bend knees',
      'Jump forward as far as possible',
      'Land with both feet together'
    ],
    keyPoints: [
      'Side view works best',
      'Full jump path visible',
      'Jump for maximum distance',
      'Balanced landing'
    ]
  },
  'Knee Push-ups': {
    gifUrl: '/kneepushup.gif',
    instructions: [
      'Start in plank position with knees on the ground',
      'Lower your body until chest nearly touches the ground',
      'Push back up to starting position',
      'Keep your back straight throughout'
    ],
    keyPoints: [
      'Full body visible in frame',
      'Side view works best',
      'Maintain steady pace',
      'Complete full range of motion'
    ]
  }
};

const LiveRecorder = ({ activityName, onBack, onComplete }: LiveRecorderProps) => {
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
  
  const [stage, setStage] = useState<'setup' | 'recording' | 'review'>('setup');
  const [isLoading, setIsLoading] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [currentTip, setCurrentTip] = useState(0);
  const [repCount, setRepCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [poseDetector, setPoseDetector] = useState<any>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [showDemoDialog, setShowDemoDialog] = useState(true); // Show on mount

  const tips = WORKOUT_TIPS[activityName] || WORKOUT_TIPS['Push-ups'];
  const demo = WORKOUT_DEMOS[activityName] || WORKOUT_DEMOS['Push-ups'];

  // Initialize camera
  useEffect(() => {
    initCamera();
    return () => cleanup();
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
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: facingMode
        },
        audio: false
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error('Video play error:', e));
        };
      }

      // Initialize MediaPipe
      await initMediaPipe();
      
      setIsLoading(false);
      toast.success('Camera ready!');
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Failed to access camera. Please allow camera permissions.');
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
    if (stage === 'recording') {
      toast.error('Cannot switch camera while recording');
      return;
    }

    try {
      // Stop current stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Toggle facing mode
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
      setFacingMode(newFacingMode);
      setIsLoading(true);

      // Get new stream with new facing mode
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: newFacingMode
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

      setIsLoading(false);
      toast.success(`Switched to ${newFacingMode === 'user' ? 'front' : 'back'} camera`);
    } catch (error) {
      console.error('Camera switch error:', error);
      toast.error('Failed to switch camera');
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      if (!videoRef.current || !canvasRef.current || !streamRef.current) {
        toast.error('Camera not ready. Please wait...');
        console.error('Missing refs:', {
          video: !!videoRef.current,
          canvas: !!canvasRef.current,
          stream: !!streamRef.current
        });
        return;
      }

      // Starting recording

      isRecordingRef.current = true;
      setStage('recording');
      setRecordingTime(0);
      setRepCount(0);
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      // Draw initial frame to prevent black screen
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      // Start recording canvas
      const canvasStream = canvas.captureStream(30);

      const recorder = new MediaRecorder(canvasStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        setStage('review');
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);

      // Start rendering with MediaPipe
      renderWithMediaPipe();
      
      toast.success('Recording started!');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording: ' + (error as Error).message);
    }
  };

  const renderWithMediaPipe = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Missing refs for rendering');
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    const { mediapipeProcessor } = await import('@/services/mediapipeProcessor');
    
    // Ensure MediaPipe is initialized
    if (!mediapipeProcessor.pose) {
      console.error('MediaPipe pose not initialized');
      toast.error('Pose detection not ready. Please try again.');
      return;
    }
    
    let frameCount = 0;
    let isProcessing = false;

    // Set up the onResults callback - this fires when MediaPipe completes processing
    mediapipeProcessor.pose.onResults((results: any) => {
      isProcessing = false;
      frameCount++;
      
      // Debug logging
      if (frameCount % 30 === 0) {
        console.log(`MediaPipe: ${frameCount} frames processed, pose: ${!!results.poseLandmarks}`);
      }
      
      if (!results.poseLandmarks) {
        console.warn('No pose detected in frame');
        return;
      }
      
      // Store landmarks - create new array to ensure updates
      lastLandmarksRef.current = results.poseLandmarks.map((lm: any) => ({...lm}));
      
      // Process frame with detector
      if (poseDetector) {
        try {
          // Calculate actual elapsed time in seconds
          const elapsedTime = isRecordingRef.current 
            ? (Date.now() - startTimeRef.current) / 1000 
            : 0;
          
          const reps = poseDetector.process(results.poseLandmarks, elapsedTime);
          
          // Update rep count based on reps array length
          if (reps && Array.isArray(reps) && reps.length > repCount) {
            console.log(`Rep count updated: ${repCount} -> ${reps.length}`);
            setRepCount(reps.length);
          }
          
          // Update detector state - use getter methods with fallbacks
          const state = poseDetector.getState?.() || 'unknown';
          const currentAngle = poseDetector.getCurrentAngle?.() ?? undefined;
          const correct = poseDetector.getCorrectCount?.() ?? 0;
          const incorrect = poseDetector.getBadCount?.() ?? 0;
          const dipTime = poseDetector.getDipTime?.(elapsedTime) ?? 0;
          const airTime = poseDetector.getAirTime?.(elapsedTime) ?? 0;
          const distance = poseDetector.getDistance?.() ?? 0;
          const reach = poseDetector.getCurrentReach?.() ?? 0;
          
          // Update state for UI cards
          if (correct !== correctCount) {
            setCorrectCount(correct);
          }
          if (incorrect !== incorrectCount) {
            setIncorrectCount(incorrect);
          }
          
          // Log state for debugging (every 30 frames)
          if (frameCount % 30 === 0) {
            console.log('Live Detector State:', { 
              activityName,
              state, 
              currentAngle, 
              correct, 
              incorrect, 
              dipTime,
              airTime,
              distance,
              reach,
              repCount,
              repsLength: reps?.length
            });
          }
          
          // Store in ref with all values
          detectorStateRef.current = {
            state,
            currentAngle,
            correctCount: correct,
            incorrectCount: incorrect,
            dipTime,
            airTime,
            distance,
            reach
          };
          
          // Debug log when counts change
          if (frameCount % 30 === 0 && (correct > 0 || incorrect > 0)) {
            console.log('📊 Counts in overlay:', { correct, incorrect, total: reps?.length });
          }
        } catch (err) {
          console.error('Detector processing error:', err);
        }
      }
    });

    const render = () => {
      if (!isRecordingRef.current || !videoRef.current || !canvasRef.current) {
        return;
      }

      try {
        // Save context state
        ctx.save();
        
        // Always draw video frame at 60fps for smooth display
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw skeleton if we have pose data - MATCH UPLOAD MODAL EXACTLY
        if (lastLandmarksRef.current) {
          const mp = window as any;
          if (mp.drawConnectors && mp.POSE_CONNECTIONS) {
            // Draw connections in cyan/blue like Python and upload modal
            mp.drawConnectors(ctx, lastLandmarksRef.current, mp.POSE_CONNECTIONS, {
              color: '#00FFFF',
              lineWidth: 2
            });
            // Draw landmarks in white/cyan like Python and upload modal
            mp.drawLandmarks(ctx, lastLandmarksRef.current, {
              color: '#FFFFFF',
              fillColor: '#00FFFF',
              radius: 3
            });
          }
        }

        // Draw overlay with metrics - MATCH UPLOAD MODAL EXACTLY
        drawOverlay(ctx);
        
        // Restore context state
        ctx.restore();

        // Send frame to MediaPipe for processing (only if not already processing)
        if (!isProcessing && mediapipeProcessor.pose) {
          isProcessing = true;
          mediapipeProcessor.pose.send({ image: video }).catch((err) => {
            console.error('MediaPipe send error:', err);
            isProcessing = false;
          });
        }
      } catch (e) {
        console.error('Render error:', e);
      }

      // Continue render loop
      animationRef.current = requestAnimationFrame(render);
    };

    // Start the render loop
    render();
  };

  const drawOverlay = (ctx: CanvasRenderingContext2D) => {
    // Draw metrics overlay EXACTLY matching upload modal
    ctx.font = 'bold 28px Arial';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    
    // Get current detector state from ref (updated in real-time by MediaPipe callback)
    const state = detectorStateRef.current?.state || 'unknown';
    const currentAngle = detectorStateRef.current?.currentAngle;
    const dipTime = detectorStateRef.current?.dipTime || 0;
    const correctCount = detectorStateRef.current?.correctCount ?? 0;
    const incorrectCount = detectorStateRef.current?.incorrectCount ?? 0;
    
    // Calculate real-time elapsed time for smooth display
    const elapsedTime = isRecordingRef.current 
      ? (Date.now() - startTimeRef.current) / 1000 
      : recordingTime;
    
    // 1. Angle display (Green) - Position: (10, 30)
    if (currentAngle !== undefined && currentAngle !== null) {
      ctx.fillStyle = '#00FF00';
      const angleText = `Elbow: ${Math.round(currentAngle)}`;
      ctx.strokeText(angleText, 10, 30);
      ctx.fillText(angleText, 10, 30);
    }
    
    // 2. Rep counter (Cyan) - Position: (10, 60) - ALWAYS SHOW
    ctx.fillStyle = '#00FFFF';
    const repText = `${activityName}: ${repCount}`;
    ctx.strokeText(repText, 10, 60);
    ctx.fillText(repText, 10, 60);
    
    // 3. State (Yellow/Green based on state) - Position: (10, 95) - ALWAYS SHOW
    ctx.fillStyle = state === 'down' ? '#00FF00' : '#C8C800';
    const stateText = `State: ${state}`;
    ctx.strokeText(stateText, 10, 95);
    ctx.fillText(stateText, 10, 95);
    
    // 4. Dip time (Red) - Position: (10, 130) - ONLY show during down state
    if (dipTime !== undefined && dipTime > 0) {
      ctx.fillStyle = '#FF0000';
      const dipText = `Dip: ${dipTime.toFixed(3)}s`;
      ctx.strokeText(dipText, 10, 130);
      ctx.fillText(dipText, 10, 130);
    }
    
    // 5. Correct count (Green) - Position: (10, 160) - ALWAYS SHOW
    ctx.fillStyle = '#00FF00';
    const correctText = `Correct: ${correctCount}`;
    ctx.strokeText(correctText, 10, 160);
    ctx.fillText(correctText, 10, 160);
    
    // 6. Bad count (Blue-ish) - Position: (10, 190) - ALWAYS SHOW
    ctx.fillStyle = '#0000FF';
    const incorrectText = `Bad: ${incorrectCount}`;
    ctx.strokeText(incorrectText, 10, 190);
    ctx.fillText(incorrectText, 10, 190);
    
    // 7. Time (Yellow) - Position: (10, 220) - ALWAYS SHOW with real-time value
    ctx.fillStyle = '#FFFF00';
    const timeText = `Time: ${elapsedTime.toFixed(1)}s`;
    ctx.strokeText(timeText, 10, 220);
    ctx.fillText(timeText, 10, 220);
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
    toast.success('Recording stopped!');
  };

  const useRecording = () => {
    if (!recordedBlob) return;

    // Create video URL from blob
    const videoUrl = URL.createObjectURL(recordedBlob);
    
    // Get final detector state
    const finalState = detectorStateRef.current;
    const correctReps = finalState.correctCount || 0;
    const incorrectReps = finalState.incorrectCount || 0;
    const totalReps = repCount;
    
    // Determine posture based on correct/incorrect ratio
    const hasReps = totalReps > 0;
    const goodPosture = hasReps && (correctReps >= incorrectReps);

    const results = {
      type: goodPosture ? 'good' : (hasReps ? 'poor' : 'bad'),
      posture: goodPosture ? 'Good' as const : 'Bad' as const,
      setsCompleted: totalReps,
      badSets: incorrectReps,
      duration: `${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`,
      videoUrl: videoUrl,
      videoBlob: recordedBlob,
      stats: {
        totalReps: totalReps,
        correctReps: correctReps,
        incorrectReps: incorrectReps,
        avgRepDuration: totalReps > 0 ? recordingTime / totalReps : 0,
        totalTime: recordingTime,
        csvData: []
      }
    };

    console.log('Live recording results:', {
      ...results,
      repCount,
      correctReps,
      incorrectReps,
      finalState
    });
    onComplete(results);
  };

  const retryRecording = () => {
    isRecordingRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setStage('setup');
    setRecordedBlob(null);
    setRepCount(0);
    setRecordingTime(0);
    chunksRef.current = [];
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b">
        <div className="px-4 py-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold">Live Workout</h1>
                <p className="text-sm text-muted-foreground">{activityName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {stage === 'setup' && !isLoading && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowDemoDialog(true)}
                    className="tap-target"
                    title="View Demo"
                  >
                    <Info className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={switchCamera}
                    className="tap-target"
                    title="Switch Camera"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </Button>
                </>
              )}
              {stage === 'recording' && (
                <Badge variant="destructive" className="animate-pulse px-3 py-1">
                  <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                  REC {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        {/* Video Display */}
        <Card className="overflow-hidden shadow-2xl">
          <div className="relative aspect-video bg-black">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
            )}

            {/* Hidden video element - always mounted for camera stream */}
            <video
              ref={videoRef}
              className={stage === 'setup' && !isLoading ? 'w-full h-full object-cover' : 'hidden'}
              playsInline
              muted
              autoPlay
              style={{ transform: 'scaleX(-1)' }}
            />

            {/* Canvas for recording - always mounted but hidden when not recording */}
            <canvas
              ref={canvasRef}
              className={stage === 'recording' ? 'w-full h-full object-cover' : 'hidden'}
            />

            {/* Review Stage - Recorded Video */}
            {stage === 'review' && recordedBlob && (
              <div className="relative w-full h-full">
                <video
                  src={URL.createObjectURL(recordedBlob)}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                  autoPlay
                  loop
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-green-500/90 text-white border-white/30 px-3 py-1">
                    Preview
                  </Badge>
                </div>
              </div>
            )}

            {/* Stage Badge */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-black/70 text-white border-white/30">
                {stage === 'setup' && '📹 Ready'}
                {stage === 'recording' && '🔴 Live'}
                {stage === 'review' && '✓ Complete'}
              </Badge>
            </div>


          </div>
        </Card>

        {/* Info Cards */}
        {stage === 'setup' && !isLoading && (
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-primary" />
                Setup Checklist
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Position your full body in frame</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Ensure good lighting</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Keep device steady (use a stand if possible)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Video will be recorded in landscape format</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === 'recording' && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-4xl font-bold text-primary mb-1">{repCount}</div>
                    <p className="text-sm text-muted-foreground">
                      {activityName.includes('Jump') ? 'Jumps' : 'Reps'}
                    </p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold mb-1">
                      {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </div>
                    <p className="text-sm text-muted-foreground">Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-center text-blue-700 dark:text-blue-300">
                  💡 {tips[currentTip]}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {stage === 'review' && (
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="p-6 text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-bold">Recording Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Review your workout above. The video will play automatically.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-bold text-green-600">{repCount}</div>
                  <p className="text-sm text-muted-foreground">Total Reps</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                  </div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {stage === 'setup' && !isLoading && (
            <Button onClick={startRecording} className="w-full h-14 text-lg" size="lg">
              <Video className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
          )}

          {stage === 'recording' && (
            <Button onClick={stopRecording} variant="destructive" className="w-full h-14 text-lg" size="lg">
              <StopCircle className="w-5 h-5 mr-2" />
              Stop Recording
            </Button>
          )}

          {stage === 'review' && (
            <>
              <Button onClick={useRecording} className="w-full h-14 text-lg" size="lg">
                <CheckCircle className="w-5 h-5 mr-2" />
                Use This Recording
              </Button>
              <Button onClick={retryRecording} variant="outline" className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />
                Record Again
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Workout Demonstration Dialog */}
      <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Video className="w-6 h-6 text-primary" />
              How to Perform {activityName}
            </DialogTitle>
            <DialogDescription>
              Watch the demonstration and follow the instructions for best results
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* GIF Demonstration */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <img 
                src={demo.gifUrl} 
                alt={`${activityName} demonstration`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if GIF fails to load
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EDemo Video%3C/text%3E%3C/svg%3E';
                }}
              />
              <Badge className="absolute top-4 right-4 bg-primary">
                Demo
              </Badge>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Step-by-Step Instructions
              </h3>
              <ol className="space-y-2">
                {demo.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 shrink-0">
                      {index + 1}
                    </Badge>
                    <span className="text-sm">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Key Points for Recording */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Recording Tips
              </h3>
              <ul className="space-y-2">
                {demo.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowDemoDialog(false)} 
                className="flex-1"
                size="lg"
              >
                Got It, Start Recording
              </Button>
              <Button 
                onClick={() => setShowDemoDialog(false)} 
                variant="outline"
                size="lg"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveRecorder;
