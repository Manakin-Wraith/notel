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
  createdAt: string;
  updatedAt: string;
}