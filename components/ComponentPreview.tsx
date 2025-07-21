import React, { useMemo } from 'react';
import ErrorBoundary from './ErrorBoundary';

// Provided by script tag in index.html
declare const Babel: any;

const ComponentPreview: React.FC<{ code: string }> = ({ code }) => {
    
    const PreviewContent = useMemo(() => {
        if (!code.trim()) {
            return (
                <div className="preview-content">
                    Start typing JSX to see a live preview.
                </div>
            );
        }
        
        // Check if Babel is available on the window
        if (typeof Babel === 'undefined') {
            return <pre className="preview-error">Babel transformer not loaded.</pre>;
        }

        try {
            // The user's code is treated as JSX to be returned.
            // This is safer than letting them define functions freely.
            const wrappedCode = `return (<>${code}</>)`;
            
            // Compile the JSX string to a regular JS string.
            const transformedCode = Babel.transform(wrappedCode, {
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
    }, [code]);

    return (
        <div className="ui-component-preview">
            <h3 className="preview-title">Live Preview</h3>
            {PreviewContent}
        </div>
    );
};

export default ComponentPreview;
