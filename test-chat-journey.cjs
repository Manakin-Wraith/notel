const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Test user credentials
const TEST_USER_EMAIL = 'chat.test@lovecode.co.za';
const TEST_USER_PASSWORD = 'securePassword123!';

async function runFullChatJourneyTest() {
  console.log('🚀 Starting Full Chat End-to-End Journey Test');
  console.log('===============================================');

  try {
    // Create a new test user through Supabase auth
    console.log('🔐 Testing Authentication...');
    console.log('📝 Creating new test user...');
    
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // First, check if user already exists and delete if so
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError.message);
      return;
    }
    
    const existingUser = existingUsers.users.find(user => user.email === TEST_USER_EMAIL);
    if (existingUser) {
      console.log('🗑️  Deleting existing test user...');
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      if (deleteError) {
        console.error('Error deleting existing user:', deleteError.message);
        return;
      }
    }
    
    // Create new user
    const { data: userData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true
    });
    
    if (signUpError) {
      console.error('❌ User creation failed:', signUpError.message);
      return;
    }
    
    console.log('✅ New user created');
    const userId = userData.user.id;
    console.log(`👤 User: ${TEST_USER_EMAIL} (${userId})`);
    
    // Sign in as the new user
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return;
    }
    
    console.log('✅ User signed in');
    
    // Create a new client with the user's access token
    const userAccessToken = signInData.session.access_token;
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${userAccessToken}`
        }
      }
    });
    
    console.log('⏳ Waiting for user profile to be created by trigger...');
    
    // Wait for profile to be created by trigger
    let profile = null;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (!profile && attempts < maxAttempts) {
      attempts++;
      console.log(`🔄 Attempt ${attempts}/${maxAttempts} to find user profile...`);
      
      // Wait 1 second between attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: profileData, error: profileError } = await supabaseUser
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profileData) {
        profile = profileData;
        console.log(`📊 Profile found: ${profile.display_name}`);
      } else {
        console.log(`📊 Profile result: Not found ${profileError?.message || ''}`);
      }
    }
    
    if (!profile) {
      console.log('📝 No profile found, attempting to create one...');
      const { data: newProfile, error: createProfileError } = await supabaseUser
        .from('user_profiles')
        .insert([
          {
            user_id: userId,
            display_name: TEST_USER_EMAIL
          }
        ])
        .select()
        .single();
      
      if (createProfileError) {
        console.error('❌ User profile test failed:', createProfileError.message);
        return;
      }
      
      profile = newProfile;
      console.log('✅ User profile created manually');
    } else {
      console.log('✅ User profile automatically created by trigger');
    }
    
    console.log('\n📡 Testing Presence Updates...');
    
    // Test presence update
    const { error: presenceError } = await supabaseUser.rpc('update_user_presence', {
      target_user_id: userId,
      new_status: 'online'
    });
    
    if (presenceError) {
      console.error('❌ Presence update failed:', presenceError.message);
      return;
    }
    
    console.log('✅ Presence updated to online');
    
    // Check presence
    const { data: presenceData, error: getPresenceError } = await supabaseUser
      .from('user_presence')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (getPresenceError) {
      console.error('❌ Failed to get presence:', getPresenceError.message);
    } else {
      const lastSeen = new Date(presenceData.last_seen).toLocaleTimeString();
      console.log(`📊 Current presence: ${presenceData.status} (last seen: ${lastSeen})`);
    }
    
    console.log('\n💬 Testing Conversation Creation...');
    
    // Test conversation creation
    const { data: conversationData, error: conversationError } = await supabaseUser
      .from('conversations')
      .insert([
        {
          name: 'Test Conversation',
          created_by: userId
        }
      ])
      .select()
      .single();
    
    if (conversationError) {
      console.error('❌ Conversation creation failed:', conversationError.message);
      return;
    }
    
    const conversationId = conversationData.id;
    console.log('✅ Conversation created');
    console.log(`🆔 Conversation ID: ${conversationId}`);
    
    console.log('\n👥 Testing Participant Addition...');
    
    // Add user as participant
    const { error: participantError } = await supabaseUser
      .from('conversation_participants')
      .insert([
        {
          conversation_id: conversationId,
          user_id: userId
        }
      ]);
    
    if (participantError) {
      console.error('❌ Participant addition failed:', participantError.message);
      return;
    }
    
    console.log('✅ Participant added');
    
    console.log('\n✍️  Testing Message Sending...');
    
    // Test message sending
    const { data: messageData, error: messageError } = await supabaseUser
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          sender_id: userId,
          content: 'Hello, this is a test message!',
          message_type: 'text'
        }
      ])
      .select()
      .single();
    
    if (messageError) {
      console.error('❌ Message sending failed:', messageError.message);
      return;
    }
    
    console.log('✅ Message sent');
    console.log(`📝 Message: ${messageData.content}`);
    
    console.log('\n👀 Testing Typing Indicator...');
    
    // Test typing indicator
    const { error: typingError } = await supabaseUser.rpc('set_typing_indicator', {
      target_conversation_id: conversationId,
      target_user_id: userId
    });
    
    if (typingError) {
      console.error('❌ Typing indicator failed:', typingError.message);
      return;
    }
    
    console.log('✅ Typing indicator set');
    
    console.log('\n📋 Testing Conversation Details...');
    
    // Test fetching conversation details
    const { data: conversation, error: convDetailsError } = await supabaseUser
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    
    if (convDetailsError) {
      console.error('❌ Conversation fetch failed:', convDetailsError.message);
      return;
    }
    
    // Fetch participants
    const { data: participants, error: participantsError } = await supabaseUser
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId);
    
    if (participantsError) {
      console.error('❌ Participants fetch failed:', participantsError.message);
      return;
    }
    
    // Fetch user profiles for participants
    const participantIds = participants.map(p => p.user_id);
    const { data: participantProfiles, error: profilesError } = await supabaseUser
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .in('user_id', participantIds);
    
    if (profilesError) {
      console.error('❌ Participant profiles fetch failed:', profilesError.message);
      return;
    }
    
    // Fetch messages
    const { data: messages, error: messagesError } = await supabaseUser
      .from('messages')
      .select('id, content, created_at, sender_id')
      .eq('conversation_id', conversationId);
    
    if (messagesError) {
      console.error('❌ Messages fetch failed:', messagesError.message);
      return;
    }
    
    // Fetch user profiles for message senders
    const senderIds = messages.map(m => m.sender_id);
    const { data: senderProfiles, error: senderProfilesError } = await supabaseUser
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .in('user_id', senderIds);
    
    if (senderProfilesError) {
      console.error('❌ Sender profiles fetch failed:', senderProfilesError.message);
      return;
    }
    
    // Combine data
    const conversationDetails = {
      ...conversation,
      participants: participantProfiles,
      messages: messages.map(message => {
        const sender = senderProfiles.find(p => p.user_id === message.sender_id);
        return {
          ...message,
          sender
        };
      })
    };
    
    console.log('✅ Conversation details fetched');
    console.log(`📊 Conversation has ${conversationDetails.messages.length} message(s)`);
    console.log(`👥 Conversation has ${conversationDetails.participants.length} participant(s)`);
    
    console.log('\n===============================================');
    console.log('🏁 Test Results: All tests passed!');
    console.log('✅ Authentication and user profile creation');
    console.log('✅ Presence updates');
    console.log('✅ Conversation creation');
    console.log('✅ Participant addition');
    console.log('✅ Message sending');
    console.log('✅ Typing indicator');
    console.log('✅ Conversation details fetching');
    
    // Clean up - sign out
    await supabaseUser.auth.signOut();
    console.log('\n👋 Signed out test user');
    
  } catch (error) {
    console.error('\n❌ Test failed with unexpected error:', error.message);
    console.error(error.stack);
  }
}

// Run the test
runFullChatJourneyTest();
