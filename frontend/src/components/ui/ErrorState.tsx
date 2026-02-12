// Error State Component
// Consistent error display with retry functionality

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  canRetry?: boolean;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  canRetry = true,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-red-50 rounded-full p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 text-center max-w-md mb-6">{message}</p>

      {canRetry && onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

// Inline error for smaller contexts (cards, rows)

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
}

export function InlineError({ message, onRetry }: InlineErrorProps) {
  return (
    <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-md text-sm">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 hover:text-red-900 transition-colors"
          title="Retry"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// Toast error for notifications

export interface ToastErrorProps {
  message: string;
  duration?: number;
  onDismiss?: () => void;
}

export function ToastError({ message, onDismiss }: ToastErrorProps) {
  return (
    <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium text-sm">Error</p>
        <p className="text-sm opacity-90">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-white/80 hover:text-white transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}
