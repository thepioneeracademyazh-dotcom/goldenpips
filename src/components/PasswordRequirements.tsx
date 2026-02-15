import { Check, X } from 'lucide-react';

interface PasswordRequirementsProps {
  password: string;
}

const requirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  if (!password) return null;

  return (
    <ul className="space-y-1 mt-1">
      {requirements.map((req) => {
        const met = req.test(password);
        return (
          <li key={req.label} className="flex items-center gap-1.5">
            {met ? (
              <Check className="w-3 h-3 text-green-500 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-destructive shrink-0" />
            )}
            <span className={`text-[10px] ${met ? 'text-green-500' : 'text-muted-foreground'}`}>
              {req.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

interface ConfirmPasswordMatchProps {
  password: string;
  confirmPassword: string;
}

export function ConfirmPasswordMatch({ password, confirmPassword }: ConfirmPasswordMatchProps) {
  if (!confirmPassword) return null;

  const match = password === confirmPassword;

  return (
    <p className={`text-[10px] font-semibold mt-1 ${match ? 'text-green-500' : 'text-destructive'}`}>
      {match ? '✓ Passwords match' : '✗ Passwords do not match'}
    </p>
  );
}
