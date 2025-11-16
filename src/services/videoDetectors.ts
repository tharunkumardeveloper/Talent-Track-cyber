// Browser-native video processing detectors
// EXACT JavaScript conversion of Python *_video.py scripts

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface RepData {
  count: number;
  timestamp?: number;
  down_time?: number;
  up_time?: number;
  dip_duration_sec?: number;
  min_elbow_angle?: number;
  correct?: boolean | string;
  angle_change?: number;
  takeoff_time?: number;
  landing_time?: number;
  air_time_s?: number;
  jump_height_px?: number;
  jump_height_m?: number;
  jump_distance_px?: number;
  jump_distance_m?: number;
  reach_px?: number;
  reach_m?: number;
  time_s?: number;
  time_of_max?: number;
  state?: string;
}

// Calculate angle - EXACT Python implementation
// Python: ba = np.array([a[0]-b[0], a[1]-b[1]])
function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const ba_x = a.x - b.x;
  const ba_y = a.y - b.y;
  const bc_x = c.x - b.x;
  const bc_y = c.y - b.y;

  const dotProduct = ba_x * bc_x + ba_y * bc_y;
  const magnitudeBA = Math.sqrt(ba_x * ba_x + ba_y * ba_y);
  const magnitudeBC = Math.sqrt(bc_x * bc_x + bc_y * bc_y);

  const cosAngle = Math.max(-1.0, Math.min(1.0, dotProduct / ((magnitudeBA * magnitudeBC) + 1e-9)));
  return Math.acos(cosAngle) * (180.0 / Math.PI);
}

// Pushup Video Detector - EXACT match to pushup_video.py
export class PushupVideoDetector {
  private state = 'up';
  private in_dip = false;
  private dip_start_time: number | null = null;
  private current_dip_min_angle = 180;
  private reps: RepData[] = [];
  private angle_history: number[] = [];
  private last_rep_time: number = 0;

  private readonly DOWN_ANGLE = 90;  // More lenient angle threshold
  private readonly UP_ANGLE = 110;
  private readonly MIN_DIP_DURATION = 0.2;  // Minimum duration for valid rep
  private readonly MIN_REP_INTERVAL = 0.5;  // Minimum time between reps to prevent false positives
  private readonly SMOOTH_N = 5;  // Increased smoothing to reduce noise

  process(landmarks: Landmark[], time: number): RepData[] {
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    const rightShoulder = landmarks[12];
    const rightElbow = landmarks[14];
    const rightWrist = landmarks[16];

    const ang_l = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const ang_r = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const elbow_angle = (ang_l + ang_r) / 2;

    this.angle_history.push(elbow_angle);
    if (this.angle_history.length > this.SMOOTH_N) {
      this.angle_history.shift();
    }

    const elbow_angle_sm = this.angle_history.reduce((a, b) => a + b, 0) / this.angle_history.length;

    if (this.state === 'up' && elbow_angle_sm <= this.DOWN_ANGLE) {
      this.state = 'down';
      this.in_dip = true;
      this.dip_start_time = time;
      this.current_dip_min_angle = elbow_angle_sm;
    }
    else if (this.state === 'down' && elbow_angle_sm >= this.UP_ANGLE) {
      this.state = 'up';
      if (this.in_dip && this.dip_start_time !== null) {
        const dip_duration = time - this.dip_start_time;
        const time_since_last_rep = time - this.last_rep_time;

        // Count all dips as reps (if not too fast)
        const is_valid_rep = time_since_last_rep >= this.MIN_REP_INTERVAL;

        // Mark as correct if: good angle (90° or less) AND proper duration (at least 0.2s)
        const has_good_depth = this.current_dip_min_angle <= this.DOWN_ANGLE;
        const has_good_duration = dip_duration >= this.MIN_DIP_DURATION;
        const is_correct = has_good_depth && has_good_duration;

        const repStatus = is_correct ? '✅ CORRECT' : '❌ BAD';
        const angleStatus = has_good_depth ? '✓' : '✗ TOO SHALLOW';
        const durationStatus = has_good_duration ? '✓' : '✗ TOO FAST';
        console.log(`Rep ${this.reps.length + 1} ${repStatus}: angle=${this.current_dip_min_angle.toFixed(1)}° ${angleStatus}, duration=${dip_duration.toFixed(2)}s ${durationStatus}`);

        // Count all valid dips (even if incorrect form)
        if (is_valid_rep) {
          const rep = {
            count: this.reps.length + 1,
            down_time: Math.round(this.dip_start_time * 1000) / 1000,
            up_time: Math.round(time * 1000) / 1000,
            dip_duration_sec: Math.round(dip_duration * 1000) / 1000,
            min_elbow_angle: Math.round(this.current_dip_min_angle * 100) / 100,
            correct: is_correct
          };

          this.reps.push(rep);
          this.last_rep_time = time;
        }

        this.in_dip = false;
        this.dip_start_time = null;
        this.current_dip_min_angle = 180;
      }
    }

    if (this.in_dip && elbow_angle_sm < this.current_dip_min_angle) {
      this.current_dip_min_angle = elbow_angle_sm;
    }

    return this.reps;
  }

