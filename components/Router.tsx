import React from 'react';
import SharedContentViewer from './SharedContentViewer';
import LandingPage from './landing/LandingPage';
import { useAuth } from '../contexts/AuthContext';

interface RouterProps {
  children: React.ReactNode;
}

const Router: React.FC<RouterProps> = ({ children }) => {
  const { user } = useAuth();
  
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

  // Show landing page for non-authenticated users on root path
  if (!user && (path === '/' || path === '')) {
    return <LandingPage />;
  }

  // Default route - render the main app for authenticated users
  return <>{children}</>;
};

export default Router;
