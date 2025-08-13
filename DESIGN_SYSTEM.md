# vendorHub Design System

## Overview
The vendorHub design system is built on principles of **minimalism**, **professionalism**, and **user-centricity**. It provides a cohesive visual language that ensures consistency across all components and pages.

## Brand Identity

### Logo & Brand Name
- **Brand Name**: vendorHub
- **Tagline**: "Streamlined Vendor Onboarding"
- **Logo**: Modern gradient icon with Building2 symbol
- **Usage**: Clean, professional, and instantly recognizable

## Color Palette

### Primary Colors
```css
--color-primary-50: #eff6ff   /* Light background */
--color-primary-100: #dbeafe  /* Subtle accents */
--color-primary-200: #bfdbfe  /* Light borders */
--color-primary-300: #93c5fd  /* Disabled states */
--color-primary-400: #60a5fa  /* Hover states */
--color-primary-500: #3b82f6  /* Base primary */
--color-primary-600: #2563eb  /* Main CTAs */
--color-primary-700: #1d4ed8  /* Pressed states */
--color-primary-800: #1e40af  /* Dark themes */
--color-primary-900: #1e3a8a  /* High contrast */
```

### Neutral Colors
```css
--color-neutral-50: #fafafa   /* Page backgrounds */
--color-neutral-100: #f5f5f5  /* Card backgrounds */
--color-neutral-200: #e5e5e5  /* Borders */
--color-neutral-300: #d4d4d4  /* Dividers */
--color-neutral-400: #a3a3a3  /* Placeholders */
--color-neutral-500: #737373  /* Secondary text */
--color-neutral-600: #525252  /* Primary text */
--color-neutral-700: #404040  /* Headings */
--color-neutral-800: #262626  /* Dark text */
--color-neutral-900: #171717  /* High contrast */
```

### Accent Colors
```css
--color-accent-success: #10b981  /* Success states */
--color-accent-warning: #f59e0b  /* Warning states */
--color-accent-error: #ef4444    /* Error states */
--color-accent-info: #06b6d4     /* Info states */
```

## Typography

### Font Stack
- **Primary**: Inter (300, 400, 500, 600, 700)
- **Monospace**: JetBrains Mono (400, 500)
- **Fallbacks**: System fonts for performance

### Type Scale
```css
/* Display Typography */
.text-display-2xl { font-size: 3.5rem; line-height: 1.1; }  /* 56px */
.text-display-xl  { font-size: 3rem; line-height: 1.2; }    /* 48px */
.text-display-lg  { font-size: 2.5rem; line-height: 1.25; } /* 40px */
.text-display-md  { font-size: 2rem; line-height: 1.3; }    /* 32px */

/* Body Typography */
.text-body-lg     { font-size: 1.125rem; line-height: 1.7; } /* 18px */
.text-body-md     { font-size: 1rem; line-height: 1.6; }     /* 16px */
.text-body-sm     { font-size: 0.875rem; line-height: 1.5; } /* 14px */
```

### Font Weights
- **Light (300)**: Large headings, elegant emphasis
- **Regular (400)**: Body text, descriptions
- **Medium (500)**: Labels, navigation
- **Semibold (600)**: Section headings, important text
- **Bold (700)**: Main headings, strong emphasis

## Spacing System

### Scale
```css
--spacing-xs: 0.5rem;   /* 8px  */
--spacing-sm: 0.75rem;  /* 12px */
--spacing-md: 1rem;     /* 16px */
--spacing-lg: 1.5rem;   /* 24px */
--spacing-xl: 2rem;     /* 32px */
--spacing-2xl: 2.5rem;  /* 40px */
--spacing-3xl: 3rem;    /* 48px */
```

### Application
- **Component Padding**: Use consistent spacing scale
- **Section Spacing**: .section-padding (py-12 md:py-16 lg:py-20)
- **Grid Gaps**: 1.5rem to 2rem for optimal visual separation

## Component Library

