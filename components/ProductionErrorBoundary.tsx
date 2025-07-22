import React, { Component, ReactNode } from 'react';
import { ProductionDebug } from '../lib/production-debug';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ProductionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error with production debugging
    ProductionDebug.logReactError(error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Check if this is the React error #310 specifically
    if (error.message && error.message.includes('Minified React error #310')) {
      console.error('React Error #310 detected - likely useMemo dependency issue');
      console.error('Error details:', { error, errorInfo });
      
      // Try to recover by refreshing the page after a short delay
      setTimeout(() => {
        if (confirm('A React error occurred. Would you like to refresh the page to recover?')) {
          window.location.reload();
        }
      }, 1000);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#111111] text-white p-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-300 mb-2">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              {ProductionDebug.isProduction() && (
                <p className="text-gray-400 text-sm">
                  Error details have been logged for debugging.
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mr-3"
              >
                Refresh Page
              </button>
              
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                Try Again
              </button>
            </div>

            {!ProductionDebug.isProduction() && this.state.error && (
              <details className="mt-6">
                <summary className="cursor-pointer text-gray-400 hover:text-white">
                  Show Error Details (Development Only)
                </summary>
                <pre className="mt-2 p-4 bg-gray-900 rounded text-sm overflow-auto text-red-300">
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 p-4 bg-gray-900 rounded text-sm overflow-auto text-yellow-300">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProductionErrorBoundary;
