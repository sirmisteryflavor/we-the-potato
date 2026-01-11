# We The Potato - Civics App

## Overview
"We The Potato" is a mobile-first web application designed to inform and engage voters for the 2026 state primary elections in five pilot states (NY, NJ, PA, CT, TX). The app provides comprehensive ballot information, allows users to track their voting decisions, manage election event notifications, and generate shareable "voter cards" for social sharing. Its core purpose is to simplify the election process and encourage civic participation.

## User Preferences
- Decisions saved to localStorage (local-first)
- Onboarding data persisted locally (state, county, ZIP, issue rankings)
- Theme preference (dark/light) saved
- Notification subscriptions stored in backend by visitorId
- Voter cards synced to backend for sharing

## System Architecture
The application uses a React + TypeScript frontend with Tailwind CSS and Shadcn UI for a mobile-first, responsive design supporting dark mode. State management is handled by TanStack Query, and routing by Wouter. The backend is an Express.js server, integrating with Anthropic Claude via Replit AI for ballot simplification. Replit Auth handles user authentication using OAuth. Data persistence for user-specific information and voter cards is managed on the backend, with local storage used for immediate user decisions and onboarding data. A key architectural decision is the "finalized voter card" system, which ties user-generated cards to specific election events and user accounts for persistence and sharing. The admin interface includes comprehensive ballot and event management with features like event visibility, archiving, and detailed editing of measures and candidates, all designed for mobile responsiveness.

### UI/UX Decisions
- Primary Color: Indigo (239, 84%, 67%)
- Font: Inter
- Mobile-first responsive design with dark mode support.
- Consistent UI following `design_guidelines.md`.
- Persistent header navigation across key application pages.
- URL-based tab state for the profile page for improved navigation.
- Dedicated full-page experience for voter card editing.

### Technical Implementations
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn UI, TanStack Query, Wouter.
- **Backend**: Express.js.
- **AI**: Anthropic Claude for ballot simplification.
- **Authentication**: Replit Auth with OAuth support (Google, GitHub, Apple, email/password).
- **Data Storage**: In-memory storage for voter cards and subscriptions (backend), LocalStorage for frontend preferences and decisions.
- **Election Event Management**: Date-based auto-transitioning for event statuses (upcoming/passed).
- **Admin Features**: Comprehensive admin panel for ballot editing, event visibility controls, and event archiving with search and filtering capabilities.

### Feature Specifications
- **Onboarding**: 4-screen flow with ZIP code validation, issue ranking, and guest/email options.
- **Ballot Display**: Collapsible proposition cards with AI-simplified summaries, decision tracking, and personal notes.
- **Voter Card Generator**: Multiple templates for shareable voter cards (PNG download, social sharing) linked to specific election events. Preview is accessible without authentication; sign-in required only when creating/saving.
- **User Profile**: Management of location, issue rankings, notification subscriptions, and finalized voter cards.
- **Notification Subscriptions**: Opt-in for election event updates.
- **Authentication**: Required for creating shareable voter cards and managing user data. Uses post-login redirect flow (`loginWithReturn()`) to preserve user's intended destination.

## External Dependencies
- **Anthropic Claude**: Used via Replit AI Integrations for simplifying ballot measure language.
- **Replit Auth**: For user authentication and session management.
- **External API for ZIP Code Lookup**: Used for validating ZIP codes and retrieving state/county information during onboarding.