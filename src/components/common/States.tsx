import type { ReactNode } from 'react';
import { Loader2, Inbox, AlertCircle, SearchX } from 'lucide-react';

export function LoadingState({ message = 'Loading...', className }: { message?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className || ''}`}>
      <Loader2 className="w-8 h-8 text-accent-500 animate-spin mb-3" />
      <p className="text-sm text-ink-300">{message}</p>
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-ink-800 rounded-lg ${className || ''}`} />;
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => <SkeletonCard key={i} className="h-8" />)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => <SkeletonCard key={c} className="h-10" />)}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ message, subMessage, icon, action }: { message: string; subMessage?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-ink-800 flex items-center justify-center mb-4 text-ink-400">
        {icon || <Inbox className="w-7 h-7" />}
      </div>
      <p className="text-ink-100 font-medium">{message}</p>
      {subMessage && <p className="text-sm text-ink-400 mt-1 max-w-sm">{subMessage}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function NoResultsState({ message = 'No results found', subMessage = 'Try adjusting your search or filters' }: { message?: string; subMessage?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-ink-800 flex items-center justify-center mb-4 text-ink-400">
        <SearchX className="w-7 h-7" />
      </div>
      <p className="text-ink-100 font-medium">{message}</p>
      <p className="text-sm text-ink-400 mt-1">{subMessage}</p>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-danger-500/10 flex items-center justify-center mb-4 text-danger-500">
        <AlertCircle className="w-7 h-7" />
      </div>
      <p className="text-ink-100 font-medium">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 btn-secondary text-sm">Try Again</button>
      )}
    </div>
  );
}
