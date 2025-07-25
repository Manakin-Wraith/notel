import React, { useState, useEffect } from 'react';
import type { ShareModalProps, ShareLink, ShareAccess, SharePermission } from '../types';
import { sharingService } from '../lib/sharing';
import { emailService } from '../lib/email';
import { useAuth } from '../contexts/AuthContext';

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  resourceId,
  resourceType,
  resourceTitle
}) => {
  const { user } = useAuth();
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [shareAccess, setShareAccess] = useState<ShareAccess[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<SharePermission>('view');
  const [linkPermission, setLinkPermission] = useState<SharePermission>('view');
  const [isPublic, setIsPublic] = useState(true);
  
  // Email invitation feedback states
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadSharingData();
    }
  }, [isOpen, resourceId, resourceType, user]);

  const loadSharingData = async () => {
    setIsLoading(true);
    try {
      const [link, access] = await Promise.all([
        sharingService.getShareLink(resourceId, resourceType),
        sharingService.getResourceAccess(resourceId, resourceType)
      ]);
      
      setShareLink(link);
      setShareAccess(access);
      
      if (link) {
        setLinkPermission(link.permission);
        setIsPublic(link.isPublic);
      }
    } catch (error) {
      console.error('Failed to load sharing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShareLink = async () => {
    if (!user) {
      alert('Please sign in to create share links');
      return;
    }
    
    setIsLoading(true);
    try {
      const link = await sharingService.createShareLink(
        resourceId,
        resourceType,
        linkPermission,
        isPublic
      );
      setShareLink(link);
    } catch (error) {
      console.error('Failed to create share link:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to create share link: ${errorMessage}\n\nThis might be because the sharing database tables haven't been set up yet. Please run the schema_sharing.sql file against your Supabase database.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    
    const url = sharingService.generateShareUrl(shareLink);
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !user) return;
    
    // Clear previous feedback
    setInviteSuccess(false);
    setInviteError(null);
    setIsInviting(true);
    
    try {
      // 1. Ensure we have a public share link
      let currentShareLink = shareLink;
      if (!currentShareLink) {
        currentShareLink = await sharingService.createShareLink(
          resourceId,
          resourceType,
          'view',
          true // public
        );
        setShareLink(currentShareLink);
      }
      
      // 2. Generate share URL
      const shareUrl = sharingService.generateShareUrl(currentShareLink);
      
      // 3. Send email with share link
      const emailResult = await emailService.sendShareEmail({
        recipientEmail: inviteEmail.trim(),
        shareUrl,
        contentTitle: resourceTitle || `Shared ${resourceType}`,
        contentType: resourceType,
        senderName: user.name || 'Someone',
        senderEmail: user.email || ''
      });
      
      if (emailResult.success) {
        // Success feedback
        setInviteSuccess(true);
        setInviteEmail('');
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setInviteSuccess(false), 3000);
      } else {
        throw new Error(emailResult.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Failed to send share email:', error);
      
      // Error feedback
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
      setInviteError(errorMessage);
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => setInviteError(null), 5000);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveAccess = async (userId: string) => {
    setIsLoading(true);
    try {
      await sharingService.removeUserAccess(resourceId, resourceType, userId);
      await loadSharingData(); // Refresh the access list
    } catch (error) {
      console.error('Failed to remove access:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteShareLink = async () => {
    setIsLoading(true);
    try {
      await sharingService.deleteShareLink(resourceId, resourceType);
      setShareLink(null);
    } catch (error) {
      console.error('Failed to delete share link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Share</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Resource Info */}
          <div className="text-sm text-gray-400">
            Sharing: <span className="font-medium text-white">{resourceTitle}</span>
          </div>

          {/* Link Sharing Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="font-medium text-white">Anyone with link</span>
            </div>

            {shareLink ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <select
                    value={linkPermission}
                    onChange={(e) => setLinkPermission(e.target.value as SharePermission)}
                    className="text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isLoading}
                  >
                    <option value="view">Can view</option>
                    <option value="edit">Can edit</option>
                    <option value="admin">Can admin</option>
                  </select>
                  <button
                    onClick={handleCreateShareLink}
                    disabled={isLoading}
                    className="text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
                  >
                    Update
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleCopyLink}
                    disabled={isLoading}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    {copySuccess ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={handleDeleteShareLink}
                    disabled={isLoading}
                    className="px-4 py-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 hover:bg-gray-800 rounded-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <select
                    value={linkPermission}
                    onChange={(e) => setLinkPermission(e.target.value as SharePermission)}
                    className="text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isLoading}
                  >
                    <option value="view">Can view</option>
                    <option value="edit">Can edit</option>
                    <option value="admin">Can admin</option>
                  </select>
                </div>
                
                <button
                  onClick={handleCreateShareLink}
                  disabled={isLoading}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  Create Link
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700"></div>

          {/* User Invitation Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium text-white">Share via email</span>
            </div>

            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter email address..."
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                disabled={isInviting}
              />
              
              <div className="flex space-x-2">
                <select
                  value={invitePermission}
                  onChange={(e) => setInvitePermission(e.target.value as SharePermission)}
                  className="text-sm bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isInviting}
                >
                  <option value="view">View only</option>
                  <option value="edit">Can edit</option>
                  <option value="admin">Full access</option>
                </select>
                
                <button
                  onClick={handleInviteUser}
                  disabled={isInviting || !inviteEmail.trim()}
                  className="flex-1 bg-gray-800 text-gray-300 px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm font-medium border border-gray-600 flex items-center justify-center space-x-2"
                >
                  {isInviting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    'Send Email'
                  )}
                </button>
              </div>
              
              {/* Success Message */}
              {inviteSuccess && (
                <div className="flex items-center space-x-2 p-3 bg-green-900/20 border border-green-700 rounded-md">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-400">Email sent successfully!</span>
                </div>
              )}
              
              {/* Error Message */}
              {inviteError && (
                <div className="flex items-start space-x-2 p-3 bg-red-900/20 border border-red-700 rounded-md">
                  <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-400">{inviteError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Current Access List */}
          {shareAccess.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white">People with access</h3>
              <div className="space-y-2">
                {shareAccess.map((access) => (
                  <div key={access.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-300">
                          {access.userId.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{access.userId}</div>
                        <div className="text-xs text-gray-400 capitalize">{access.permission}</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveAccess(access.userId)}
                      disabled={isLoading}
                      className="text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 p-1 rounded hover:bg-gray-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-800 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full bg-gray-700 border border-gray-600 text-gray-300 px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
