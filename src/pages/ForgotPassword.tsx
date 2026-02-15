import { useState, useEffect, useCallback } from 'react';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';

type ResetStep = 'email' | 'otp' | 'new-password';

const RESEND_COOLDOWN = 60;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<ResetStep>('email');
  const [email, setEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const startResendTimer = useCallback(() => setResendTimer(RESEND_COOLDOWN), []);

  const handleSendOtp = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { action: 'send_otp', email },
      });
      if (error) {
        toast.error('Something went wrong. Please try again.');
        return;
      }
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setStep('otp');
      startResendTimer();
      toast.success('OTP sent to your email!');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (otpValue.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { action: 'verify_and_reset', email, otp: otpValue, new_password: newPassword },
      });
      if (error) {
        try {
          const ctx = (error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            toast.error(body.error || 'Something went wrong. Please try again.');
          } else {
            toast.error('Something went wrong. Please try again.');
          }
        } catch {
          toast.error('Something went wrong. Please try again.');
        }
        return;
      }
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      toast.success('Password reset successfully!');
      navigate('/auth', { replace: true });
    } catch {
      toast.error('Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    try {
      await supabase.functions.invoke('reset-password', {
        body: { action: 'send_otp', email },
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

      <div className="relative w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4">
          <Logo size="lg" />
        </div>

        <Card className="card-trading border-primary/20">
          <CardHeader className="text-center pb-4">
            <button
              onClick={() => step === 'email' ? navigate('/auth') : setStep('email')}
              className="absolute top-4 left-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <CardTitle className="text-xl">
              {step === 'email' && 'Reset Password'}
              {step === 'otp' && 'Reset Password'}
            </CardTitle>
            <CardDescription>
              {step === 'email' && 'Enter your email to receive a verification code'}
              {step === 'otp' && 'Enter the 6-digit code and your new password'}
            </CardDescription>
            {step === 'otp' && (
              <p className="text-xs text-primary font-medium mt-1">{email}</p>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Step 1: Email */}
            {step === 'email' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSendOtp}
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
              </>
            )}

            {/* Step 2: OTP + New Password (combined) */}
            {step === 'otp' && (
              <>
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
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={newPassword} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  onClick={handleVerifyAndReset}
                  disabled={isSubmitting || otpValue.length !== 6}
                  className="w-full gradient-gold text-primary-foreground font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
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
              </>
            )}

            <div className="text-center pt-2">
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
