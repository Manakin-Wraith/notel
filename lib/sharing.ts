import { supabase, getCurrentUser } from './supabase';
import type { ShareLink, ShareAccess, SharePermission, User } from '../types';

export class SharingService {
  // Generate a shareable link for a resource
  async createShareLink(
    resourceId: string,
    resourceType: 'page' | 'event',
    permission: SharePermission = 'view',
    isPublic: boolean = true,
    expiresAt?: string
  ): Promise<ShareLink> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Check if share link already exists
    const { data: existing } = await supabase
      .from('share_links')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType)
      .single();

    if (existing) {
      // Update existing share link
      const { data, error } = await supabase
        .from('share_links')
        .update({
          permission,
          is_public: isPublic,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return this.dbShareLinkToShareLink(data);
    } else {
      // Create new share link
      const { data, error } = await supabase
        .from('share_links')
        .insert({
          resource_id: resourceId,
          resource_type: resourceType,
          permission,
          is_public: isPublic,
          expires_at: expiresAt,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return this.dbShareLinkToShareLink(data);
    }
  }

  // Get share link for a resource
  async getShareLink(resourceId: string, resourceType: 'page' | 'event'): Promise<ShareLink | null> {
    const { data, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data ? this.dbShareLinkToShareLink(data) : null;
  }

  // Delete share link
  async deleteShareLink(resourceId: string, resourceType: 'page' | 'event'): Promise<void> {
    const { error } = await supabase
      .from('share_links')
      .delete()
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType);

    if (error) throw error;
  }

  // Share with specific users
  async shareWithUser(
    resourceId: string,
    resourceType: 'page' | 'event',
    userEmail: string,
    permission: SharePermission
  ): Promise<ShareAccess> {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    // Try to find user profile by email
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', userEmail)
      .single();

    let userId: string;
    let isPending: boolean;
    if (userError || !targetUser) {
      // User doesn't exist yet - create pending invitation
      userId = `pending_${userEmail}`;
      isPending = true;
    } else {
      // User exists, use their actual ID
      userId = targetUser.id;
      isPending = false;
    }

    // Check if access already exists
    const { data: existing } = await supabase
      .from('share_access')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing access
      const { data, error } = await supabase
        .from('share_access')
        .update({
          permission,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return this.dbShareAccessToShareAccess(data);
    } else {
      // Create new access (works for both existing users and pending invitations)
      const { data, error } = await supabase
        .from('share_access')
        .insert({
          resource_id: resourceId,
          resource_type: resourceType,
          user_id: userId, // This will be either a real UUID or pending_email format
          user_email: isPending ? userEmail : null, // Store email for pending invitations
          is_pending: isPending,
          permission,
          invited_by: currentUser.id
        })
        .select()
        .single();

      if (error) throw error;
      return this.dbShareAccessToShareAccess(data);
    }
  }

  // Get all users with access to a resource
  async getResourceAccess(resourceId: string, resourceType: 'page' | 'event'): Promise<ShareAccess[]> {
    const { data, error } = await supabase
      .from('share_access')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType);

    if (error) throw error;
    
    // For each access record, try to get user profile if it's not a pending invitation
    const accessWithProfiles = await Promise.all(
      data.map(async (item) => {
        let userProfile = null;
        
        // Only try to fetch user profile if user_id is a valid UUID (not pending)
        if (!item.user_id.startsWith('pending_')) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', item.user_id)
            .single();
          userProfile = profile;
        }
        
        return {
          ...item,
          user_profiles: userProfile
        };
      })
    );
    
    return accessWithProfiles.map(item => this.dbShareAccessToShareAccess(item));
  }

  // Remove user access
  async removeUserAccess(
    resourceId: string,
    resourceType: 'page' | 'event',
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('share_access')
      .delete()
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Check if user has access to a resource
  async checkAccess(
    resourceId: string,
    resourceType: 'page' | 'event',
    userId?: string
  ): Promise<{ hasAccess: boolean; permission?: SharePermission }> {
    // If no userId provided, check public access
    if (!userId) {
      const { data: shareLink } = await supabase
        .from('share_links')
        .select('*')
        .eq('resource_id', resourceId)
        .eq('resource_type', resourceType)
        .eq('is_public', true)
        .single();

      if (shareLink && (!shareLink.expires_at || new Date(shareLink.expires_at) > new Date())) {
        return { hasAccess: true, permission: shareLink.permission };
      }
      return { hasAccess: false };
    }

    // Check user-specific access
    const { data: access } = await supabase
      .from('share_access')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType)
      .eq('user_id', userId)
      .single();

    if (access) {
      return { hasAccess: true, permission: access.permission };
    }

    // Check public access as fallback
    const { data: shareLink } = await supabase
      .from('share_links')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType)
      .eq('is_public', true)
      .single();

    if (shareLink && (!shareLink.expires_at || new Date(shareLink.expires_at) > new Date())) {
      return { hasAccess: true, permission: shareLink.permission };
    }

    return { hasAccess: false };
  }

  // Generate shareable URL
  generateShareUrl(shareLink: ShareLink): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/${shareLink.resourceType}/${shareLink.id}`;
  }

  // Search users by email for sharing
  async searchUsers(query: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .ilike('email', `%${query}%`)
      .limit(10);

    if (error) throw error;
    return data.map(user => this.dbUserToUser(user));
  }

  // Create or update user profile
  async upsertUserProfile(user: Partial<User>): Promise<User> {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: currentUser.id,
        email: currentUser.email || '',
        name: user.name,
        avatar: user.avatar,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return this.dbUserToUser(data);
  }

  // Helper methods to convert database types to app types
  private dbShareLinkToShareLink(dbShareLink: any): ShareLink {
    return {
      id: dbShareLink.id,
      resourceId: dbShareLink.resource_id,
      resourceType: dbShareLink.resource_type,
      permission: dbShareLink.permission,
      isPublic: dbShareLink.is_public,
      expiresAt: dbShareLink.expires_at,
      createdBy: dbShareLink.created_by,
      createdAt: dbShareLink.created_at,
      updatedAt: dbShareLink.updated_at
    };
  }

  private dbShareAccessToShareAccess(dbShareAccess: any): ShareAccess {
    return {
      id: dbShareAccess.id,
      resourceId: dbShareAccess.resource_id,
      resourceType: dbShareAccess.resource_type,
      userId: dbShareAccess.user_id,
      permission: dbShareAccess.permission,
      invitedBy: dbShareAccess.invited_by,
      createdAt: dbShareAccess.created_at,
      updatedAt: dbShareAccess.updated_at
    };
  }

  private dbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatar: dbUser.avatar,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at
    };
  }
}

export const sharingService = new SharingService();
