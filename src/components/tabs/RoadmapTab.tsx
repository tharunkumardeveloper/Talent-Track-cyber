import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  Target,
  Flag,
  ArrowRight,
  Trophy
} from 'lucide-react';

interface RoadmapTabProps {
  onViewAllBadges: () => void;
}

const RoadmapTab = ({ onViewAllBadges }: RoadmapTabProps) => {
  const roadmapItems = [
    {
      id: 1,
      title: 'Week 1: Foundation Building',
      description: 'Basic strength and mobility exercises',
      status: 'completed',
      date: 'Oct 1-7',
      activities: ['Push-ups', 'Planks', 'Squats'],
      progress: 100
    },
    {
      id: 2,
      title: 'Week 2: Strength Focus',
      description: 'Increase intensity and build muscle',
      status: 'completed',
      date: 'Oct 8-14',
      activities: ['Pull-ups', 'Deadlifts', 'Lunges'],
      progress: 100
    },
    {
      id: 3,
      title: 'Week 3: Endurance Training',
      description: 'Cardiovascular fitness improvement',
      status: 'current',
      date: 'Oct 15-21',
      activities: ['Running', 'Cycling', 'Swimming'],
      progress: 65
    },
    {
      id: 4,
      title: 'Week 4: Power Development',
      description: 'Explosive movement training',
      status: 'upcoming',
      date: 'Oct 22-28',
      activities: ['Plyometrics', 'Sprint Training', 'Jump Squats'],
      progress: 0
    },
    {
      id: 5,
      title: 'Week 5: Recovery & Assessment',
      description: 'Active recovery and progress evaluation',
      status: 'upcoming',
      date: 'Oct 29 - Nov 4',
      activities: ['Yoga', 'Stretching', 'Assessment Tests'],
      progress: 0
    }
  ];

  // User's last 3 badges
  const userBadges = [
    { id: 1, name: 'Strength Starter', icon: '💪', earned: true, category: 'Strength' },
    { id: 2, name: 'Endurance Sprinter', icon: '🏃', earned: true, category: 'Endurance' },
    { id: 3, name: 'Flexibility Master', icon: '🤸', earned: true, category: 'Flexibility' }
  ];

  const goals = [
    {
      title: 'Complete First Challenge',
      target: 'Nov 15, 2024',
      progress: 78,
      type: 'challenge'
    },
    {
      title: 'Increase Push-up Max',
      target: '50 reps',
      progress: 62,
      type: 'strength'
    },
    {
      title: 'Run 5K Non-stop',
      target: 'Dec 1, 2024',
      progress: 34,
      type: 'endurance'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'current':
        return <Circle className="w-5 h-5 text-primary fill-primary" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10 border-success/20';
      case 'current':
        return 'text-primary bg-primary/10 border-primary/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Roadmap</h1>
        <p className="text-muted-foreground">Your fitness journey ahead</p>
      </div>

      {/* Badge Showcase */}
      <Card className="mb-6 card-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-warning" />
              <span>Your Badges</span>
            </div>
            <Button variant="outline" size="sm" onClick={onViewAllBadges}>
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {userBadges.map((badge) => (
              <div key={badge.id} className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl border-2 border-success bg-success/20">
                  {badge.icon}
                </div>
                <div className="mt-2">
                  <p className="text-xs font-medium text-success line-clamp-2">
                    {badge.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Last 3 badges earned
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Week Highlight */}
      <Card className="card-elevated gradient-violet text-white">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">This Week</h2>
              <p className="text-white/80">Week 3: Endurance Training</p>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>65%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{ width: '65%' }} />
            </div>
          </div>
          <Button variant="secondary" size="sm" className="w-full">
            Continue Training
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Goals Overview */}
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary" />
            <span>Active Goals</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.map((goal, index) => (
            <div key={index} className="p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">{goal.title}</h3>
                <Badge variant="outline" className="text-xs">
                  {goal.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Target: {goal.target}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{goal.progress}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${goal.progress}%` }} 
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Flag className="w-5 h-5 text-primary" />
            <span>Training Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {roadmapItems.map((item, index) => (
              <div key={item.id} className="relative">
                {/* Timeline Line */}
                {index < roadmapItems.length - 1 && (
                  <div className="absolute left-[10px] top-8 w-0.5 h-16 bg-border" />
                )}
                
                <div className="flex items-start space-x-4">
                  {/* Status Icon */}
                  <div className="mt-1">
                    {getStatusIcon(item.status)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{item.title}</h3>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(item.status)}`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.date}</span>
                      </div>
                    </div>

                    {/* Activities */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.activities.map((activity) => (
                        <Badge key={activity} variant="secondary" className="text-xs">
                          {activity}
                        </Badge>
                      ))}
                    </div>

                    {/* Progress Bar */}
                    {item.progress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              item.status === 'completed' ? 'bg-success' : 'bg-primary'
                            }`}
                            style={{ width: `${item.progress}%` }} 
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    {item.status === 'current' && (
                      <Button size="sm" className="mt-3" variant="outline">
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Milestones */}
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold mb-2">Next Milestone</h3>
          <p className="text-muted-foreground mb-4">
            Complete Week 4 to unlock advanced training modules
          </p>
          <div className="text-4xl mb-2">🏆</div>
          <Badge variant="outline">2 weeks remaining</Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoadmapTab;