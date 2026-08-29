import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { classNames } from '@/utils/helpers';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, hint, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">{icon}</div>}
          <input
            ref={ref}
            id={inputId}
            className={classNames('input-base', icon ? 'pl-10' : '', error ? 'border-danger focus:border-danger focus:ring-danger' : '', className)}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-text-secondary">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
export default Input;
