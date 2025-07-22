// Production debugging utilities to help identify React error #310 and other production issues

export const ProductionDebug = {
  // Log React errors in production with more context
  logReactError: (error: Error, errorInfo?: any) => {
    console.error('React Error in Production:', {
      message: error.message,
      stack: error.stack,
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  },

  // Check if we're in production
  isProduction: () => {
    return process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost';
  },

  // Log state synchronization issues
  logStateSync: (context: string, data: any) => {
    if (ProductionDebug.isProduction()) {
      console.log(`State Sync [${context}]:`, data);
    }
  },

  // Check for common production issues
  checkEnvironment: () => {
    const issues: string[] = [];
    
    // Check for Babel
    if (typeof (window as any).Babel === 'undefined') {
      issues.push('Babel not loaded');
    }
    
    // Check for required environment variables
    const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    requiredEnvVars.forEach(envVar => {
      if (!import.meta.env[envVar]) {
        issues.push(`Missing environment variable: ${envVar}`);
      }
    });
    
    if (issues.length > 0) {
      console.warn('Production Environment Issues:', issues);
    }
    
    return issues;
  }
};

// Global error handler for unhandled React errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message && event.error.message.includes('Minified React error')) {
      ProductionDebug.logReactError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    }
  });
  
  // Check environment on load
  window.addEventListener('load', () => {
    setTimeout(() => ProductionDebug.checkEnvironment(), 1000);
  });
}
