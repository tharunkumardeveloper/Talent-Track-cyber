// Pure JavaScript workout detection algorithms
// Replaces Python MediaPipe scripts with browser-native implementation
// 100% serverless - runs entirely in the browser using MediaPipe Web

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface RepData {
  count: number;
  timestamp: number;
  downTime?: number;
  upTime?: number;
  dipDuration?: number;
  minElbowAngle?: number;
  correct?: boolean;
  state?: string;
  jumpHeight?: number;
  airTime?: number;
  distance?: number;
  reach?: number;
}

// Smoothing helper for angle/position data
class SmoothingBuffer {
  private buffer: number[] = [];
  private maxSize: number;

  constructor(size: number) {
    this.maxSize = size;
  }

  add(value: number): number {
    this.buffer.push(value);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
    return this.getAverage();
  }

  getAverage(): number {
    if (this.buffer.length === 0) return 0;
    return this.buffer.reduce((a, b) => a + b, 0) / this.buffer.length;
  }

  reset() {
    this.buffer = [];
  }
}

// Calculate angle between three points (matches Python implementation)
function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };
  
  const dotProduct = ba.x * bc.x + ba.y * bc.y;
  const magnitudeBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
  const magnitudeBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);
  
  const cosAngle = Math.max(-1, Math.min(1, dotProduct / ((magnitudeBA * magnitudeBC) + 1e-9)));
  return Math.acos(cosAngle) * (180 / Math.PI);
}

// Pushup Detector (matches pushup_video.py)
export class PushupDetector {
  private state = 'up';
  private inDip = false;
  private dipStartTime = 0;
  private currentMinAngle = 180;
  private reps: RepData[] = [];
  private angleBuffer = new SmoothingBuffer(5); // Match video detector smoothing
  private lastRepTime = 0;
  
  private readonly DOWN_ANGLE = 90; // Match video detector
  private readonly UP_ANGLE = 110;
  private readonly MIN_DIP_DURATION = 0.2;
  private readonly MIN_REP_INTERVAL = 0.3; // Match video detector

  process(landmarks: Landmark[], time: number): RepData[] {
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    const rightShoulder = landmarks[12];
    const rightElbow = landmarks[14];
    const rightWrist = landmarks[16];

    const leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const elbowAngle = this.angleBuffer.add((leftAngle + rightAngle) / 2);

    // Track minimum angle while in down state
    if (this.state === 'down' && elbowAngle < this.currentMinAngle) {
      this.currentMinAngle = elbowAngle;
    }

    if (this.state === 'up' && elbowAngle <= this.DOWN_ANGLE) {
      this.state = 'down';
      this.inDip = true;
      this.dipStartTime = time;
      this.currentMinAngle = elbowAngle;
    } else if (this.state === 'down' && elbowAngle >= this.UP_ANGLE) {
      this.state = 'up';
      if (this.inDip) {
        const dipDuration = time - this.dipStartTime;
        const timeSinceLastRep = time - this.lastRepTime;
        
        // Only count if enough time has passed since last rep
        const isValidRep = timeSinceLastRep >= this.MIN_REP_INTERVAL;
        
        if (isValidRep) {
          const hasGoodDepth = this.currentMinAngle <= this.DOWN_ANGLE;
          const hasGoodDuration = dipDuration >= this.MIN_DIP_DURATION;
          const isCorrect = hasGoodDepth && hasGoodDuration;
          
          this.reps.push({
            count: this.reps.length + 1,
            downTime: this.dipStartTime,
            upTime: time,
            dipDuration: dipDuration,
            minElbowAngle: this.currentMinAngle,
            correct: isCorrect,
            timestamp: time,
            state: 'completed'
          });
          
          this.lastRepTime = time;
        }
        
        this.inDip = false;
        this.currentMinAngle = 180;
      }
    }

    return this.reps;
  }

  getState() { return this.state; }
  getCurrentAngle() { return this.currentMinAngle; }
  getDipTime(currentTime: number) { 
    return this.inDip ? currentTime - this.dipStartTime : 0; 
  }
  getReps() { return this.reps; }
  getCorrectCount() { return this.reps.filter(r => r.correct).length; }
  getBadCount() { return this.reps.filter(r => !r.correct).length; }
}

