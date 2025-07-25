-- Sharing functionality database schema
-- This extends the existing schema with sharing capabilities

-- Share links table for public/private link sharing
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('page', 'event')),
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
  is_public BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique share links per resource
  UNIQUE(resource_id, resource_type)
);

-- Share access table for user-specific sharing
CREATE TABLE IF NOT EXISTS share_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('page', 'event')),
  user_id TEXT NOT NULL, -- Can be UUID for existing users or 'pending_email' for invitations
  user_email TEXT, -- Store email for pending invitations
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pending BOOLEAN DEFAULT false, -- Track if this is a pending invitation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique access per user per resource
  UNIQUE(resource_id, resource_type, user_id)
);

-- User profiles table for sharing UI
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collaboration presence table for real-time features
CREATE TABLE IF NOT EXISTS collaboration_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('page', 'event')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cursor_x INTEGER,
  cursor_y INTEGER,
  selection_block_id TEXT,
  selection_start INTEGER,
  selection_end INTEGER,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique presence per user per resource
  UNIQUE(resource_id, resource_type, user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_share_links_resource ON share_links(resource_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_share_links_created_by ON share_links(created_by);
CREATE INDEX IF NOT EXISTS idx_share_access_resource ON share_access(resource_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_share_access_user ON share_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_collaboration_presence_resource ON collaboration_presence(resource_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_collaboration_presence_user ON collaboration_presence(user_id);

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- RLS (Row Level Security) policies
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_presence ENABLE ROW LEVEL SECURITY;

-- Share links policies
DROP POLICY IF EXISTS "Users can create share links for their own resources" ON share_links;
CREATE POLICY "Users can create share links for their own resources" ON share_links
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can view share links they created" ON share_links;
CREATE POLICY "Users can view share links they created" ON share_links
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update share links they created" ON share_links;
CREATE POLICY "Users can update share links they created" ON share_links
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete share links they created" ON share_links;
CREATE POLICY "Users can delete share links they created" ON share_links
  FOR DELETE USING (created_by = auth.uid());

-- Share access policies
DROP POLICY IF EXISTS "Users can create share access for resources they own" ON share_access;
CREATE POLICY "Users can create share access for resources they own" ON share_access
  FOR INSERT WITH CHECK (invited_by = auth.uid());

DROP POLICY IF EXISTS "Users can view share access for resources they have access to" ON share_access;
CREATE POLICY "Users can view share access for resources they have access to" ON share_access
  FOR SELECT USING (
    user_id = auth.uid() OR 
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM share_access sa2 
      WHERE sa2.resource_id = share_access.resource_id 
      AND sa2.resource_type = share_access.resource_type 
      AND sa2.user_id = auth.uid()
      AND sa2.permission IN ('edit', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can update share access they created" ON share_access;
CREATE POLICY "Users can update share access they created" ON share_access
  FOR UPDATE USING (invited_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete share access they created" ON share_access;
CREATE POLICY "Users can delete share access they created" ON share_access
  FOR DELETE USING (invited_by = auth.uid());

-- User profiles policies
DROP POLICY IF EXISTS "Users can view all user profiles" ON user_profiles;
CREATE POLICY "Users can view all user profiles" ON user_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR ALL USING (id = auth.uid());

-- Collaboration presence policies
DROP POLICY IF EXISTS "Users can manage their own presence" ON collaboration_presence;
CREATE POLICY "Users can manage their own presence" ON collaboration_presence
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view presence for resources they have access to" ON collaboration_presence;
CREATE POLICY "Users can view presence for resources they have access to" ON collaboration_presence
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM share_access sa 
      WHERE sa.resource_id = collaboration_presence.resource_id 
      AND sa.resource_type = collaboration_presence.resource_type 
      AND sa.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM share_links sl 
      WHERE sl.resource_id = collaboration_presence.resource_id 
      AND sl.resource_type = collaboration_presence.resource_type 
      AND sl.is_public = true
    )
  );

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_share_links_updated_at ON share_links;
CREATE TRIGGER update_share_links_updated_at BEFORE UPDATE ON share_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_share_access_updated_at ON share_access;
CREATE TRIGGER update_share_access_updated_at BEFORE UPDATE ON share_access
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