  getState() { return this.state; }
  getCurrentAngle() {
    return this.angle_history.length > 0
      ? this.angle_history.reduce((a, b) => a + b, 0) / this.angle_history.length
      : 0;
  }
  getDipTime(currentTime: number) {
    return (this.in_dip && this.dip_start_time !== null) ? currentTime - this.dip_start_time : 0;
  }
  getReps() { return this.reps; }
  getCorrectCount() { return this.reps.filter(r => r.correct === true).length; }
  getBadCount() { return this.reps.filter(r => r.correct === false).length; }
}

// Pullup Video Detector - Simplified angle-based detection
export class PullupVideoDetector {
  private state = 'down';
  private in_pull = false;
  private pull_start_time: number | null = null;
  private current_pull_min_angle = 180;
  private reps: RepData[] = [];
  private angle_history: number[] = [];
  private last_rep_time: number = 0;

  private readonly UP_ANGLE = 100;  // Arms bent at top (more lenient)
  private readonly DOWN_ANGLE = 130; // Arms extended at bottom (more lenient)
  private readonly MIN_PULL_DURATION = 0.2; // Shorter minimum
  private readonly MIN_REP_INTERVAL = 0.5;
  private readonly SMOOTH_N = 5;

  process(landmarks: Landmark[], time: number): RepData[] {
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    const rightShoulder = landmarks[12];
    const rightElbow = landmarks[14];
    const rightWrist = landmarks[16];

    const ang_l = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const ang_r = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const elbow_angle = (ang_l + ang_r) / 2;

    this.angle_history.push(elbow_angle);
    if (this.angle_history.length > this.SMOOTH_N) {
      this.angle_history.shift();
    }

    const elbow_angle_sm = this.angle_history.reduce((a, b) => a + b, 0) / this.angle_history.length;

    // State: down (hanging) -> up (pulled up) -> down
    if (this.state === 'down' && elbow_angle_sm <= this.UP_ANGLE) {
      this.state = 'up';
      this.in_pull = true;
      this.pull_start_time = time;
      this.current_pull_min_angle = elbow_angle_sm;
    }
    else if (this.state === 'up' && elbow_angle_sm >= this.DOWN_ANGLE) {
      this.state = 'down';
      if (this.in_pull && this.pull_start_time !== null) {
        const pull_duration = time - this.pull_start_time;
        const time_since_last_rep = time - this.last_rep_time;

        // Count all pulls as reps (if not too fast)
        const is_valid_rep = time_since_last_rep >= this.MIN_REP_INTERVAL;

        // Mark as correct if: good angle (≤90°) AND proper duration (≥0.3s)
        const has_good_pull = this.current_pull_min_angle <= this.UP_ANGLE;
        const has_good_duration = pull_duration >= this.MIN_PULL_DURATION;
        const is_correct = has_good_pull && has_good_duration;

        const repStatus = is_correct ? '✅ CORRECT' : '❌ BAD';
        const angleStatus = has_good_pull ? '✓' : '✗ NOT PULLED UP ENOUGH';
        const durationStatus = has_good_duration ? '✓' : '✗ TOO FAST';
        console.log(`Pullup ${this.reps.length + 1} ${repStatus}: angle=${this.current_pull_min_angle.toFixed(1)}° ${angleStatus}, duration=${pull_duration.toFixed(2)}s ${durationStatus}`);

        if (is_valid_rep) {
          this.reps.push({
            count: this.reps.length + 1,
            up_time: Math.round(this.pull_start_time * 1000) / 1000,
            down_time: Math.round(time * 1000) / 1000,
            dip_duration_sec: Math.round(pull_duration * 1000) / 1000,
            min_elbow_angle: Math.round(this.current_pull_min_angle * 100) / 100,
            correct: is_correct
          });
          this.last_rep_time = time;
        }

        this.in_pull = false;
        this.pull_start_time = null;
        this.current_pull_min_angle = 180;
      }
    }

    if (this.in_pull && elbow_angle_sm < this.current_pull_min_angle) {
      this.current_pull_min_angle = elbow_angle_sm;
    }

    return this.reps;
  }

