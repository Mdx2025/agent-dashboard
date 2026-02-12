// Loading State Component
// Provides consistent loading indicators across the dashboard

import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function LoadingState({
  message = 'Loading...',
  size = 'md',
  fullScreen = false,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const Container = fullScreen ? 'div' : 'div';

  return (
    <Container
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen ? 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50' : 'py-12'
      }`}
    >
      <Loader2 className={`animate-spin ${sizeClasses[size]} text-blue-600`} />
      <p className="text-sm text-gray-600">{message}</p>
    </Container>
  );
}

// Skeleton loading components for different UI patterns

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 mb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded flex-1" />
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(4)].map((_, j) => (
            <div key={j} className="h-8 bg-gray-200 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonMetric() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
      <div className="h-8 bg-gray-200 rounded w-1/2" />
    </div>
  );
}
