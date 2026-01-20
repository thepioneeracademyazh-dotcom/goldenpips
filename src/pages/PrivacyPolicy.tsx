import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, Lock, Eye, Database, Bell } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <AppLayout>
      <div className="p-4 pb-24 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: January 2026</p>
          </div>
        </div>

        {/* Signal Disclaimer - Prominent */}
        <Card className="card-trading border-destructive/50 bg-destructive/5 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Trading Signal Disclaimer
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-foreground space-y-3">
            <p>
              <strong>RISK WARNING:</strong> Trading cryptocurrencies and forex involves substantial risk of loss and is not suitable for all investors. Past performance is not indicative of future results.
            </p>
            <p>
              The trading signals provided by GoldenPips are for <strong>educational and informational purposes only</strong>. They do not constitute financial advice, investment recommendations, or a solicitation to buy or sell any financial instruments.
            </p>
            <p>
              <strong>You acknowledge that:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>You trade at your own risk and discretion</li>
              <li>You may lose some or all of your invested capital</li>
              <li>GoldenPips is not responsible for any trading losses</li>
              <li>You should never invest money you cannot afford to lose</li>
              <li>You should seek independent financial advice if unsure</li>
            </ul>
            <p className="text-xs text-muted-foreground italic mt-3">
              By using our signals, you accept full responsibility for your trading decisions and any resulting gains or losses.
            </p>
          </CardContent>
        </Card>

        {/* Privacy Sections */}
        <div className="space-y-4">
          <Card className="card-trading">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>We collect the following information when you use GoldenPips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Email address for account creation and communication</li>
                <li>Payment information processed securely via third-party gateways</li>
                <li>Usage data to improve our services</li>
                <li>Device information for app optimization</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-trading">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                How We Use Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Your information is used to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Provide and maintain our trading signal services</li>
                <li>Process subscriptions and payments</li>
                <li>Send important updates and notifications</li>
                <li>Improve user experience and app performance</li>
                <li>Comply with legal obligations</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-trading">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>We implement industry-standard security measures:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Encrypted data transmission (SSL/TLS)</li>
                <li>Secure authentication systems</li>
                <li>Regular security audits</li>
                <li>Limited access to personal information</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-trading">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Access your personal data</li>
                <li>Request data correction or deletion</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data</li>
              </ul>
              <p className="mt-2">
                Contact us at <a href="mailto:privacy@goldenpips.com" className="text-primary hover:underline">privacy@goldenpips.com</a> for any privacy-related requests.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          This policy may be updated periodically. Continued use of our services constitutes acceptance of any changes.
        </p>
      </div>
    </AppLayout>
  );
}
