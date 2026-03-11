# Phase 5: Contact Us / Help Page Plan

**Status: Planning**

## 1. Page Objectives

*   **Primary Goal:** Provide users with a clear, efficient way to get help and contact support.
*   **Secondary Goal:** Reduce support load by offering self-service options through a comprehensive FAQ.
*   **User Experience Goal:** Ensure the page is easy to navigate, welcoming, and instills confidence that the user's issue will be resolved.

## 2. Key Topics & Content Strategy

The page will be divided into two main sections: a self-service FAQ and direct contact options.

### 2.1. Frequently Asked Questions (FAQ) Section

The FAQ will be categorized to help users find answers quickly.

*   **Subscription Management:**
    *   How do I pause or cancel my subscription?
    *   Can I change the dishes in my upcoming delivery?
    *   How do I update my delivery address?
    *   What is the deadline for making changes to my order?

*   **Billing & Payments:**
    *   How do I update my payment method?
    *   Where can I find my invoices?
    *   What payment methods do you accept?
    *   Why did my payment fail?

*   **Delivery & Logistics:**
    *   What are your delivery days and times?
    *   What happens if I'm not home for a delivery?
    *   Do you deliver to my area?
    *   How is the food packaged?

*   **Food & Menu:**
    *   Do you cater to dietary restrictions (e.g., allergies, vegan)?
    *   How often does the menu change?
    *   Where can I find nutritional information?
    *   How should I store and reheat the meals?

### 2.2. Direct Contact Section

This section will provide clear channels for users who couldn't find an answer in the FAQ.

*   **Contact Form:** The primary method for non-urgent inquiries.
    *   Fields: Name, Email, Subject (Dropdown), Message.
    *   Subject Dropdown Options:
        *   Subscription Inquiry
        *   Billing Question
        *   Delivery Issue
        *   Technical Problem
        *   Feedback & Suggestions
        *   Other
*   **Direct Contact Information:** For more urgent matters.
    *   **Email:** `support@osassyskitchen.com`
    *   **Phone / WhatsApp:** `+234-XXX-XXX-XXXX` (Clearly state business hours, e.g., "Mon-Fri, 9am-5pm WAT").
*   **Social Media Links:** Icons linking to relevant social profiles (e.g., Instagram, Twitter) for community engagement.

## 3. Detailed Wireframe & Layout

This wireframe outlines the structure and components of the page, designed to be consistent with the existing brand style.

```plaintext
[ Global Header ]
--------------------------------------------------------------------------------------------------

[ Inner Banner: "Help Center" / "How can we help?" ]
[ A friendly, welcoming hero image or graphic consistent with the brand. ]

--------------------------------------------------------------------------------------------------
|                                                                                                |
|    [ Search Bar: "Search for answers..." ]                                                     |
|    [ Prominently placed for quick access. ]                                                    |
|                                                                                                |
--------------------------------------------------------------------------------------------------

[ Section Title: "Frequently Asked Questions" ]

[ FAQ Category Navigation: [Subscription] [Billing] [Delivery] [Food] ]
[ These are tabs or buttons that filter the questions shown below. ]

--------------------------------------------------------------------------------------------------
|                                                                                                |
|    [ Accordion Item 1: "How do I pause or cancel my subscription?" ] (+)                       |
|    [ Accordion Item 2: "Can I change the dishes in my upcoming delivery?" ] (+)                |
|    [ Accordion Item 3: "How do I update my delivery address?" ] (+)                            |
|    [ Accordion Item 4: "What is the deadline for making changes...?" ] (+)                     |
|    [ Clicking an item expands it to show the answer. ]                                         |
|                                                                                                |
--------------------------------------------------------------------------------------------------

[ Divider Line or Visual Break ]

--------------------------------------------------------------------------------------------------
|                                                                                                |
|    [ Section Title: "Still need help?" ]                                                       |
|    [ Sub-heading: "Our team is here to assist you." ]                                          |
|                                                                                                |
|    [ Two-Column Layout ]                                                                       |
|                                                                                                |
|    [ Column 1: Contact Form ]                                                                  |
|    ------------------------------------                                                        |
|    | [ Label: Full Name ]           |                                                        |
|    | [ Input Field ]                |                                                        |
|    |                                |                                                        |
|    | [ Label: Email Address ]       |                                                        |
|    | [ Input Field ]                |                                                        |
|    |                                |                                                        |
|    | [ Label: Subject ]             |                                                        |
|    | [ Dropdown Select ]            |                                                        |
|    |                                |                                                        |
|    | [ Label: Message ]             |                                                        |
|    | [ Text Area (multi-line) ]     |                                                        |
|    |                                |                                                        |
|    | [ Submit Button: "Send Message" ] |                                                        |
|    ------------------------------------                                                        |
|                                                                                                |
|    [ Column 2: Direct Contact Info ]                                                           |
|    ------------------------------------                                                        |
|    | [ Icon ] [ Title: Email Us ]   |                                                        |
|    |   support@osassyskitchen.com   |                                                        |
|    |                                |                                                        |
|    | [ Icon ] [ Title: Call or WhatsApp ] |                                                    |
|    |   +234-XXX-XXX-XXXX            |                                                        |
|    |   (Mon-Fri, 9am-5pm WAT)       |                                                        |
|    |                                |                                                        |
|    | [ Title: Follow Us ]           |                                                        |
|    | [ Social Media Icons: IG, TW ] |                                                        |
|    ------------------------------------                                                        |
|                                                                                                |
--------------------------------------------------------------------------------------------------

[ Global Footer ]
```

## 4. Implementation Plan

1.  **Component Breakdown:**
    *   `HelpPageLayout`: Main container for the page.
    *   `SearchBar`: Reusable search component.
    *   `FaqAccordion`: Component to display categorized, collapsible FAQ items.
    *   `ContactForm`: The form for submitting inquiries.
    *   `ContactInfoCard`: A component to display direct contact details.
2.  **Styling:** Create a new SCSS module (`help.module.scss`) to style these components, ensuring it aligns with the existing brand guidelines from `SITE_MAP.md`.
3.  **API Endpoint:** Create a new API endpoint (e.g., `/api/contact`) to handle form submissions. This endpoint should:
    *   Validate the incoming data (Zod).
    *   Send a formatted email to the support desk (`support@osassyskitchen.com`).
    *   Send an auto-reply confirmation email to the user.
4.  **Routing:** Add a new page at `/help` (or `/contact`) in the `src/pages` directory.
5.  **Navigation:** Add a link to the new Help page in the site's header and footer.
