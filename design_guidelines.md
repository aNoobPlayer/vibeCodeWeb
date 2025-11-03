# APTIS KEYS Design Guidelines

## Design Approach

**Dual-Interface Strategy**: This platform requires two distinct design languages:
- **Admin/Teacher Interface**: Professional, data-focused dashboard approach inspired by modern admin panels (Linear, Notion, Retool)
- **Student Interface**: Vibrant, engaging glassmorphic design with gamification elements

## Core Design Principles

### Admin Interface (Teacher Dashboard)

**Visual Identity**:
- Professional dark theme with gradient sidebar (gray-900 to gray-800)
- Clean, data-dense layout prioritizing functionality
- Subtle animations and transitions for polish
- High information density without clutter

**Color System**:
- Primary: Indigo (#6366f1) for interactive elements and active states
- Accent: Cyan (#06b6d4) for secondary highlights
- Status colors: Success (#10b981), Warning (#f59e0b), Danger (#ef4444)
- Backgrounds: White cards on light gray (#f8fafc) base
- Dark sidebar: Gradient from #1f2937 to #374151

**Layout Structure**:
- Fixed topbar (72px height) with logo, global search, and user controls
- Sticky sidebar (280px width) with dark gradient background
- Main content area with 32px padding
- Grid-based layouts for KPI cards (4 columns) and data tables

### Student Interface

**Visual Identity**:
- Vibrant green gradient background (#9CCC65 → #66BB6A → #1B5E20)
- Heavy use of glassmorphism with backdrop-blur effects
- Playful, engaging aesthetics with smooth animations
- Color-coded practice cards for visual categorization

**Glass Effects**:
- Sidebar: `rgba(255,255,255,0.1)` with 20px blur
- Cards: `rgba(255,255,255,0.95)` with subtle borders
- Overlays: Multiple layers of translucent white with varying opacity
- Border accent: `rgba(255,255,255,0.2-0.3)` for depth

**Color Coding**:
- Blue gradients: Reading sections
- Cyan gradients: Listening sections  
- Green gradients: Speaking sections
- Red/Orange gradients: Writing sections
- Purple/Gray: Supplementary content

## Typography

**Font Stack**: Inter (primary), fallback to system fonts
- Weights: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

**Admin Hierarchy**:
- Page titles: 28px, weight 700
- Card titles: 18px, weight 600
- Body text: 14-16px, weight 400
- Labels: 11-12px uppercase, weight 600, letter-spacing 0.1em

**Student Hierarchy**:
- Main title: 42px, weight 700, gradient text fill
- Section headers: 20-24px, weight 700
- Card text: 15-16px, weight 600
- Supporting text: 14px, weight 400

## Layout & Spacing

**Spacing Scale**: Use Tailwind units consistently
- Primary spacing: 8px (2), 16px (4), 24px (6), 32px (8)
- Card padding: 24px standard
- Section gaps: 20-24px for tight grouping, 40-50px for major sections
- Grid gaps: 16-24px depending on density

**Component Sizing**:
- Buttons: 44px min-height (touch-friendly)
- Input fields: 12px padding with 44px icon areas
- Cards: 16px border-radius (admin), 14-16px (student)
- Avatars: 32-45px circular
- Icons: 16-24px for UI, 28-50px for decorative

## Components

### Admin Components

**KPI Cards**:
- Gradient background from white to gray-50
- 4px colored top border (gradient: primary to accent)
- Center-aligned content
- Large numeric value (32px) in primary color
- Hover: translateY(-4px) with enhanced shadow

**Data Tables**:
- Alternating row backgrounds for readability
- Sticky headers
- Action buttons grouped on right
- Status badges with appropriate colors
- Responsive with horizontal scroll on mobile

**Sidebar Navigation**:
- Active state: gradient background (primary to primary-light) with left accent bar
- Hover: slight translateX(4px) and opacity change
- Badge counters on right for numerical indicators
- Section headers with uppercase styling

### Student Components

**Practice Cards**:
- Gradient backgrounds matching skill categories
- Glassmorphic borders and shadows
- Shimmer animation on hover (diagonal sweep)
- Icon + text layout with consistent spacing
- Transform on hover: translateY(-8px) scale(1.02)

**Tabbed Navigation**:
- Pill-style tabs in glassmorphic container
- Active tab: gradient background with shadow elevation
- Smooth transitions between states (0.4s cubic-bezier)
- Full-width responsive layout

**Glassmorphic Sidebar**:
- Fixed 320px width
- Floating rocket emoji animation (3s ease-in-out loop)
- Gradient overlay layers for depth
- CTA button with cyan gradient and shadow

## Animations

**Admin Interface**: Minimal, professional
- Hover translations: 1-2px
- Shadow transitions: 0.2s ease
- Fade-ins: 0.3s slideIn from 10px below
- Loading spinners: subtle rotation

**Student Interface**: Playful, engaging
- Floating animations: 3s infinite ease-in-out
- Shimmer effects: 1.5s diagonal sweep on hover
- Pulse effects: 2s infinite for notifications
- Scale transforms: up to 1.05-1.1 on interactive elements
- Transition timing: 0.4s cubic-bezier(0.4, 0, 0.2, 1)

## Images

**Admin Interface**: No hero images
- Avatar images for user profiles
- Icon library: Font Awesome 6.5.0 via CDN
- Optional: Chart visualizations for analytics

**Student Interface**: 
- No large hero image required
- Avatar system for user identification
- Emoji icons (🎓, 🚀) as decorative elements
- Color gradients serve as primary visual impact

## Accessibility

- Minimum touch target: 44x44px
- Color contrast ratios meet WCAG AA standards
- Focus states visible on all interactive elements
- Keyboard navigation support
- Proper heading hierarchy (h1 → h2 → h3)

## Responsive Behavior

**Breakpoints**:
- Mobile: < 768px (single column, stacked layouts)
- Tablet: 768-1024px (2-column grids)
- Desktop: > 1024px (full multi-column layouts)

**Admin Adaptations**:
- Sidebar collapses to icon-only or drawer on mobile
- Tables scroll horizontally with sticky first column
- KPI grid: 4 cols → 2 cols → 1 col

**Student Adaptations**:
- Sidebar becomes bottom drawer or hidden menu
- Practice grid: 2 cols → 1 col
- Search container width adjusts proportionally