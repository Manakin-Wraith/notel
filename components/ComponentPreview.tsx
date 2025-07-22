import React, { useMemo, useState, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';

// Provided by script tag in index.html
declare const Babel: any;

const ComponentPreview: React.FC<{ code: string }> = ({ code }) => {
    const [babelReady, setBabelReady] = useState(false);
    const [babelError, setBabelError] = useState<string | null>(null);
    
    // Check for Babel availability with retry logic
    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 10;
        const retryInterval = 100;
        
        const checkBabel = () => {
            if (typeof window !== 'undefined' && typeof (window as any).Babel !== 'undefined') {
                setBabelReady(true);
                setBabelError(null);
                return;
            }
            
            retryCount++;
            if (retryCount < maxRetries) {
                setTimeout(checkBabel, retryInterval);
            } else {
                setBabelError('Babel transformer failed to load after multiple attempts.');
            }
        };
        
        checkBabel();
    }, []);
    
    const PreviewContent = useMemo(() => {
        if (!code.trim()) {
            return (
                <div className="preview-content">
                    Start typing JSX to see a live preview.
                </div>
            );
        }
        
        // Show loading state while waiting for Babel
        if (!babelReady && !babelError) {
            return (
                <div className="preview-content text-gray-400">
                    Loading preview...
                </div>
            );
        }
        
        // Show error if Babel failed to load
        if (babelError) {
            return <pre className="preview-error">{babelError}</pre>;
        }
        
        // Check if Babel is available (double-check for safety)
        const BabelInstance = (window as any).Babel;
        if (!BabelInstance) {
            return <pre className="preview-error">Babel transformer not available.</pre>;
        }

        try {
            // The user's code is treated as JSX to be returned.
            // This is safer than letting them define functions freely.
            const wrappedCode = `return (<>${code}</>)`;
            
            // Compile the JSX string to a regular JS string.
            const transformedCode = BabelInstance.transform(wrappedCode, {
                presets: ['react'],
            }).code;

            // Create a renderable React element from the compiled JS string.
            // We pass React into the scope of the new function.
            const element = new Function('React', transformedCode)(React);
            
            // The key on ErrorBoundary ensures it resets if the code changes,
            // clearing old errors.
            return (
                <ErrorBoundary key={code}>
                    {element}
                </ErrorBoundary>
            );
        } catch (error: any) {
            // If Babel or React throws an error, display it.
            return <pre className="preview-error">{error.message}</pre>;
        }
    }, [code, babelReady, babelError]);

    return (
        <div className="ui-component-preview">
            <h3 className="preview-title">Live Preview</h3>
            {PreviewContent}
        </div>
    );
};

export default ComponentPreview;
