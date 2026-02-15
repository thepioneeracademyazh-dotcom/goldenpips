import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { score, label, color } = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };

    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;

    const levels = [
      { label: 'Very Weak', color: 'bg-destructive' },
      { label: 'Weak', color: 'bg-destructive' },
      { label: 'Fair', color: 'bg-orange-500' },
      { label: 'Good', color: 'bg-yellow-500' },
      { label: 'Strong', color: 'bg-green-500' },
    ];

    const idx = Math.min(s, 4);
    return { score: (s / 5) * 100, label: levels[idx].label, color: levels[idx].color };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-1">
      <Progress value={score} className="h-1.5 bg-muted" indicatorClassName={color} />
      <p className={`text-[10px] font-semibold tracking-wide ${
        score <= 40 ? 'text-destructive' : score <= 60 ? 'text-orange-500' : score <= 80 ? 'text-yellow-500' : 'text-green-500'
      }`}>
        {label}
      </p>
    </div>
  );
}
