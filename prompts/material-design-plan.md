Role: You are a senior front-end developer and UI/UX expert specializing in Material Design 3 (M3) and the M3 Expressive update.
Task: Redesign the Marianne Cottage Bed & Breakfast website (https://marrianecottage.netlify.app/) using a modern, accessible, and emotionally resonant design system.
1. Architecture & Design Tokens:

    Implement a full Design Token system using CSS variables.
    Use System Tokens (e.g., --md-sys-color-primary) to bridge reference values and component-level styles. Follow standard M3 naming conventions.
    Ensure the design is "Personal and Adaptive." Use Dynamic Color principles to derive a palette from the Normandy countryside—prioritising soft greens, earth tones, and sky blues.

2. Theming & Dark Mode:

    Create both Light and Dark themes.
    For the Dark theme, use a dark grey surface color (#121212) rather than pure black to better express elevation through tonal overlays.
    Use desaturated primary colors in dark mode to pass WCAG AA standards (4.5:1 contrast) and prevent visual vibration.

3. Layout & Navigation:

    Implement a Responsive Layout Grid.
    Use a Navigation Bar for mobile views and a Navigation Rail for medium-to-large screens to improve ergonomics and thumb-reachability.
    Apply M3's "Tonal Elevation": Instead of relying only on shadows, use semi-transparent color overlays to show depth. Higher elevation levels should have lighter surface colors.

4. M3 Expressive Components:

    Hero Section: Use "Expressive" typography (Display and Headline scales) to emphasize the "Haven of Peace" theme.
    Primary Action: Use an Extended FAB (Floating Action Button) for "Book Your Stay" or "Check Availability." Position it in the bottom-right for easy access.
    Amenities: Display Free WiFi, Parking, and Breakfast using Chips or small, outlined cards with rounded shape tokens.
    Accommodation: Use M3 Cards for the "Suites" section. Apply the new M3 shape system, using varied corner radii (from extra-small to extra-large) to create visual rhythm.
    Nearby Locations: Use a Carousel component to showcase distances to the D-Day beaches and Cerisy Abbey.

5. Accessibility & Motion:

    All interactive elements must have a minimum touch target size.
    Ensure all "On-color" combinations (e.g., text on a primary container) meet accessibility contrast requirements.
    Implement "Motion Physics" for transitions: replace static easing with natural, fluid movements for ripples and page transitions to make the interface feel "alive."

6. Content Requirements:

    Maintain all core cottage details: 1800s farmhouse history, wildlife haven status, and specific distances to local landmarks.
    Include a "Guest Reviews" section using high-fidelity cards with medium emphasis.

Technical Deliverable: Provide the updated HTML and a comprehensive CSS file (or SCSS) that maps these Material 3 system tokens to the cottage's specific brand identity.