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
  'Modified Shuttle Run': { video: 'shuttlerun_video', live: 'shuttlerun_live' }, // Same as Shuttle Run
  'Sit Reach': { video: 'sitreach_video', live: 'sitreach_live' },
  'Vertical Broad Jump': { video: 'verticalbroadjump_video', live: 'verticalbroadjump_live' },
  'Standing Broad Jump': { video: 'verticalbroadjump_video', live: 'verticalbroadjump_live' }
};

class MediaPipeProcessor {
  public pose: any = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private videoTrack: any = null;
  private processedFrames: ImageData[] = [];
  private cancelProcessing = false;

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

  async createVideoFromFrames(frames: ImageData[], fps: number, actualDuration?: number): Promise<Blob> {
    if (frames.length === 0) {
      return new Blob([], { type: 'video/webm' });
    }

    console.log(`Creating video: ${frames.length} frames at ${fps.toFixed(2)}fps`);
    console.log(`Target duration: ${actualDuration?.toFixed(2)}s`);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = frames[0].width;
    tempCanvas.height = frames[0].height;
    const tempCtx = tempCanvas.getContext('2d', { alpha: false })!;

    // Manual capture with 0 fps for precise control
    const stream = tempCanvas.captureStream(0);
    const track = stream.getVideoTracks()[0] as any;

    // Good bitrate for quality
    let options: MediaRecorderOptions;
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 5000000 };
    } else {
      options = { mimeType: 'video/webm', videoBitsPerSecond: 5000000 };
    }

    const recorder = new MediaRecorder(stream, options);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.start();

    return new Promise((resolve) => {
      let frameIndex = 0;
      // CRITICAL: Calculate frame duration based on actual duration, not FPS
      // This ensures the video plays at the correct speed
      const totalDurationMs = actualDuration ? actualDuration * 1000 : (frames.length / fps) * 1000;
      const frameDuration = totalDurationMs / frames.length;
      const startTime = performance.now();
      
      console.log(`Frame duration: ${frameDuration.toFixed(2)}ms per frame`);

      // Use setInterval for consistent timing
      const interval = setInterval(() => {
        if (frameIndex >= frames.length) {
          clearInterval(interval);

          // Wait for encoder to finish
          setTimeout(() => {
            recorder.onstop = async () => {
              const blob = new Blob(chunks, { type: options.mimeType || 'video/webm' });
              console.log(`Video blob: ${blob.size} bytes`);

              // CRITICAL: Use actual duration from original video to maintain speed
              // This ensures the output video plays at the same speed as the input
              const duration = actualDuration ? actualDuration * 1000 : (frames.length / fps) * 1000;
              console.log(`Setting video duration to ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
              console.log(`This will result in ${(frames.length / (duration / 1000)).toFixed(2)} fps playback`);
              
              const fixedBlob = await fixWebmDuration(blob, duration);
              console.log(`✅ Output video will play at original speed`);
              resolve(fixedBlob);
            };
            recorder.stop();
          }, 300);
          return;
        }

        // Draw frame
        tempCtx.putImageData(frames[frameIndex], 0, 0);

        // Request frame capture
        if (track.requestFrame) {
          track.requestFrame();
        }

        if (frameIndex % 30 === 0) {
          const elapsed = performance.now() - startTime;
          const expectedTime = (frameIndex / fps) * 1000;
          const drift = elapsed - expectedTime;
          console.log(`Rendering frame ${frameIndex}/${frames.length} (drift: ${drift.toFixed(0)}ms)`);
        }

        frameIndex++;
      }, frameDuration);
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

    // Reset cancel flag
    this.cancelProcessing = false;

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
      let originalFPS = 30; // Default to 30fps, will try to detect actual FPS

      video.onloadedmetadata = () => {
        console.log('✅ Video metadata loaded');
        console.log('  Dimensions:', video.videoWidth, 'x', video.videoHeight);
        console.log('  Duration:', video.duration, 'seconds');
        console.log('  Ready state:', video.readyState);

        if (!video.videoWidth || !video.videoHeight) {
          console.error('❌ Invalid video dimensions:', video.videoWidth, video.videoHeight);
          reject(new Error('Invalid video dimensions'));
          return;
        }

        if (!video.duration || !isFinite(video.duration) || video.duration === 0) {
          console.error('❌ Invalid video duration:', video.duration);
          reject(new Error('Invalid video duration: ' + video.duration));
          return;
        }

        // Use 640p for good quality
        const targetWidth = 640;
        const scale = Math.min(1, targetWidth / video.videoWidth);
        this.canvas!.width = Math.floor(video.videoWidth * scale);
        this.canvas!.height = Math.floor(video.videoHeight * scale);
        
        // Try to detect original FPS, default to 30 if not available
        originalFPS = 30; // Most videos are 30fps
        totalFrames = Math.floor(video.duration * originalFPS);

        console.log('Processing at:', this.canvas!.width, 'x', this.canvas!.height);
        console.log('Target FPS:', originalFPS);
        console.log('Total frames to process:', totalFrames);

        // Don't use MediaRecorder - we'll collect frames and create video at the end
        this.processedFrames = [];
        console.log('Starting video processing (frame-by-frame)...');

        // Use normal playback rate for smooth processing
        // The browser will naturally throttle to ~30fps which is perfect
        video.playbackRate = 1.0;
        video.currentTime = 0;
        processingStarted = true;

        // Process every frame for accurate output
        skipEveryNFrames = 1;

        console.log(`📹 Video duration: ${video.duration.toFixed(1)}s`);
        console.log(`⚡ Processing at normal speed with 30fps target`);

        // Start playing
        video.play().then(() => {
          console.log('✅ Video playback started successfully');
        }).catch(err => {
          console.error('❌ Error playing video:', err);
          console.error('This might be due to browser autoplay restrictions');
          reject(new Error('Failed to play video: ' + err.message));
        });
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

      let lastCapturedFrame = '';
      let safetyTimeout: NodeJS.Timeout;
      let processingStarted = false;
      let lastProcessTime = -1;
      let isProcessing = false;
      const targetFPS = 30;
      
      // For very long videos (>2 min), process every other frame to speed up
      // This is safe because reps take multiple frames
      let frameSkipCounter = 0;
      let skipEveryNFrames = 1; // Process every frame by default

      // Process frames as video plays naturally (like Python's cap.read())
      const processFrame = async () => {
        // Check for cancellation
        if (this.cancelProcessing) {
          console.log('⚠️ Processing cancelled by user');
          video.pause();
          clearTimeout(safetyTimeout);
          reject(new Error('Processing cancelled'));
          return;
        }
        
        if (!this.canvas || !this.ctx || !processingStarted) {
          requestAnimationFrame(processFrame);
          return;
        }

        // Check if video ended
        if (video.ended || video.currentTime >= video.duration) {
          console.log('✅ Video processing complete!');
          console.log('  Video duration:', video.duration.toFixed(2), 'seconds');
          console.log('  Frames collected:', this.processedFrames.length);
          console.log('  Expected frames:', Math.floor(video.duration * originalFPS));
          console.log('  Frame rate:', (this.processedFrames.length / video.duration).toFixed(2), 'fps');

          const finalReps = detector.getReps ? detector.getReps() : [];
          const actualDuration = video.duration;

          // Verify we have enough frames
          const minExpectedFrames = Math.floor(video.duration * 15); // At least 15fps
          if (this.processedFrames.length < minExpectedFrames) {
            console.warn(`⚠️ Only collected ${this.processedFrames.length} frames, expected at least ${minExpectedFrames}`);
          }

          // CRITICAL: Calculate the exact playback FPS needed to match original duration
          // If we collected 250 frames over 10 seconds, we need to play at 25fps to get 10s duration
          const playbackFPS = this.processedFrames.length / actualDuration;
          
          console.log(`📹 Original video: ${actualDuration.toFixed(2)}s`);
          console.log(`📊 Frames collected: ${this.processedFrames.length}`);
          console.log(`🎬 Playback FPS: ${playbackFPS.toFixed(2)} (${this.processedFrames.length} frames ÷ ${actualDuration.toFixed(2)}s)`);
          console.log(`⚡ Output duration will be: ${actualDuration.toFixed(2)}s (matches original)`);

          console.log('Creating video from', this.processedFrames.length, 'frames...');
          // Use playbackFPS for encoding, and actualDuration for metadata
          this.createVideoFromFrames(this.processedFrames, playbackFPS, actualDuration).then(videoBlob => {
            console.log('✅ Created video blob:', videoBlob.size, 'bytes');
            clearTimeout(safetyTimeout);
            const result = this.calculateStats(finalReps, activityName, actualDuration, videoBlob);
            resolve(result);
          });
          return;
        }

        const currentTime = video.currentTime;

        // Process frames at target FPS (30fps) for smooth output
        const timeSinceLastFrame = currentTime - lastProcessTime;
        const minFrameTime = 1 / targetFPS;
        
        if (!isProcessing && timeSinceLastFrame >= minFrameTime) {
          isProcessing = true;
          lastProcessTime = currentTime;
          frameCount++;

          const progress = Math.min((currentTime / video.duration) * 100, 99);

          if (frameCount % 30 === 0) {
            console.log('Frame:', frameCount, 'Time:', currentTime.toFixed(2), 'Progress:', progress.toFixed(1) + '%', 'Reps:', detector.getReps ? detector.getReps().length : 0);
          }

          // Draw video frame to canvas (like Python's frame processing)
          this.ctx!.drawImage(video, 0, 0, this.canvas!.width, this.canvas!.height);

          // Process with MediaPipe - send and continue (don't wait)
          if (this.pose) {
            try {
              // Send frame to MediaPipe (async, non-blocking)
              this.pose.send({ image: video }).catch((err: any) => {
                console.error('MediaPipe processing error:', err);
              });
            } catch (err) {
              console.error('MediaPipe send error:', err);
            }
          }

          // Send progress update
          const currentReps = detector.getReps ? detector.getReps() : [];
          const correctCount = currentReps.filter((r: any) => r.correct === 'True' || r.correct === true).length;
          const currentAngle = detector.getCurrentAngle ? detector.getCurrentAngle() : undefined;
          const dipTime = detector.getDipTime ? detector.getDipTime(currentTime) : 0;

          // Get jump metrics for vertical jump activities
          const maxJumpHeight = (detector as any).getMaxJumpHeight ? (detector as any).getMaxJumpHeight() : undefined;
          
          // Calculate average jump height
          let avgJumpHeight = undefined;
          if (currentReps.length > 0) {
            const heights = currentReps
              .map((r: any) => r.jump_height_m)
              .filter((h: number) => h !== undefined && h > 0);
            if (heights.length > 0) {
              avgJumpHeight = heights.reduce((a: number, b: number) => a + b, 0) / heights.length;
            }
          }

          const metrics = {
            correctCount,
            incorrectCount: currentReps.length - correctCount,
            minAngle: currentAngle,
            currentTime: currentTime,
            dipTime: dipTime,
            maxJumpHeight: maxJumpHeight,
            avgJumpHeight: avgJumpHeight
          };

          // Send progress update every 3 frames (more frequent updates)
          if (frameCount % 3 === 0) {
            onProgress(progress, lastCapturedFrame || '', currentReps.length, metrics);
          }
        }

        requestAnimationFrame(processFrame);
      };

      this.pose!.onResults((results: any) => {
        poseResultsReceived++;

        if (poseResultsReceived === 1) {
          console.log('✅ First pose result received');
          console.log('Detector type:', detector.constructor.name);
          console.log('Activity:', activityName);
          console.log('Canvas:', this.canvas?.width, 'x', this.canvas?.height);
        }

        if (poseResultsReceived % 30 === 0) {
          console.log(`Pose results: ${poseResultsReceived}, Frames stored: ${this.processedFrames.length}`);
        }

        // Process with video detector
        let reps: any[] = [];
        let currentAngle = 0;
        let state = 'up';
        let dipTime = 0;
        let maxJumpHeight = 0;

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
          if (typeof (detector as any).getMaxJumpHeight === 'function') {
            maxJumpHeight = (detector as any).getMaxJumpHeight();
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
        
        // Get distance for shuttle run, broad jump, and sit reach
        let distance = undefined;
        let currentReach = undefined;
        if ((detector as any).getDistance) {
          distance = (detector as any).getDistance();
        } else if ((detector as any).getMaxDistance) {
          distance = (detector as any).getMaxDistance();
        } else if ((detector as any).getMaxReach) {
          distance = (detector as any).getMaxReach();
          // Also get current reach for sit-and-reach
          if ((detector as any).getCurrentReach) {
            currentReach = (detector as any).getCurrentReach();
          }
        }
        
        this.drawResults(
          results,
          activityName,
          reps.length,
          state,
          currentAngle,
          correctCount,
          incorrectCount,
          video.currentTime,
          dipTime,
          maxJumpHeight,
          distance,
          currentReach
        );

        // Capture frame for preview (every 10th frame)
        if (poseResultsReceived % 10 === 0 || poseResultsReceived === 1) {
          try {
            lastCapturedFrame = this.canvas!.toDataURL('image/jpeg', 0.5);
          } catch (err) {
            console.error('Error capturing frame:', err);
          }
        }

        // Store frame for video output immediately after drawing
        if (this.ctx && this.canvas) {
          const frameData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
          this.processedFrames.push(frameData);
          
          // Log every 60 frames to track progress
          if (this.processedFrames.length % 60 === 0) {
            console.log(`✅ Stored ${this.processedFrames.length} frames with pose data`);
          }
        }
        
        // Mark processing as complete for this frame
        isProcessing = false;
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
      requestAnimationFrame(processFrame);

      // Safety timeout - if processing takes too long, force completion
      const maxProcessingTime = Math.max((video.duration || 60) * 5000, 300000); // 5x video duration or 5 minutes minimum
      safetyTimeout = setTimeout(() => {
        console.warn('Processing timeout - forcing completion after', maxProcessingTime / 1000, 'seconds');

        // Get final reps from detector
        const finalReps = detector.getReps ? detector.getReps() : [];
        const actualDuration = video.duration && isFinite(video.duration) ? video.duration : video.currentTime;

        console.log('Timeout triggered - Reps:', finalReps.length, 'Duration:', actualDuration, 'Frames:', this.processedFrames.length);

        // Calculate the exact playback FPS needed to match original duration
        const playbackFPS = this.processedFrames.length / actualDuration;
        console.log(`📹 Original video: ${actualDuration.toFixed(2)}s`);
        console.log(`📊 Frames collected: ${this.processedFrames.length}`);
        console.log(`🎬 Playback FPS: ${playbackFPS.toFixed(2)}`);

        // Create video from collected frames with calculated FPS
        this.createVideoFromFrames(this.processedFrames, playbackFPS, actualDuration).then(videoBlob => {
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

  private drawResults(results: any, activityName: string, repCount: number, state: string, currentAngle?: number, correctCount?: number, incorrectCount?: number, currentTime?: number, dipTime?: number, maxJumpHeight?: number, distance?: number, currentReach?: number) {
    if (!this.ctx || !this.canvas) return;

    // Get MediaPipe drawing functions
    const mp = getMediaPipe();

    // Draw landmarks and connections (EXACTLY like Python with mp_draw)
    if (results.poseLandmarks) {
      // Draw connections in cyan/blue
      mp.drawConnectors(this.ctx, results.poseLandmarks, mp.POSE_CONNECTIONS, {
        color: '#00FFFF',
        lineWidth: 1.5
      });
      // Draw landmarks in white/cyan
      mp.drawLandmarks(this.ctx, results.poseLandmarks, {
        color: '#FFFFFF',
        fillColor: '#00FFFF',
        radius: 2
      });
    }

    // Draw metrics overlay with good visibility
    this.ctx.font = 'bold 20px Arial';
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeStyle = '#000000';

    let yPos = 25;

    // 1. Angle display (Green) - only for exercises that use angles
    if (currentAngle !== undefined && currentAngle > 0) {
      this.ctx.fillStyle = '#00FF00';
      const angleText = `Elbow: ${Math.round(currentAngle)}°`;
      this.ctx.strokeText(angleText, 10, yPos);
      this.ctx.fillText(angleText, 10, yPos);
      yPos += 25;
    }

    // 1b. Current Reach (Green) - for sit and reach, show current reach prominently
    if (currentReach !== undefined && activityName.includes('Reach')) {
      this.ctx.fillStyle = '#00FF00';
      const currentReachText = `Current Reach: ${currentReach.toFixed(2)}m`;
      this.ctx.strokeText(currentReachText, 10, yPos);
      this.ctx.fillText(currentReachText, 10, yPos);
      yPos += 25;
    }

    // 2. Rep counter (Cyan) - skip for sit and reach
    if (!activityName.includes('Reach')) {
      this.ctx.fillStyle = '#00FFFF';
      let repLabel = activityName;
      if (activityName.includes('Jump')) {
        repLabel = 'Jump Count';
      } else if (activityName.includes('Shuttle')) {
        repLabel = 'Run Count';
      }
      const repText = `${repLabel}: ${repCount}`;
      this.ctx.strokeText(repText, 10, yPos);
      this.ctx.fillText(repText, 10, yPos);
      yPos += 25;
    }

    // 3. Max Jump Height (Green) - for vertical jump
    if (maxJumpHeight !== undefined && maxJumpHeight > 0) {
      this.ctx.fillStyle = '#00FF00';
      const heightText = `Peak Height: ${maxJumpHeight.toFixed(2)}m`;
      this.ctx.strokeText(heightText, 10, yPos);
      this.ctx.fillText(heightText, 10, yPos);
      yPos += 25;
    }

    // 3b. Distance/Reach (Cyan) - for shuttle run, broad jump, and sit reach (max reach)
    if (distance !== undefined && distance > 0) {
      this.ctx.fillStyle = '#00FFFF';
      let distanceLabel = 'Distance';
      if (activityName.includes('Broad')) {
        distanceLabel = 'Max Distance';
      } else if (activityName.includes('Reach')) {
        distanceLabel = 'Max Reach';
      }
      const distanceText = `${distanceLabel}: ${distance.toFixed(2)}m`;
      this.ctx.strokeText(distanceText, 10, yPos);
      this.ctx.fillText(distanceText, 10, yPos);
      yPos += 25;
    }

    // 4. State (Yellow/Green based on state)
    const stateColor = state === 'airborne' || state === 'down' || state === 'holding' ? '#00FF00' : 
                       state === 'reaching' ? '#00FFFF' : '#C8C800';
    this.ctx.fillStyle = stateColor;
    const stateText = `State: ${state}`;
    this.ctx.strokeText(stateText, 10, yPos);
    this.ctx.fillText(stateText, 10, yPos);
    yPos += 25;

    // 5. Dip/Air time (Red) - show during active state
    if (dipTime !== undefined && dipTime > 0) {
      this.ctx.fillStyle = '#FF0000';
      const timeLabel = state === 'airborne' ? 'Air Time' : 'Dip';
      const dipText = `${timeLabel}: ${dipTime.toFixed(2)}s`;
      this.ctx.strokeText(dipText, 10, yPos);
      this.ctx.fillText(dipText, 10, yPos);
      yPos += 25;
    }

    // 6. Correct count (Green) - for non-jump activities
    const isJumpActivity = activityName.includes('Jump');
    if (!isJumpActivity && correctCount !== undefined) {
      this.ctx.fillStyle = '#00FF00';
      const correctText = `Correct: ${correctCount}`;
      this.ctx.strokeText(correctText, 10, yPos);
      this.ctx.fillText(correctText, 10, yPos);
      yPos += 25;
    }

    // 7. Bad count (Red) - for non-jump activities, always show
    if (!isJumpActivity && incorrectCount !== undefined) {
      this.ctx.fillStyle = '#FF0000';
      const incorrectText = `Bad: ${incorrectCount}`;
      this.ctx.strokeText(incorrectText, 10, yPos);
      this.ctx.fillText(incorrectText, 10, yPos);
      yPos += 25;
    }

    // 8. Time (Yellow)
    if (currentTime !== undefined) {
      this.ctx.fillStyle = '#FFFF00';
      const timeText = `Video Time: ${currentTime.toFixed(2)}s`;
      this.ctx.strokeText(timeText, 10, yPos);
      this.ctx.fillText(timeText, 10, yPos);
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
    this.pose!.onResults((results: any) => {
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
      
      // Get distance for shuttle run
      const distance = (detector as any).getDistance ? (detector as any).getDistance() : undefined;
      
      this.drawResults(
        results,
        activityName,
        reps.length,
        state,
        currentAngle,
        correctCount,
        incorrectCount,
        (Date.now() - startTime) / 1000,
        0, // dipTime
        undefined, // maxJumpHeight
        distance
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

  cancelVideoProcessing() {
    console.log('🛑 Cancelling video processing...');
    this.cancelProcessing = true;
  }

  cleanup() {
    this.cancelProcessing = false;
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