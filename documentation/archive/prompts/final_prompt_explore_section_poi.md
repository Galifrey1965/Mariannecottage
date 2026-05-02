# AI Prompt: France B&B Points of Interest Discovery + Interactive UI System

## Role

You are a senior AI travel discovery engineer, frontend architect (Svelte), UX designer, and data pipeline designer. You specialize in high-quality tourism experiences in France, with a strong focus on boutique bed & breakfast guests.

---

## Objective

Design and produce a **complete, implementation-ready system** for discovering and displaying Points of Interest (POIs) around a B&B location in France, including:

* Data discovery
* Media sourcing (open-license only)
* Optimized asset pipeline
* Svelte UI components (plain Svelte, no routing assumptions)
* Leaflet-based map integration
* i18n integration (EN, FR, DE)
* UX, accessibility, and performance considerations
* Competitive analysis of B&B/tourism websites

---

## Context

* **Starting location:**
  `1 La Haye, 50680 Couvains, France`

* **Primary radius:**
  50km

* **Exception rule:**
  Include exceptional destinations slightly beyond radius if culturally significant
  MUST include: Mont Saint-Michel

* **Max POIs:**
  Top 20 only

* **Audience:**
  International B&B guests (EN, FR, DE)

---

## Core Requirements

### 1) POI Discovery

Identify high-quality POIs within scope.

Include categories (dynamically inferred, not fixed):

* Historic landmarks
* Coastal attractions
* Nature parks
* Museums
* Villages/towns
* Food/markets
* Hidden gems

For each POI, collect:

* id (stable, slug-based)
* name
* category (inferred)
* latitude / longitude
* distance (km, from origin)
* popularity score (internal only)
* title (short, engaging)
* subtitle
* summary (tourism-focused, concise)
* official website (preferred)
* fallback: Wikipedia
* accessibility level (basic rating: e.g., “Good”, “Limited”, etc.)

---

### 2) Popularity (Composite Model)

Design a **transparent internal scoring model**, combining:

* Landmark significance
* Estimated visitor volume
* Online presence (e.g., Wikipedia richness)
* Regional importance

Do NOT expose score in UI.

---

### 3) Media Sourcing (STRICT)

Use ONLY:

* Wikimedia Commons
* Public domain archives
* Unsplash (only if license permits free use)

For each POI:

* Up to 10 images (landscape preferred)
* Avoid duplicates / low quality
* Include attribution metadata
* Include ambient audio where available (open-license only)

---

### 4) Image Pipeline

Images must be:

* Downloaded locally to:
  `/static/images/poi/{poi-id}/`

Preprocess:

* Resize (multiple resolutions)
* Generate WebP + AVIF
* Keep optimized fallback (JPEG/PNG)
* Mobile-first optimization

---

### 5) UI Implementation (Plain Svelte)

Use Svelte Material UI Complex Card pattern:
https://sveltematerialui.com/demo/card/

Each POI card must include:

#### Content

* Title
* Subtitle
* Summary
* Accessibility level (visible indicator)

#### Media

* Carousel (max 10 images)
* ONE image visible at a time
* Auto-rotate:

  * Random interval between 3–5 seconds
  * Pause on hover
* Design carousel approach (do not assume library; propose clean solution)

#### Actions

1. Primary Button:

* Label: “Learn More”
* Link priority:

  1. Official site
  2. Wikipedia
  3. No button if none available

2. Favorite (Heart Icon):

* Toggle state
* Persist via localStorage
* Structured for future backend sync (hybrid model)

3. Distance Icon (SVG):

* Displays distance
* On click:

  * Opens inline map (modal or expandable panel)
  * Shows:

    * Starting location
    * Selected POI
  * Auto-fit bounds

---

### 6) Map Integration (Leaflet)

* Use Leaflet (no API key)
* Requirements:

  * Marker for origin
  * Marker for POI
  * Fit bounds to include both
  * Smooth zoom behavior
  * Reusable map component

---

### 7) Distance Calculation

* Use Haversine formula (straight-line distance)
* No external APIs

---

### 8) Sorting & Filtering

Provide logic for:

* Category
* Distance
* Popularity

Suggest UI:

* Dropdowns / chips / toggles

---

### 9) i18n Integration

System:

* Custom i18n (`src/lib/i18n.ts`)
* Server-loaded messages
* `t(messages, key, params?)`

Requirements:

* Provide translation keys (not inline strings)
* Update:

  * `messages/en.json`
  * `messages/fr.json`
  * `messages/de.json`

Include:

* Titles
* Subtitles
* Summaries
* UI labels

Ensure:

* No duplication
* Clean nested key structure
* Reusable keys where possible

---

### 10) State & Persistence

Favorites:

* localStorage key structure
* Example:
  `poi:favorites = [poiId, ...]`

Click tracking:

* Define event schema (future-ready)
* Do not integrate analytics yet

---

### 11) Offline & Resilience

* Cards must render fully without external links
* Graceful degradation:

  * Missing link → hide button
  * Missing media → fallback image
* No runtime dependency on third-party APIs

---

### 12) Styling & UX

* Allow enhanced “stand-out” design
* Must remain compatible with existing site
* Focus:

  * Clean layout
  * High visual appeal
  * Mobile-first
  * Smooth interactions

Include:

* Skeleton loading states
* Lazy loading images
* Performance optimizations

---

### 13) Accessibility (A11y)

Target: Basic good practice

Include:

* Alt text for images
* Keyboard navigation
* ARIA labels for actions
* Visible accessibility rating per POI

---

### 14) Build Environment

* Plain Svelte components
* Compatible with:

  * Vite + SvelteKit defaults
* No assumptions about routing or backend APIs

---

### 15) Output Requirements

Provide:

#### A) Implementation Plan

* Step-by-step
* Clean architecture

#### B) JSON Data (Sample)

* At least 5 fully populated POIs

#### C) Svelte Component Design

* Component breakdown
* Props/interfaces
* State handling

#### D) Image Pipeline Plan

* Download + optimization workflow

#### E) i18n File Updates

* Example EN/FR/DE entries

#### F) Map Component Design

* Leaflet integration details

#### G) UX Enhancements

* Performance + interaction improvements

#### H) Competitive Analysis

Research B&B / tourism sites in:

* EN
* FR
* DE

Evaluate:

* i18n quality
* Accessibility
* Design
* Differentiation
* Performance

Provide:

* Scores
* Specific improvements

---

## Process Rules

* Be precise and implementation-focused
* Avoid unnecessary complexity
* Use clean, reusable structures
* Do NOT assume missing details
* If clarification is required:

  * Embed questions inline in the plan (do not pause output)

---

## Goal

Deliver a **production-quality foundation** for a high-end, visually compelling, performant POI discovery experience tailored to a French B&B audience.
