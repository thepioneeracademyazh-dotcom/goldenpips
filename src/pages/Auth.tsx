import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
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

type AuthStep = 'form' | 'otp-signup' | 'otp-reset' | 'new-password';

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
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const startResendTimer = useCallback(() => {
    setResendTimer(RESEND_COOLDOWN);
  }, []);

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
            // User exists but not confirmed - resend OTP
            setPendingEmail(data.email);
            await supabase.auth.resend({ type: 'signup', email: data.email });
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
        // Sign up - sends confirmation email with OTP
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
        setPendingEmail(data.email);
        setStep('otp-signup');
        startResendTimer();
        toast.success('OTP sent to your email!');
      }
    } catch (error) {
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
      const { error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otpValue,
        type: 'signup',
      });

      if (error) {
        toast.error(error.message || 'Invalid OTP. Please try again.');
        return;
      }

      toast.success('Email verified! Welcome to Golden Pips!');
      navigate(from, { replace: true });
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
      if (error) {
        toast.error(error.message);
        return;
      }
      setPendingEmail(resetEmail);
      setStep('otp-reset');
      startResendTimer();
      toast.success('OTP sent to your email!');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyResetOtp = async () => {
    if (otpValue.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otpValue,
        type: 'recovery',
      });

      if (error) {
        toast.error(error.message || 'Invalid OTP. Please try again.');
        return;
      }

      setStep('new-password');
      toast.success('OTP verified! Set your new password.');
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setVerifying(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Password reset successfully!');
      setStep('form');
      setOtpValue('');
      setResetEmail('');
      setNewPassword('');
      setConfirmPassword('');
      navigate('/', { replace: true });
    } catch {
      toast.error('Failed to reset password.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    try {
      if (step === 'otp-signup') {
        await supabase.auth.resend({ type: 'signup', email: pendingEmail });
      } else if (step === 'otp-reset') {
        await supabase.auth.resetPasswordForEmail(pendingEmail);
      }
      startResendTimer();
      toast.success('OTP resent!');
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  const goBack = () => {
    setStep('form');
    setOtpValue('');
    setResetEmail('');
  };

  // OTP Screen Component
  const renderOtpScreen = (title: string, description: string, onVerify: () => void) => (
    <div className="w-full max-w-sm space-y-8 relative">
      <div className="flex flex-col items-center gap-4">
        <Logo size="lg" />
      </div>

      <Card className="card-trading border-primary/20">
        <CardHeader className="text-center pb-4">
          <button onClick={goBack} className="absolute top-4 left-4 p-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          <p className="text-xs text-primary font-medium mt-1">{pendingEmail}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OTP Input */}
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otpValue}
              onChange={setOtpValue}
            >
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
            onClick={onVerify}
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

          {/* Resend */}
          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend OTP in <span className="text-primary font-semibold">{resendTimer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResendOtp}
                className="text-sm text-primary hover:underline font-medium"
              >
                Resend OTP
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Forgot Password - Email Entry
  const renderForgotEmail = () => (
    <div className="w-full max-w-sm space-y-8 relative">
      <div className="flex flex-col items-center gap-4">
        <Logo size="lg" />
      </div>

      <Card className="card-trading border-primary/20">
        <CardHeader className="text-center pb-4">
          <button onClick={goBack} className="absolute top-4 left-4 p-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <CardTitle className="text-xl">Reset Password</CardTitle>
          <CardDescription>Enter your email to receive an OTP</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleForgotPassword}
            disabled={isSubmitting}
            className="w-full gradient-gold text-primary-foreground font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send OTP'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // New Password Screen
  const renderNewPassword = () => (
    <div className="w-full max-w-sm space-y-8 relative">
      <div className="flex flex-col items-center gap-4">
        <Logo size="lg" />
      </div>

      <Card className="card-trading border-primary/20">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">Set New Password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleSetNewPassword}
            disabled={verifying}
            className="w-full gradient-gold text-primary-foreground font-semibold"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gradient-bg-premium">
      {/* Background accents */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative">
        {/* OTP Signup */}
        {step === 'otp-signup' && renderOtpScreen(
          'Verify Email',
          'Enter the 6-digit code sent to',
          handleVerifySignupOtp
        )}

        {/* OTP Reset */}
        {step === 'otp-reset' && renderOtpScreen(
          'Enter OTP',
          'Enter the 6-digit code sent to',
          handleVerifyResetOtp
        )}

        {/* New Password */}
        {step === 'new-password' && renderNewPassword()}

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
                  {isLogin
                    ? 'Sign in to access your signals'
                    : 'Join Golden Pips today'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-destructive text-xs">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-destructive text-xs">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor="terms"
                      className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                    >
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary hover:underline font-medium">
                        Terms & Conditions
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-primary hover:underline font-medium">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>

                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail('');
                        setStep('otp-reset');
                        setOtpValue('');
                      }}
                      className="text-xs text-primary hover:underline w-full text-right -mt-2"
                    >
                      Forgot Password?
                    </button>
                  )}

                  <Button
                    type="submit"
                    className="w-full gradient-gold text-primary-foreground font-semibold"
                    disabled={isSubmitting || !acceptedTerms}
                  >
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
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
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

        {/* Forgot Password Email Entry (shown when step is otp-reset but no pendingEmail yet) */}
        {step === 'otp-reset' && !pendingEmail && renderForgotEmail()}
      </div>
    </div>
  );
}
