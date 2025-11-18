import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, FolderOpen, Bell, CheckCircle } from 'lucide-react';
import { requestAllPermissions, isNativePlatform } from '@/services/notificationService';

interface PermissionRequestProps {
  onComplete: () => void;
}

export const PermissionRequest = ({ onComplete }: PermissionRequestProps) => {
  const [permissions, setPermissions] = useState({
    camera: false,
    storage: false,
    notifications: false,
  });
  const [isRequesting, setIsRequesting] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    // Show on both web and mobile
    // Check if we need to request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      setShowPermissions(true);
    } else if (isNativePlatform()) {
      setShowPermissions(true);
    } else {
      // Browser with notifications already granted/denied
      onComplete();
    }
  }, [onComplete]);

  const handleRequestPermissions = async () => {
    setIsRequesting(true);
    
    try {
      const result = await requestAllPermissions();
      setPermissions(result);
      
      // Wait a bit to show the checkmarks
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Error requesting permissions:', error);
      // Continue anyway
      onComplete();
    } finally {
      setIsRequesting(false);
    }
  };

  if (!showPermissions) {
    return null;
  }

  const allGranted = permissions.camera && permissions.storage && permissions.notifications;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Talent Track</CardTitle>
          <CardDescription>
            {isNativePlatform() 
              ? 'We need a few permissions to help you track your workouts'
              : 'Enable notifications to get updates while processing videos'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Permission items */}
          <div className="space-y-3">
            {isNativePlatform() && (
              <>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30">
                  {permissions.camera ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Camera className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">Camera Access</p>
                    <p className="text-xs text-muted-foreground">Record workout videos</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30">
                  {permissions.storage ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <FolderOpen className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">Storage Access</p>
                    <p className="text-xs text-muted-foreground">Save and load videos</p>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30">
              {permissions.notifications ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Bell className="w-5 h-5 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="font-medium">Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {isNativePlatform() 
                    ? 'Processing updates in background'
                    : 'Get notified when video processing completes'}
                </p>
              </div>
            </div>
          </div>

          {/* Action button */}
          {!allGranted && (
            <Button 
              onClick={handleRequestPermissions} 
              disabled={isRequesting}
              className="w-full"
            >
              {isRequesting ? 'Requesting...' : 'Grant Permissions'}
            </Button>
          )}

          {allGranted && (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All permissions granted!</p>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground">
            {isNativePlatform()
              ? 'You can change these permissions anytime in your device settings'
              : 'You can change notification settings in your browser anytime'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
