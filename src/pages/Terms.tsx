import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Link to="/auth">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-6 text-primary">Terms & Conditions</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using Golden Pips, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Trading Signals Disclaimer</h2>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive font-medium">
                ⚠️ IMPORTANT RISK WARNING
              </p>
              <p className="text-muted-foreground mt-2">
                Trading in financial markets involves substantial risk of loss and is not suitable for all investors. The trading signals provided by Golden Pips are for educational and informational purposes only and should not be construed as investment advice.
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Past performance is not indicative of future results</li>
                <li>You may lose more than your initial investment</li>
                <li>Never trade with money you cannot afford to lose</li>
                <li>Golden Pips is not responsible for any trading losses</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Service Description</h2>
            <p className="text-muted-foreground">
              Golden Pips provides gold trading signals including entry points, take profit levels, and stop loss recommendations. Our service includes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Real-time trading signals via the app</li>
              <li>Push notifications for new signals</li>
              <li>Premium subscription features</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. User Responsibilities</h2>
            <p className="text-muted-foreground">
              As a user of Golden Pips, you agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Provide accurate registration information</li>
              <li>Keep your account credentials secure</li>
              <li>Not share your subscription with others</li>
              <li>Use the service for personal, non-commercial purposes only</li>
              <li>Make your own trading decisions independently</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Subscription & Payments</h2>
            <p className="text-muted-foreground">
              Premium subscriptions are billed according to the plan selected. By subscribing, you agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Pay all applicable fees for your subscription</li>
              <li>Subscriptions are non-refundable unless otherwise stated</li>
              <li>We reserve the right to modify pricing with notice</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Golden Pips and its operators shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our services, including but not limited to trading losses.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Modifications</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms & Conditions, please contact us at:{' '}
              <a href="mailto:goldenpipsofficial1@gmail.com" className="text-primary hover:underline">
                goldenpipsofficial1@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