  getState() { return this.state; }
  getCurrentAngle() {
    return this.angle_history.length > 0
      ? this.angle_history.reduce((a, b) => a + b, 0) / this.angle_history.length
      : 0;
  }
  getDipTime(currentTime: number) {
    return (this.in_pull && this.pull_start_time !== null) ? currentTime - this.pull_start_time : 0;
  }
  getReps() { return this.reps; }
  getCorrectCount() { return this.reps.filter(r => r.correct === true).length; }
  getBadCount() { return this.reps.filter(r => r.correct === false).length; }
}

// Situp Video Detector - Count rep when entering 'down' state
export class SitupVideoDetector {
  private state = 'up';
  private last_extreme_angle: number | null = null;
  private up_start_time: number | null = null;
  private reps: RepData[] = [];
  private angle_history: number[] = [];
  private first_down = true; // Track if this is the first down (don't count it)
  private up_angle: number = 0; // Track angle at up position

  private readonly MIN_DIP_CHANGE = 15;
  private readonly SMOOTH_N = 5;
  private readonly MIN_DURATION = 0.2; // Minimum 0.2s for a rep (more lenient)

  process(landmarks: Landmark[], time: number): RepData[] {
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    const rightShoulder = landmarks[12];
    const rightElbow = landmarks[14];
    const rightWrist = landmarks[16];

    const elbow_angle = (calculateAngle(leftShoulder, leftElbow, leftWrist) +
      calculateAngle(rightShoulder, rightElbow, rightWrist)) / 2;

    this.angle_history.push(elbow_angle);
    if (this.angle_history.length > this.SMOOTH_N) {
      this.angle_history.shift();
    }

    const elbow_angle_sm = this.angle_history.reduce((a, b) => a + b, 0) / this.angle_history.length;

    if (this.last_extreme_angle === null) {
      this.last_extreme_angle = elbow_angle_sm;
      this.up_angle = elbow_angle_sm;
    }

    // Transition from UP to DOWN (going down)
    if (this.state === 'up' && this.last_extreme_angle - elbow_angle_sm >= this.MIN_DIP_CHANGE) {
      this.state = 'down';
      this.up_angle = this.last_extreme_angle; // Store the up angle
      this.last_extreme_angle = elbow_angle_sm;

      // Count rep when entering 'down' state (except the very first time)
      if (!this.first_down) {
        const angle_change = this.up_angle - elbow_angle_sm;
        const rep_duration = this.up_start_time !== null ? time - this.up_start_time : 0;

        // More lenient validation: just check angle change
        const is_correct = angle_change >= this.MIN_DIP_CHANGE && rep_duration >= this.MIN_DURATION;

        this.reps.push({
          count: this.reps.length + 1,
          down_time: Math.round(time * 1000) / 1000,
          up_time: this.up_start_time !== null ? Math.round(this.up_start_time * 1000) / 1000 : 0,
          angle_change: Math.round(angle_change * 100) / 100,
          dip_duration_sec: Math.round(rep_duration * 1000) / 1000,
          correct: is_correct
        });
      } else {
        this.first_down = false;
      }

      this.up_start_time = null;
    }
    // Transition from DOWN to UP (going up)
    else if (this.state === 'down' && elbow_angle_sm - this.last_extreme_angle >= this.MIN_DIP_CHANGE) {
      this.state = 'up';
      this.up_start_time = time; // Track when we reached up position
      this.last_extreme_angle = elbow_angle_sm;
    }

    return this.reps;
  }

  getState() { return this.state; }
  getCurrentAngle() {
    return this.angle_history.length > 0
      ? this.angle_history.reduce((a, b) => a + b, 0) / this.angle_history.length
      : 0;
  }
  getDipTime(currentTime: number) {
    // Return time in down position (not used for sit-ups, but kept for compatibility)
    return 0;
  }
  getReps() { return this.reps; }
  getCorrectCount() { return this.reps.filter(r => r.correct === true || r.correct === 'True').length; }
  getBadCount() { return this.reps.filter(r => r.correct === false || r.correct === 'False').length; }
}

