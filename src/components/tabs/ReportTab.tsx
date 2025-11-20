import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartBar as BarChart3, Calendar, Target, TrendingUp, Download, Award, Clock, Zap, Scale, Ruler, Activity, Play } from 'lucide-react';
import { getWorkoutHistory, getRecentWorkouts, getStorageInfo } from '@/utils/workoutStorage';

interface ReportTabProps {
  userSetupData?: any;
}

const ReportTab = ({ userSetupData }: ReportTabProps) => {
  // Get workout history from localStorage
  const workoutHistory = getWorkoutHistory();
  const recentWorkouts = getRecentWorkouts(2); // Get last 2 workouts
  const storageInfo = getStorageInfo();
  
  // Get current day
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  
  const weeklyStats = [
    { day: 'Mon', value: 85 },
    { day: 'Tue', value: 92 },
    { day: 'Wed', value: 78 },
    { day: 'Thu', value: 95 },
    { day: 'Fri', value: 88 },
    { day: 'Sat', value: 76 },
    { day: 'Sun', value: 82 }
  ];

  const achievements = [
    { 
      title: '5-Day Streak',
      description: 'Completed workouts 5 days in a row',
      icon: '🔥',
      date: '2 days ago'
    },
    {
      title: 'Push-up Master',
      description: 'Completed 100 push-ups in one session',
      icon: '💪',
      date: '1 week ago'
    },
    {
      title: 'First Challenge',
      description: 'Completed your first fitness challenge',
      icon: '🏆',
      date: '2 weeks ago'
    }
  ];

  // Calculate BMI from setup data
  const calculateBMI = () => {
    if (userSetupData?.height && userSetupData?.weight) {
      const heightM = userSetupData.height / 100; // Convert cm to m
      const bmi = userSetupData.weight / (heightM * heightM);
      return bmi.toFixed(1);
    }
    return "22.9"; // Default value
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Underweight", color: "info" };
    if (bmi < 25) return { category: "Normal Weight", color: "success" };
    if (bmi < 30) return { category: "Overweight", color: "warning" };
    return { category: "Obese", color: "destructive" };
  };

  const bmiValue = parseFloat(calculateBMI());
  const bmiInfo = getBMICategory(bmiValue);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Report</h1>
        <p className="text-muted-foreground">Track your fitness progress</p>
      </div>

      {/* Recent Workouts - Last 2 Only */}
      {recentWorkouts.length > 0 && (
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary" />
                <span>Recent Workouts</span>
              </div>
              <Badge variant="outline" className="text-xs">
                Last {recentWorkouts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentWorkouts.reverse().map((workout, index) => (
                <Card key={workout.id || index} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4 mb-3">
                      {/* Workout Thumbnail */}
                      <div className="w-16 h-12 bg-black rounded overflow-hidden relative flex-shrink-0">
                        {workout.thumbnailUrl ? (
                          <img 
                            src={workout.thumbnailUrl} 
                            alt={`${workout.activityName} thumbnail`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <Play className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </div>
                      
                      {/* Workout Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{workout.activityName}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(workout.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div>
                        <div className="text-sm font-medium">{workout.setsCompleted}</div>
                        <div className="text-xs text-muted-foreground">Sets</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{workout.badSets}</div>
                        <div className="text-xs text-muted-foreground">Bad Sets</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{workout.duration}</div>
                        <div className="text-xs text-muted-foreground">Duration</div>
                      </div>
                      <div>
                        <Badge 
                          className={`text-xs ${workout.posture === 'Good' ? 'bg-success/10 text-success border-success' : 'bg-warning/10 text-warning border-warning'}`}
                          variant="outline"
                        >
                          {workout.posture}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Storage Info */}
            <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total workouts: {storageInfo.workoutCount}</span>
                <span>Thumbnails: {storageInfo.thumbnailCount}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Older workout thumbnails are automatically removed to save space
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BMI Tracker */}
      <Card className="mb-6 card-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-primary" />
            <span>BMI Tracker</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Ruler className="w-4 h-4 text-muted-foreground mr-1" />
              </div>
              <div className="text-sm font-medium">{userSetupData?.height || "175"} cm</div>
              <div className="text-xs text-muted-foreground">Height</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Scale className="w-4 h-4 text-muted-foreground mr-1" />
              </div>
              <div className="text-sm font-medium">{userSetupData?.weight || "70"} kg</div>
              <div className="text-xs text-muted-foreground">Weight</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">{calculateBMI()}</div>
              <div className="text-xs text-muted-foreground">BMI</div>
            </div>
          </div>
          <div className={`p-3 rounded-lg bg-${bmiInfo.color}/10 border border-${bmiInfo.color}/20`}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Category</span>
              <Badge variant="outline" className={`text-${bmiInfo.color}`}>
                {bmiInfo.category}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="card-elevated">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-primary mr-2" />
              <span className="text-2xl font-bold text-primary">{workoutHistory.length > 0 ? '92%' : '87%'}</span>
            </div>
            <p className="text-sm text-muted-foreground">Weekly Goal</p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-success mr-2" />
              <span className="text-2xl font-bold text-success">{workoutHistory.length > 0 ? '9.2h' : '8.5h'}</span>
            </div>
            <p className="text-sm text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress Chart */}
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span>Weekly Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyStats.map((stat) => {
              const isToday = stat.day === today;
              return (
                <div key={stat.day} className="flex items-center space-x-3">
                  <span className={`text-sm font-medium w-8 ${isToday ? 'text-primary font-bold' : ''}`}>
                    {stat.day}
                    {isToday && <span className="ml-1 text-xs">•</span>}
                  </span>
                  <div className="flex-1 bg-secondary rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isToday ? 'bg-primary ring-2 ring-primary/30' : 'bg-primary'}`}
                      style={{ width: `${stat.value}%` }}
                    />
                  </div>
                  <span className={`text-sm w-8 ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {stat.value}%
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average completion</span>
              <span className="font-medium text-primary">{workoutHistory.length > 0 ? '88%' : '85%'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <span>Performance Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workoutHistory.length > 0 && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <p className="text-sm font-medium text-primary">Recent Activity</p>
                  <p className="text-xs text-muted-foreground">You've completed {workoutHistory.length} workout{workoutHistory.length !== 1 ? 's' : ''} with AI analysis</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-3 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-success rounded-full mt-2" />
              <div>
                <p className="text-sm font-medium text-success">Strength Improving</p>
                <p className="text-xs text-muted-foreground">Your push-up performance increased by 15% this week</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-warning rounded-full mt-2" />
              <div>
                <p className="text-sm font-medium text-warning">Flexibility Focus</p>
                <p className="text-xs text-muted-foreground">Consider adding more stretching to your routine</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-info/10 rounded-lg border border-info/20">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-info rounded-full mt-2" />
              <div>
                <p className="text-sm font-medium text-info">Consistency Bonus</p>
                <p className="text-xs text-muted-foreground">You're on track for your monthly goal!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-warning" />
            <span>Recent Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{achievement.title}</h3>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{achievement.date}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  New
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Export Data</h3>
              <p className="text-sm text-muted-foreground">Download your fitness reports</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder */}
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="font-semibold mb-2">Advanced Analytics Coming Soon</h3>
          <p className="text-sm text-muted-foreground">
            Detailed performance analysis, comparison charts, and personalized recommendations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportTab;