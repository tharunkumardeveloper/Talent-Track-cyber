import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface CSVDataDisplayProps {
  csvData: any[];
  activityName: string;
}

const CSVDataDisplay = ({ csvData, activityName }: CSVDataDisplayProps) => {
  if (!csvData || csvData.length === 0) {
    return null;
  }

  const renderPushupData = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Rep</th>
            <th className="text-left p-2">Down Time</th>
            <th className="text-left p-2">Up Time</th>
            <th className="text-left p-2">Duration</th>
            <th className="text-left p-2">Min Angle</th>
            <th className="text-left p-2">Form</th>
          </tr>
        </thead>
        <tbody>
          {csvData.map((row, idx) => (
            <tr key={idx} className="border-b hover:bg-secondary/50">
              <td className="p-2 font-medium">{row.count}</td>
              <td className="p-2">{(row.down_time || row.downTime)?.toFixed(2) || 'N/A'}s</td>
              <td className="p-2">{(row.up_time || row.upTime)?.toFixed(2) || 'N/A'}s</td>
              <td className="p-2">{(row.dip_duration_sec || row.dipDuration)?.toFixed(2) || 'N/A'}s</td>
              <td className="p-2">{(row.min_elbow_angle || row.minElbowAngle)?.toFixed(0) || 'N/A'}°</td>
              <td className="p-2">
                {row.correct === true || row.correct === 'True' ? (
                  <Badge className="bg-success/10 text-success border-success" variant="outline">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Good
                  </Badge>
                ) : (
                  <Badge className="bg-destructive/10 text-destructive border-destructive" variant="outline">
                    <XCircle className="w-3 h-3 mr-1" />
                    Bad
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPullupData = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Rep</th>
            <th className="text-left p-2">Up Time</th>
            <th className="text-left p-2">Down Time</th>
            <th className="text-left p-2">Duration</th>
            <th className="text-left p-2">Min Angle</th>
          </tr>
        </thead>
        <tbody>
          {csvData.map((row, idx) => (
            <tr key={idx} className="border-b hover:bg-secondary/50">
              <td className="p-2 font-medium">{row.count}</td>
              <td className="p-2">{(row.up_time || row.upTime)?.toFixed(2) || 'N/A'}s</td>
              <td className="p-2">{(row.down_time || row.downTime)?.toFixed(2) || 'N/A'}s</td>
              <td className="p-2">{(row.dip_duration_sec || row.dipDuration)?.toFixed(2) || 'N/A'}s</td>
              <td className="p-2">{(row.min_elbow_angle || row.minElbowAngle)?.toFixed(0) || 'N/A'}°</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderJumpData = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Jump</th>
            <th className="text-left p-2">Takeoff</th>
            <th className="text-left p-2">Height</th>
            <th className="text-left p-2">Air Time</th>
          </tr>
        </thead>
        <tbody>
          {csvData.map((row, idx) => (
            <tr key={idx} className="border-b hover:bg-secondary/50">
              <td className="p-2 font-medium">{row.count}</td>
              <td className="p-2">{(row.takeoff_time || row.timestamp)?.toFixed(2) || 'N/A'}s</td>
              <td className="p-2">{(row.jump_height_m || row.jumpHeight)?.toFixed(3) || 'N/A'}m</td>
              <td className="p-2">{(row.air_time_s || row.airTime)?.toFixed(2) || 'N/A'}s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSitReachData = () => {
    // For sit and reach, we only have one measurement with max reach
    const maxReach = csvData[0]?.reach_m || 0;
    const timeOfMax = csvData[0]?.time_of_max || 0;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-success">{maxReach.toFixed(2)}m</div>
            <div className="text-xs text-muted-foreground mt-1">Maximum Reach</div>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">{timeOfMax.toFixed(2)}s</div>
            <div className="text-xs text-muted-foreground mt-1">Time of Max Reach</div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground text-center">
          <p>✅ Maximum forward reach distance measured</p>
        </div>
      </div>
    );
  };

  const renderGenericData = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Rep</th>
            <th className="text-left p-2">Time</th>
            <th className="text-left p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {csvData.map((row, idx) => (
            <tr key={idx} className="border-b hover:bg-secondary/50">
              <td className="p-2 font-medium">{row.count}</td>
              <td className="p-2">{row.timestamp?.toFixed(2)}s</td>
              <td className="p-2">
                {row.correct !== undefined ? (
                  row.correct ? (
                    <Badge className="bg-success/10 text-success" variant="outline">Good</Badge>
                  ) : (
                    <Badge className="bg-destructive/10 text-destructive" variant="outline">Bad</Badge>
                  )
                ) : (
                  <Badge variant="outline">Completed</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderData = () => {
    // Check if activity name includes push-up variations
    if (activityName.toLowerCase().includes('push')) {
      return renderPushupData();
    }
    
    switch (activityName) {
      case 'Pull-ups':
        return renderPullupData();
      case 'Vertical Jump':
        return renderJumpData();
      case 'Sit-ups':
        return renderPushupData(); // Similar format
      case 'Sit Reach':
        return renderSitReachData();
      default:
        return renderGenericData();
    }
  };

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-base">Detailed Rep Data</CardTitle>
      </CardHeader>
      <CardContent>
        {renderData()}
        {activityName !== 'Sit Reach' && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            📊 {csvData.length} {csvData.length === 1 ? 'rep' : 'reps'} recorded
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CSVDataDisplay;
