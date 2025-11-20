# TalentTrack Assets

This folder contains all static assets for the TalentTrack application.

## Structure

### Challenge Images (`/challenges/`)
Cover images for challenge cards:
- `adaptive-strength.jpg` - Para-Athlete challenge
- `core-crusher.avif` - Core strength challenge
- `flexibility-foundation.webp` - Flexibility challenge
- `jump-power.jpg` - Jump power challenge
- `pullup-progression.jpg` - Pull-up challenge
- `pushup-power.webp` - Push-up challenge
- `sprint-master.jpg` - Sprint challenge

### Workout GIFs (root `/`)
Demonstration animations for exercises:
- `kneepushup.gif` - Knee push-up demonstration
- `pullup.gif` - Pull-up demonstration
- `pushup.gif` - Push-up demonstration
- `shuttlerun.gif` - Shuttle run demonstration
- `sit&reach.gif` - Sit and reach demonstration
- `situp.gif` - Sit-up demonstration
- `verticaljump.gif` - Vertical jump demonstration

## Usage

All assets are accessible via absolute paths from the root:
- Challenge images: `/challenges/[filename]`
- Workout GIFs: `/[filename].gif`

## Performance

Assets are preloaded on app initialization for optimal performance. See `src/utils/imagePreloader.ts` for implementation details.

## Adding New Assets

1. Place challenge images in `/public/challenges/`
2. Place workout GIFs in `/public/`
3. Update `src/utils/imagePreloader.ts` with new asset paths
4. Update component references as needed