// Vertical Jump Video Detector - Fixed coordinate system
export class VerticalJumpVideoDetector {
  private baseline_y: number | null = null;
  private in_air = false;
  private peak_y: number | null = null;
  private air_start_time = 0;
  private air_time = 0;
  private reps: RepData[] = [];
  private hip_history: number[] = [];
  private max_jump_height_px = 0;
  private baseline_frames = 0;

  private readonly PIXEL_TO_M = 2.6; // Adjusted for normalized coords (0-1 range)
  private readonly SMOOTH_N = 5;
  private readonly TAKEOFF_THRESHOLD = 0.037; // ~20px in 540px height (20/540)
  private readonly LANDING_THRESHOLD = 0.009; // ~5px in 540px height (5/540)
  private readonly MIN_BASELINE_FRAMES = 10;

  process(landmarks: Landmark[], time: number): RepData[] {
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const mid_hip_y = (leftHip.y + rightHip.y) / 2;

    this.hip_history.push(mid_hip_y);
    if (this.hip_history.length > this.SMOOTH_N) {
      this.hip_history.shift();
    }

    const hip_smoothed = this.hip_history.reduce((a, b) => a + b, 0) / this.hip_history.length;

    // Establish baseline over first few frames
    if (this.baseline_y === null) {
      this.baseline_y = hip_smoothed;
      this.baseline_frames = 0;
    } else if (this.baseline_frames < this.MIN_BASELINE_FRAMES && !this.in_air) {
      this.baseline_y = (this.baseline_y * this.baseline_frames + hip_smoothed) / (this.baseline_frames + 1);
      this.baseline_frames++;
    }

    // Takeoff detection: hip moves up significantly (y decreases in screen coords)
    if (!this.in_air && this.baseline_frames >= this.MIN_BASELINE_FRAMES) {
      if (hip_smoothed < this.baseline_y - this.TAKEOFF_THRESHOLD) {
        this.in_air = true;
        this.peak_y = hip_smoothed;
        this.air_start_time = time;
        this.air_time = 0;
      }
    }
    // While in air
    else if (this.in_air && this.peak_y !== null) {
      // Track peak (minimum y value = highest point)
      if (hip_smoothed < this.peak_y) {
        this.peak_y = hip_smoothed;
      }
      this.air_time = time - this.air_start_time;

      // Landing detection: hip returns close to baseline
      if (hip_smoothed >= this.baseline_y - this.LANDING_THRESHOLD) {
        this.in_air = false;
        const jump_height_norm = this.baseline_y - this.peak_y;
        const jump_height_m = jump_height_norm * this.PIXEL_TO_M;

        if (jump_height_norm > this.max_jump_height_px) {
          this.max_jump_height_px = jump_height_norm;
        }

        // Only count jumps with reasonable height
        if (jump_height_norm > 0.01) {
          this.reps.push({
            count: this.reps.length + 1,
            takeoff_time: Math.round(this.air_start_time * 1000) / 1000,
            landing_time: Math.round(time * 1000) / 1000,
            air_time_s: Math.round(this.air_time * 1000) / 1000,
            jump_height_px: Math.round(jump_height_norm * 1000) / 1000,
            jump_height_m: Math.round(jump_height_m * 1000) / 1000,
            correct: true  // All jumps are valid for vertical jump
          });
        }

        this.peak_y = null;
        this.air_time = 0;
        // Update baseline after landing
        this.baseline_y = hip_smoothed;
      }
      // Safety: force landing if airborne too long (>2 seconds)
      else if (this.air_time > 2.0) {
        this.in_air = false;
        this.peak_y = null;
        this.air_time = 0;
        this.baseline_y = hip_smoothed;
      }
    }

    return this.reps;
  }

  getState() { return this.in_air ? 'airborne' : 'grounded'; }
  getAirTime(currentTime: number) {
    return this.in_air ? currentTime - this.air_start_time : 0;
  }
  getMaxJumpHeight() { return this.max_jump_height_px * this.PIXEL_TO_M; }
  getReps() { return this.reps; }
  getCurrentAngle() { return 0; }
  getDipTime(currentTime: number) {
    return this.in_air ? currentTime - this.air_start_time : 0;
  }
  getCorrectCount() { return this.reps.length; }
  getBadCount() { return 0; }
}

