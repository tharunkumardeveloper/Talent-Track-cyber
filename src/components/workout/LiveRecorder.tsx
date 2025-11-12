import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Video, StopCircle, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { mediapipeProcessor } from '@/services/mediapipeProcessor';

interface LiveRecorderProps {
  activityName: string;
  onBack: () => void;
  onComplete: (results: any) => void;
}

// Workout-specific tips and suggestions
const WORKOUT_TIPS: { [key: string]: string[] } = {
  'Push-ups': [
    '💪 Keep your body in a straight line',
    '👀 Look slightly ahead, not down',
    '🔽 Lower until chest nearly touches ground',
    '⬆️ Push up explosively',
    '🫁 Breathe out as you push up',
    '✋ Hands shoulder-width apart'
  ],
  'Pull-ups': [
    '💪 Start from dead hang',
    '👆 Pull until chin clears bar',
    '📏 Full range of motion',
    '🚫 No swinging or kipping',
    '🫁 Breathe out as you pull up',
    '⬇️ Control the descent'
  ],
  'Sit-ups': [
    '🦵 Keep knees bent at 90°',
    '🙌 Arms across chest',
    '⬆️ Curl up to touch knees',
    '⬇️ Lower with control',
    '🫁 Exhale on the way up',
    '💪 Engage your core'
  ],
  'Vertical Jump': [
    '🦵 Bend knees for power',
    '🙌 Swing arms upward',
    '🚀 Explode upward',
    '🎯 Land softly',
    '⚖️ Keep balance',
    '🔄 Reset between jumps'
  ],
  'Shuttle Run': [
    '🏃 Sprint at full speed',
    '🔄 Turn explosively',
    '👟 Stay on your toes',
    '💨 Maintain momentum',
    '🎯 Touch the line',
    '⚡ Quick direction changes'
  ]
};

