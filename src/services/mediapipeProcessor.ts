import { getVideoDetectorForActivity, type VideoDetector } from './videoDetectors';
import { fixWebmDuration } from '@/utils/fixWebmDuration';

// Declare global MediaPipe types
declare global {
  interface Window {
    Pose: any;
    drawConnectors: any;
    drawLandmarks: any;
    POSE_CONNECTIONS: any;
  }
}

// Helper to get MediaPipe from either npm or CDN
function getMediaPipe() {
  // Check if loaded via CDN (global window object)
  if (typeof window !== 'undefined' && window.Pose) {
    console.log('Using MediaPipe from CDN (window.Pose)');
    return {
      Pose: window.Pose,
      drawConnectors: window.drawConnectors,
      drawLandmarks: window.drawLandmarks,
      POSE_CONNECTIONS: window.POSE_CONNECTIONS
    };
  }
  
  // Try npm package import
  try {
    const { Pose, POSE_CONNECTIONS } = require('@mediapipe/pose');
    const { drawConnectors, drawLandmarks } = require('@mediapipe/drawing_utils');
    console.log('Using MediaPipe from npm package');
    return { Pose, drawConnectors, drawLandmarks, POSE_CONNECTIONS };
  } catch (e) {
    console.error('MediaPipe not available:', e);
    throw new Error('MediaPipe library not loaded. Please refresh the page.');
  }
}

export interface RepData {
  count: number;
  timestamp: number;
  downTime?: number;
  upTime?: number;
  dipDuration?: number;
  angle?: number;
  minElbowAngle?: number;
  correct?: boolean;
  state?: string;
  jumpHeight?: number;
  airTime?: number;
}

export interface ProcessingResult {
  reps: RepData[];
  correctReps: number;
  incorrectReps: number;
  totalTime: number;
  posture: 'Good' | 'Bad';
  videoBlob?: Blob;
  stats: any;
  csvData: RepData[];
}

// Workout name mapping to match Python scripts
export const WORKOUT_MAPPING: { [key: string]: { video: string; live: string } } = {
  'Push-ups': { video: 'pushup_video', live: 'pushup_live' },
  'Pull-ups': { video: 'pullup_video', live: 'pullup_live' },
  'Sit-ups': { video: 'situp_video', live: 'situp_live' },
  'Vertical Jump': { video: 'verticaljump_video', live: 'verticaljump_live' },
  'Shuttle Run': { video: 'shuttlerun_video', live: 'shuttlerun_live' },
  'Sit Reach': { video: 'sitreach_video', live: '' },
  'Vertical Broad Jump': { video: 'verticalbroadjump_video', live: '' }
};

class MediaPipeProcessor {
  public pose: any = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private videoTrack: any = null;
  private processedFrames: ImageData[] = [];
  
