-- Notel App Database Schema for Supabase
-- Run this in your Supabase SQL Editor
-- This script is safe to run multiple times

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own pages" ON pages;
DROP POLICY IF EXISTS "Users can insert their own pages" ON pages;
DROP POLICY IF EXISTS "Users can update their own pages" ON pages;
DROP POLICY IF EXISTS "Users can delete their own pages" ON pages;
DROP POLICY IF EXISTS "Users can view blocks of their own pages" ON blocks;
DROP POLICY IF EXISTS "Users can insert blocks to their own pages" ON blocks;
DROP POLICY IF EXISTS "Users can update blocks of their own pages" ON blocks;
DROP POLICY IF EXISTS "Users can delete blocks of their own pages" ON blocks;

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  icon TEXT DEFAULT 'document-text',
  parent_id TEXT REFERENCES pages(id) ON DELETE CASCADE,
  due_date TIMESTAMPTZ,
  status TEXT CHECK (status IN ('todo', 'in-progress', 'done')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  page_id TEXT REFERENCES pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '""',
  position INTEGER NOT NULL DEFAULT 0,
  checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent_id ON pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_blocks_page_id ON blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_blocks_position ON blocks(page_id, position);

-- Enable Row Level Security (RLS)
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pages
CREATE POLICY "Users can view their own pages" ON pages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pages" ON pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pages" ON pages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pages" ON pages
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for blocks (access through pages ownership)
CREATE POLICY "Users can view blocks of their own pages" ON blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pages 
      WHERE pages.id = blocks.page_id 
      AND pages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert blocks to their own pages" ON blocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pages 
      WHERE pages.id = blocks.page_id 
      AND pages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update blocks of their own pages" ON blocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pages 
      WHERE pages.id = blocks.page_id 
      AND pages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete blocks of their own pages" ON blocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pages 
      WHERE pages.id = blocks.page_id 
      AND pages.user_id = auth.uid()
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
DROP TRIGGER IF EXISTS update_blocks_updated_at ON blocks;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
