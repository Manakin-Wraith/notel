export interface TableCell {
  id: string;
  content: string;
}

export interface TableRow {
  id: string;
  cells: TableCell[];
}

export interface TableContent {
  hasHeaders: boolean;
  rows: TableRow[];
}

export interface Block {
  id:string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'image' | 'code' | 'todo' | 'blockquote' | 'bulleted-list-item' | 'divider' | 'table' | 'ai-prompt' | 'json-schema' | 'ui-component';
  content: string | TableContent;
  checked?: boolean; // For 'todo' blocks
}

export interface Page {
  id:string;
  title: string;
  icon: string; 
  parentId: string | null;
  position: number;
  content: Block[]; 
  dueDate: string | null; 
  status: 'todo' | 'in-progress' | 'done' | null;
}

// Import notification types
import type { Reminder } from './types/notifications';

export interface Event {
  id: string;
  title: string;
  description?: string;
  icon?: string; // Emoji icon for visual identification
  startDate: string; // ISO string
  endDate?: string; // ISO string for multi-day or timed events
  allDay: boolean;
  status: 'scheduled' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  linkedPageId?: string; // Optional reference to a related page
  reminders?: Reminder[]; // Notification reminders for this event
  createdAt: string;
  updatedAt: string;
}

// Sharing Types
export type SharePermission = 'view' | 'edit' | 'admin';

export interface ShareLink {
  id: string;
  resourceId: string; // Page or Event ID
  resourceType: 'page' | 'event';
  permission: SharePermission;
  isPublic: boolean;
  expiresAt?: string; // ISO string
  createdBy: string; // User ID
  createdAt: string;
  updatedAt: string;
}

export interface ShareAccess {
  id: string;
  resourceId: string; // Page or Event ID
  resourceType: 'page' | 'event';
  userId: string;
  permission: SharePermission;
  invitedBy: string; // User ID
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  resourceType: 'page' | 'event';
  resourceTitle: string;
}

export interface CollaboratorPresence {
  userId: string;
  userName: string;
  userAvatar?: string;
  cursor?: {
    x: number;
    y: number;
  };
  selection?: {
    blockId: string;
    start: number;
    end: number;
  };
  lastSeen: string;
}