import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthFormData = z.infer<typeof authSchema>;

type AuthStep = 'form' | 'otp-signup';

const RESEND_COOLDOWN = 60;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [step, setStep] = useState<AuthStep>('form');
  const [otpValue, setOtpValue] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const startResendTimer = useCallback(() => setResendTimer(RESEND_COOLDOWN), []);

  const onSubmit = async (data: AuthFormData) => {
    if (!acceptedTerms) {
      toast.error('Please accept the Terms & Conditions and Privacy Policy');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(data.email, data.password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('Invalid email or password');
          } else if (error.message.includes('Email not confirmed')) {
            setPendingEmail(data.email);
            await supabase.functions.invoke('verify-signup', {
              body: { action: 'send_otp', email: data.email },
            });
            setStep('otp-signup');
            startResendTimer();
            toast.info('Please verify your email first. OTP sent!');
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please sign in.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        // Send custom OTP via Resend
        const { data: otpData, error: otpError } = await supabase.functions.invoke('verify-signup', {
          body: { action: 'send_otp', email: data.email },
        });
        if (otpError || otpData?.error) {
          toast.error('Failed to send verification email. Please try again.');
          return;
        }
        setPendingEmail(data.email);
        setStep('otp-signup');
        startResendTimer();
        toast.success('OTP sent to your email!');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySignupOtp = async () => {
    if (otpValue.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-signup', {
        body: { action: 'verify', email: pendingEmail, otp: otpValue },
      });

      if (error) {
        try {
          const ctx = (error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            toast.error(body.error || 'Verification failed. Please try again.');
          } else {
            toast.error('Verification failed. Please try again.');
          }
        } catch {
          toast.error('Verification failed. Please try again.');
        }
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // Send welcome notification
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: { email: pendingEmail, type: 'welcome' },
        });
      } catch {
        // Non-critical
      }

      toast.success('Email verified! Welcome to GoldenPips!');
      // Sign in the user after verification
      navigate('/auth', { replace: true });
      setStep('form');
      setOtpValue('');
      toast.info('Please sign in with your credentials.');
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    try {
      await supabase.functions.invoke('verify-signup', {
        body: { action: 'send_otp', email: pendingEmail },
      });
      startResendTimer();
      toast.success('OTP resent!');
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gradient-bg-premium">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative">
        {/* OTP Signup Verification */}
        {step === 'otp-signup' && (
          <div className="w-full max-w-sm space-y-8 relative">
            <div className="flex flex-col items-center gap-4">
              <Logo size="lg" />
            </div>

            <Card className="card-trading border-primary/20">
              <CardHeader className="text-center pb-4">
                <button onClick={() => { setStep('form'); setOtpValue(''); }} className="absolute top-4 left-4 p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                </button>
                <CardTitle className="text-xl">Verify Email</CardTitle>
                <CardDescription>Enter the 6-digit code sent to</CardDescription>
                <p className="text-xs text-primary font-medium mt-1">{pendingEmail}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className="w-12 h-14 text-lg font-bold border-2 border-primary/30 bg-background text-foreground rounded-lg
                            data-[active=true]:border-primary data-[active=true]:ring-2 data-[active=true]:ring-primary/20"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerifySignupOtp}
                  disabled={verifying || otpValue.length !== 6}
                  className="w-full gradient-gold text-primary-foreground font-semibold"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </Button>

                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Resend OTP in <span className="text-primary font-semibold">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button onClick={handleResendOtp} className="text-sm text-primary hover:underline font-medium">
                      Resend OTP
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Auth Form */}
        {step === 'form' && (
          <div className="w-full max-w-sm space-y-8 relative">
            <div className="flex flex-col items-center gap-4">
              <Logo size="lg" />
              <p className="text-muted-foreground text-center text-sm">
                Premium Gold Trading Signals
              </p>
            </div>

            <Card className="card-trading border-primary/20">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </CardTitle>
                <CardDescription>
                  {isLogin ? 'Sign in to access your signals' : 'Join GoldenPips today'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="you@example.com" className="pl-10" {...register('email')} />
                    </div>
                    {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10" {...register('password')} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(checked) => setAcceptedTerms(checked === true)} className="mt-0.5" />
                    <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary hover:underline font-medium">Terms & Conditions</Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>
                    </label>
                  </div>

                  {isLogin && (
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline w-full text-right block -mt-2">
                      Forgot Password?
                    </Link>
                  )}

                  <Button type="submit" className="w-full gradient-gold text-primary-foreground font-semibold" disabled={isSubmitting || !acceptedTerms}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isLogin ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : (
                      isLogin ? 'Sign In' : 'Create Account'
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {isLogin ? (
                      <>Don't have an account? <span className="text-primary font-medium">Sign up</span></>
                    ) : (
                      <>Already have an account? <span className="text-primary font-medium">Sign in</span></>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
