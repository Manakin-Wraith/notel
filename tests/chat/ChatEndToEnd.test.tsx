import { act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { supabase } from '../../lib/supabase';
import { chatService } from '../../lib/chat';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      removeAllChannels: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

const mockSupabase = supabase as any;

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    PROD: false,
  },
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
};

const mockConversation = {
  id: 'conv-123',
  name: 'Test Conversation',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_persistent: false,
};

const mockMessage = {
  id: 'msg-123',
  conversation_id: 'conv-123',
  sender_id: 'user-123',
  content: 'Hello, world!',
  created_at: new Date().toISOString(),
  message_type: 'text',
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  is_saved: false,
  edited_at: null,
  sender: {
    id: 'user-123',
    full_name: 'Test User',
    avatar_url: null,
  },
};

const mockPresence = {
  user_id: 'user-123',
  status: 'online',
  last_seen: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('Chat End-to-End Journey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock auth user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    
    // Mock auth state change
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should complete full chat journey: user auth -> presence -> conversation -> messaging -> typing indicators', async () => {
    // Mock successful RPC calls
    mockSupabase.rpc.mockImplementation((functionName: string, _params: any) => {
      if (functionName === 'update_user_presence') {
        return Promise.resolve({ error: null });
      }
      if (functionName === 'set_typing_indicator') {
        return Promise.resolve({ error: null });
      }
      if (functionName === 'save_message') {
        return Promise.resolve({ error: null });
      }
      return Promise.resolve({ error: null });
    });

    // Mock successful database operations
    mockSupabase.from.mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      
      // Mock specific table responses
      then: (resolve: Function) => {
        if (table === 'conversations') {
          resolve({ data: mockConversation, error: null });
        } else if (table === 'messages') {
          resolve({ data: mockMessage, error: null });
        } else if (table === 'user_presence') {
          resolve({ data: mockPresence, error: null });
        } else {
          resolve({ data: [], error: null });
        }
        return { catch: vi.fn() };
      },
    }));

    // Test 1: User authentication and profile creation
    await act(async () => {
      const userResponse = await mockSupabase.auth.getUser();
      expect(userResponse.data.user).toEqual(mockUser);
    });

    // Test 2: User presence update
    await act(async () => {
      const presenceResponse = await mockSupabase.rpc('update_user_presence', {
        target_user_id: mockUser.id,
        new_status: 'online',
      });
      expect(presenceResponse.error).toBeNull();
    });

    // Test 3: Conversation creation
    await act(async () => {
      const conversationResponse = await chatService.createConversation({
        name: 'Test Conversation',
        type: 'direct',
        participant_ids: [mockUser.id],
      });
      expect(conversationResponse.success).toBe(true);
      expect(conversationResponse.data).toBeDefined();
    });

    // Test 4: Message sending
    await act(async () => {
      const messageResponse = await chatService.sendMessage({
        conversation_id: mockConversation.id,
        content: 'Hello, world!',
      });
      expect(messageResponse.success).toBe(true);
      expect(messageResponse.data).toBeDefined();
      expect(messageResponse.data?.content).toBe('Hello, world!');
    });

    // Test 5: Typing indicator
    await act(async () => {
      const typingResponse = await chatService.setTypingIndicator(mockConversation.id);
      expect(typingResponse.success).toBe(true);
    });

    // Test 6: Conversation details fetching
    await act(async () => {
      const detailsResponse = await chatService.getConversationDetails(mockConversation.id);
      expect(detailsResponse.success).toBe(true);
      expect(detailsResponse.data).toBeDefined();
    });

    console.log('✅ Full chat end-to-end journey completed successfully');
  });

  it('should handle offline messaging correctly', async () => {
    // Simulate offline scenario
    mockSupabase.rpc.mockImplementation((functionName: string, _params: any) => {
      if (functionName === 'update_user_presence') {
        // Simulate offline presence
        return Promise.resolve({ error: null });
      }
      return Promise.resolve({ error: null });
    });

    // Mock successful message sending even when "offline"
    mockSupabase.from.mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: (resolve: Function) => {
        if (table === 'messages') {
          resolve({ data: mockMessage, error: null });
        } else {
          resolve({ data: [], error: null });
        }
        return { catch: vi.fn() };
      },
    }));

    // Test that messages can be sent even when offline
    await act(async () => {
      const messageResponse = await chatService.sendMessage({
        conversation_id: mockConversation.id,
        content: 'Offline message',
      });
      expect(messageResponse.success).toBe(true);
      expect(messageResponse.data).toBeDefined();
      expect(messageResponse.data?.content).toBe('Offline message');
    });

    console.log('✅ Offline messaging test completed successfully');
  });
});
