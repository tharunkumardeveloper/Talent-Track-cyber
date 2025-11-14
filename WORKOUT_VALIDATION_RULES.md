# Workout Validation Rules

This document describes how each workout type validates correct vs incorrect reps in both live recording and upload modes.

## 1. Push-ups ✅

**Validation Criteria:**
- ✅ **Elbow Angle**: Must reach ≤ 75° at the bottom (deep enough)
- ✅ **Dip Duration**: Must hold down position for ≥ 0.2 seconds
- ❌ **Incorrect if**: Shallow push-up (angle > 75°) OR too fast (< 0.2s)

**Metrics Displayed:**
- Elbow angle (green)
- State (up/down)
- Dip time (red, during down state)
- Correct count (green)
- Bad count (blue)

---

## 2. Pull-ups ✅

**Validation Criteria:**
- ✅ **Chin Over Bar**: Head must lift ≥ 5% of frame height
- ✅ **Full Extension**: Elbow angle must reach ≥ 160° at bottom
- ✅ **Minimum Duration**: Pull-up must take ≥ 0.1 seconds
- ❌ **Incorrect if**: Chin doesn't clear bar OR incomplete extension OR too fast

**Metrics Displayed:**
- Elbow angle (green)
- State (waiting/up)
- Dip time (red, during pull)
- Correct count (green)
- Bad count (blue)

---

## 3. Sit-ups ✅

**Validation Criteria:**
- ✅ **Range of Motion**: Angle change must be ≥ 30° (full sit-up)
- ✅ **Duration**: Must take ≥ 0.3 seconds
- ❌ **Incorrect if**: Partial sit-up (< 30° range) OR too fast (< 0.3s)

**Metrics Displayed:**
- Elbow angle (green)
- State (up/down)
- Dip time (red, during down state)
- Correct count (green)
- Bad count (blue)

---

## 4. Vertical Jump ✅

**Validation Criteria:**
- ✅ **Jump Height**: Must reach ≥ 5cm (0.05m)
- ✅ **Air Time**: Must be airborne for ≥ 0.15 seconds
- ❌ **Incorrect if**: Too low (< 5cm) OR too short air time (< 0.15s)

**Metrics Displayed:**
- State (airborne/grounded)
- Air time (red, during jump)
- Jump height
- Correct count (green)
- Bad count (blue)

---

## 5. Vertical Broad Jump ✅

**Validation Criteria:**
- ✅ **Distance**: Must jump ≥ 10cm (0.1m) horizontally
- ✅ **Air Time**: Must be airborne for ≥ 0.2 seconds
- ❌ **Incorrect if**: Too short distance (< 10cm) OR too short air time (< 0.2s)

**Metrics Displayed:**
- State (airborne/grounded)
- Air time (red, during jump)
- Distance
- Correct count (green)
- Bad count (blue)

---

## 6. Shuttle Run ✅

**Validation Criteria:**
- ✅ **Direction Change**: Consistent movement in one direction for 3 frames
- ✅ **All turns counted as correct** (no bad reps for shuttle run)

**Metrics Displayed:**
- State (forward/backward/waiting)
- Distance covered
- Turn count
- Correct count (green)
- Bad count (blue) - always 0

---

## 7. Sit and Reach ✅

**Validation Criteria:**
- ✅ **Maximum Reach**: Tracks the furthest reach distance
- ✅ **All attempts counted as correct** (no bad reps for flexibility test)

**Metrics Displayed:**
- Current reach distance
- Maximum reach
- Correct count (green)
- Bad count (blue) - always 0

---

## Implementation Details

### Common Pattern
All detectors follow this pattern:
```typescript
const isCorrect = condition1 && condition2 && condition3;

this.reps.push({
  count: this.reps.length + 1,
  // ... other data
  correct: isCorrect,
  timestamp: time,
  state: 'completed'
});
```

### Counting Methods
Every detector has:
```typescript
getCorrectCount() { return this.reps.filter(r => r.correct).length; }
getBadCount() { return this.reps.filter(r => !r.correct).length; }
```

### Display in UI
Both live recording and upload mode show:
- **Correct: X** in green (#00FF00) at position (10, 160)
- **Bad: X** in blue (#0000FF) at position (10, 190)

These update in real-time as reps are performed/detected.

---

## Testing Recommendations

### Push-ups
- ✅ Good: Go down to 70°, hold for 0.3s
- ❌ Bad: Only go to 80° (too shallow)
- ❌ Bad: Quick bounce (< 0.2s)

### Pull-ups
- ✅ Good: Chin clearly over bar, full extension at bottom
- ❌ Bad: Chin doesn't clear bar
- ❌ Bad: Bent elbows at bottom (< 160°)

### Sit-ups
- ✅ Good: Full range motion (30°+ change), controlled pace
- ❌ Bad: Partial sit-up (< 30° range)
- ❌ Bad: Too fast (< 0.3s)

### Vertical Jump
- ✅ Good: Jump at least 5cm high, 0.15s+ air time
- ❌ Bad: Small hop (< 5cm)

### Vertical Broad Jump
- ✅ Good: Jump at least 10cm forward, 0.2s+ air time
- ❌ Bad: Short jump (< 10cm)

---

## Notes

1. **Shuttle Run** and **Sit and Reach** don't have "bad" reps by design - they measure performance rather than form
2. All validation thresholds are based on typical fitness standards
3. Thresholds can be adjusted in the detector classes if needed
4. The same validation logic applies to both live recording and video upload modes
