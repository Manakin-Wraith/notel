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
  content: Block[]; // Changed from string
  icon: string; // icon identifier
  parentId: string | null;
  dueDate: string | null; // ISO 8601 date string
  status: 'todo' | 'in-progress' | 'done' | null;
}