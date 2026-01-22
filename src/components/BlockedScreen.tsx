import { ShieldX, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function BlockedScreen() {
  const handleContactSupport = () => {
    window.open('mailto:support@goldenpips.com?subject=Account%20Blocked%20-%20Appeal%20Request', '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="card-trading p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-8 h-8 text-destructive" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Account Suspended
        </h1>
        
        <p className="text-muted-foreground mb-6">
          Your account has been temporarily suspended. If you believe this is a mistake, 
          please contact our support team to resolve this issue.
        </p>
        
        <Button 
          onClick={handleContactSupport}
          className="w-full gradient-gold text-primary-foreground"
        >
          <Mail className="w-4 h-4 mr-2" />
          Contact Support
        </Button>
        
        <p className="text-xs text-muted-foreground mt-4">
          Reference: support@goldenpips.com
        </p>
      </Card>
    </div>
  );
}