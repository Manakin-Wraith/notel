# UI Mockups: Social Chat & Messaging Feature

**Author**: Development Team  
**Date**: 2025-07-30  
**Version**: 1.0  

---

## Design System Analysis

### Current Notion-Inspired Aesthetic
- **Background**: `bg-black/30 backdrop-blur-xl` (glassmorphism)
- **Borders**: `border-white/10` (subtle white borders)
- **Text Colors**: 
  - Primary: `text-white`
  - Secondary: `text-gray-400`
  - Muted: `text-gray-500`
- **Interactive States**:
  - Hover: `hover:text-white hover:bg-white/10`
  - Focus: Subtle border highlights
- **Spacing**: 8px grid system (`p-4`, `mb-6`, `gap-1`)
- **Typography**: Clean, minimal font with proper hierarchy

---

## 1. Desktop Chat Interface Layout

### Main Chat Layout (3-Panel Design)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar - 288px]    │ [Chat List - 320px]    │ [Active Chat - Flexible]     │
│                      │                         │                               │
│ 📄 Pages             │ 💬 Messages            │ Alice Johnson                 │
│ 📅 Agenda            │ ─────────────────────   │ ───────────────────────────── │
│ 📋 Board             │ 🟢 Alice Johnson       │ │ Hey, can you review the     │ │
│ 📆 Calendar          │    Can you review...    │ │ project document I shared?  │ │
│                      │    2 min ago            │ │                        2:30 │ │
│ 💬 Chat              │                         │ └─────────────────────────────┘ │
│ ⚙️  Settings         │ 🔴 Bob Wilson          │                               │
│ 👤 Profile           │    Meeting at 3pm       │ ┌─────────────────────────────┐ │
│                      │    5 min ago            │ │ Sure! I'll take a look      │ │
│                      │                         │ │ and get back to you         │ │
│                      │ 📱 Team Alpha (3)       │ │                        2:32 │ │
│                      │    New sprint planning  │ └─────────────────────────────┘ │
│                      │    1 hour ago           │                               │
│                      │                         │ [Type a message...]           │
│                      │ + Start new chat        │ [Send] 📎                     │
└──────────────────────┴─────────────────────────┴───────────────────────────────┘
```

### Detailed Component Specifications

#### 1.1 Chat Sidebar Integration
```tsx
// Add to existing Sidebar.tsx
<button
  onClick={() => handleViewChange('chat')}
  className={`p-2 rounded-md transition-colors ${
    viewMode === 'chat' 
      ? 'bg-white/20 text-white' 
      : 'text-gray-400 hover:text-white hover:bg-white/10'
  }`}
  title="Chat"
>
  <MessageCircleIcon className="w-5 h-5" />
</button>
```

#### 1.2 Chat List Panel
```
┌─────────────────────────────────┐
│ 💬 Messages              🔍     │ ← Header with search
├─────────────────────────────────┤
│ 🟢 Alice Johnson               │ ← Online indicator + name
│ Can you review the project...   │ ← Last message preview
│ 2 min ago                      │ ← Timestamp
├─────────────────────────────────┤
│ 🔴 Bob Wilson                  │ ← Offline indicator
│ Meeting at 3pm tomorrow        │
│ 5 min ago                      │
├─────────────────────────────────┤
│ 📱 Team Alpha (3)              │ ← Group chat with count
│ New sprint planning discussion  │
│ 1 hour ago                     │
├─────────────────────────────────┤
│                                │
│ + Start new conversation       │ ← New chat button
└─────────────────────────────────┘
```

**Styling**:
- Background: `bg-black/20 backdrop-blur-xl`
- Border: `border-r border-white/10`
- Width: `w-80` (320px)
- Padding: `p-4`

#### 1.3 Active Chat Window
```
┌─────────────────────────────────────────────────┐
│ Alice Johnson                    🟢 Online      │ ← Chat header
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────────┐ │ ← Received message
│ │ Hey, can you review the project document   │ │
│ │ I shared with you yesterday?                │ │
│ │                                        2:30 │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│         ┌─────────────────────────────────────┐ │ ← Sent message
│         │ Sure! I'll take a look and get back │ │
│         │ to you by end of day                │ │
│         │ 2:32                                │ │
│         └─────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Thanks! Let me know if you have any        │ │
│ │ questions or suggestions                    │ │
│ │                                        2:33 │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Type a message...]              📎 [Send]     │ ← Input area
└─────────────────────────────────────────────────┘
```

---

## 2. Mobile Chat Interface

### Mobile Chat List View
```
┌─────────────────────┐
│ ← Messages     🔍   │ ← Header with back button
├─────────────────────┤
│ 🟢 Alice Johnson   │
│ Can you review...   │
│ 2 min ago          │
├─────────────────────┤
│ 🔴 Bob Wilson      │
│ Meeting at 3pm     │
│ 5 min ago          │
├─────────────────────┤
│ 📱 Team Alpha (3)   │
│ New sprint plan... │
│ 1 hour ago         │
├─────────────────────┤
│                    │
│ + New chat         │
└─────────────────────┘
```

### Mobile Active Chat View
```
┌─────────────────────┐
│ ← Alice Johnson 🟢  │ ← Header with back button
├─────────────────────┤
│                    │
│ Hey, can you       │ ← Received message
│ review the project │
│ document?     2:30 │
│                    │
│        Sure! I'll  │ ← Sent message (right-aligned)
│        take a look │
│             2:32   │
│                    │
├─────────────────────┤
│ [Type here...] 📎  │ ← Input with attachment
│              [Send]│
└─────────────────────┘
```

---

## 3. Component Design Specifications

### 3.1 Message Bubble Component
```tsx
interface MessageBubbleProps {
  message: string;
  timestamp: string;
  isOwn: boolean;
  senderName?: string;
  senderAvatar?: string;
}

