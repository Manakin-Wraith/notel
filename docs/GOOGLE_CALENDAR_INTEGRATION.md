# Google Calendar Integration for Notel

## 🎯 Vision
Transform Notel into a unified workspace by seamlessly integrating Google Calendar, allowing users to manage events, tasks, and notes in one place with bidirectional synchronization.

## 🚀 Implementation Phases

### Phase 1: Calendar Links (MVP) - 1-2 days
**Goal**: Allow users to create Google Calendar events from Notel events

**Features**:
- Generate Google Calendar links from Notel events
- "Add to Google Calendar" buttons throughout the app
- No authentication required - uses public Google Calendar URL format

**Technical Approach**:
```typescript
// utils/calendarLinks.ts
export const createGoogleCalendarLink = (event: NotelEvent): string => {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const startDate = formatDateForGoogle(event.startDate);
  const endDate = formatDateForGoogle(event.endDate);
  
  const params = new URLSearchParams({
    text: event.title,
    dates: `${startDate}/${endDate}`,
    details: event.description || '',
    location: event.location || ''
  });
  
  return `${baseUrl}&${params.toString()}`;
};
```

### Phase 2: Read-Only Integration - 1 week
**Goal**: Display Google Calendar events within Notel

**Features**:
- OAuth authentication with Google
- Fetch and display Google Calendar events
- Calendar view in Notel showing both Notel and Google events
- Basic sync (Google → Notel)

**Technical Requirements**:
- Google Calendar API setup
- OAuth 2.0 flow implementation
- Calendar data models and storage
- Sync service for fetching events

### Phase 3: Full Two-Way Sync - 2-3 weeks
**Goal**: Complete bidirectional synchronization

**Features**:
- Create/edit/delete Google Calendar events from Notel
- Real-time sync using webhooks
- Conflict resolution for simultaneous edits
- Smart notifications across both platforms

## 🏗️ Architecture Design

### Database Schema
```sql
-- Calendar connections
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  provider VARCHAR(50) NOT NULL DEFAULT 'google',
  access_token TEXT,
  refresh_token TEXT,
  calendar_id TEXT,
  sync_enabled BOOLEAN DEFAULT true,
  sync_frequency INTEGER DEFAULT 300, -- seconds
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Event synchronization tracking
CREATE TABLE synced_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notel_event_id UUID REFERENCES events(id),
  external_event_id TEXT NOT NULL,
  provider VARCHAR(50) NOT NULL DEFAULT 'google',
  sync_status VARCHAR(20) DEFAULT 'synced',
  conflict_data JSONB,
  last_synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Extend existing events table
ALTER TABLE events ADD COLUMN 
  google_calendar_id TEXT,
  sync_status VARCHAR(20) DEFAULT 'local',
  external_url TEXT;
```

### API Integration Points

#### Google Calendar API Endpoints
```typescript
interface GoogleCalendarAPI {
  // Authentication
  authenticate(authCode: string): Promise<TokenResponse>;
  refreshToken(refreshToken: string): Promise<TokenResponse>;
  
  // Calendar Management
  listCalendars(): Promise<Calendar[]>;
  
  // Event Management
  listEvents(calendarId: string, options?: ListOptions): Promise<Event[]>;
  createEvent(calendarId: string, event: EventInput): Promise<Event>;
  updateEvent(calendarId: string, eventId: string, event: EventInput): Promise<Event>;
  deleteEvent(calendarId: string, eventId: string): Promise<void>;
  
  // Webhooks
  watchEvents(calendarId: string, webhook: WebhookConfig): Promise<Channel>;
}
```

### Service Architecture
```typescript
// services/CalendarSyncService.ts
class CalendarSyncService {
  async syncUserCalendars(userId: string): Promise<void>;
  async handleWebhookNotification(notification: WebhookNotification): Promise<void>;
  async resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<void>;
  async createEventInGoogle(event: NotelEvent): Promise<void>;
  async updateEventInGoogle(eventId: string, changes: Partial<NotelEvent>): Promise<void>;
}
```

## 🎨 UI/UX Integration

### Calendar View Components
```typescript
// components/calendar/CalendarView.tsx
interface CalendarViewProps {
  events: (NotelEvent | GoogleCalendarEvent)[];
  onEventClick: (event: Event) => void;
  onDateSelect: (date: Date) => void;
  syncStatus: SyncStatus;
}

// components/calendar/EventCard.tsx
interface EventCardProps {
  event: NotelEvent;
  showSyncStatus?: boolean;
  onAddToCalendar?: () => void;
  onSync?: () => void;
}
```

### Integration Points
1. **Event Creation Form**: Add "Sync to Google Calendar" toggle
2. **Event Detail View**: Show sync status and Google Calendar link
3. **Calendar Settings**: Manage calendar connections and sync preferences
4. **Notification Center**: Unified notifications from both platforms

## 🔐 Security & Privacy

### OAuth Configuration
```typescript
const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${process.env.APP_URL}/auth/google/calendar/callback`,
  scopes: [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
  ]
};
```

### Data Protection
- Encrypt stored access tokens using Supabase's built-in encryption
- Implement token refresh logic to maintain access
- Provide easy calendar disconnection and data deletion
- Respect user privacy preferences for data sharing

## 📊 Success Metrics

### User Engagement
- **Calendar Connection Rate**: % of users who connect Google Calendar
- **Event Creation Rate**: Events created with calendar sync enabled
- **Sync Success Rate**: % of successful synchronizations
- **User Retention**: Impact on user retention after calendar integration

### Technical Metrics
- **API Response Times**: Google Calendar API performance
- **Sync Accuracy**: % of events successfully synchronized
- **Error Rates**: Failed sync attempts and resolution times
- **Webhook Reliability**: Real-time notification success rate

## 🚀 Quick Start Implementation

### Immediate Next Steps (Phase 1)
1. **Create Calendar Link Utility**: Implement basic Google Calendar link generation
2. **Add UI Components**: "Add to Calendar" buttons in event forms and cards
3. **Test Integration**: Verify calendar links work correctly
4. **User Feedback**: Gather feedback on basic calendar link functionality

### Development Timeline
- **Week 1**: Phase 1 implementation and testing
- **Week 2-3**: Google OAuth setup and Phase 2 development
- **Week 4-6**: Full sync implementation (Phase 3)
- **Week 7**: Testing, refinement, and documentation

## 💡 Future Enhancements

### Advanced Features
- **Multiple Calendar Support**: Sync with multiple Google Calendars
- **Smart Scheduling**: AI-powered meeting scheduling suggestions
- **Calendar Analytics**: Insights on time usage and productivity
- **Team Calendars**: Shared calendar functionality for teams
- **Other Providers**: Outlook, Apple Calendar integration

### Notion-Style Features
- **Calendar Database View**: Events as database entries with properties
- **Template Events**: Reusable event templates
- **Calendar Formulas**: Calculated fields based on calendar data
- **Automation**: Trigger actions based on calendar events

---

*This integration will position Notel as a true Notion competitor by providing seamless calendar functionality within the unified workspace experience.*
