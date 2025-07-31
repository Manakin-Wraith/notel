// Online Users Component
// Shows who's available to chat with presence indicators

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ProfileAvatar from '../ProfileAvatar';

interface OnlineUser {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
}

interface OnlineUsersProps {
  onStartChat: (userId: string, userName: string) => void;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ onStartChat }) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    loadOnlineUsers();
    
    // Subscribe to presence changes
    const subscription = supabase
      .channel('user_presence')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_presence' },
        () => loadOnlineUsers()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadOnlineUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select(`
          user_id,
          status,
          last_seen,
          user_profiles!inner(
            display_name,
            email,
            avatar_url
          )
        `)
        .neq('user_id', user?.id) // Exclude current user
        .in('status', ['online', 'away', 'busy'])
        .order('last_seen', { ascending: false });

      if (error) throw error;

      const users: OnlineUser[] = data.map(item => ({
        id: item.user_id,
        display_name: item.user_profiles.display_name || item.user_profiles.email,
        email: item.user_profiles.email,
        avatar_url: item.user_profiles.avatar_url,
        status: item.status,
        last_seen: item.last_seen
      }));

      setOnlineUsers(users);
    } catch (error) {
      console.error('Failed to load online users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'busy': return 'Busy';
      default: return 'Offline';
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
              <div className="flex-1 h-4 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-l border-gray-700 w-64 bg-gray-800/50">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-200 mb-2">
          Online Users ({onlineUsers.length})
        </h3>
      </div>
      
      <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
        {onlineUsers.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No users online
          </div>
        ) : (
          onlineUsers.map(onlineUser => (
            <div
              key={onlineUser.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
              onClick={() => onStartChat(onlineUser.id, onlineUser.display_name)}
            >
              <div className="relative">
                <ProfileAvatar
                  displayName={onlineUser.display_name}
                  avatarUrl={onlineUser.avatar_url}
                  size="small"
                />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(onlineUser.status)}`}></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-200 truncate">
                  {onlineUser.display_name}
                </div>
                <div className="text-xs text-gray-500">
                  {getStatusText(onlineUser.status)}
                </div>
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-xs text-purple-400 hover:text-purple-300">
                  Chat
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OnlineUsers;