// Pullup Detector (matches pullup_video.py)
export class PullupDetector {
  private state = 'waiting';
  private inDip = false;
  private dipStartTime = 0;
  private initialHeadY: number | null = null;
  private minHeadY: number = 999; // Track minimum head Y during pull
  private maxElbowAngle: number = 0; // Track max elbow angle at bottom
  private reps: RepData[] = [];
  private angleBuffer = new SmoothingBuffer(3);
  
  private readonly BOTTOM_ANGLE = 160; // Minimum angle at bottom for full extension
  private readonly MIN_DIP = 0.1; // Minimum time for pull-up
  private readonly MIN_HEAD_LIFT = 0.05; // Minimum head lift (5% of frame height) - chin over bar

  process(landmarks: Landmark[], time: number): RepData[] {
    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    const rightShoulder = landmarks[12];
    const rightElbow = landmarks[14];
    const rightWrist = landmarks[16];

    const headY = nose.y;
    if (this.initialHeadY === null) {
      this.initialHeadY = headY;
    }

    const leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const elbowAngle = this.angleBuffer.add((leftAngle + rightAngle) / 2);

    if (this.state === 'waiting' && headY < this.initialHeadY - 0.01) {
      // Starting pull-up
      this.state = 'up';
      this.inDip = true;
      this.dipStartTime = time;
      this.minHeadY = headY;
      this.maxElbowAngle = elbowAngle;
    } else if (this.state === 'up') {
      // Track minimum head position during pull
      if (headY < this.minHeadY) {
        this.minHeadY = headY;
      }
      
      // Track maximum elbow angle (should be > 160° at bottom)
      if (elbowAngle > this.maxElbowAngle) {
        this.maxElbowAngle = elbowAngle;
      }
      
      // Check if returning to bottom (elbows extended)
      if (elbowAngle > this.BOTTOM_ANGLE) {
        if (headY >= this.initialHeadY - 0.01 && this.inDip) {
          const dipDuration = time - this.dipStartTime;
          const headLift = this.initialHeadY - this.minHeadY;
          
          // Validate rep: chin must go over bar AND full elbow extension AND minimum duration
          const chinOverBar = headLift >= this.MIN_HEAD_LIFT;
          const fullExtension = this.maxElbowAngle >= this.BOTTOM_ANGLE;
          const goodDuration = dipDuration >= this.MIN_DIP;
          const isCorrect = chinOverBar && fullExtension && goodDuration;
          
          this.reps.push({
            count: this.reps.length + 1,
            upTime: this.dipStartTime,
            downTime: time,
            dipDuration: dipDuration,
            minElbowAngle: this.maxElbowAngle,
            correct: isCorrect,
            timestamp: time,
            state: 'completed'
          });
          
          this.inDip = false;
          this.state = 'waiting';
          this.minHeadY = 999;
          this.maxElbowAngle = 0;
        }
      }
    }

    return this.reps;
  }

  getState() { return this.state; }
  getCurrentAngle() { return this.maxElbowAngle; }
  getDipTime(currentTime: number) { 
    return this.inDip ? currentTime - this.dipStartTime : 0; 
  }
  getReps() { return this.reps; }
  getCorrectCount() { return this.reps.filter(r => r.correct).length; }
  getBadCount() { return this.reps.filter(r => !r.correct).length; }
}

// Situp Detector (matches situp_video.py)
export class SitupDetector {
  private state = 'up';
  private lastExtremeAngle: number | null = null;
  private dipStartTime = 0;
  private minAngle: number = 180;
  private maxAngle: number = 0;
  private reps: RepData[] = [];
  private angleBuffer = new SmoothingBuffer(5);
  
  private readonly MIN_DIP_CHANGE = 15; // Minimum angle change to count as movement
  private readonly MIN_DURATION = 0.3; // Minimum time for a sit-up
  private readonly GOOD_RANGE_MIN = 30; // Good sit-up should reach at least 30° range

