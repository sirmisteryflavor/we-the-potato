# We The Potato - Design Guidelines

## Design Approach

**Selected Approach:** Design System Foundation (Material Design mobile patterns) + Reference Inspiration (Linear for information hierarchy, Instagram for social features)

**Rationale:** This civic engagement app prioritizes information clarity, mobile usability, and trustworthiness while appealing to younger voters. The design must balance serious civic content with modern, shareable social features.

**Core Principles:**
- Information clarity over decoration
- Thumb-zone optimization for mobile
- Scannable content hierarchy
- Trust through consistency and clarity

---

## Typography System

### Font Families
- **Primary:** Inter (via Google Fonts CDN)
- **Display/Headers:** Inter weight 700-800
- **Body/UI:** Inter weight 400-500

### Type Scale (Mobile-First)
- **H1 (Hero/Page Titles):** text-3xl font-bold (30px)
- **H2 (Section Headers):** text-2xl font-bold (24px)
- **H3 (Card Titles):** text-xl font-semibold (20px)
- **H4 (Subheadings):** text-lg font-semibold (18px)
- **Body Large:** text-base (16px) - ballot summaries, important content
- **Body:** text-sm (14px) - standard UI text
- **Caption/Meta:** text-xs (12px) - timestamps, metadata

### Reading Optimization
- Max width for text blocks: max-w-prose (65ch)
- Line height: leading-relaxed (1.625) for body text
- Paragraph spacing: space-y-4

---

## Layout System

### Spacing Primitives
**Standardized Units:** Use Tailwind spacing of 2, 4, 6, 8, 12, 16 units
- **Micro spacing (p-2, gap-2):** 8px - between related items in cards
- **Standard spacing (p-4, gap-4):** 16px - card padding, list item spacing
- **Section spacing (p-6, gap-6):** 24px - between distinct sections
- **Large spacing (p-8, py-12):** 32-48px - page-level spacing

### Container Strategy
- **Mobile base:** px-4 (16px horizontal padding)
- **Desktop max-width:** max-w-2xl (672px) - maintains mobile-first focus
- **Full-bleed sections:** Use for hero, voter card previews

### Grid Patterns
- **Onboarding screens:** Single column, centered content
- **Ballot list:** Single column cards with full-width tap targets
- **Voter card templates:** 3-column grid on tablet+ (grid-cols-1 md:grid-cols-3)
- **Share options:** 2-column grid (grid-cols-2 gap-3)

---

## Component Library

### Navigation & Headers
**Top App Bar (Mobile)**
- Fixed position with backdrop blur
- Height: h-14 (56px - thumb-safe)
- Elements: Back button (left), Page title (center), Action icon (right)
- Sticky on scroll with subtle elevation

**Bottom Navigation (Optional for main sections)**
- Fixed bottom position, h-16 (64px)
- 3-4 main sections with icons + labels
- Active state with icon fill + label weight change

### Cards & Content Containers

**Ballot Measure Card**
- Rounded corners: rounded-xl (12px)
- Padding: p-5
- Stack structure:
  - Measure number badge (top-left, small pill)
  - Title (text-xl font-semibold)
  - Summary toggle buttons (text-sm, inline flex)
  - Content area (varies by view mode)
  - Decision buttons (bottom, full-width row)
- Elevation: Subtle shadow on white background
- Spacing between cards: space-y-4

**Candidate Card**
- Similar structure to ballot measure
- Photo placeholder: rounded-lg, aspect-square on left (80x80px mobile)
- Info column: Name, party, top 3 positions as bullet list
- Select button at bottom

**Voter Card Preview**
- Aspect ratio: aspect-[9/16] (Instagram story format)
- Border: Border with subtle styling
- Interior padding: p-6
- Typography hierarchy: Title (text-2xl), location (text-sm), decisions list (text-base)

### Buttons & Interactive Elements

**Primary CTA Button**
- Height: h-12 (48px - minimum touch target)
- Padding: px-6
- Font: text-base font-semibold
- Border radius: rounded-lg (8px)
- Full-width on mobile: w-full
- On images: backdrop-blur-md with semi-transparent background

**Secondary Button**
- Same sizing as primary
- Outlined style with border-2
- Background: transparent

**Decision Toggle Group (Yes/No/Undecided)**
- Three equal-width buttons in flex row
- Height: h-11 (44px)
- Gap: gap-2
- Border radius: rounded-lg
- Active state: filled, inactive: outlined

**Tab Navigation (Simple/Detailed/Original)**
- Horizontal scroll on mobile
- Pills style: rounded-full px-4 py-2
- Inline-flex with gap-2

### Forms & Inputs

**Text Input Fields**
- Height: h-12 (48px)
- Padding: px-4
- Border: border-2
- Border radius: rounded-lg
- Font: text-base
- Label: text-sm font-medium, mb-2