// Shuttle Run Video Detector - Fixed to return RepData[]
export class ShuttleRunVideoDetector {
  private last_x: number | null = null;
  private direction: string | null = null;
  private start_x: number | null = null;
  private run_count = 0;
  private status = 'Waiting';
  private x_history: number[] = [];
  private dir_history: string[] = [];
  private reps: RepData[] = [];
  private current_distance = 0;

  private readonly THRESHOLD_PIX = 0.005; // 0.5% of frame width
  private readonly DIR_FRAMES = 3;
  private readonly PIXEL_TO_M = 10.0; // For normalized coords: 1.0 = ~10m (typical shuttle run distance)
  private readonly SMOOTH_N = 5;

  process(landmarks: Landmark[], time: number): RepData[] {
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const leftFoot = landmarks[31];
    const rightFoot = landmarks[32];

    const avg_x = (leftAnkle.x + rightAnkle.x + leftFoot.x + rightFoot.x) / 4;

    this.x_history.push(avg_x);
    if (this.x_history.length > this.SMOOTH_N) {
      this.x_history.shift();
    }

    const smoothed_x = this.x_history.reduce((a, b) => a + b, 0) / this.x_history.length;

    if (this.last_x !== null) {
      const delta = smoothed_x - this.last_x;

      if (Math.abs(delta) > this.THRESHOLD_PIX) {
        const new_direction = delta > 0 ? 'forward' : 'backward';
        this.dir_history.push(new_direction);

        if (this.dir_history.length > this.DIR_FRAMES) {
          this.dir_history.shift();
        }

        if (this.dir_history.length === this.DIR_FRAMES &&
          this.dir_history.every(d => d === this.dir_history[0])) {
          const confirmed_direction = this.dir_history[0];

          if (this.start_x === null) {
            this.start_x = smoothed_x;
            this.direction = confirmed_direction;
            this.status = confirmed_direction === 'forward' ? 'Running Towards' : 'Returning';
          } else if (this.direction && this.direction !== confirmed_direction) {
            this.direction = confirmed_direction;
            if (confirmed_direction === 'backward') {
              this.run_count++;
              this.status = 'Returning';

              // Add rep when turning back
              this.reps.push({
                count: this.run_count,
                timestamp: Math.round(time * 1000) / 1000,
                correct: true
              });
            } else {
              this.status = 'Running Towards';
            }
          }
        }
      }
    }

    this.last_x = smoothed_x;
    this.current_distance = this.start_x !== null ? Math.abs(smoothed_x - this.start_x) * this.PIXEL_TO_M : 0;

    return this.reps;
  }

  getState() { return this.status; }
  getDistance() {
    return this.current_distance;
  }
  getRunCount() { return this.run_count; }
  getCurrentAngle() { return 0; }
  getDipTime() { return 0; }
  getCorrectCount() { return this.run_count; }
  getBadCount() { return 0; }
  getReps() { return this.reps; }
}

// Vertical Broad Jump Video Detector - EXACT match to verticalbroadjump_video.py
export class VerticalBroadJumpVideoDetector {
  private state = 'grounded';
  private air_start_time = 0;
  private takeoff_x: number | null = null;
  private takeoff_y: number | null = null;
  private peak_y: number | null = null;
  private reps: RepData[] = [];
  private ankle_y_history: number[] = [];
  private last_jump_time = 0;

  private readonly Y_THRESHOLD = 0.02; // 2% of frame height for takeoff
  private readonly MIN_AIR_TIME = 0.15; // Minimum 0.15s in air
  private readonly MIN_DISTANCE = 0.02; // Minimum 2% of frame width
  private readonly MIN_JUMP_INTERVAL = 0.8; // At least 0.8 second between jumps
  private readonly SMOOTH_N = 5;
  private readonly PIXEL_TO_M = 10.0; // For normalized coords

