import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sharingService } from '../lib/sharing';
import { databaseService } from '../lib/database';
import { supabase } from '../lib/supabase';
import type { Page, Event, ShareLink, SharePermission } from '../types';
import Editor from './Editor';

interface SharedContentViewerProps {
  shareId: string;
  resourceType: 'page' | 'event';
}

const SharedContentViewer: React.FC<SharedContentViewerProps> = ({
  shareId,
  resourceType
}) => {
  const { user } = useAuth();
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [content, setContent] = useState<Page | Event | null>(null);
  const [permission, setPermission] = useState<SharePermission>('view');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    loadSharedContent();
  }, [shareId, resourceType, user]);

  const loadSharedContent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, get the share link details
      const { data: shareLinkData, error: shareLinkError } = await supabase
        .from('share_links')
        .select('*')
        .eq('id', shareId)
        .single();

      if (shareLinkError) {
        throw new Error('Share link not found or expired');
      }

      setShareLink(shareLinkData);

      // Check if link is expired
      if (shareLinkData.expires_at && new Date(shareLinkData.expires_at) < new Date()) {
        throw new Error('This share link has expired');
      }

      // Check access permissions
      const accessCheck = await sharingService.checkAccess(
        shareLinkData.resource_id,
        shareLinkData.resource_type,
        user?.id
      );

      if (!accessCheck.hasAccess) {
        throw new Error('You do not have permission to view this content');
      }

      setPermission(accessCheck.permission || 'view');

      // Load the actual content
      if (resourceType === 'page') {
        const pages = await databaseService.getPages();
        const page = pages.find(p => p.id === shareLinkData.resource_id);
        if (!page) {
          throw new Error('Page not found');
        }
        setContent(page);
      } else {
        const events = await databaseService.getEvents();
        const event = events.find(e => e.id === shareLinkData.resource_id);
        if (!event) {
          throw new Error('Event not found');
        }
        setContent(event);
      }

      // Show sign-up prompt for new users after 2 seconds
      if (!user) {
        setTimeout(() => {
          setShowSignUpPrompt(true);
        }, 2000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shared content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpPrompt = () => {
    setShowAuthModal(true);
    setShowSignUpPrompt(false);
  };

  const handleSaveToWorkspace = async () => {
    if (!user || !content || resourceType !== 'page') return;

    try {
      const originalPage = content as Page;
      const newPageId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create a copy of the page with new IDs for blocks
      const pageCopy: Page = {
        ...originalPage,
        id: newPageId,
        parentId: null,
        position: 0,
        // Create new block IDs to avoid conflicts
        content: originalPage.content.map(block => ({
          ...block,
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }))
      };

      await databaseService.createPage(pageCopy);
      
      // Show success message
      alert('Page saved to your workspace!');
    } catch (error) {
      console.error('Failed to save to workspace:', error);
      alert('Failed to save to workspace');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Link no longer available</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header for shared content */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600">
                {resourceType === 'page' ? '📄' : '📅'} 
                <span className="ml-1">
                  You're viewing "{content.title}" 
                  {shareLink && (
                    <span className="text-gray-400"> shared by {shareLink.createdBy}</span>
                  )}
                </span>
              </div>
              {!user && (
                <button
                  onClick={() => setShowSignUpPrompt(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {user && resourceType === 'page' && (
                <button
                  onClick={handleSaveToWorkspace}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition-colors"
                >
                  Save to Workspace
                </button>
              )}
              
              {!user && (
                <button
                  onClick={handleSignUpPrompt}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors"
                >
                  Sign Up
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sign-up prompt for new users */}
      {showSignUpPrompt && !user && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-blue-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-blue-800">
                    Enjoying this content? <strong>Create your free account</strong> to collaborate and save your own notes.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSignUpPrompt}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors"
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setShowSignUpPrompt(false)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {resourceType === 'page' ? (
          <div className="bg-white rounded-lg shadow-sm">
            <Editor
              page={content as Page}
              onUpdateTitle={permission === 'view' ? () => {} : (_, title) => console.log('Update title:', title)}
              onUpdateContent={permission === 'view' ? () => {} : (_, content) => console.log('Update content:', content)}
              onUpdateIcon={permission === 'view' ? () => {} : (_, icon) => console.log('Update icon:', icon)}
              onUpdateDate={permission === 'view' ? () => {} : (_, date) => console.log('Update date:', date)}
              onUpdateStatus={permission === 'view' ? () => {} : (_, status) => console.log('Update status:', status)}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start space-x-4">
              <div className="text-2xl">{(content as Event).icon || '📅'}</div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {content.title}
                </h1>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {new Date((content as Event).startDate).toLocaleDateString()} at{' '}
                      {new Date((content as Event).startDate).toLocaleTimeString()}
                    </span>
                  </div>
                  {(content as Event).description && (
                    <div className="mt-4">
                      <p className="text-gray-700">{(content as Event).description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating collaboration indicator for authenticated users */}
      {user && (
        <div className="fixed bottom-4 right-4">
          <div className="bg-white rounded-full shadow-lg px-3 py-2 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">You're collaborating</span>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Join to collaborate</h2>
              <p className="text-gray-600 mb-6">
                Create an account to edit, save, and collaborate on this content.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/auth'}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Continue with Google
                </button>
                
                <div className="text-center">
                  <button
                    onClick={() => setShowAuthModal(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedContentViewer;