const LiveRecorder = ({ activityName, onBack, onComplete }: LiveRecorderProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [stage, setStage] = useState<'preview' | 'recording' | 'review'>('preview');
  const [currentReps, setCurrentReps] = useState(0);
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [currentTip, setCurrentTip] = useState(0);
  const [formFeedback, setFormFeedback] = useState<string>('');
  
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tipIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const allRepsRef = useRef<any[]>([]);

  // Get tips for current workout
  const tips = WORKOUT_TIPS[activityName] || WORKOUT_TIPS['Push-ups'];

  // Start camera and MediaPipe preview
  useEffect(() => {
    startCamera();
    return () => {
      cleanup();
    };
  }, []);

  // Rotate tips during preview
  useEffect(() => {
    if (stage === 'preview') {
      tipIntervalRef.current = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % tips.length);
      }, 3000);
    }
    return () => {
      if (tipIntervalRef.current) {
        clearInterval(tipIntervalRef.current);
      }
    };
  }, [stage, tips.length]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        
        // Initialize MediaPipe
        await mediapipeProcessor.initialize();
        
        // Start preview with MediaPipe
        startPreview();
      }
      
      toast.success('Camera ready! Position yourself in frame');
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Failed to access camera. Please check permissions.');
    }
  };

  const startPreview = () => {
    if (!videoRef.current || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext('2d')!;

    const renderPreview = async () => {
      if (stage !== 'preview' || !video || !canvas) return;

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Process with MediaPipe for skeleton overlay
      try {
        await mediapipeProcessor.pose?.send({ image: video });
      } catch (e) {
        console.error('MediaPipe error:', e);
      }

      animationFrameRef.current = requestAnimationFrame(renderPreview);
    };

    // Setup MediaPipe results callback
    if (mediapipeProcessor.pose) {
      mediapipeProcessor.pose.onResults((results: any) => {
        if (stage === 'preview' && results.poseLandmarks) {
          // Draw skeleton on preview
          const mp = (window as any);
          if (mp.drawConnectors && mp.drawLandmarks) {
            mp.drawConnectors(ctx, results.poseLandmarks, mp.POSE_CONNECTIONS, {
              color: '#00FF00',
              lineWidth: 2
            });
            mp.drawLandmarks(ctx, results.poseLandmarks, {
              color: '#FFFFFF',
              fillColor: '#00FF00',
              radius: 3
            });
          }
        }
      });
    }

    renderPreview();
  };

  const startRecording = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setStage('recording');
    setRecordingTime(0);
    setCurrentReps(0);
    recordedChunksRef.current = [];
    allRepsRef.current = [];

    // Stop preview animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext('2d')!;

    // Setup MediaRecorder
    const canvasStream = canvas.captureStream(30);
    const recorder = new MediaRecorder(canvasStream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setStage('review');
    };

    mediaRecorderRef.current = recorder;
    recorder.start(100);

    // Start recording timer
    const startTime = Date.now();
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Start MediaPipe processing with rep counting
    const detector = (await import('@/services/videoDetectors')).getVideoDetectorForActivity(activityName);
    
    const renderRecording = async () => {
      if (stage !== 'recording' || !video || !canvas) return;

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Process with MediaPipe
      try {
        await mediapipeProcessor.pose?.send({ image: video });
      } catch (e) {
        console.error('MediaPipe error:', e);
      }

      animationFrameRef.current = requestAnimationFrame(renderRecording);
    };

    // Setup MediaPipe results callback for recording
    if (mediapipeProcessor.pose) {
      mediapipeProcessor.pose.onResults((results: any) => {
        if (stage === 'recording' && results.poseLandmarks) {
          // Draw skeleton
          const mp = (window as any);
          if (mp.drawConnectors && mp.drawLandmarks) {
            mp.drawConnectors(ctx, results.poseLandmarks, mp.POSE_CONNECTIONS, {
              color: '#00FFFF',
              lineWidth: 2
            });
            mp.drawLandmarks(ctx, results.poseLandmarks, {
              color: '#FFFFFF',
              fillColor: '#00FFFF',
              radius: 3
            });
          }

          // Process rep counting
          const repData = detector.processFrame(results.poseLandmarks, recordingTime);
          if (repData) {
            setCurrentReps(repData.count);
            setCurrentMetrics(repData);
            
            // Store rep data
            if (repData.count > allRepsRef.current.length) {
              allRepsRef.current.push(repData);
            }

            // Provide form feedback
            if (repData.correct === false) {
              setFormFeedback('⚠️ Check your form!');
            } else if (repData.correct === true) {
              setFormFeedback('✅ Good form!');
            }
          }

          // Draw metrics on canvas
          ctx.font = 'bold 32px Arial';
          ctx.fillStyle = '#00FF00';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          
          // Rep count
          const repText = `${activityName.includes('Jump') ? 'Jumps' : 'Reps'}: ${currentReps}`;
          ctx.strokeText(repText, 20, 50);
          ctx.fillText(repText, 20, 50);

          // Time
          const timeText = `Time: ${recordingTime}s`;
          ctx.strokeText(timeText, 20, 90);
          ctx.fillText(timeText, 20, 90);

          // Form feedback
          if (formFeedback) {
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = formFeedback.includes('✅') ? '#00FF00' : '#FFFF00';
            ctx.strokeText(formFeedback, 20, 130);
            ctx.fillText(formFeedback, 20, 130);
          }
        }
      });
    }

    renderRecording();
    toast.success('Recording started! Start your workout');
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    toast.success('Recording stopped! Review your workout');
  };

  const processRecording = () => {
    if (!recordedBlob) return;

    // Create results object
    const correctReps = allRepsRef.current.filter(r => r.correct !== false).length;
    const totalReps = allRepsRef.current.length;
    
    const results = {
      type: correctReps >= totalReps * 0.7 ? 'good' : 'bad',
      posture: correctReps >= totalReps * 0.7 ? 'Good' : 'Bad',
      setsCompleted: totalReps,
      badSets: totalReps - correctReps,
      duration: `${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`,
      videoBlob: recordedBlob,
      stats: {
        totalReps,
        correctReps,
        incorrectReps: totalReps - correctReps,
        csvData: allRepsRef.current
      }
    };

    onComplete(results);
  };

  const retryRecording = () => {
    setStage('preview');
    setRecordedBlob(null);
    setCurrentReps(0);
    setRecordingTime(0);
    recordedChunksRef.current = [];
    allRepsRef.current = [];
    startPreview();
  };

  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    if (tipIntervalRef.current) {
      clearInterval(tipIntervalRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    mediapipeProcessor.cleanup();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-subtle border-b safe-top">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-3 max-w-4xl mx-auto">
            <Button variant="ghost" size="sm" onClick={onBack} className="tap-target">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Live Workout</h1>
              <p className="text-sm text-muted-foreground">{activityName}</p>
            </div>
            {stage === 'recording' && (
              <Badge variant="destructive" className="animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                REC {formatTime(recordingTime)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-20 max-w-4xl mx-auto pt-6 space-y-6">
        {/* Camera Preview/Recording */}
        <Card className="card-elevated overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-video bg-black">
              {/* Hidden video element */}
              <video
                ref={videoRef}
                className="hidden"
                playsInline
                muted
              />
              
              {/* Preview canvas (with MediaPipe skeleton) */}
              {stage === 'preview' && (
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-full object-contain"
                />
              )}
              
              {/* Recording canvas (with MediaPipe skeleton + metrics) */}
              {stage === 'recording' && (
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain"
                />
              )}
              
              {/* Review video */}
              {stage === 'review' && recordedBlob && (
                <video
                  src={URL.createObjectURL(recordedBlob)}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                />
              )}

              {/* Stage indicator */}
              <div className="absolute top-4 left-4">
                <Badge className="bg-black/60 text-white border-white/20">
                  {stage === 'preview' && '👁️ Preview'}
                  {stage === 'recording' && '🔴 Recording'}
                  {stage === 'review' && '📹 Review'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips / Metrics / Review */}
        {stage === 'preview' && (
          <Card className="card-elevated bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Form Tips</h3>
                  <p className="text-lg font-medium text-primary animate-fade-in">
                    {tips[currentTip]}
                  </p>
                  <div className="flex gap-1 mt-3">
                    {tips.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i === currentTip ? 'bg-primary' : 'bg-primary/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === 'recording' && (
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">{currentReps}</div>
                  <p className="text-sm text-muted-foreground">
                    {activityName.includes('Jump') ? 'Jumps' : 'Reps'}
                  </p>
                </div>
                <div>
                  <div className="text-3xl font-bold">{formatTime(recordingTime)}</div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-500">
                    {currentMetrics?.correct !== false ? '✓' : '⚠'}
                  </div>
                  <p className="text-sm text-muted-foreground">Form</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === 'review' && (
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-bold">Recording Complete!</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{currentReps}</div>
                    <p className="text-sm text-muted-foreground">Total Reps</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatTime(recordingTime)}</div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Review your workout above, then process to see detailed analysis
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {stage === 'preview' && (
            <Button
              onClick={startRecording}
              className="w-full h-14 text-lg"
              size="lg"
            >
              <Video className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
          )}

          {stage === 'recording' && (
            <Button
              onClick={stopRecording}
              variant="destructive"
              className="w-full h-14 text-lg"
              size="lg"
            >
              <StopCircle className="w-5 h-5 mr-2" />
              Stop Recording
            </Button>
          )}

          {stage === 'review' && (
            <>
              <Button
                onClick={processRecording}
                className="w-full h-14 text-lg"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Process & Analyze
              </Button>
              <Button
                onClick={retryRecording}
                variant="outline"
                className="w-full"
              >
                Record Again
              </Button>
            </>
          )}
        </div>

        {/* Info */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-sm text-center text-muted-foreground">
            {stage === 'preview' && '💡 Position yourself so your full body is visible in frame'}
            {stage === 'recording' && '🎯 AI is tracking your form in real-time'}
            {stage === 'review' && '📊 Processing will generate detailed analysis and metrics'}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveRecorder;
