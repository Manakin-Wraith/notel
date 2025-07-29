# Landing Page Documentation

## Overview

The Notel landing page is a Notion-inspired, dark-themed marketing page designed to convert visitors into users through compelling design and seamless Google OAuth integration.

## Architecture

### Components Structure

```
components/landing/
├── LandingPage.tsx      # Main container component
├── Header.tsx           # Navigation and auth buttons
├── HeroSection.tsx      # Main value proposition
├── FeatureShowcase.tsx  # App features demonstration
├── BenefitsSection.tsx  # Benefits and comparisons
├── CTASection.tsx       # Final call-to-action
└── Footer.tsx           # Brand info and links
```

### Key Features

- **Google OAuth Integration**: All auth buttons connect to Google sign-in
- **Loading States**: Professional spinners and disabled states during auth
- **Toast Notifications**: Success/error feedback with auto-hide
- **Responsive Design**: Mobile-optimized across all breakpoints
- **Accessibility**: Proper ARIA labels and semantic HTML

## Authentication Flow

### useAuthWithToast Hook

Custom React hook that handles:
- Google OAuth sign-in process
- Loading state management
- Toast notification display
- Error handling and user feedback

```typescript
const { signInWithGoogle, isLoading } = useAuthWithToast();
```

### Integration Points

1. **Header**: Sign In and Get Started buttons
2. **HeroSection**: Start for Free button
3. **CTASection**: Start Free Today button

## Design Principles

### Notion-Inspired Aesthetic
- **Dark Theme**: Gray-900 background with white text
- **Minimalist Layout**: Clean, focused design with ample whitespace
- **Typography**: Clear hierarchy with bold headings
- **Color Palette**: Blue accents (#3B82F6) for CTAs

### Responsive Breakpoints
- **Mobile**: < 768px - Stacked layout, simplified navigation
- **Tablet**: 768px - 1024px - Adjusted spacing and typography
- **Desktop**: > 1024px - Full layout with optimal spacing

## Testing

### Test Coverage
- **LandingPage.test.tsx**: Component rendering and navigation
- **Router.test.tsx**: Routing and authentication flows
- **AuthContext.test.tsx**: Authentication state management

### Running Tests
```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode for development
npm run test:coverage   # Generate coverage report
```

## Production Setup

### Prerequisites

1. **Supabase Configuration**
   - Google OAuth provider enabled
   - Redirect URLs configured:
     - Development: `http://localhost:5173/`
     - Production: `https://notel-wine.vercel.app/`

2. **Google Cloud Console**
   - OAuth 2.0 client ID created
   - Authorized redirect URIs added
   - Client ID added to Supabase

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Deployment Checklist

- [ ] Supabase Google OAuth configured
- [ ] Google Cloud Console redirect URIs set
- [ ] Environment variables configured
- [ ] Tests passing (90%+ coverage)
- [ ] Responsive design verified
- [ ] Accessibility audit completed

## Performance Optimizations

### Loading States
- Immediate visual feedback during auth
- Disabled buttons prevent double-clicks
- Smooth transitions and animations

### Toast Notifications
- Auto-hide after 3-5 seconds
- Non-blocking user experience
- Clear success/error messaging

## Future Enhancements

### Potential Improvements
1. **A/B Testing**: Different hero messages and CTAs
2. **Analytics**: User interaction tracking
3. **SEO**: Meta tags and structured data
4. **Animations**: Subtle scroll-triggered animations
5. **Testimonials**: User reviews and social proof

### Technical Debt
1. Remaining test failures (4/41) - navigation link duplicates
2. Toast notification cleanup between tests
3. Enhanced error handling for edge cases

## Maintenance

### Regular Tasks
- Monitor conversion rates
- Update copy and messaging
- Test OAuth flow functionality
- Review and update dependencies

### Monitoring
- Google OAuth success/failure rates
- Page load performance
- Mobile responsiveness
- Accessibility compliance

---

*Last updated: July 29, 2025*
*Version: 1.0.0*