**ZIP Code Input (Onboarding)**
- Large, centered presentation
- Numeric keyboard trigger (inputmode="numeric")
- Auto-focus on screen entry
- Validation message below input

**Notes Field (Optional on ballot items)**
- Multi-line textarea
- Min height: h-24
- Resize: resize-none (controlled height)
- Placeholder text for guidance

### Onboarding Screens

**Screen Layout Pattern**
- Vertical stack: flex flex-col justify-between min-h-screen
- Content section: flex-1 flex flex-col justify-center px-4
- CTA section: pb-8 px-4 (safe area padding)

**Progress Indicator**
- Top of screen: Dots or step numbers (1/4, 2/4, etc.)
- Small, unobtrusive

**Welcome Screen (Screen 1)**
- Large hero headline: text-4xl font-bold text-center
- Subtext: text-lg text-center, mt-4
- Illustration or icon above headline (optional)
- CTA button at bottom

**Preferences Screen (Screen 3)**
- Issue sliders: Stack with labels
- Slider component: Native range input styled
- Skip link: text-sm, subtle, top-right

### Modals & Overlays

**Share Modal**
- Slides up from bottom on mobile
- Rounded top corners: rounded-t-3xl
- Drag handle at top (visual indicator)
- Sections: Preview, Share options (grid), Copy link
- Dismiss area: backdrop tap or swipe down

**Detail Expansion**
- Accordion pattern for "Detailed view"
- Smooth height transition
- Icon rotation for expand/collapse state

### Social Sharing Components

**Platform Share Buttons**
- Icon + platform name
- Size: h-14, rounded-xl
- Grid layout: grid-cols-2 gap-3
- Icons: Heroicons or Font Awesome via CDN

**Voter Card Template Selector**
- Horizontal scroll carousel
- Card preview: aspect-[9/16], width 60vw
- Snap scroll: snap-x snap-mandatory
- Active indicator below

---

## Animations & Interactions

**Minimal Animation Philosophy:** Use sparingly, only for feedback and clarity

**Permitted Animations:**
- Button press: scale-95 on active
- Card tap: Subtle scale or opacity change
- Modal entry: slide-up transition
- Tab switch: Fade content transition (200ms)
- Decision state change: Quick scale pulse

**Prohibited:**
- Scroll-triggered animations
- Decorative floating elements
- Auto-playing carousels
- Loading spinners longer than necessary

---

## Images

### Hero Image (Landing Page)
**Usage:** Yes - Landing page hero section
**Description:** Energetic, diverse group of young people (18-30) at a polling location or community event, showing engagement and excitement about voting. Modern, bright aesthetic that feels optimistic.
**Placement:** Full-width hero section, height 60vh on mobile with centered content overlay
**Treatment:** Subtle gradient overlay for text readability

### Onboarding Welcome Screen
**Usage:** Icon/Illustration
**Description:** Simple line-art illustration of a ballot or voting box with a checkmark, modern and friendly style
**Placement:** Centered above headline, max width 200px

### Voter Card Backgrounds (Templates)
**Usage:** Pattern/Texture options
**Templates:**
1. **Minimal:** No image, solid background
2. **Bold:** Abstract gradient patterns
3. **Professional:** Subtle geometric patterns or civic-themed icons (very light opacity)

### Share Preview Thumbnails
**Usage:** Generated images
**Description:** Server-rendered voter card designs as PNG for social media sharing
**Placement:** Open Graph meta tags, downloadable files

---

## Mobile-Specific Considerations

### Touch Targets
- Minimum height: 44px (iOS standard)
- Minimum width: 44px
- Spacing between tap targets: At least 8px

### Safe Areas
- Bottom padding for CTA buttons: pb-safe or pb-8
- Account for notches and home indicators
- Test in iOS Safari and Android Chrome

### Scroll Behavior
- Smooth scroll: scroll-smooth
- Snap points for template carousel: snap-x
- Pull-to-refresh (native browser behavior)
- Sticky headers with backdrop-blur

### Keyboard Handling
- Auto-scroll to input on focus
- Dismiss keyboard on form submit
- Done button for numeric inputs

---

## Accessibility Standards

- **Color Contrast:** WCAG AA minimum (4.5:1 for text)
- **Focus States:** Visible outline on all interactive elements (ring-2 ring-offset-2)
- **Labels:** Explicit labels for all form inputs (not just placeholders)
- **ARIA:** Proper roles for custom components (tabs, modals)
- **Semantic HTML:** Use proper heading hierarchy, button vs. div
- **Screen Reader:** Test with VoiceOver (iOS) and TalkBack (Android)

---

## Design Specifications Summary

This civic engagement app balances serious civic content with modern, social-first design. The mobile-first approach ensures thumb-friendly interactions, scannable information hierarchies, and trustworthy presentation. Strategic use of cards, clear typography, and minimal animations keep users focused on understanding ballot measures and making informed decisions. The shareable voter card feature embraces social media aesthetics while maintaining the app's credible, educational foundation.