  async initialize() {
    // Wait for MediaPipe to be available (if loading from CDN)
    if (typeof window !== 'undefined' && !window.Pose) {
      console.log('Waiting for MediaPipe to load from CDN...');
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (window.Pose) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(false);
        }, 10000);
      });
    }

    const mp = getMediaPipe();
    
    this.pose = new mp.Pose({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    this.pose.setOptions({
      modelComplexity: 1, // Match Python: model_complexity=1
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5, // Match Python: min_detection_confidence=0.5
      minTrackingConfidence: 0.5
    });

    return this.pose;
  }

  calculateAngle(a: any, b: any, c: any): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  }

  async createVideoFromFrames(frames: ImageData[], fps: number): Promise<Blob> {
    // Create a temporary canvas for rendering frames
    const tempCanvas = document.createElement('canvas');
    if (frames.length === 0) {
      return new Blob([], { type: 'video/webm' });
    }
    
    tempCanvas.width = frames[0].width;
    tempCanvas.height = frames[0].height;
    const tempCtx = tempCanvas.getContext('2d', { 
      alpha: false,
      desynchronized: true // Better performance
    })!;
    
    // Setup MediaRecorder with the temp canvas - HIGHER BITRATE for better quality
    const stream = tempCanvas.captureStream(fps);
    
    let options: MediaRecorderOptions;
    // Use higher bitrate (8 Mbps) for smoother video
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      options = { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8000000 };
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 8000000 };
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
      options = { mimeType: 'video/webm;codecs=h264', videoBitsPerSecond: 8000000 };
    } else {
      options = { mimeType: 'video/webm', videoBitsPerSecond: 8000000 };
    }
    
    const recorder = new MediaRecorder(stream, options);
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    // Start recording with smaller timeslice for smoother output
    recorder.start(100); // Collect data every 100ms
    
    // Render frames using requestAnimationFrame for smoother playback
    const frameDuration = 1000 / fps; // milliseconds per frame
    let frameIndex = 0;
    let lastFrameTime = performance.now();
    
    return new Promise((resolve) => {
      const renderFrame = (currentTime: number) => {
        if (frameIndex >= frames.length) {
          // All frames rendered, stop recording
          recorder.onstop = () => {
            const blob = new Blob(chunks, { type: options.mimeType || 'video/webm' });
            console.log('Video created:', blob.size, 'bytes', blob.type);
            resolve(blob);
          };
          recorder.stop();
          return;
        }
        
        // Check if enough time has passed for next frame
        const elapsed = currentTime - lastFrameTime;
        if (elapsed >= frameDuration) {
          // Render current frame
          tempCtx.putImageData(frames[frameIndex], 0, 0);
          
          if (frameIndex % 30 === 0) {
            console.log(`Rendering frame ${frameIndex}/${frames.length} to video...`);
          }
          
          frameIndex++;
          lastFrameTime = currentTime;
        }
        
        // Continue to next frame
        requestAnimationFrame(renderFrame);
      };
      
      // Start rendering
      requestAnimationFrame(renderFrame);
    });
  }

  async processVideo(
    videoFile: File,
    activityName: string,
    onProgress: (progress: number, frame: string, reps?: number, metrics?: any) => void
  ): Promise<ProcessingResult> {
    if (!this.pose) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.muted = true;
      
      // Create canvas for drawing
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d')!;
      
      // Use video detector instead of manual state management
      const detector = getVideoDetectorForActivity(activityName) as any;
      let frameCount = 0;
      let totalFrames = 0;
      let poseResultsReceived = 0;

      video.onloadedmetadata = () => {
        console.log('Video loaded:', video.videoWidth, 'x', video.videoHeight, 'Duration:', video.duration);
        
        if (!video.videoWidth || !video.videoHeight) {
          reject(new Error('Invalid video dimensions'));
          return;
        }
        
        if (!video.duration || !isFinite(video.duration) || video.duration === 0) {
          reject(new Error('Invalid video duration: ' + video.duration));
          return;
        }
        
        // Use moderate resolution for balance between speed and accuracy
        const scale = Math.min(1, 640 / video.videoWidth);
        this.canvas!.width = Math.floor(video.videoWidth * scale);
        this.canvas!.height = Math.floor(video.videoHeight * scale);
        const fps = 30; // Target 30fps like Python
        totalFrames = Math.floor(video.duration * fps);
        
        console.log('Processing at:', this.canvas!.width, 'x', this.canvas!.height);
        console.log('Total frames to process:', totalFrames);
        
        // Don't use MediaRecorder - we'll collect frames and create video at the end
        this.processedFrames = [];
        console.log('Starting video processing (frame-by-frame)...');
        
        // DON'T play the video - we'll manually seek through frames
        video.currentTime = 0;
        processingStarted = true;
      };
      
      video.onplay = () => {
        console.log('Video is now playing');
      };
      
      video.onended = () => {
        console.log('Video playback ended naturally');
        // Don't do anything here - let processFrame handle it
      };
      
      video.onerror = (e) => {
        console.error('Video error event:', e);
        reject(new Error('Video loading failed'));
      };

      let lastFrameDataUrl = '';
      let safetyTimeout: NodeJS.Timeout;
      
      let processingStarted = false;
      let isProcessingFrame = false;
      
      const processFrame = async () => {
        // Don't start until canvas is ready
        if (!this.canvas || !this.ctx || !processingStarted) {
          requestAnimationFrame(processFrame);
          return;
        }
        
        // Check if we're done processing all frames
        if (frameCount >= totalFrames || video.currentTime >= video.duration) {
          console.log('Video processing complete!');
          console.log('  Frames processed:', frameCount);
          console.log('  Total frames collected:', this.processedFrames.length);
          console.log('  Duration:', video.duration);
          
          // Get final reps from detector
          const finalReps = detector.getReps ? detector.getReps() : [];
          console.log('Total reps detected:', finalReps.length);
          
          // Get actual video duration
          const actualDuration = video.duration && isFinite(video.duration) ? video.duration : video.currentTime;
          console.log('Video duration:', actualDuration, 'seconds');
          
          // Create video from collected frames
          console.log('Creating video from', this.processedFrames.length, 'frames...');
          const videoBlob = await this.createVideoFromFrames(this.processedFrames, 30);
          console.log('Created video blob:', videoBlob.size, 'bytes');
          
          clearTimeout(safetyTimeout);
          console.log('Processing complete - Reps:', finalReps.length, 'Duration:', actualDuration);
          const result = this.calculateStats(finalReps, activityName, actualDuration, videoBlob);
          resolve(result);
          return;
        }

        // Skip if already processing a frame (wait for MediaPipe)
        if (isProcessingFrame) {
          setTimeout(() => processFrame(), 10);
          return;
        }

        isProcessingFrame = true;
        frameCount++;
        
        // Seek to next frame (30fps)
        const targetTime = frameCount / 30;
        video.currentTime = Math.min(targetTime, video.duration);
        
        // Wait for video to seek
        await new Promise<void>((resolveSeeked) => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            resolveSeeked();
          };
          video.addEventListener('seeked', onSeeked);
          setTimeout(() => {
            video.removeEventListener('seeked', onSeeked);
            resolveSeeked();
          }, 100);
        });

        const currentTime = video.currentTime;
        const progress = Math.min((currentTime / video.duration) * 100, 99);

        if (frameCount === 1) {
          console.log('Processing first frame');
        }
        
        if (frameCount % 30 === 0) {
          console.log('Frame:', frameCount, '/', totalFrames, 'Time:', currentTime.toFixed(2), '/', video.duration.toFixed(2), 'Progress:', progress.toFixed(1) + '%', 'Reps:', detector.getReps ? detector.getReps().length : 0, 'Stored frames:', this.processedFrames.length);
        }

        // Draw video frame to canvas
        this.ctx!.drawImage(video, 0, 0, this.canvas!.width, this.canvas!.height);

        // Process with MediaPipe and WAIT for result
        if (this.pose) {
          try {
            await this.pose.send({ image: video });
            // Wait a bit for onResults to be called
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (err) {
            console.error('MediaPipe processing error:', err);
          }
        }

        // Send progress update
        const currentReps = detector.getReps ? detector.getReps() : [];
        const correctCount = currentReps.filter((r: any) => r.correct === 'True' || r.correct === true).length;
        const currentAngle = detector.getCurrentAngle ? detector.getCurrentAngle() : undefined;
        const dipTime = detector.getDipTime ? detector.getDipTime(currentTime) : 0;
        
        const metrics = {
          correctCount,
          incorrectCount: currentReps.length - correctCount,
          minAngle: currentAngle,
          currentTime: currentTime,
          dipTime: dipTime
        };
        
        // Send progress updates with skeleton-annotated frame
        if (frameCount % 5 === 0) {
          onProgress(progress, lastCapturedFrame || '', currentReps.length, metrics);
        }

        isProcessingFrame = false;
        
        // Continue to next frame immediately (no delay - process as fast as possible)
        processFrame();
      };

      let lastCapturedFrame = '';
      let isDrawing = false; // Prevent overlapping draws
      
      this.pose!.onResults((results: Results) => {
        poseResultsReceived++;
        
        if (poseResultsReceived === 1) {
          console.log('✅ First pose result received');
          console.log('Detector type:', detector.constructor.name);
          console.log('Activity:', activityName);
        }
        
        // Skip if already drawing (prevents backlog)
        if (isDrawing) {
          return;
        }
        
        isDrawing = true;
        
        // Process with video detector
        let reps: any[] = [];
        let currentAngle = 0;
        let state = 'up';
        let dipTime = 0;
        
        if (results.poseLandmarks) {
          // Process frame with detector
          reps = detector.process(results.poseLandmarks, video.currentTime);
          
          // Get current state and angle from detector
          if (typeof detector.getState === 'function') {
            state = detector.getState();
          }
          if (typeof detector.getCurrentAngle === 'function') {
            currentAngle = detector.getCurrentAngle();
          }
          if (typeof detector.getDipTime === 'function') {
            dipTime = detector.getDipTime(video.currentTime);
          }
          
          // Log when reps are detected
          if (reps.length > 0 && reps.length !== (window as any).lastRepCount) {
            console.log('✅ Rep detected! Total:', reps.length);
            (window as any).lastRepCount = reps.length;
          }
          
          // Log every 30 frames for debugging
          if (poseResultsReceived % 30 === 0) {
            console.log(`Frame ${poseResultsReceived}: angle=${currentAngle.toFixed(1)}° state=${state} reps=${reps.length}`);
          }
        } else {
          if (poseResultsReceived % 30 === 0) {
            console.warn('No pose landmarks detected in frame');
          }
        }
        
        // Draw with updated metrics (EXACTLY like Python)
        const correctCount = reps.filter(r => r.correct === true || r.correct === 'True').length;
        const incorrectCount = reps.length - correctCount;
        this.drawResults(
          results, 
          activityName, 
          reps.length, 
          state, 
          currentAngle,
          correctCount,
          incorrectCount,
          video.currentTime,
          dipTime
        );
        
        // Capture frame AFTER drawing skeleton (for preview - every 10th frame)
        if (poseResultsReceived % 10 === 0 || poseResultsReceived === 1) {
          try {
            lastCapturedFrame = this.canvas!.toDataURL('image/jpeg', 0.5);
          } catch (err) {
            console.error('Error capturing frame:', err);
          }
        }
        
        // Store processed frame for video creation
        if (this.ctx && this.canvas) {
          try {
            const frameData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.processedFrames.push(frameData);
          } catch (err) {
            console.error('Error storing frame:', err);
          }
        }
        
        isDrawing = false;
      });

      video.onerror = (e) => {
        console.error('Video error event:', e);
        reject(new Error('Video loading failed'));
      };
      
      // Add timeout to prevent infinite processing
      const timeout = setTimeout(() => {
        console.error('Processing timeout - video may be stuck');
        if (!video.paused && !video.ended) {
          video.pause();
        }
      }, 120000); // 2 minute timeout
      
      // Clear timeout when done
      const originalResolve = resolve;
      resolve = (result: any) => {
        clearTimeout(timeout);
        originalResolve(result);
      };
      
      // Start processing loop (will wait for canvas to be ready)
      processFrame();
      
      // Safety timeout - if processing takes too long, force completion
      const maxProcessingTime = Math.max((video.duration || 60) * 5000, 300000); // 5x video duration or 5 minutes minimum
      safetyTimeout = setTimeout(() => {
        console.warn('Processing timeout - forcing completion after', maxProcessingTime / 1000, 'seconds');
        
        // Get final reps from detector
        const finalReps = detector.getReps ? detector.getReps() : [];
        const actualDuration = video.duration && isFinite(video.duration) ? video.duration : video.currentTime;
        
        console.log('Timeout triggered - Reps:', finalReps.length, 'Duration:', actualDuration, 'Frames:', this.processedFrames.length);
        
        // Create video from collected frames
        this.createVideoFromFrames(this.processedFrames, 30).then(videoBlob => {
          const result = this.calculateStats(finalReps, activityName, actualDuration, videoBlob);
          resolve(result);
        }).catch(err => {
          console.error('Error creating video:', err);
          const emptyBlob = new Blob([], { type: 'video/webm' });
          const result = this.calculateStats(finalReps, activityName, actualDuration, emptyBlob);
          resolve(result);
        });
      }, maxProcessingTime);
    });
  }

  private drawResults(results: any, activityName: string, repCount: number, state: string, currentAngle?: number, correctCount?: number, incorrectCount?: number, currentTime?: number, dipTime?: number) {
    if (!this.ctx || !this.canvas) return;

    // Get MediaPipe drawing functions
    const mp = getMediaPipe();

    // Draw landmarks and connections (EXACTLY like Python with mp_draw)
    if (results.poseLandmarks) {
      // Draw connections in cyan/blue like Python
      mp.drawConnectors(this.ctx, results.poseLandmarks, mp.POSE_CONNECTIONS, {
        color: '#00FFFF',
        lineWidth: 2
      });
      // Draw landmarks in white/cyan like Python
      mp.drawLandmarks(this.ctx, results.poseLandmarks, {
        color: '#FFFFFF',
        fillColor: '#00FFFF',
        radius: 3
      });
    }

    // Draw metrics overlay EXACTLY matching Python script
    this.ctx.font = 'bold 28px Arial';
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#000000';
    
    // 1. Angle display (Green) - Position: (10, 30)
    if (currentAngle !== undefined) {
      this.ctx.fillStyle = '#00FF00';
      const angleText = `Elbow: ${Math.round(currentAngle)}`;
      this.ctx.strokeText(angleText, 10, 30);
      this.ctx.fillText(angleText, 10, 30);
    }
    
    // 2. Rep counter (Cyan) - Position: (10, 60)
    this.ctx.fillStyle = '#00FFFF';
    const repText = `${activityName}: ${repCount}`;
    this.ctx.strokeText(repText, 10, 60);
    this.ctx.fillText(repText, 10, 60);
    
    // 3. State (Yellow/Green based on state) - Position: (10, 95)
    this.ctx.fillStyle = state === 'down' ? '#00FF00' : '#C8C800';
    const stateText = `State: ${state}`;
    this.ctx.strokeText(stateText, 10, 95);
    this.ctx.fillText(stateText, 10, 95);
    
    // 4. Dip time (Red) - Position: (10, 130) - ONLY show during down state
    if (dipTime !== undefined && dipTime > 0) {
      this.ctx.fillStyle = '#FF0000';
      const dipText = `Dip: ${dipTime.toFixed(3)}s`;
      this.ctx.strokeText(dipText, 10, 130);
      this.ctx.fillText(dipText, 10, 130);
    }
    
    // 5. Correct count (Green) - Position: (10, 160)
    if (correctCount !== undefined) {
      this.ctx.fillStyle = '#00FF00';
      const correctText = `Correct: ${correctCount}`;
      this.ctx.strokeText(correctText, 10, 160);
      this.ctx.fillText(correctText, 10, 160);
    }
    
    // 6. Bad count (Red) - Position: (10, 190)
    if (incorrectCount !== undefined) {
      this.ctx.fillStyle = '#0000FF'; // Blue-ish red (BGR in Python = RGB here)
      const incorrectText = `Bad: ${incorrectCount}`;
      this.ctx.strokeText(incorrectText, 10, 190);
      this.ctx.fillText(incorrectText, 10, 190);
    }
    
    // 7. Time (Yellow) - Position: (10, 220)
    if (currentTime !== undefined) {
      this.ctx.fillStyle = '#FFFF00';
      const timeText = `Time: ${currentTime.toFixed(1)}s`;
      this.ctx.strokeText(timeText, 10, 220);
      this.ctx.fillText(timeText, 10, 220);
    }
  }



  private calculateStats(reps: any[], activityName: string, duration: number, videoBlob: Blob): ProcessingResult {
    const correctReps = reps.filter(r => r.correct === 'True' || r.correct === true).length;
    const incorrectReps = reps.length - correctReps;
    const posture: 'Good' | 'Bad' = correctReps >= reps.length * 0.7 ? 'Good' : 'Bad';

    // Calculate activity-specific stats
    let stats: any = {
      totalReps: reps.length,
      correctReps,
      incorrectReps,
      posture,
      totalTime: duration,
      avgRepDuration: reps.length > 0 ? duration / reps.length : 0,
      csvData: reps // Include CSV data for display
    };

    // Add activity-specific metrics
    if (activityName.includes('Push') || activityName.includes('Pull') || activityName.includes('Sit')) {
      const angles = reps.map(r => r.min_elbow_angle).filter(a => a !== undefined) as number[];
      if (angles.length > 0) {
        stats.minElbowAngle = Math.min(...angles);
        stats.maxElbowAngle = Math.max(...angles);
        stats.avgElbowAngle = angles.reduce((a, b) => a + b, 0) / angles.length;
      }
      
      const durations = reps.map(r => r.dip_duration_sec).filter(d => d !== undefined) as number[];
      if (durations.length > 0) {
        stats.avgDipDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        stats.avgRepDuration = stats.avgDipDuration;
      }
    }

    if (activityName.includes('Jump')) {
      const heights = reps.map(r => r.jump_height_m).filter(h => h !== undefined) as number[];
      if (heights.length > 0) {
        stats.maxJumpHeight = Math.max(...heights);
        stats.avgJumpHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
      }
      
      const airTimes = reps.map(r => r.air_time_s).filter(t => t !== undefined) as number[];
      if (airTimes.length > 0) {
        stats.avgAirTime = airTimes.reduce((a, b) => a + b, 0) / airTimes.length;
      }
    }

    if (activityName.includes('Reach')) {
      const reaches = reps.map(r => r.reach_m).filter(r => r !== undefined) as number[];
      if (reaches.length > 0) {
        stats.maxReach = Math.max(...reaches);
      }
    }

    return {
      reps,
      correctReps,
      incorrectReps,
      totalTime: duration,
      posture,
      videoBlob,
      stats,
      csvData: reps
    };
  }

  async processLiveCamera(
    videoElement: HTMLVideoElement,
    activityName: string,
    onFrame: (canvas: HTMLCanvasElement, reps: RepData[], stats: any) => void,
    onComplete: () => void
  ): Promise<void> {
    if (!this.pose) {
      await this.initialize();
    }

    // Create canvas for drawing
    this.canvas = document.createElement('canvas');
    this.canvas.width = videoElement.videoWidth || 640;
    this.canvas.height = videoElement.videoHeight || 480;
    this.ctx = this.canvas.getContext('2d')!;

    // Use video detector
    const detector = getVideoDetectorForActivity(activityName) as any;
    const startTime = Date.now();
    let isProcessing = true;
    let frameCount = 0;

    // Setup pose results handler FIRST
    this.pose!.onResults((results: Results) => {
      // Draw video frame first
      if (this.ctx && this.canvas) {
        this.ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);
      }

      // Process with detector
      let reps: any[] = [];
      let currentAngle = 0;
      let state = 'up';
      
      if (results.poseLandmarks) {
        const currentTime = (Date.now() - startTime) / 1000;
        reps = detector.process(results.poseLandmarks, currentTime);
        
        if (typeof detector.getState === 'function') {
          state = detector.getState();
        }
        if (typeof detector.getCurrentAngle === 'function') {
          currentAngle = detector.getCurrentAngle();
        }
      }
      
      // Draw skeleton overlay
      const correctCount = reps.filter(r => r.correct === 'True' || r.correct === true).length;
      const incorrectCount = reps.length - correctCount;
      this.drawResults(
        results,
        activityName,
        reps.length,
        state,
        currentAngle,
        correctCount,
        incorrectCount,
        (Date.now() - startTime) / 1000
      );

      // Call frame callback with updated canvas
      onFrame(this.canvas!, reps, {
        correctCount,
        incorrectCount,
        currentTime: (Date.now() - startTime) / 1000,
        state
      });
    });

    // Processing loop
    const processFrame = async () => {
      if (!isProcessing || !videoElement || videoElement.readyState < 2) {
        if (!isProcessing) {
          onComplete();
        }
        return;
      }

      frameCount++;
      
      // Send frame to MediaPipe (throttle to ~30fps)
      if (frameCount % 2 === 0) {
        try {
          await this.pose!.send({ image: videoElement });
        } catch (error) {
          console.error('MediaPipe processing error:', error);
        }
      }

      requestAnimationFrame(processFrame);
    };

    // Start processing
    processFrame();

    // Return a function to stop processing
    return new Promise((resolve) => {
      (window as any).stopLiveProcessing = () => {
        isProcessing = false;
        resolve();
      };
    });
  }

  cleanup() {
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    if (this.canvas) {
      this.canvas = null;
    }
    this.ctx = null;
    if ((window as any).stopLiveProcessing) {
      (window as any).stopLiveProcessing();
      delete (window as any).stopLiveProcessing;
    }
  }
}

export const mediapipeProcessor = new MediaPipeProcessor();