// Received Message Styling
className={`
  max-w-xs lg:max-w-md p-3 rounded-lg mb-2
  bg-white/10 backdrop-blur-sm border border-white/20
  text-white text-sm leading-relaxed
  ${isOwn ? 'ml-auto bg-blue-500/20 border-blue-400/30' : 'mr-auto'}
`}

// Timestamp Styling
className="text-xs text-gray-400 mt-1 block"
```

### 3.2 Presence Indicator Component
```tsx
// Online Status Dot
<div className={`
  w-3 h-3 rounded-full border-2 border-black/50
  ${isOnline ? 'bg-green-400' : 'bg-gray-500'}
`} />

// Status Options:
// 🟢 Online: bg-green-400
// 🟡 Away: bg-yellow-400  
// 🔴 Offline: bg-gray-500
```

### 3.3 Chat Input Component
```tsx
// Input Container
className="flex items-center gap-2 p-4 border-t border-white/10 bg-black/20"

// Text Input
className={`
  flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2
  text-white placeholder-gray-400 text-sm
  focus:outline-none focus:border-white/40 focus:bg-white/20
  resize-none max-h-32
`}

// Send Button
className={`
  px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-lg
  text-blue-400 hover:bg-blue-500/30 hover:text-blue-300
  transition-colors disabled:opacity-50 disabled:cursor-not-allowed
`}
```

### 3.4 Conversation List Item
```tsx
// Container
className={`
  flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
  hover:bg-white/10 ${isActive ? 'bg-white/20' : ''}
`}

// Avatar/Presence Container
className="relative flex-shrink-0"

// Content Area
className="flex-1 min-w-0"

// Name
className="font-medium text-white text-sm truncate"

// Last Message
className="text-gray-400 text-sm truncate mt-1"

// Timestamp
className="text-xs text-gray-500 mt-1"

// Unread Count Badge
className={`
  absolute -top-1 -right-1 w-5 h-5 rounded-full
  bg-blue-500 text-white text-xs font-medium
  flex items-center justify-center
`}
```

---

## 4. Interactive States & Animations

### 4.1 Hover States
- **Chat List Items**: `hover:bg-white/10`
- **Send Button**: `hover:bg-blue-500/30 hover:text-blue-300`
- **Input Focus**: `focus:border-white/40 focus:bg-white/20`

### 4.2 Loading States
```tsx
// Message Sending (Optimistic UI)
<div className="opacity-60 animate-pulse">
  <MessageBubble {...messageProps} />
</div>

// Chat List Loading
<div className="animate-pulse space-y-3">
  {[1,2,3].map(i => (
    <div key={i} className="flex gap-3 p-3">
      <div className="w-10 h-10 bg-white/20 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/20 rounded w-3/4" />
        <div className="h-3 bg-white/20 rounded w-1/2" />
      </div>
    </div>
  ))}