### Cards
```css
.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(229, 229, 229, 0.6);
  border-radius: 0.75rem;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  transition: all 300ms ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Buttons
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px; /* Accessibility minimum */
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 300ms ease;
}

.btn-primary {
  background: linear-gradient(to right, #2563eb, #1d4ed8);
  color: white;
  box-shadow: 0 4px 14px 0 rgb(59 130 246 / 0.3);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px 0 rgb(59 130 246 / 0.4);
}
```

### Forms
```css
.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #d4d4d4;
  border-radius: 0.5rem;
  transition: all 200ms ease;
}

.form-input:focus {
  transform: translateY(-1px);
  border-color: transparent;
  outline: 2px solid #3b82f6;
  box-shadow: 0 4px 12px 0 rgb(59 130 246 / 0.15);
}
```

## Layout System

### Containers
```css
.container-fluid {
  max-width: 1280px; /* 7xl */
  margin: 0 auto;
  padding: 0 1rem; /* Mobile */
  padding: 0 1.5rem; /* Tablet */
  padding: 0 2rem; /* Desktop */
}

.container-narrow {
  max-width: 896px; /* 4xl */
  margin: 0 auto;
  padding: 0 1rem;
}
```

### Grid System
- **Mobile**: Single column, stack vertically
- **Tablet**: 2-column grid with appropriate gaps
- **Desktop**: 3-4 column grid for content sections
- **Responsive**: Always mobile-first approach

## Interactive Elements

### Micro-interactions
```css
/* Hover Effects */
.card:hover { transform: translateY(-2px); }
.btn:hover { transform: translateY(-1px); }
.form-input:focus { transform: translateY(-1px); }

/* Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
```

### Status Indicators
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-success { background: #dcfce7; color: #166534; }
.status-warning { background: #fef3c7; color: #d97706; }
.status-error { background: #fee2e2; color: #dc2626; }
```

## Accessibility Standards

### Color Contrast
- **AA Standard**: All text meets WCAG 2.1 AA contrast ratios
- **AAA Standard**: Important content meets AAA where possible
- **Color Independence**: Never rely solely on color for meaning

### Interactive Elements
- **Touch Targets**: Minimum 44px × 44px for mobile
- **Focus States**: Clear, visible focus indicators
- **Keyboard Navigation**: Full keyboard accessibility

### Typography
- **Readable Sizes**: Minimum 14px for body text
- **Line Height**: 1.5+ for optimal readability
- **Font Weight**: Sufficient contrast between weights

## Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### Grid Behavior
- **Mobile (< 640px)**: Single column, full width
- **Tablet (640px+)**: 2-column grid, optimized spacing
- **Desktop (1024px+)**: 3-4 column grid, maximum efficiency
- **Large (1280px+)**: Contained width, generous whitespace

## Performance Optimizations

### Loading Performance
- **Font Loading**: font-display: swap for custom fonts
- **Image Optimization**: Next.js Image component with lazy loading
- **CSS**: Critical CSS inlined, non-critical deferred

### Animation Performance
- **Hardware Acceleration**: transform and opacity properties
- **Reduced Motion**: Respects user motion preferences
- **Smooth Animations**: 60fps animations with proper easing

## Usage Guidelines

### Do's
- ✅ Use consistent spacing from the scale
- ✅ Maintain proper contrast ratios
- ✅ Follow the component patterns
- ✅ Ensure responsive behavior
- ✅ Include focus states for all interactive elements

### Don'ts
- ❌ Mix different button styles inconsistently
- ❌ Use colors outside the defined palette
- ❌ Ignore mobile-first responsive design
- ❌ Skip accessibility considerations
- ❌ Over-animate or create distracting effects

## Implementation

### CSS Classes
All design system tokens are available as CSS custom properties and utility classes. The system is built on Tailwind CSS with custom extensions.

### Component Usage
```jsx
// Button Example
<button className="btn btn-primary btn-lg">
  Get Started
</button>

// Card Example
<div className="card">
  <h3 className="text-display-md mb-4">Card Title</h3>
  <p className="text-body-md">Card content goes here.</p>
</div>

// Form Example
<div className="form-group">
  <label className="form-label">Email Address</label>
  <input className="form-input" type="email" placeholder="Enter your email" />
</div>
```

This design system ensures consistency, accessibility, and a premium user experience across all vendorHub interfaces.