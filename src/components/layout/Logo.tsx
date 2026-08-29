import { Shield } from 'lucide-react';
import { classNames } from '@/utils/helpers';

export default function Logo({ size = 'md', showText = true }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean }) {
  const iconSizes = { sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-10 h-10' };
  const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };
  return (
    <div className="flex items-center gap-2.5">
      <div className={classNames('flex items-center justify-center shrink-0', iconSizes[size])}>
        <Shield className={classNames('text-primary', size === 'lg' ? 'w-8 h-8' : 'w-6 h-6')} strokeWidth={2.5} />
      </div>
      {showText && (
        <div className="leading-tight flex flex-col">
          <span className={classNames('font-bold text-text-primary tracking-tight', textSizes[size])}>FraudShield</span>
          <span className="text-[10px] font-semibold text-primary uppercase tracking-widest leading-none mt-0.5">Financial Security</span>
        </div>
      )}
    </div>
  );
}