</div>
```

### 4.3 Micro-Interactions
- **Message Appear**: Fade in from bottom with slight scale
- **Typing Indicator**: Animated dots
- **Online Status**: Subtle pulse animation for online users
- **New Message**: Gentle slide-in animation

---

## 5. Responsive Breakpoints

### Desktop (lg: 1024px+)
- 3-panel layout: Sidebar (288px) + Chat List (320px) + Chat Window (flexible)
- Full feature set visible

### Tablet (md: 768px - 1023px)
- 2-panel layout: Chat List (320px) + Chat Window (flexible)
- Sidebar collapses to hamburger menu

### Mobile (sm: < 768px)
- Single panel navigation
- Full-screen chat list or chat window
- Bottom navigation for main app sections

---

## 6. Accessibility Specifications

### Keyboard Navigation
- **Tab Order**: Chat list → Active chat → Message input → Send button
- **Arrow Keys**: Navigate through chat list items
- **Enter**: Open selected conversation or send message
- **Escape**: Close chat modals or return to previous view

### Screen Reader Support
```tsx
// Chat List Item
<div role="button" tabIndex={0} aria-label={`Chat with ${name}, last message: ${lastMessage}, ${timestamp}`}>

// Message
<div role="log" aria-live="polite" aria-label={`Message from ${sender} at ${time}: ${content}`}>

// Input
<textarea 
  aria-label="Type your message"
  placeholder="Type a message..."
  aria-describedby="send-button"
/>

// Send Button
<button 
  id="send-button"
  aria-label="Send message"
  disabled={!message.trim()}
>
```

### Color Contrast
- **Text on Background**: 4.5:1 minimum ratio
- **Interactive Elements**: Clear focus indicators
- **Status Indicators**: Shape + color for colorblind users

---

## 7. Dark Mode Optimization

### Color Palette
```css
/* Primary Colors */
--chat-bg-primary: rgba(0, 0, 0, 0.3);
--chat-bg-secondary: rgba(0, 0, 0, 0.2);
--chat-border: rgba(255, 255, 255, 0.1);

/* Text Colors */
--chat-text-primary: #ffffff;
--chat-text-secondary: #9ca3af;
--chat-text-muted: #6b7280;

/* Interactive Colors */
--chat-hover: rgba(255, 255, 255, 0.1);
--chat-active: rgba(255, 255, 255, 0.2);
--chat-focus: rgba(255, 255, 255, 0.4);

/* Status Colors */
--chat-online: #10b981;
--chat-away: #f59e0b;
--chat-offline: #6b7280;

/* Message Colors */
--chat-received-bg: rgba(255, 255, 255, 0.1);
--chat-sent-bg: rgba(59, 130, 246, 0.2);
--chat-sent-border: rgba(59, 130, 246, 0.3);
```

---

## 8. Implementation Priority

### Phase 1: Core UI Components
1. **ChatSidebar** - Integration with existing sidebar
2. **ConversationList** - Chat list with basic styling
3. **ChatWindow** - Main chat interface
4. **MessageBubble** - Individual message display
5. **MessageInput** - Text input with send functionality

### Phase 2: Enhanced UX
1. **PresenceIndicator** - Online status display
2. **TypingIndicator** - Show when users are typing
3. **MessageStatus** - Delivered/read indicators
4. **SearchBar** - Search conversations and messages
5. **UserSearch** - Find users to start new chats

### Phase 3: Advanced Features
1. **GroupChatUI** - Multi-user conversation interface
2. **ChatNotifications** - In-app notification system
3. **MessageActions** - Reply, edit, delete functionality
4. **EmojiPicker** - Emoji selection for messages
5. **FileUpload** - Attachment support

---

## 9. Design System Integration

### Reusable Components
- Use existing `ProfileAvatar` component for user avatars
- Extend `Button` component variants for chat actions
- Utilize existing `Modal` component for chat settings
- Leverage `Input` component styling for message input

### Consistent Patterns
- Match existing glassmorphism effects
- Use same border radius and spacing
- Follow existing color hierarchy
- Maintain consistent typography scale

---

*These mockups provide a comprehensive foundation for implementing the chat feature while maintaining perfect consistency with your Notion-inspired dark, minimalistic aesthetic.*
