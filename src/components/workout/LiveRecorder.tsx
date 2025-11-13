import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Video, StopCircle, CheckCircle, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

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

const LiveRecorder = ({ activityName, onBack, onComplete }: LiveRecorderProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const [stage, setStage] = useState<'setup' | 'recording' | 'review'>('setup');
  const [isLoading, setIsLoading] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [currentTip, setCurrentTip] = useState(0);
  const [repCount, setRepCount] = useState(0);
  const [poseDetector, setPoseDetector] = useState<any>(null);

  const tips = WORKOUT_TIPS[activityName] || WORKOUT_TIPS['Push-ups'];

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
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Initialize MediaPipe
      await initMediaPipe();
      
      setIsLoading(false);
      toast.success('Camera ready!');
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Failed to access camera');
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

  const startRecording = async () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

    setStage('recording');
    setRecordingTime(0);
    setRepCount(0);
    chunksRef.current = [];
    startTimeRef.current = Date.now();

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    // Start recording canvas
    const canvasStream = canvas.captureStream(30);
    const recorder = new MediaRecorder(canvasStream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
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
  };

  const renderWithMediaPipe = async () => {
    if (!videoRef.current || !canvasRef.current || stage !== 'recording') return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d')!;

    const render = async () => {
      if (stage !== 'recording') return;

      // Draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Process with MediaPipe
      try {
        const { mediapipeProcessor } = await import('@/services/mediapipeProcessor');
        if (mediapipeProcessor.pose) {
          await mediapipeProcessor.pose.send({ image: video });
          
          // MediaPipe will call onResults callback which draws skeleton
          mediapipeProcessor.pose.onResults((results: any) => {
            if (results.poseLandmarks && stage === 'recording') {
              // Draw skeleton
              const mp = (window as any);
              if (mp.drawConnectors && mp.POSE_CONNECTIONS) {
                mp.drawConnectors(ctx, results.poseLandmarks, mp.POSE_CONNECTIONS, {
                  color: '#00FFFF',
                  lineWidth: 4
                });
                mp.drawLandmarks(ctx, results.poseLandmarks, {
                  color: '#FFFFFF',
                  fillColor: '#00FFFF',
                  radius: 5
                });
              }

              // Count reps
              if (poseDetector) {
                const repData = poseDetector.processFrame(results.poseLandmarks, recordingTime);
                if (repData && repData.count > repCount) {
                  setRepCount(repData.count);
                }
              }

              // Draw overlay
              drawOverlay(ctx);
            }
          });
        }
      } catch (e) {
        console.error('MediaPipe error:', e);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();
  };

  const drawOverlay = (ctx: CanvasRenderingContext2D) => {
    // Background for text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 100);

    // Rep count
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#00FF00';
    ctx.fillText(`Reps: ${repCount}`, 20, 50);

    // Time
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#FFFFFF';
    const mins = Math.floor(recordingTime / 60);
    const secs = recordingTime % 60;
    ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, 20, 85);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    toast.success('Recording stopped!');
  };

  const useRecording = () => {
    if (!recordedBlob) return;

    const results = {
      type: 'good',
      posture: 'Good' as const,
      setsCompleted: repCount,
      badSets: 0,
      duration: `${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`,
      videoBlob: recordedBlob,
      stats: {
        totalReps: repCount,
        correctReps: repCount,
        incorrectReps: 0,
        csvData: []
      }
    };

    onComplete(results);
  };

  const retryRecording = () => {
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
            {stage === 'recording' && (
              <Badge variant="destructive" className="animate-pulse px-3 py-1">
                <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                REC {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </Badge>
            )}
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

            {/* Setup Stage - Raw Video */}
            {stage === 'setup' && !isLoading && (
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                muted
                autoPlay
                style={{ transform: 'scaleX(-1)' }}
              />
            )}

            {/* Recording Stage - Canvas with MediaPipe */}
            {stage === 'recording' && (
              <>
                <video ref={videoRef} className="hidden" playsInline muted />
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </>
            )}

            {/* Review Stage - Recorded Video */}
            {stage === 'review' && recordedBlob && (
              <video
                src={URL.createObjectURL(recordedBlob)}
                className="w-full h-full object-contain"
                controls
                playsInline
                style={{ transform: 'scaleX(-1)' }}
              />
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
                  <span className="text-sm">Keep device steady</span>
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
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-bold">Recording Complete!</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-bold">{repCount}</div>
                  <p className="text-sm text-muted-foreground">Total Reps</p>
                </div>
                <div>
                  <div className="text-3xl font-bold">
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
    </div>
  );
};

export default LiveRecorder;
