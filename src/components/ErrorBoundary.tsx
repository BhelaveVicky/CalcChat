import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.95L13.75 4a2 2 0 00-3.5 0L3.25 16.05A2 2 0 005.07 19z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400 font-medium">Something went wrong</p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-4 px-4 py-2 rounded-xl bg-[#ff2e93] text-white text-xs font-bold active:scale-95 transition-transform"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
