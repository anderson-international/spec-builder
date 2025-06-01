# Spec Builder Color System

This document outlines the color palette and UI component styling guidelines for the Spec Builder application.

## Color Palette

The application uses a minimalist color palette:

| Name | Hex Code | Usage |
|------|----------|-------|
| Content Background | `#1E2128` | Main application background |
| Card Background | `#161a22` | Card component background |
| Border | `#343741` | Borders for cards, inputs, and other components |
| Text | `#FFFFFF` | Primary text color for dark backgrounds |
| Divider | `#A1A1A1` | Secondary text, dividers, and less important elements |
| Button Blue | `#1878B9` | Primary action buttons |
| Button Green | `#469B3B` | Success actions or confirmation buttons |
| Link | `#4693D1` | Hyperlinks and interactive text elements |

## Component Styling Guidelines

### Cards

Cards should:
- Use the darker grey background (`#161a22`)
- Have a border using the border color
- Include rounded corners and subtle shadow
- Maintain consistent padding

```jsx
<Card className="max-w-md">
  {/* Card content */}
</Card>
```

### Form Elements

Form elements (inputs, selects, textareas) should:
- Have white backgrounds with black text
- Use consistent border styling
- Show blue focus rings when active

```jsx
<input className="input" type="text" />
<select className="input">
  {/* Options */}
</select>
```

### Typography

Text elements follow a clear hierarchy:
- `.heading-primary` - Main headings (larger, bold)
- `.heading-secondary` - Secondary headings (medium size)
- `.text-meta` - Meta information (smaller size, lighter color)

### Buttons

Buttons use our color palette for clear action hierarchy:
- Blue buttons for primary actions
- Green buttons for success/confirmation actions

```jsx
<button className="btn btn-blue">Primary Action</button>
<button className="btn btn-green">Confirm</button>
```

### Tags

Tags use two styles:
- `.tag-primary` - For highlighting primary information
- `.tag-secondary` - For secondary or supporting information

## CSS Implementation

The color system is implemented through:
1. Tailwind color configuration in `tailwind.config.js`
2. Reusable component classes in `globals.css`
3. Consistent application in React components

When creating new components, always use the existing color classes and utility classes rather than hardcoding colors.