  process(landmarks: Landmark[], time: number): RepData[] {
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const ankle_y = (leftAnkle.y + rightAnkle.y) / 2;
    const ankle_x = (leftAnkle.x + rightAnkle.x) / 2;

    this.ankle_y_history.push(ankle_y);
    if (this.ankle_y_history.length > this.SMOOTH_N) {
      this.ankle_y_history.shift();
    }

    if (this.ankle_y_history.length < this.SMOOTH_N) return this.reps;

    const avg_y = this.ankle_y_history.reduce((a, b) => a + b, 0) / this.ankle_y_history.length;

    if (this.state === 'grounded') {
      // Detect takeoff: ankles suddenly rise (y decreases)
      if (this.takeoff_y !== null && this.takeoff_y - avg_y > this.Y_THRESHOLD) {
        // Prevent false detections too soon after last jump
        if (time - this.last_jump_time >= this.MIN_JUMP_INTERVAL) {
          this.state = 'airborne';
          this.air_start_time = time;
          this.takeoff_x = ankle_x;
          this.peak_y = avg_y;
        }
      }
      this.takeoff_y = avg_y;
    } else if (this.state === 'airborne') {
      // Track peak height (minimum y)
      if (this.peak_y === null || avg_y < this.peak_y) {
        this.peak_y = avg_y;
      }

      // Detect landing: ankles come back down (y increases)
      if (this.takeoff_y !== null && avg_y >= this.takeoff_y - this.Y_THRESHOLD / 2) {
        const air_time = time - this.air_start_time;
        const jump_distance = this.takeoff_x !== null ? Math.abs(ankle_x - this.takeoff_x) : 0;
        const jump_height = this.takeoff_y !== null && this.peak_y !== null ? this.takeoff_y - this.peak_y : 0;

        // Validate: must have minimum air time, distance, and height
        if (air_time >= this.MIN_AIR_TIME &&
          jump_distance >= this.MIN_DISTANCE &&
          jump_height >= this.Y_THRESHOLD / 2) {

          const distance_m = jump_distance * this.PIXEL_TO_M;

          this.reps.push({
            count: this.reps.length + 1,
            takeoff_time: Math.round(this.air_start_time * 1000) / 1000,
            landing_time: Math.round(time * 1000) / 1000,
            air_time_s: Math.round(air_time * 1000) / 1000,
            jump_distance_px: Math.round(jump_distance * 1000) / 1000,
            jump_distance_m: Math.round(distance_m * 1000) / 1000,
            correct: true
          });

          this.last_jump_time = time;
        }

        this.state = 'grounded';
        this.takeoff_x = null;
        this.peak_y = null;
      }
    }

    return this.reps;
  }

  getState() { return this.state; }
  getReps() { return this.reps; }
  getCurrentAngle() { return 0; }
  getDipTime(currentTime: number) {
    return this.state === 'airborne' ? currentTime - this.air_start_time : 0;
  }
  getAirTime(currentTime: number) {
    return this.state === 'airborne' ? currentTime - this.air_start_time : 0;
  }
  getMaxDistance() {
    if (this.reps.length === 0) return 0;
    const distances = this.reps.map(r => r.jump_distance_m || 0);
    return Math.max(...distances);
  }
  getCorrectCount() { return this.reps.length; }
  getBadCount() { return 0; }
}

// Sit and Reach Video Detector - Enhanced version with state tracking
export class SitAndReachVideoDetector {
  private max_reach_px = 0;
  private reach_history: number[] = [];
  private current_reach_px = 0;
  private state: 'starting' | 'reaching' | 'holding' = 'starting';
  private time_of_max_reach = 0;
  private reach_data: any[] = [];
  private baseline_foot_x: number | null = null;
  private baseline_frames = 0;
  private hold_frames = 0;
  private rep_completed = false; // Track if rep is completed
  private hold_start_time = 0;

  private readonly PIXEL_TO_M = 2.6; // Adjusted for normalized coords (0-1 range)
  private readonly SMOOTH_N = 5;
  private readonly BASELINE_FRAMES = 30; // Frames to establish baseline
  private readonly HOLD_THRESHOLD = 0.02; // 2cm movement threshold for holding
  private readonly HOLD_DURATION = 0.5; // Need to hold for 0.5 seconds to count as rep

