# Talent Track - AI-Powered Fitness Analysis

##  Hackathon Submission
### What Died
- Push-ups, Pull-ups, Sit-ups
- Shuttle Run, Vertical Jump
- Sit & Reach, Broad Jump

It motivated millions but died due to:
- Manual testing was time-consuming
- No real-time feedback
- Inconsistent scoring
- Lack of engagement for digital natives

### What We Brought Back
**Talent Track** resurrects this iconic program with modern AI:

- **AI-Powered Analysis**: MediaPipe pose detection replaces manual counting
- **Real-Time Feedback**: Instant form validation with skeleton overlay
- **Consistent Scoring**: AI ensures fair, accurate measurements
- **Gamification**: Challenges and leaderboards engage today's generation
- **Accessibility**: Anyone with a camera can participate
- **All 7 Original Tests**: Complete Presidential Fitness Test suite

### Why It Matters Today
- **Fitness Crisis**: Youth obesity has tripled since the program ended
- **Digital Solution**: Meets kids where they are (on screens)
- **Scalability**: AI enables millions to test simultaneously
- **Data-Driven**: Track progress over time with detailed metrics
- **Motivation**: Gamification drives engagement better than ever

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:5173** in your browser.

### Requirements
- Node.js 16+
- Modern browser (Chrome, Firefox, Safari, Edge)
- Webcam (optional, for live recording)

**Note**: All AI processing happens in your browser using MediaPipe - no backend server or cloud required!

## 📚 Documentation

### Technical Documentation
- **[QUICK_START.md](QUICK_START.md)** - Setup and usage guide
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing procedures
- **[WORKOUT_SETUP.md](WORKOUT_SETUP.md)** - Detailed workout configuration


### Live Recording + Video Upload
- 💪 **Push-ups** - Rep counting, elbow angle tracking, form validation
- 🏋️ **Pull-ups** - Chin-over-bar detection, full range of motion
- 🧘 **Sit-ups** - Torso angle tracking, proper form validation
- 🦘 **Vertical Jump** - Jump height measurement, air time tracking
- 🏃 **Shuttle Run** - Distance tracking, direction change detection

### Video Upload Only
- 🤸 **Sit & Reach** - Flexibility measurement
- 🦵 **Vertical Broad Jump** - Horizontal distance tracking

**All tests match the original Presidential Fitness Test standards with AI-enhanced accuracy.**

## 🎨 Annotated Video Features

All processed videos include:
- **Skeleton Overlay**: Colored lines connecting body joints
- **Joint Markers**: Dots at key body points
- **Real-time Metrics**: Rep counter, angles, timer, state indicators
- **Form Feedback**: Correct/incorrect rep indicators
- **Color Coding**: Green (good form), Red (issues), Yellow (neutral)

## 🛠️ Technology Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- React Router
- TanStack Query

### Backend
- Node.js + Express
- Multer (file uploads)
- CSV Parser
- Child Process (Python integration)

### ML Processing
- Python 3.8+
- MediaPipe (pose detection)
- OpenCV (video processing)
- NumPy (calculations)
- Pandas (data handling)

## 📁 Project Structure

```
project/
├── src/                          # React frontend
│   ├── components/workout/       # Workout UI components
│   ├── services/                 # API services
│   └── pages/                    # App pages
├── server/                       # Node.js backend
│   ├── server.js                 # Express server
│   ├── uploads/                  # Temp video uploads
│   └── outputs/                  # Processed results
├── Talent Track py scripts/      # Python ML scripts
│   ├── pushup_video.py
│   ├── pullup_video.py
│   ├── situp_video.py
│   ├── verticaljump_video.py
│   ├── shuttlerun_video.py
│   └── requirements.txt
└── Documentation/                # Guides and docs
```

## 🎥 How It Works

1. **User uploads video or records live**
2. **Backend receives video and spawns Python process**
3. **Python script processes video:**
   - Detects body landmarks with MediaPipe
   - Tracks joint angles
   - Counts reps/jumps
   - Validates form
   - Draws skeleton overlay
   - Generates annotated video
4. **Backend returns results to frontend**
5. **User views annotated video with statistics**

## 📊 Output Data

### Annotated Video
- MP4 format with skeleton overlay
- Colored lines connecting joints
- Joint markers (dots)
- On-screen metrics (reps, angles, timer)
- Form indicators

### CSV Data
Detailed metrics per rep:
- Timestamps
- Joint angles
- Duration
- Form validation
- Performance statistics

## 🔧 Requirements

- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **Webcam** (optional, for live recording)

## 🎓 Usage

1. **Login** - Select Athlete role
2. **Select Workout** - Choose from 7 workout types
3. **Record/Upload** - Use camera or upload video
4. **Wait for Processing** - AI analyzes your workout (30-60 seconds)
5. **View Results** - Watch annotated video with skeleton overlay
6. **Review Metrics** - Check reps, form, angles, and statistics
7. **Submit** - Save workout to your profile

## 🐛 Troubleshooting

### Backend Connection Issues
```bash
# Ensure backend is running
cd server
npm start
```

### Python Errors
```bash
# Reinstall dependencies
cd "Talent Track py scripts"
pip install -r requirements.txt
```

### Camera Access
- Allow camera permissions in browser
- Try Chrome (recommended)
- Close other apps using camera

See [WORKOUT_SETUP.md](WORKOUT_SETUP.md) for detailed troubleshooting.

## 📈 Performance

- **Processing Time**: 30-60 seconds per video
- **Video Length**: 30 seconds to 2 minutes recommended
- **Resolution**: 720p or higher for best results
- **CPU Usage**: Moderate (MediaPipe optimized)

## 🎯 Tips for Best Results

- **Lighting**: Bright, even lighting
- **Framing**: Full body visible in frame
- **Background**: Plain, uncluttered
- **Camera**: Steady, landscape orientation
- **Clothing**: Fitted clothing for better detection

## 🚀 Future Enhancements

- Browser-based processing (TensorFlow.js)
- Cloud storage integration
- Social features (leaderboards, challenges)
- Mobile app (React Native)
- Advanced analytics dashboard
- Video comparison tools
- Progress tracking graphs

## 📞 Support

For issues or questions:
1. Check documentation in project root
2. Review browser console (F12)
3. Check server terminal for errors
4. Verify all dependencies installed

## 🙏 Credits

- **MediaPipe** - Google's ML framework
- **OpenCV** - Computer vision library
- **React** - UI framework
- **shadcn/ui** - Component library

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

## 🎉 Get Started

Ready to analyze your workouts? Run `start-full-app.bat` and start training! 💪
