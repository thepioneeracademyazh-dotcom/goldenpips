import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className }: LogoProps) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const imgSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('rounded-full overflow-hidden shrink-0', imgSizes[size])}>
        <img src="/favicon.png" alt="Golden Pips" className="w-full h-full object-cover" />
      </div>
      <div className={cn(
        'relative font-bold tracking-tight',
        sizes[size]
      )}>
        <span className="text-gradient-gold">Golden</span>
        <span className="text-foreground ml-1">Pips</span>
      </div>
      <div className="w-2 h-2 rounded-full bg-primary animate-pulse-gold" />
    </div>
  );
}
