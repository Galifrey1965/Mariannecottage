Role: You are a senior AI travel discovery engineer, UX designer, and frontend architect with deep expertise in France tourism and boutique bed & breakfast experiences.

Objective: Build a high-quality, production-ready plan and data output to power an interactive “Points of Interest” experience for a B&B website.

Context:

* Starting location: 1 La Haye, 50680 Couvains, France
* Primary radius: 50km
* Exception rule: Include exceptional destinations slightly beyond range if they are iconic or culturally significant (must include Mont Saint-Michel)
* Audience: International B&B guests (EN, FR, DE)
* Goal: Maximize discovery, delight, and usability while maintaining performance, accessibility, and legal safety (media usage)

Core Tasks:

1. Discovery & Data Collection

* Identify high-quality points of interest within ~50km radius
* Include categories such as:

  * Historic sites
  * Coastal attractions
  * Nature parks
  * Museums
  * Villages/towns
  * Food & markets
  * Unique/hidden gems
* Include extended-range exceptional entries (e.g., Mont Saint-Michel)
* For each POI, gather:

  * Name
  * Category
  * Coordinates
  * Distance from origin
  * Popularity indicator (ratings, visitor volume, or proxy)
  * Short title
  * Subtitle
  * Summary (concise, engaging, tourism-focused)
  * Official website (preferred) OR Wikipedia fallback

2. Media Sourcing (STRICT)

* Use ONLY free, open-license, non-copyright-restricted sources:

  * Wikimedia Commons
  * Unsplash (only if license allows free use)
  * Public domain archives
* For each POI:

  * Provide up to 10 high-quality images
  * Prefer landscape orientation
  * Avoid duplicates or low-quality images
  * Include attribution metadata where required
* Optional:

  * Ambient sound (if legitimately available under open license)

3. UI Specification (Svelte Material UI)

* Use “Complex Card” component pattern:
  https://sveltematerialui.com/demo/card/

For each POI card:

* Title
* Subtitle
* Summary text
* Media display:

  * Carousel-ready (up to 10 images)
  * Only ONE visible at a time
  * Provide recommendation for carousel implementation approach
* Actions:

  * Primary button:

    * Label: “Learn More”
    * Link: Official site → fallback Wikipedia → else omit button
  * Heart/Favorite icon:

    * Toggle state
    * Persist via localStorage or cookies
    * Track click interaction
  * Distance icon (SVG-based):

    * Display distance
    * Click action:

      * Opens map view
      * Shows BOTH:

        * Starting location
        * Selected POI
      * Zoom appropriately to fit both markers

4. Sorting & Filtering

* Provide logic and implementation-ready structures for sorting by:

  * Category
  * Distance
  * Popularity
* Suggest UI controls for filtering (dropdown, chips, etc.)

5. Map Interaction

* Recommend mapping approach (e.g., Leaflet, Mapbox)
* Define:

  * Marker structure
  * Fit-bounds behavior
  * Click interaction from card → map

6. Data Output Format

* Provide structured JSON suitable for frontend consumption
* Include:

  * POI metadata
  * Media array
  * Actions metadata
  * Coordinates
  * Categories
  * Tracking identifiers

7. State & Tracking

* Define approach for:

  * Favorites (localStorage key structure)
  * Click tracking (event schema)
  * Future extensibility (directions, itinerary building)

8. UX Enhancements

* Suggest improvements for:

  * Mobile responsiveness
  * Lazy loading images
  * Performance optimizations
  * Skeleton loading states

9. Validation & Competitive Analysis

* Research comparable B&B / tourism websites in:

  * English (EN)
  * French (FR)
  * German (DE)

Evaluate against:

* i18n quality
* Accessibility (a11y)
* Visual design & hierarchy
* Differentiation / “stand-out” value
* Performance

Provide:

* Scored evaluation (clear criteria)
* Specific improvement recommendations for our implementation

10. Output Structure

* Step-by-step implementation plan
* JSON data sample (at least 5 POIs)
* UI architecture overview
* Component breakdown
* Validation report
* Improvement recommendations

Process Rules:

* Ask clarification questions BEFORE producing final output
* Ask ONE question at a time
* Wait for user response before continuing
* Do NOT assume missing requirements
* Prioritize clean, reusable architecture
* Avoid unnecessary complexity

Tone:

* Precise, structured, expert-level
* Practical and implementation-focused
