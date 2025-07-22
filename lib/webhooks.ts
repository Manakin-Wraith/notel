// Webhook and real-time synchronization utilities for Vercel/Supabase integration

import { supabase } from './supabase';
import { ProductionDebug } from './production-debug';

export class WebhookManager {
  private static subscriptions: Map<string, any> = new Map();

  // Subscribe to real-time changes for pages
  static subscribeToPageChanges(userId: string, onPageChange: (payload: any) => void) {
    const channelName = `pages:${userId}`;
    
    // Unsubscribe from existing subscription if any
    this.unsubscribeFromPageChanges(userId);

    try {
      const subscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pages',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const pageId = (payload.new && typeof payload.new === 'object' && 'id' in payload.new) 
              ? payload.new.id 
              : (payload.old && typeof payload.old === 'object' && 'id' in payload.old) 
                ? payload.old.id 
                : 'unknown';
            
            ProductionDebug.logStateSync('realtime page change', {
              event: payload.eventType,
              pageId,
              timestamp: new Date().toISOString()
            });
            onPageChange(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to page changes');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Failed to subscribe to page changes');
            ProductionDebug.logReactError(new Error('Webhook subscription failed'), { status });
          }
        });

      this.subscriptions.set(channelName, subscription);
      return subscription;
    } catch (error) {
      console.error('Error setting up page subscription:', error);
      ProductionDebug.logReactError(error as Error, { context: 'webhook subscription' });
      return null;
    }
  }

  // Unsubscribe from page changes
  static unsubscribeFromPageChanges(userId: string) {
    const channelName = `pages:${userId}`;
    const subscription = this.subscriptions.get(channelName);
    
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(channelName);
      console.log('Unsubscribed from page changes');
    }
  }

  // Subscribe to block changes for a specific page
  static subscribeToBlockChanges(pageId: string, onBlockChange: (payload: any) => void) {
    const channelName = `blocks:${pageId}`;
    
    // Unsubscribe from existing subscription if any
    this.unsubscribeFromBlockChanges(pageId);

    try {
      const subscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'blocks',
            filter: `page_id=eq.${pageId}`
          },
          (payload) => {
            const blockId = (payload.new && typeof payload.new === 'object' && 'id' in payload.new) 
              ? payload.new.id 
              : (payload.old && typeof payload.old === 'object' && 'id' in payload.old) 
                ? payload.old.id 
                : 'unknown';
            
            ProductionDebug.logStateSync('realtime block change', {
              event: payload.eventType,
              blockId,
              pageId,
              timestamp: new Date().toISOString()
            });
            onBlockChange(payload);
          }
        )
        .subscribe();

      this.subscriptions.set(channelName, subscription);
      return subscription;
    } catch (error) {
      console.error('Error setting up block subscription:', error);
      ProductionDebug.logReactError(error as Error, { context: 'block webhook subscription' });
      return null;
    }
  }

  // Unsubscribe from block changes
  static unsubscribeFromBlockChanges(pageId: string) {
    const channelName = `blocks:${pageId}`;
    const subscription = this.subscriptions.get(channelName);
    
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(channelName);
    }
  }

  // Clean up all subscriptions
  static cleanup() {
    this.subscriptions.forEach((subscription, channelName) => {
      supabase.removeChannel(subscription);
      console.log(`Cleaned up subscription: ${channelName}`);
    });
    this.subscriptions.clear();
  }

  // Handle webhook events from Vercel/Supabase
  static async handleWebhookEvent(event: any) {
    try {
      ProductionDebug.logStateSync('webhook event received', {
        type: event.type,
        table: event.table,
        timestamp: new Date().toISOString()
      });

      switch (event.type) {
        case 'INSERT':
          console.log('New record created:', event.record);
          break;
        case 'UPDATE':
          console.log('Record updated:', event.record);
          break;
        case 'DELETE':
          console.log('Record deleted:', event.old_record);
          break;
        default:
          console.log('Unknown webhook event:', event);
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      ProductionDebug.logReactError(error as Error, { context: 'webhook handler', event });
    }
  }
}

// Initialize webhook manager on window load
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    WebhookManager.cleanup();
  });
}