  process(landmarks: Landmark[], time: number): RepData[] {
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    const rightShoulder = landmarks[12];
    const rightElbow = landmarks[14];
    const rightWrist = landmarks[16];

    const leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const elbowAngle = this.angleBuffer.add((leftAngle + rightAngle) / 2);

    if (this.lastExtremeAngle === null) {
      this.lastExtremeAngle = elbowAngle;
      this.minAngle = elbowAngle;
      this.maxAngle = elbowAngle;
    }

    // Track min and max angles during movement
    if (elbowAngle < this.minAngle) {
      this.minAngle = elbowAngle;
    }
    if (elbowAngle > this.maxAngle) {
      this.maxAngle = elbowAngle;
    }

    if (this.state === 'up' && this.lastExtremeAngle - elbowAngle >= this.MIN_DIP_CHANGE) {
      this.state = 'down';
      this.dipStartTime = time;
      this.lastExtremeAngle = elbowAngle;
      this.minAngle = elbowAngle;
      this.maxAngle = elbowAngle;
    } else if (this.state === 'down' && elbowAngle - this.lastExtremeAngle >= this.MIN_DIP_CHANGE) {
      this.state = 'up';
      const dipDuration = time - this.dipStartTime;
      const angleRange = this.maxAngle - this.minAngle;
      
      // Validate: good duration and sufficient range of motion
      const goodDuration = dipDuration >= this.MIN_DURATION;
      const goodRange = angleRange >= this.GOOD_RANGE_MIN;
      const isCorrect = goodDuration && goodRange;
      
      this.reps.push({
        count: this.reps.length + 1,
        downTime: this.dipStartTime,
        upTime: time,
        dipDuration: dipDuration,
        minElbowAngle: this.minAngle,
        correct: isCorrect,
        timestamp: time,
        state: 'completed'
      });
      this.lastExtremeAngle = elbowAngle;
      this.minAngle = elbowAngle;
      this.maxAngle = elbowAngle;
    }

    return this.reps;
  }

  getState() { return this.state; }
  getCurrentAngle() { return this.lastExtremeAngle || 0; }
  getDipTime(currentTime: number) { 
    return this.state === 'down' ? currentTime - this.dipStartTime : 0; 
  }
  getReps() { return this.reps; }
  getCorrectCount() { return this.reps.filter(r => r.correct).length; }
  getBadCount() { return this.reps.filter(r => !r.correct).length; }
}

// Vertical Jump Detector (matches verticaljump_video.py)
export class VerticalJumpDetector {
  private baselineY: number | null = null;
  private inAir = false;
  private peakY: number | null = null;
  private airStartTime = 0;
  private reps: RepData[] = [];
  private hipBuffer = new SmoothingBuffer(5);
  private maxJumpHeight = 0;
  
  private readonly PIXEL_TO_M = 0.0026; // Calibration factor
  private readonly MIN_JUMP_HEIGHT = 0.05; // Minimum 5cm jump to count as valid
  private readonly MIN_AIR_TIME = 0.15; // Minimum 0.15s air time

  process(landmarks: Landmark[], time: number): RepData[] {
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const midHipY = this.hipBuffer.add((leftHip.y + rightHip.y) / 2);

    if (this.baselineY === null) {
      this.baselineY = midHipY;
    }

    const liftoffThreshold = 0.02; // 2% of frame height
    const landingThreshold = 0.005; // 0.5% of frame height

    if (!this.inAir && midHipY < this.baselineY - liftoffThreshold) {
      this.inAir = true;
      this.peakY = midHipY;
      this.airStartTime = time;
    } else if (this.inAir && this.peakY !== null) {
      this.peakY = Math.min(this.peakY, midHipY);
      
      if (midHipY >= this.baselineY - landingThreshold) {
        const jumpHeightPx = this.baselineY - this.peakY;
        const jumpHeightM = jumpHeightPx * this.PIXEL_TO_M;
        const airTime = time - this.airStartTime;
        
        if (jumpHeightM > this.maxJumpHeight) {
          this.maxJumpHeight = jumpHeightM;
        }
        
        // Validate: minimum height and air time
        const goodHeight = jumpHeightM >= this.MIN_JUMP_HEIGHT;
        const goodAirTime = airTime >= this.MIN_AIR_TIME;
        const isCorrect = goodHeight && goodAirTime;
        
        this.reps.push({
          count: this.reps.length + 1,
          timestamp: time,
          downTime: this.airStartTime,
          upTime: time,
          airTime: airTime,
          jumpHeight: jumpHeightM,
          correct: isCorrect,
          state: 'completed'
        });
        
        this.inAir = false;
        this.peakY = null;
      }
    }

    return this.reps;
  }

  getState() { return this.inAir ? 'airborne' : 'grounded'; }
  getAirTime(currentTime: number) { 
    return this.inAir ? currentTime - this.airStartTime : 0; 
  }
  getMaxJumpHeight() { return this.maxJumpHeight; }
  getReps() { return this.reps; }
  getCorrectCount() { return this.reps.filter(r => r.correct).length; }
  getBadCount() { return this.reps.filter(r => !r.correct).length; }
}

