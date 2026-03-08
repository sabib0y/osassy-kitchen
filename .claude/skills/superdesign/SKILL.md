---
name: superdesign
description: Generate React/TypeScript UI components using a structured design workflow. Use when designing interfaces, creating components, or prototyping UI. Follows a 4-step process - layout, theme, animation, then React component generation with SCSS modules.
allowed-tools: Write, Read, Edit, Glob, Grep, Bash
---

# SuperDesign - React/TypeScript Component Design Workflow

A senior frontend designer skill for generating production-ready React components through a structured workflow.

## When to Use This Skill

Use SuperDesign when:
- Designing UI & frontend interfaces
- Creating React/TypeScript components
- Building Next.js pages
- Prototyping new features
- Iterating on visual designs

## Core Workflow (Must Follow in Order)

### 1. Layout Design
**Output type**: Text (ASCII wireframe)

Think through the layout and present it in ASCII wireframe format:
- Identify UI components
- Define component hierarchy
- Show responsive behaviour
- Get user sign-off before proceeding

### 2. Theme Design
**Output type**: Tool call (Write SCSS)

Design the visual theme:
- Choose colours, fonts, spacing, shadows
- Create SCSS module file with CSS variables
- Follow project's brand colours (if applicable)
- Get user approval before proceeding

### 3. Animation Design
**Output type**: Text (micro-syntax)

Define animations and transitions:
- Specify timing and easing
- List micro-interactions
- Document all animation states
- Get user confirmation before proceeding

### 4. Generate React Component
**Output type**: Tool call (Write)

Create the final React/TypeScript component:
- Build `.tsx` component file
- Create accompanying `.module.scss` file
- Use proper TypeScript interfaces
- Follow Next.js/React best practices
- MUST use Write tool (not text output)

**CRITICAL**: Confirm with user at each step before moving to the next!

## Output Structure

### For Pages
```
src/
├── pages/
│   └── feature-name.tsx          # Next.js page component
└── styles/
    └── pages/
        └── feature-name.module.scss   # Page-specific styles
```

### For Components
```
src/
├── components/
│   └── feature/
│       ├── ComponentName.tsx     # React component
│       └── ComponentName.module.scss  # Component styles
└── types/
    └── feature.ts               # TypeScript interfaces
```

## Styling Guidelines

### Design System
Follow project's established patterns:
- **Primary colours** from brand guidelines
- **Typography**: Inter, system-ui
- **Component library**: Build on existing patterns
- **Responsive**: Mobile-first with proper breakpoints

### SCSS Module Structure
```scss
// Component-specific styles with CSS variables
.container {
  background: var(--background);
  color: var(--foreground);
  padding: var(--spacing-lg);
}

.card {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

// Responsive
@media (max-width: 768px) {
  .container {
    padding: var(--spacing-md);
  }
}
```

### Colour Rules
- **Use project's brand colours** (e.g., #C52D2F red, #F1C40F yellow, #FF6F3C orange)
- Follow existing design system
- Ensure proper contrast ratios
- Support dark mode if applicable

### Typography
Use project's font stack:
```css
font-family: Inter, system-ui, -apple-system, sans-serif;
```

## React/TypeScript Best Practices

### Component Structure
```typescript
import React, { useState } from 'react';
import styles from './ComponentName.module.scss';

interface ComponentNameProps {
  title: string;
  onAction?: () => void;
}

const ComponentName: React.FC<ComponentNameProps> = ({ title, onAction }) => {
  const [state, setState] = useState<string>('');

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{title}</h1>
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
```

### Next.js Page Structure
```typescript
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import styles from '@/styles/pages/feature.module.scss';

interface PageProps {
  data: any;
}

const FeaturePage: React.FC<PageProps> = ({ data }) => {
  return (
    <Layout>
      <div className={styles.container}>
        {/* Page content */}
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  return { props: { data: {} } };
};

export default FeaturePage;
```

## Icons & Images

### Icons
Use Lucide React:
```typescript
import { Search, User, ChevronRight } from 'lucide-react';

<Search className={styles.icon} size={20} />
```

### Images
Use Next.js Image component:
```typescript
import Image from 'next/image';

<Image
  src="/images/placeholder.jpg"
  alt="Description"
  width={400}
  height={300}
  className={styles.image}
/>
```

## File Naming Convention

### Components
- **PascalCase** for components: `UserProfile.tsx`
- **camelCase** for files: `userProfile.module.scss`
- **kebab-case** for pages: `user-profile.tsx`

### Iterations
When iterating:
- v1: `UserProfile.tsx`
- v2: `UserProfileV2.tsx` (or create new branch)

## Example Workflow

```
User: "Design a Help Center page with FAQ accordion"

Step 1 - Layout:
[Present ASCII wireframe with search bar, FAQ categories, contact form]
"Would you like to proceed with this layout?"

User: "Looks good"

Step 2 - Theme:
[Create help.module.scss with brand colours and variables]
"I've created the theme using your brand colours. Approve?"

User: "Perfect"

Step 3 - Animation:
[Present micro-syntax for accordion animations, hover states]
"These animations will make the FAQ smooth. Proceed?"

User: "Yes"

Step 4 - React Component:
[Create help.tsx page with TypeScript interfaces]
[Create help.module.scss with responsive styles]
"I've created the Help page component. Please review!"
```

## Integration with Project

### Check Project Structure
Before generating components:
1. Read existing component patterns
2. Check established naming conventions
3. Review existing SCSS variables
4. Verify TypeScript interface patterns

### Follow TDD Approach
After component creation:
1. Write test file first (if TDD required)
2. Implement component
3. Run tests to verify
4. Iterate as needed

## Critical Rules

1. **MUST use actual tool calls** - Never output pseudo-tool-call text
2. **MUST confirm at each step** - Layout → Theme → Animation → Component
3. **MUST follow project structure** - Use existing patterns
4. **MUST use TypeScript** - Full type safety required
5. **MUST create SCSS modules** - No inline styles

## Available Tools

When this Skill is active, you have access to:
- `Write` - Create component/style files
- `Read` - Read existing files for patterns
- `Edit` - Modify existing files
- `Glob` - Find files by pattern
- `Grep` - Search codebase
- `Bash` - Run build/test commands

Remember: Generate production-ready React/TypeScript components, not just HTML prototypes!
