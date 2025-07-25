import React from 'react';
import SharedContentViewer from './SharedContentViewer';

interface RouterProps {
  children: React.ReactNode;
}

const Router: React.FC<RouterProps> = ({ children }) => {
  
  // Simple routing based on URL path
  const path = window.location.pathname;
  const pathSegments = path.split('/').filter(Boolean);

  // Handle shared content routes: /shared/{type}/{shareId}
  if (pathSegments[0] === 'shared' && pathSegments.length === 3) {
    const [, resourceType, shareId] = pathSegments;
    
    if (resourceType === 'page' || resourceType === 'event') {
      return (
        <SharedContentViewer
          shareId={shareId}
          resourceType={resourceType as 'page' | 'event'}
        />
      );
    }
  }

  // Default route - render the main app
  return <>{children}</>;
};

export default Router;