// Shuttle Run Detector (matches shuttlerun_video.py)
export class ShuttleRunDetector {
  private lastX: number | null = null;
  private direction: string | null = null;
  private startX: number | null = null;
  private turnCount = 0;
  private reps: RepData[] = [];
  private xBuffer = new SmoothingBuffer(5);
  private directionBuffer: string[] = [];
  
  private readonly THRESHOLD_PIX = 0.005;
  private readonly DIR_FRAMES = 3;
  private readonly PIXEL_TO_M = 10.0; // For normalized coords: 1.0 = ~10m

  process(landmarks: Landmark[], time: number): RepData[] {
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const leftFoot = landmarks[31];
    const rightFoot = landmarks[32];

    const avgX = (leftAnkle.x + rightAnkle.x + leftFoot.x + rightFoot.x) / 4;
    const smoothedX = this.xBuffer.add(avgX);

    if (this.lastX === null) {
      this.lastX = smoothedX;
      this.startX = smoothedX;
      return this.reps;
    }

    const delta = smoothedX - this.lastX;

    if (Math.abs(delta) > this.THRESHOLD_PIX) {
      const newDirection = delta > 0 ? 'forward' : 'backward';
      this.directionBuffer.push(newDirection);
      
      if (this.directionBuffer.length > this.DIR_FRAMES) {
        this.directionBuffer.shift();
      }
      
      // Confirm direction change only after consistent movement
      if (this.directionBuffer.length === this.DIR_FRAMES && 
          this.directionBuffer.every(d => d === this.directionBuffer[0])) {
        const confirmedDirection = this.directionBuffer[0];
        
        if (this.direction && this.direction !== confirmedDirection) {
          this.turnCount++;
          const distance = Math.abs(smoothedX - (this.startX || 0)) * this.PIXEL_TO_M;
          
          this.reps.push({
            count: this.turnCount,
            timestamp: time,
            distance: distance,
            correct: true,
            state: 'completed'
          });
        }
        
        this.direction = confirmedDirection;
      }
      
      this.lastX = smoothedX;
    }

    return this.reps;
  }

  getState() { return this.direction || 'waiting'; }
  getDistance() { 
    if (this.startX === null || this.lastX === null) return 0;
    return Math.abs(this.lastX - this.startX) * this.PIXEL_TO_M; 
  }
  getReps() { return this.reps; }
  getCorrectCount() { return this.reps.filter(r => r.correct).length; }
  getBadCount() { return this.reps.filter(r => !r.correct).length; }
}

// Vertical Broad Jump Detector (matches verticalbroadjump_video.py)
export class VerticalBroadJumpDetector {
  private state = 'grounded';
  private airStartTime = 0;
  private takeoffX: number | null = null;
  private takeoffY: number | null = null;
  private peakY: number | null = null;
  private reps: RepData[] = [];
  private ankleYBuffer = new SmoothingBuffer(5);
  private lastJumpTime = 0;
  
  private readonly Y_THRESHOLD = 0.03; // 3% of frame height
  private readonly MIN_DISTANCE = 0.05; // Minimum 5% of frame width
  private readonly MIN_AIR_TIME = 0.2; // Minimum 0.2s air time
  private readonly MIN_JUMP_INTERVAL = 1.0; // At least 1 second between jumps

