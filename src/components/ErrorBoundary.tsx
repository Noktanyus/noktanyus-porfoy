'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Sandbox hatalarını görmezden gel
    const errorStr = error.toString();
    if (
      errorStr.includes('sandboxed') || 
      errorStr.includes('about:blank') ||
      errorStr.includes('allow-scripts')
    ) {
      return { hasError: false };
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Sandbox hatalarını log'lama
    const errorStr = error.toString();
    if (
      errorStr.includes('sandboxed') || 
      errorStr.includes('about:blank') ||
      errorStr.includes('allow-scripts')
    ) {
      return;
    }
    
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }
      
      return (
        <div className="p-4 border border-red-300 rounded-md bg-red-50">
          <h2 className="text-lg font-semibold text-red-800">Bir hata oluştu</h2>
          <p className="text-red-600 mt-2">Sayfa yeniden yüklenmeyi deneyin.</p>
          <button 
            onClick={this.resetError}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded"
          >
            Tekrar Dene
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;