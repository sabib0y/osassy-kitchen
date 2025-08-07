# UI Generation Prompt for “Create Subscription” Page

You are the **ui-html-generator** agent. Generate a **self-contained HTML file** (with embedded CSS in a `<style>` tag) for the **“Create Subscription”** page of Osassy’s Kitchen. The design must match the visual style of the existing **User Dashboard** (see attached screenshot), using SCSS-like custom properties for colours and spacing.

---

## 1. Page Purpose & Structure

- **Goal**: Let logged-in users select dishes & quantities, choose a billing interval (Weekly/Monthly), review their selection, and confirm to start a new subscription.
- **URL**: `/manage/subscribe`

### 1.1 Layout

1. **Breadcrumb / Header**  
   - “Dashboard > Subscriptions > Create New”  
   - Page title: **“Create New Subscription”**  

2. **Plan Selector**  
   - Two pill-style toggles: **Weekly** and **Monthly**  
   - The active pill is highlighted in the brand accent colour.

3. **Menu Grid**  
   - Cards for each available `MenuItem`, laid out in a responsive grid (3 columns desktop, 2 tablet, 1 mobile).  
   - Each card shows: dish image, name, description, and a quantity selector (`–`, value, `+`).  
   - Disabled or out-of-stock items appear faded with a “Sold Out” badge.

4. **Summary Panel** (sticky on desktop, collapsible on mobile)  
   - Lists selected items & quantities, line-item subtotal.  
   - Displays chosen plan interval and calculated total price.  
   - **Primary Button**: “Proceed to Checkout”  

5. **Cancel Link**  
   - Secondary text link below the button: “Cancel and Return to Subscriptions”  

---

## 2. Data & Props

Assume the following mock data:

```ts
interface MenuItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number; // per delivery
  available: boolean;
}

interface SubscriptionFormData {
  interval: 'WEEKLY' | 'MONTHLY';
  items: { menuItemId: string; quantity: number }[];
}
3. Styling & Theming
Use a <style> tag with CSS custom properties:

scss
Copy
Edit
:root {
  --brand-primary:   #C52D2F;
  --brand-secondary: #F1C40F;
  --accent:          #FF6F3C;
  --text-dark:       #1E1E1E;
  --text-light:      #FFFFFF;
  --spacing:         1rem;
  --radius:          0.5rem;
  --shadow:          0 2px 8px rgba(0,0,0,0.05);
}
Grid: display: grid; gap: var(--spacing); grid-template-columns: repeat(auto-fill, minmax(240px,1fr));

Cards: white background, border-radius var(--radius), box-shadow var(--shadow), padding var(--spacing).

Buttons & Pills: background var(--accent), white text, border-radius 2rem, padding 0.5rem 1rem, hover state darkens accent by 10%.

Typography: headings 1.5rem bold, base text 1rem, link colour var(--brand-primary).

4. Accessibility
All images have alt attributes.

Quantity controls are buttons with aria-label="Increase quantity of [dish name]" and aria-label="Decrease quantity of [dish name]".

Form elements have associated <label> tags.

Ensure keyboard navigation: focus states clearly visible.

5. Responsive Behaviour
Mobile (<768px):

Grid becomes single column.

Summary panel collapses below the grid.

Pills stack or scroll horizontally.

Tablet & Up:

Two-column grid.

Summary panel fixed to the right of the grid.

6. Deliverable
Produce a single HTML file that:

Renders the Create Subscription UI as specified.

Includes mock data inline so the page can be previewed standalone.

Embeds all CSS in a <style> tag in the <head>.

Uses semantic HTML5 and ensures full accessibility compliance.

Use this prompt exactly to generate the high-fidelity, production-ready HTML prototype.