  process(landmarks: Landmark[], time: number): RepData[] {
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const ankleY = this.ankleYBuffer.add((leftAnkle.y + rightAnkle.y) / 2);
    const ankleX = (leftAnkle.x + rightAnkle.x) / 2;

    if (this.state === 'grounded') {
      // Detect takeoff: ankles suddenly rise (y decreases)
      if (this.takeoffY !== null && this.takeoffY - ankleY > this.Y_THRESHOLD) {
        // Prevent false detections too soon after last jump
        if (time - this.lastJumpTime >= this.MIN_JUMP_INTERVAL) {
          this.state = 'airborne';
          this.airStartTime = time;
          this.takeoffX = ankleX;
          this.peakY = ankleY;
        }
      }
      this.takeoffY = ankleY;
    } else if (this.state === 'airborne') {
      // Track peak height (minimum y)
      if (this.peakY === null || ankleY < this.peakY) {
        this.peakY = ankleY;
      }

      // Detect landing: ankles come back down (y increases)
      if (this.takeoffY !== null && ankleY >= this.takeoffY - this.Y_THRESHOLD / 2) {
        const airTime = time - this.airStartTime;
        const jumpDistance = this.takeoffX !== null ? Math.abs(ankleX - this.takeoffX) : 0;
        const jumpHeight = this.takeoffY !== null && this.peakY !== null ? this.takeoffY - this.peakY : 0;
        
        // Validate: minimum distance, air time, and height
        const goodDistance = jumpDistance >= this.MIN_DISTANCE;
        const goodAirTime = airTime >= this.MIN_AIR_TIME;
        const goodHeight = jumpHeight >= this.Y_THRESHOLD / 2;
        const isCorrect = goodDistance && goodAirTime && goodHeight;
        
        if (isCorrect) {
          this.reps.push({
            count: this.reps.length + 1,
            timestamp: time,
            downTime: this.airStartTime,
            upTime: time,
            airTime: airTime,
            distance: jumpDistance,
            correct: true,
            state: 'completed'
          });
          this.lastJumpTime = time;
        }
        
        this.state = 'grounded';
        this.takeoffX = null;
        this.peakY = null;
      }
    }

    return this.reps;
  }

  getState() { return this.state; }
  getReps() { return this.reps; }
  getCorrectCount() { return this.reps.filter(r => r.correct).length; }
  getBadCount() { return this.reps.filter(r => !r.correct).length; }
}

// Sit and Reach Detector (matches sitreach_video.py)
export class SitAndReachDetector {
  private maxReach = 0;
  private timeOfMaxReach = 0;
  private reps: RepData[] = [];
  private reachBuffer = new SmoothingBuffer(5);
  
  private readonly PIXEL_TO_M = 2.6; // Adjusted for normalized coords

  process(landmarks: Landmark[], time: number): RepData[] {
    const leftFoot = landmarks[31];
    const rightFoot = landmarks[32];
    const footX = (leftFoot.x + rightFoot.x) / 2;

    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const handX = (leftWrist.x + rightWrist.x) / 2;

    // Forward reach distance (positive if hands ahead of feet)
    const reachPx = handX - footX;
    const reachSmoothed = this.reachBuffer.add(reachPx);
    const reachM = reachSmoothed * this.PIXEL_TO_M;

    // Update max reach
    if (reachSmoothed > this.maxReach) {
      this.maxReach = reachSmoothed;
      this.timeOfMaxReach = time;
      
      // Update or add the current max reach record
      if (this.reps.length === 0) {
        this.reps.push({
          count: 1,
          timestamp: time,
          reach: reachM,
          correct: true,
          state: 'completed'
        });
      } else {
        this.reps[0] = {
          count: 1,
          timestamp: time,
          reach: reachM,
          correct: true,
          state: 'completed'
        };
      }
    }

    return this.reps;
  }

  getCurrentReach() { 
    return this.maxReach * this.PIXEL_TO_M; 
  }
  getMaxReach() { 
    return this.maxReach * this.PIXEL_TO_M; 
  }
  getReps() { return this.reps; }
  getCorrectCount() { return this.reps.filter(r => r.correct).length; }
  getBadCount() { return this.reps.filter(r => !r.correct).length; }
}

// Factory function to get detector for activity
export function getDetectorForActivity(activityName: string) {
  const name = activityName.toLowerCase();
  
  if (name.includes('push')) {
    return new PushupDetector();
  } else if (name.includes('pull') || name.includes('chin')) {
    return new PullupDetector();
  } else if (name.includes('sit-up') || name.includes('situp')) {
    return new SitupDetector();
  } else if (name.includes('vertical') && name.includes('jump')) {
    return new VerticalJumpDetector();
  } else if (name.includes('broad') && name.includes('jump')) {
    return new VerticalBroadJumpDetector();
  } else if (name.includes('shuttle')) {
    return new ShuttleRunDetector();
  } else if (name.includes('sit') && name.includes('reach')) {
    return new SitAndReachDetector();
  }
  
  // Default to pushup detector
  return new PushupDetector();
}

// Export all detector types
export type WorkoutDetector = 
  | PushupDetector 
  | PullupDetector 
  | SitupDetector 
  | VerticalJumpDetector 
  | VerticalBroadJumpDetector
  | ShuttleRunDetector 
  | SitAndReachDetector;
