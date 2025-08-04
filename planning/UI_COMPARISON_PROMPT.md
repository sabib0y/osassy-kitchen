# UI Design Comparison Prompt for LLM Analysis

## Task: Compare HTML Designs vs React Implementation

Please analyze and compare the original HTML designs with the React implementation to identify visual discrepancies and ensure design fidelity.

## Files to Compare:

### **ADMIN ORDERS MANAGEMENT**

**Original HTML Design:**
```
File: .superdesign/design_iterations/admin_orders_management_1.html
```

**React Implementation Files:**
```
Main Page: src/pages/admin/orders.tsx
Layout: src/components/admin/shared/AdminLayout.tsx
Components:
- src/components/admin/orders/OrderTable.tsx
- src/components/admin/orders/OrderModal.tsx
- src/components/admin/orders/OrderFilters.tsx
- src/components/admin/orders/BulkActions.tsx
- src/components/admin/orders/OrderStats.tsx
Shared Components:
- src/components/admin/shared/StatusBadge.tsx
- src/components/admin/shared/StatsCard.tsx
- src/components/admin/shared/LoadingSpinner.tsx
- src/components/admin/shared/ErrorMessage.tsx
```

### **ADMIN MENU MANAGEMENT**

**Original HTML Design:**
```
File: .superdesign/design_iterations/admin_menu_management_1.html
```

**React Implementation Files:**
```
Main Page: src/pages/admin/menu.tsx
Layout: src/components/admin/shared/AdminLayout.tsx
Components:
- src/components/admin/menu/MenuGrid.tsx
- src/components/admin/menu/MenuItemCard.tsx
- src/components/admin/menu/MenuFilters.tsx
- src/components/admin/menu/MenuStats.tsx
Shared Components:
- src/components/admin/shared/StatusBadge.tsx
- src/components/admin/shared/StatsCard.tsx
- src/components/admin/shared/LoadingSpinner.tsx
- src/components/admin/shared/ErrorMessage.tsx
```

## Analysis Required:

### **1. Layout & Structure Comparison**
- Compare overall page layout and component positioning
- Verify sidebar navigation matches original design
- Check header and navigation elements
- Ensure responsive breakpoints are consistent

### **2. Component Visual Fidelity**
- **Order Table**: Compare table styling, headers, row layout, and pagination
- **Order Modal**: Verify modal design, layout, and visual hierarchy
- **Menu Grid**: Compare card layout, image positioning, and grid structure
- **Filters**: Check filter styling, dropdown design, and search inputs
- **Stats Cards**: Verify dashboard card design and data presentation
- **Status Badges**: Compare color schemes and styling

### **3. Color Scheme & Typography**
- Verify CSS custom properties match original design
- Check font families, sizes, and weights
- Ensure color consistency (primary, secondary, accent colors)
- Validate spacing and padding throughout

### **4. Interactive Elements**
- Compare button styles and hover states
- Verify form input styling
- Check modal overlay and transition effects
- Ensure dropdown and select element styling

### **5. Mobile Responsiveness**
- Compare responsive behavior at different breakpoints
- Verify mobile navigation and layout
- Check table responsive behavior (overflow, horizontal scrolling)

## Expected Output:

Please provide:

1. **Detailed Discrepancy Report** listing specific visual differences
2. **Priority Ranking** of issues (Critical, High, Medium, Low)
3. **Specific CSS/Styling Recommendations** to fix each issue
4. **Code Examples** showing required changes for major discrepancies
5. **Screenshots Comparison** if possible (describe what should look like)

## Focus Areas:

- **Critical**: Layout structure, color scheme, typography
- **High**: Component styling, spacing, responsive behavior  
- **Medium**: Interactive states, micro-interactions
- **Low**: Minor styling details, polish items

## Additional Context:

- Original designs use CSS custom properties (CSS variables)
- React implementation uses Tailwind CSS classes
- The theme files are: 
  - `.superdesign/design_iterations/osassy_admin_dashboard_theme.css`
  - `.superdesign/design_iterations/osassy_user_dashboard_theme.css`
- Target framework: Next.js 14 with TypeScript
- Icons: Lucide React icons used instead of original icon set

Please provide actionable feedback to ensure the React implementation perfectly matches the original HTML designs.
