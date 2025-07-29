# Phase 1 Google Calendar Integration - Testing User Flow

## 🎯 Testing Objectives
Validate that users can successfully generate and use Google Calendar links from Notel events through both EventModal and EventDetailsModal interfaces.

---

## 📋 Pre-Testing Setup

### Environment Verification
- [ ] Development server running (`npm run dev`)
- [ ] User authenticated with Google OAuth
- [ ] Browser with clipboard access permissions
- [ ] Google Calendar accessible in separate tab/window

### Test Data Preparation
- [ ] Create test events with various data combinations:
  - Complete event (title, date, time, description)
  - Minimal event (title and date only)
  - All-day event
  - Multi-day event
  - Event with special characters in title/description

---

## 🔄 User Flow Test Scenarios

### Scenario 1: EventModal Integration (New Event Creation)

#### 1.1 Access EventModal
- [ ] Navigate to Calendar view
- [ ] Click "+" button or empty calendar cell
- [ ] Verify EventModal opens

#### 1.2 Create Event with Calendar Integration
- [ ] Fill in event details:
  - Title: "Team Meeting"
  - Date: Tomorrow
  - Time: 2:00 PM - 3:00 PM
  - Description: "Weekly team sync"
- [ ] Verify CalendarLinkButton appears in actions section
- [ ] Button should show "Add to Calendar" text
- [ ] Button should have calendar icon

#### 1.3 Test Simple Calendar Link (No Copy Option)
- [ ] Click "Add to Calendar" button directly
- [ ] Verify Google Calendar opens in new tab/window
- [ ] Verify event details pre-populated correctly:
  - Title matches
  - Date/time correct
  - Description includes "Created with Notel" branding
- [ ] Verify success callback (if implemented)

#### 1.4 Test Dropdown with Copy Option
- [ ] Modify CalendarLinkButton to show copy option (`showCopyOption={true}`)
- [ ] Click dropdown arrow
- [ ] Verify dropdown menu appears with:
  - "Open in Google Calendar" option
  - "Copy calendar link" option

#### 1.5 Test "Open in Google Calendar" from Dropdown
- [ ] Click "Open in Google Calendar"
- [ ] Verify Google Calendar opens with event details
- [ ] Verify dropdown closes after action

#### 1.6 Test "Copy calendar link" from Dropdown
- [ ] Click "Copy calendar link"
- [ ] Verify success feedback (toast/message)
- [ ] Open new browser tab
- [ ] Paste link in address bar
- [ ] Verify Google Calendar opens with event details
- [ ] Verify dropdown closes after action

### Scenario 2: EventDetailsModal Integration (Existing Event)

#### 2.1 Access EventDetailsModal
- [ ] Create and save an event first
- [ ] Click on existing event in calendar
- [ ] Verify EventDetailsModal opens
- [ ] Verify event details display correctly

#### 2.2 Test Calendar Integration from Details Modal
- [ ] Verify CalendarLinkButton appears alongside Edit/Delete buttons
- [ ] Test same functionality as EventModal:
  - Direct calendar opening
  - Dropdown with copy option
  - Link copying and validation

#### 2.3 Test with Various Event Types
- [ ] All-day event: Verify no time in calendar link
- [ ] Multi-day event: Verify date range correct
- [ ] Event with special characters: Verify proper URL encoding
- [ ] Minimal event: Verify works with just title and date

### Scenario 3: Edge Cases and Error Handling

#### 3.1 Invalid Event Data
- [ ] Test with missing required fields
- [ ] Verify button doesn't appear or is disabled
- [ ] Test with invalid dates
- [ ] Verify graceful error handling

#### 3.2 Browser Limitations
- [ ] Test clipboard access denied
- [ ] Verify error callback triggered
- [ ] Verify user-friendly error message
- [ ] Test popup blocker interference
- [ ] Verify fallback behavior

#### 3.3 Network Issues
- [ ] Test with slow/intermittent connection
- [ ] Verify loading states work correctly
- [ ] Test offline behavior (if applicable)

### Scenario 4: UI/UX Validation

#### 4.1 Visual Design
- [ ] Verify button styling matches Notion-inspired theme
- [ ] Test different button variants (primary, secondary, ghost)
- [ ] Test different button sizes (sm, md, lg)
- [ ] Verify proper spacing and alignment
- [ ] Test responsive behavior on mobile

#### 4.2 Accessibility
- [ ] Test keyboard navigation
- [ ] Verify screen reader compatibility
- [ ] Test focus management
- [ ] Verify ARIA labels and roles
- [ ] Test high contrast mode

#### 4.3 User Feedback
- [ ] Verify loading states during actions
- [ ] Test success/error feedback mechanisms
- [ ] Verify dropdown animations smooth
- [ ] Test hover/active states

### Scenario 5: Integration Testing

#### 5.1 Cross-Component Integration
- [ ] Test calendar button in both modals
- [ ] Verify consistent behavior across components
- [ ] Test state management between modals
- [ ] Verify no conflicts with other modal actions

#### 5.2 Data Flow Validation
- [ ] Verify event data correctly passed to calendar utilities
- [ ] Test with events from different sources (manual, imported)
- [ ] Verify calendar links work with shared events
- [ ] Test with events in different timezones

---

## 📊 Success Criteria

### Functional Requirements
- [ ] All calendar links generate correctly
- [ ] Google Calendar opens with proper event details
- [ ] Copy functionality works reliably
- [ ] Error handling graceful and informative
- [ ] UI responsive across devices

### User Experience Requirements
- [ ] Intuitive button placement and design
- [ ] Clear visual feedback for all actions
- [ ] Consistent behavior across components
- [ ] Accessible to users with disabilities
- [ ] Performance acceptable (<2s for link generation)

### Technical Requirements
- [ ] All automated tests pass (30/30)
- [ ] No console errors during testing
- [ ] Proper TypeScript typing throughout
- [ ] Clean code architecture maintained
- [ ] Documentation complete and accurate

---

## 🐛 Bug Tracking Template

### Issue Report Format
```
**Issue**: [Brief description]
**Scenario**: [Which test scenario]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**: [What should happen]
**Actual Result**: [What actually happened]
**Browser/Device**: [Testing environment]
**Severity**: [High/Medium/Low]
**Status**: [Open/In Progress/Fixed]
```

---

## 🚀 Post-Testing Actions

### If All Tests Pass
- [ ] Update documentation with testing results
- [ ] Create user-facing documentation
- [ ] Plan Phase 2 implementation
- [ ] Gather user feedback for improvements

### If Issues Found
- [ ] Document all bugs using template above
- [ ] Prioritize fixes based on severity
- [ ] Fix critical issues before proceeding
- [ ] Re-run affected test scenarios
- [ ] Update automated tests if needed

---

## 📝 Testing Notes

**Tester**: [Name]  
**Date**: [Testing Date]  
**Environment**: [Browser, OS, Device]  
**Build Version**: [Git commit hash]  

**Overall Assessment**: [Pass/Fail with notes]  
**Recommendations**: [Any suggestions for improvement]