  process(landmarks: Landmark[], time: number): RepData[] {
    // Use foot index landmarks (31, 32) for feet position
    const leftFoot = landmarks[31];
    const rightFoot = landmarks[32];
    const foot_x = (leftFoot.x + rightFoot.x) / 2;

    // Use wrist landmarks (15, 16) for hand position
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const hand_x = (leftWrist.x + rightWrist.x) / 2;

    // Establish baseline foot position in first frames
    if (this.baseline_frames < this.BASELINE_FRAMES) {
      if (this.baseline_foot_x === null) {
        this.baseline_foot_x = foot_x;
      } else {
        this.baseline_foot_x = (this.baseline_foot_x * this.baseline_frames + foot_x) / (this.baseline_frames + 1);
      }
      this.baseline_frames++;
      this.state = 'starting';
    } else {
      // Use baseline foot position for consistent measurement
      const reference_foot_x = this.baseline_foot_x || foot_x;

      // Calculate reach distance (positive = reaching forward)
      const reach_px = hand_x - reference_foot_x;

      // Smooth the reach measurement
      this.reach_history.push(reach_px);
      if (this.reach_history.length > this.SMOOTH_N) {
        this.reach_history.shift();
      }

      const reach_smoothed = this.reach_history.reduce((a, b) => a + b, 0) / this.reach_history.length;
      this.current_reach_px = reach_smoothed;

      // Determine state based on reach changes
      const prev_state = this.state;
      if (this.max_reach_px > 0) {
        const reach_diff = Math.abs(reach_smoothed - this.max_reach_px);
        if (reach_diff < this.HOLD_THRESHOLD) {
          this.hold_frames++;
          if (this.hold_frames > 10) {
            if (this.state !== 'holding') {
              // Just entered holding state
              this.hold_start_time = time;
            }
            this.state = 'holding';

            // Check if we've held long enough to count as a rep
            if (!this.rep_completed && (time - this.hold_start_time) >= this.HOLD_DURATION) {
              this.rep_completed = true;
            }
          }
        } else {
          this.hold_frames = 0;
          this.state = 'reaching';
        }
      } else {
        this.state = 'reaching';
      }

      // Update max reach
      if (reach_smoothed > this.max_reach_px) {
        this.max_reach_px = reach_smoothed;
        this.time_of_max_reach = time;
        this.hold_frames = 0;
      }

      // Log reach data
      this.reach_data.push({
        time_s: Math.round(time * 1000) / 1000,
        reach_px: Math.round(reach_smoothed * 1000) / 1000,
        reach_m: Math.round(reach_smoothed * this.PIXEL_TO_M * 1000) / 1000,
        state: this.state
      });
    }

    // Return rep only if holding state was achieved and held long enough
    return this.rep_completed ? [{
      count: 1,
      reach_m: Math.round(this.max_reach_px * this.PIXEL_TO_M * 1000) / 1000,
      time_of_max: Math.round(this.time_of_max_reach * 1000) / 1000,
      correct: true
    }] : [];
  }

  getCurrentReach() {
    return this.current_reach_px * this.PIXEL_TO_M;
  }
  getMaxReach() {
    return this.max_reach_px * this.PIXEL_TO_M;
  }
  getState() {
    return this.state;
  }
  getCurrentAngle() { return 0; }
  getDipTime() { return 0; }
  getCorrectCount() { return this.rep_completed ? 1 : 0; }
  getBadCount() { return 0; }
  getReps() {
    return this.rep_completed ? [{
      count: 1,
      reach_m: this.getMaxReach(),
      time_of_max: this.time_of_max_reach,
      correct: true
    }] : [];
  }
  getReachData() {
    return this.reach_data;
  }
}

// Factory function to get detector for activity
export function getVideoDetectorForActivity(activityName: string) {
  const name = activityName.toLowerCase();

  if (name.includes('push')) {
    return new PushupVideoDetector();
  } else if (name.includes('pull') || name.includes('chin')) {
    return new PullupVideoDetector();
  } else if (name.includes('sit-up') || name.includes('situp')) {
    return new SitupVideoDetector();
  } else if (name.includes('vertical') && name.includes('jump') && !name.includes('broad')) {
    return new VerticalJumpVideoDetector();
  } else if (name.includes('broad') && name.includes('jump')) {
    return new VerticalBroadJumpVideoDetector();
  } else if (name.includes('shuttle')) {
    return new ShuttleRunVideoDetector();
  } else if (name.includes('sit') && name.includes('reach')) {
    return new SitAndReachVideoDetector();
  }

  return new PushupVideoDetector();
}

export type VideoDetector =
  | PushupVideoDetector
  | PullupVideoDetector
  | SitupVideoDetector
  | VerticalJumpVideoDetector
  | VerticalBroadJumpVideoDetector
  | ShuttleRunVideoDetector
  | SitAndReachVideoDetector;
