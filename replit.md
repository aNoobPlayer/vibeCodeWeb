# APTIS KEYS - Professional APTIS Test Preparation Platform

## Project Overview
A dual-interface APTIS test preparation platform built with React + Vite and Express.js. Features separate professional admin dashboard for teachers and vibrant glassmorphic student learning interface.

## Recent Changes
- **2025-01-03**: Initial project setup with schema-first development approach
  - Created comprehensive data schemas for test sets, questions, tips, media, and activities
  - Configured design system with dual-theme support (admin dark theme + student vibrant green theme)
  - Built complete admin dashboard with sidebar navigation, KPI cards, data tables, and management views
  - Built complete student dashboard with glassmorphic design, practice cards, and tips section
  - Created home page with portal selection for admin/student access

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + Node.js 20
- **Styling**: Tailwind CSS + Shadcn UI components
- **State Management**: TanStack Query (React Query v5)
- **Routing**: Wouter
- **Icons**: Font Awesome 6.5.0
- **Data Storage**: In-memory storage (MemStorage)
- **Form Handling**: React Hook Form + Zod validation

## Project Structure
```
/client                  # Frontend React application
  /src
    /components/ui       # Shadcn UI components
    /pages              # Page components
      - home.tsx        # Landing page with portal selection
      - admin-dashboard.tsx   # Admin/teacher interface
      - student-dashboard.tsx # Student learning interface
      - not-found.tsx   # 404 page
    - App.tsx          # Main app with routing
    - index.css        # Global styles with CSS variables
/server                 # Backend Express application
  - routes.ts          # API routes
  - storage.ts         # In-memory storage implementation
/shared                 # Shared types and schemas
  - schema.ts          # Drizzle schemas and Zod validation
```

## Features Implemented

### Admin Dashboard (/admin)
- **Professional Dark Theme**: Gray-900 to gray-800 gradient sidebar
- **Dashboard View**: 
  - 4 KPI cards (test sets, questions, tips, media count)
  - Activity feed showing recent changes
  - Skill distribution chart for questions
  - Quick action buttons
- **Test Sets Management**: Table with filtering, search, CRUD operations
- **Questions Bank**: Comprehensive question management with type and skill filters
- **Tips Management**: Create and manage study tips for students
- **Media Library**: Grid view for audio and image file management
- **Users Management**: Placeholder for user administration

### Student Interface (/student)
- **Vibrant Glassmorphic Design**: Green gradient background with frosted glass effects
- **Glassmorphic Sidebar**: Floating navigation with current page indicator and rocket animation
- **Practice Page**: 
  - Skill-based tabs (All, Reading, Listening, Speaking, Writing)
  - Color-coded practice cards with shimmer effect on hover
  - Gradient backgrounds matching skill types
- **Tips & Guides**: Filter by skill, view study tips
- **Progress Tracking**: Placeholder stats dashboard

### Home Page (/)
- Portal selection for admin/teacher vs student access
- Feature showcase
- Professional gradient design

## Data Model
- **TestSets**: Skill-based test collections with status (draft/published)
- **Questions**: Multiple types (MCQ single/multi, fill blank, writing/speaking prompts)
- **Tips**: Study guides categorized by skill
- **Media**: Audio and image file library
- **Activities**: System activity tracking for dashboard
- **Users**: Role-based user management (admin/student)

## Design System
- **Admin Colors**: 
  - Primary: Indigo (#6366f1)
  - Accent: Cyan (#06b6d4)
  - Success: Green (#10b981)
  - Warning: Orange (#f59e0b)
  - Destructive: Red (#ef4444)
- **Student Colors**: Green gradient (#9CCC65 → #66BB6A → #1B5E20)
- **Typography**: Inter font family, weights 300-700
- **Animations**: Smooth transitions, hover effects, floating animations

## User Preferences
- Visual excellence is paramount - every component follows design_guidelines.md
- Accessibility-first approach with proper ARIA labels and test IDs
- Responsive design across all breakpoints
- Professional polish with smooth interactions

## Next Steps
1. Implement backend API endpoints for all CRUD operations
2. Set up storage implementation with proper data persistence
3. Connect frontend components to backend APIs
4. Add loading states and error handling
5. Implement form modals for create/edit operations
6. Add media upload functionality
7. Test all core MVP features
