import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShieldCheck,
  BellRing,
  Crown,
  LineChart,
  Clock,
  ArrowRight,
  Check,
  Quote,
  Star,
  ChevronDown,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: TrendingUp,
    title: 'Expert XAUUSD Signals',
    description: 'Clear entry, stop loss and two take-profit levels on every gold trade we share.',
  },
  {
    icon: BellRing,
    title: 'Instant Alerts',
    description: 'Push notifications the moment a signal goes live, so you never miss an entry.',
  },
  {
    icon: LineChart,
    title: 'Live Updates',
    description: 'Every signal updates in real time as targets are hit or the setup is closed.',
  },
  {
    icon: ShieldCheck,
    title: 'Disciplined Risk',
    description: 'Defined risk on each setup with transparent results and full signal history.',
  },
];

const planPoints = [
  'Unlimited premium gold signals',
  'Real-time entry and exit updates',
  'Push alerts on every new setup',
  'Complete signal history access',
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="card-trading overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="font-semibold text-foreground text-sm">{question}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      )}
    </Card>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-area-top">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16 px-4">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auth')}
              className="font-semibold"
            >
              Log in
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/auth?mode=signup')}
              className="gradient-gold text-primary-foreground font-bold"
            >
              Sign up
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pt-14 pb-16">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

          <div className="relative max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/15 text-success text-[11px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Live gold signals
            </span>

            <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Trade gold with <span className="text-gradient-gold">confidence</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
              GoldenPips delivers precise XAUUSD trading signals with clear entries,
              stop loss and targets — straight to your phone in real time.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate('/auth?mode=signup')}
                className="w-full sm:w-auto gradient-gold text-primary-foreground font-bold glow-gold-sm"
              >
                Create free account <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/auth')}
                className="w-full sm:w-auto border-primary/30 text-primary hover:bg-primary/10 font-semibold"
              >
                Log in
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3 max-w-md mx-auto">
              {[
                { value: 'XAUUSD', label: 'Focused pair' },
                { value: '24/5', label: 'Market cover' },
                { value: 'Live', label: 'Signal updates' },
              ].map((stat) => (
                <div key={stat.label} className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-base font-extrabold text-primary">{stat.value}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-12 bg-muted/20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center">
              Everything you need to follow the market
            </h2>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-lg mx-auto">
              Built for traders who want clarity, not noise.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {features.map((feature) => (
                <Card key={feature.title} className="card-trading p-5">
                  <div className="p-2.5 rounded-xl bg-primary/10 w-fit">
                    <feature.icon className="w-6 h-6 text-primary stroke-[2.5]" />
                  </div>
                  <h3 className="mt-3 font-bold text-foreground">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center">How it works</h2>
            <div className="mt-8 space-y-4">
              {[
                { step: '1', title: 'Create your account', text: 'Sign up with your email in under a minute.' },
                { step: '2', title: 'Go premium', text: 'Unlock every signal with a simple monthly plan.' },
                { step: '3', title: 'Trade the alerts', text: 'Follow entries, stops and targets as they arrive.' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-9 h-9 shrink-0 rounded-full gradient-gold flex items-center justify-center font-extrabold text-primary-foreground">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Signal Benefits */}
        <section className="px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center">
              Why our signals work
            </h2>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-lg mx-auto">
              Clear rules, disciplined risk, and instant delivery.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'Entry, stop & target',
                  desc: 'Every signal includes exact entry price, stop loss and two take-profit levels.',
                },
                {
                  title: 'Real-time updates',
                  desc: 'Signals update instantly when targets hit or the setup is closed.',
                },
                {
                  title: 'Risk first',
                  desc: 'We share position risk before reward so you stay in control.',
                },
                {
                  title: '24/5 coverage',
                  desc: 'Active during gold market hours so you never miss a move.',
                },
                {
                  title: 'Mobile alerts',
                  desc: 'Push notifications the moment a signal goes live.',
                },
                {
                  title: 'Full history',
                  desc: 'Review every past signal and learn from transparent results.',
                },
              ].map((benefit) => (
                <Card key={benefit.title} className="card-trading p-5">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-foreground">{benefit.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{benefit.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-4 py-12 bg-muted/20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center">
              What traders say
            </h2>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-lg mx-auto">
              Real feedback from our community.
            </p>
            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              {[
                {
                  name: 'Rahul M.',
                  quote:
                    'The XAUUSD signals are precise. I finally have a clear entry and stop for every trade.',
                },
                {
                  name: 'Priya S.',
                  quote:
                    'Alerts come right on time. The risk-first approach helped me protect my capital.',
                },
                {
                  name: 'Amit K.',
                  quote:
                    'Clean setup, no noise. The daily quote and live updates keep me focused.',
                },
              ].map((t) => (
                <Card key={t.name} className="card-trading p-5 relative">
                  <Quote className="w-6 h-6 text-primary/40 absolute top-4 right-4" />
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-primary fill-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">"{t.quote}"</p>
                  <p className="mt-4 text-xs font-semibold text-primary">{t.name}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center">
              Frequently asked questions
            </h2>
            <div className="mt-8 space-y-3">
              {[
                {
                  q: 'Which market do the signals cover?',
                  a: 'All signals are for XAUUSD (gold vs US dollar) — the most liquid gold pair.',
                },
                {
                  q: 'How do I receive new signals?',
                  a: 'New signals appear instantly in the app and you get a push notification if enabled.',
                },
                {
                  q: 'Can I cancel my subscription?',
                  a: 'Yes, your premium access continues until the expiry date and is not auto-renewed.',
                },
                {
                  q: 'Do you offer refunds?',
                  a: 'Payments are final once the plan is activated. Contact support if you face a technical issue.',
                },
                {
                  q: 'Is this financial advice?',
                  a: 'No. Signals are for educational purposes only. Always trade according to your own risk tolerance.',
                },
              ].map((faq) => (
                <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* Premium */}
        <section className="px-4 py-12 bg-muted/20">
          <div className="max-w-xl mx-auto">
            <Card className="card-trading p-6 border-primary/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl gradient-gold">
                    <Crown className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Premium Membership</h3>
                    <p className="text-sm text-muted-foreground">Full access to every gold signal</p>
                  </div>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {planPoints.map((point) => (
                    <li key={point} className="flex items-center gap-2.5 text-sm text-foreground">
                      <Check className="w-4 h-4 text-success stroke-[3] shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  onClick={() => navigate('/auth?mode=signup')}
                  className="mt-6 w-full gradient-gold text-primary-foreground font-bold"
                >
                  Get started
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" /> Cancel anytime — no lock-in
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-14 text-center">
          <h2 className="text-2xl font-bold text-foreground">Ready to trade smarter?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Join GoldenPips and get your next gold signal as it happens.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate('/auth?mode=signup')}
              className="w-full sm:w-auto gradient-gold text-primary-foreground font-bold"
            >
              Sign up free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto border-primary/30 text-primary hover:bg-primary/10 font-semibold"
            >
              I already have an account
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 safe-area-bottom">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <button onClick={() => navigate('/help')} className="hover:text-foreground transition-colors">Help</button>
            <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">Privacy</button>
            <button onClick={() => navigate('/terms')} className="hover:text-foreground transition-colors">Terms</button>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          Trading involves risk. Signals are for educational purposes and are not financial advice.
        </p>
      </footer>
    </div>
  );
}
