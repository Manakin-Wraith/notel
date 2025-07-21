import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error in preview:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <pre className="preview-error">{this.state.error?.message || 'An unknown error occurred.'}</pre>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
