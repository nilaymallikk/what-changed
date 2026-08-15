# What Changed Around Me — System Design & Architecture Specification

`What Changed Around Me` is an open-data neighborhood intelligence platform that tracks temporal physical and commercial changes across US communities by analyzing geographic metadata, Wikimedia / Wikipedia Geosearch records, and US Census Bureau ACS demographic records.

---

## 1. Product Vision & Design Philosophy

### 1.1 Core Utility
When individuals explore a neighborhood (residents, prospective home buyers, journalists, city planners, local business owners), they want to answer:
- *What new businesses, cafes, restaurants, or community facilities recently opened?*
- *What places updated their branding, expanded, or relocated?*
- *What establishments closed, fell disused, or were unlisted?*
- *How has the demographic, economic, and housing baseline shifted over the last 1, 5, and 10 years?*

### 1.2 Aesthetic & Micro-Interaction Principles
- **Monochrome Precision**: High-contrast, clean black-and-white visual identity (`#000000`, `#09090b`, `#18181b`, `#27272a`, `#ffffff`) prioritizing typography and map readability over decorative gimmicks.
- **Typographic Duality**: Crisp modern sans-serif typography for headlines and descriptive copy paired with JetBrains Mono / monospace fonts for coordinates, revision numbers, timestamps, and confidence percentages.
- **Micro-Interactions & Tactile Feedback**:
  - `btn-interactive`: Smooth click scale depression (`active:scale-95` / `active:scale-[0.96]`) and elevation on hover (`translateY(-1px)`).
  - `shimmer-text`: Elegant animated gradient sheen across hero highlights.
  - `animate-radar-sweep`: Smooth rotating 360-degree radar scan line for spatial scanner previews.
  - Synchronized map-marker pulsing and sector highlighting.
- **Zero Synthetic Fluff**: Complete absence of fake mock data. Every entity links directly to verified geographic and encyclopedic data sources.

---

## 2. System Architecture

```
                                    +------------------------------------------+
                                    |               USER INTERFACE             |
                                    | (React 19 + Vite + TailwindCSS + Lucide) |
                                    +------------------------------------------+
                                                          |
                                                          v
                                    +------------------------------------------+
                                    |         DATA RESOLUTION & ROUTING        |
                                    |     (React Router DOM v7 + Geocoding)    |
                                    +------------------------------------------+
                                         /             |               \
                                        v              v                v
+-----------------------------+  +----------------------------+  +----------------------------+
|     Spatial Overpass Engine |  |     Wikipedia Geosearch    |  |     US Census Bureau ACS   |
|   (Multi-Mirror Failover)   |  |   (Extracts + Page Images) |  |   (1Y, 5Y, 10Y Demographics|
+-----------------------------+  +----------------------------+  +----------------------------+
                \                              |                              /
                 -------------------------------------------------------------
                                               |
                                               v
                                +------------------------------+
                                |  CHANGE CLASSIFICATION &     |
                                |  SIGNIFICANCE SCORING ENGINE |
                                +------------------------------+
                                               |
                                               v
                                +------------------------------+
                                |      OPENROUTER AI ENGINE    |
                                |  (Executive Summary + Trends)|
                                +------------------------------+
                                               |
                                               v
                                +------------------------------+
                                |  LOCALSTORE / SUPABASE DB    |
                                |  (Fast Snapshots & Caching)  |
                                +------------------------------+
```

---

## 3. Data Ingestion & Provider Pipeline

All integrated data providers are **100% free and open-access**:

### 3.1 Spatial Overpass Provider (`OverpassProvider.ts`)
- **Query Type**: Overpass QL with `out center meta 250;` retrieving complete element revision histories (`timestamp`, `version`, `user`, `changeset`).
- **Resilience Multi-Mirror Failover**: Automatically cycles through primary and secondary mirrors if any endpoint is rate-limited:
  1. `https://overpass-api.de/api/interpreter`
  2. `https://lz4.overpass-api.de/api/interpreter`
  3. `https://overpass.kumi.systems/api/interpreter`
- **Search Radius**: Dynamic 3,500m radius covering complete ZIP code geographic perimeters.
- **Domain Coverage**:
  - *Dining & Food*: `restaurant`, `cafe`, `fast_food`, `bar`, `pub`, `ice_cream`, `bakery`, `food_court`
  - *Retail & Shopping*: `shop=*`, `supermarket`, `convenience`, `clothes`, `electronics`, `beauty`, `mall`
  - *Healthcare & Civic*: `hospital`, `clinic`, `pharmacy`, `dentist`, `school`, `college`, `library`, `post_office`, `community_centre`
  - *Recreation & Hospitality*: `fitness_centre`, `gym`, `sports_centre`, `park`, `cinema`, `theatre`, `hotel`, `motel`
  - *Disused & Vanished*: `disused:amenity`, `abandoned:amenity`, `closed=yes`, `disused:shop`

### 3.2 Wikimedia / Wikipedia Geosearch Provider (`WikipediaProvider.ts`)
- **API Endpoint**: `https://en.wikipedia.org/w/api.php?action=query&list=geosearch`
- **Features Extracted**:
  - Coordinates & proximity distance (`lat`, `lon`, `dist`)
  - Encyclopedic summary extracts (`exintro=1`, `explaintext=1`)
  - Wikimedia Commons photos & thumbnails (`piprop=thumbnail&pithumbsize=500`)
  - Canonical live article URLs (`fullurl`)

### 3.3 US Census Bureau Demographics Service (`censusService.ts`)
- **Data Source**: US Census Bureau ACS (American Community Survey) 5-Year Data via ZCTA (ZIP Code Tabulation Areas).
- **Tracked Metrics**:
  - Total Population (`B01003_001E`)
  - Total Households (`B11001_001E`)
  - Median Household Income (`B19013_001E`)
  - Housing Units (`B25001_001E`)
  - Median Age (`B01002_001E`)
  - Median Home Value (`B25077_001E`)
- **Temporal Horizon Compounding**: Compares current baseline against 1-Year, 5-Year, and 10-Year historical demographic shifts with growth percentage tags.

---

## 4. Change Detection & Significance Scoring

### 4.1 Temporal Classification Logic (`changeDetection.ts`)
1. **`business_opened` (+ NEW PLACE)**:
   - Elements where `version === 1`, or entities newly captured in the latest snapshot.
   - Assigned true historical creation timestamp from element metadata or start date.
2. **`business_modified` (Δ MODIFIED)**:
   - Elements where `version > 1`, or entities where tag attributes (name, category, operating hours, phone, website, address) changed between snapshots.
   - Captures previous vs current values with exact diff descriptions.
3. **`business_removed` (− UNLISTED / CLOSED)**:
   - Entities explicitly tagged with `closed=yes`, `disused:*`, or `abandoned:*`.
   - Entities previously present in earlier snapshots that are no longer active in the latest map capture.

### 4.2 Significance Scoring Algorithm (0–100 Scale)
Every detected change is scored based on civic, commercial, and community weight:
- **Baseline by Category**:
  - Hospitals, Schools, Universities, Civic Libraries: **75–90 pts**
  - Major Supermarkets, Department Stores: **70–85 pts**
  - Restaurants, Cafes, Bakeries, Fitness Centers: **60–80 pts**
  - Retail & Specialty Shops: **40–60 pts**
- **Action Modifiers**:
  - Brand new opening (`business_opened`): **+15 pts**
  - Permanent closure / disused (`business_removed`): **+10 pts**
  - Minor attribute modification: **-15 pts**
- **Completeness Modifiers**:
  - Street address mapped: **+5 pts**
  - Opening hours / phone / website: **+5 pts**
  - Wikipedia article association: **+10 pts**

---

## 5. User Interface & Page Design

### 5.1 Homepage (`/`)
- **Hero Section**: High-impact uppercase typography *"WHAT CHANGED AROUND ME?"* with animated `shimmer-text` styling.
- **Search Component**: 5-digit US ZIP code input with auto-formatting, validation, and instantaneous navigation.
- **Trending ZIP Quick Chips**: 1-click exploratory chips for key metros (`90210` Beverly Hills, `77005` Houston, `10001` New York, `33139` Miami Beach, `60611` Chicago, `94102` San Francisco).
- **Live Metrics Counter Bar**: Real-time stats ticker displaying 41,000+ US ZIP Codes, 100% Free Open Access, 10-Year Census Deltas, and Instant Spatial Scans.
- **Live Spatial Intelligence**:
  - Live rotating radar scanner preview with multi-sector filter chips (*All Activity*, *Dining & Cafes*, *Retail & Fashion*, *Civic & Landmarks*).
  - Interactive pulsing blips that synchronize with selectable result cards on click.
- **How It Works 3-Step Flow**:
  - `01`: Enter Any US ZIP
  - `02`: Historical Snapshot Diffing
  - `03`: AI Synthesis & Map View
- **Featured Metros Explorer**: Interactive 6-metro visual directory with live activity tags and 1-click drilldowns.
- **Interactive FAQ Accordion**: Expandable Q&A cards with smooth slide animations.

### 5.2 Area Dashboard (`/area/:zip`)
- **Left Intelligence Sidebar**: Dedicated navigation sidebar with brand typography (*Intelligence / Neighborhood Analysis*), section switches (*Overview*, *Demographics*, *Timeline*), and quick search triggers.
- **Top Header & Provenance**: Displays `ZIP {location.zip}` and Sub-Neighborhood pills, bold uppercase municipality title (`NEW YORK, NY`, `BEVERLY HILLS, CA`), and high-contrast **"RESCAN LIVE MAP"** radar action.
- **Executive Narrative Card**: Monospace header with sparkles icon and high-contrast macro spatial trends analysis.
- **Census Demographics Module**:
  - `1Y`, `5Y`, and `10Y` historical horizon selector.
  - 4 high-contrast metric cards: `TOTAL POPULATION`, `MEDIAN INCOME`, `HOUSING UNITS`, and `COMMERCIAL VACANCY` / `MEDIAN HOME VALUE` with real-time percentage delta indicators (`↗ 2.4%`, `↗ 8.1%`, `↗ 1.2%`).
- **Lower Section (Split 7 / 5 Layout)**:
  - *Left: `■ VECTOR_NODE_MAP`*: MapLibre Dark matter vector map with high level-of-detail (`LOD: HIGH`), zoom controls, and custom interactive target pins.
  - *Right: `CHRONOLOGICAL_EVENT_FEED`*: Searchable chronological place event stream with quick type filters (`ALL`, `+ NEW`, `− UNLISTED`), place category tags, addresses, `SIG_SCORE {x}/10`, and `ANALYZE →` detail drilldowns.

### 5.3 Change Detail Inspection View (`/area/:zip/change/:id`)
- **Breadcrumb Navigation**: `TIMELINE  ›  EVENTS  ›  NODE_{id}` for seamless context.
- **Top Action Bar**: Interactive `Reject Change` outline button and `Verify Entity` solid confirmation state.
- **Headline & Metric Block**: Prominent place title, address badge, and side-by-side metric panel displaying `SIGNIFICANCE SCORE ({score}/100)` and `MATCH CONFIDENCE ({confidencePct}%)`.
- **Two-Column Deep Inspection Grid**:
  - *Left Column*: High-resolution photo card with bottom metadata bar (`SOURCE: ... TIMESTAMP: ...`) + Pinpoint coordinate map with crosshair target diamond and coordinate label (`MAP NODE  LAT: ...  LNG: ...`).
  - *Right Column*:
    - **Tag Analysis Diff**: Monospace comparison table (`KEY`, `PREVIOUS VALUE` with strikethrough, `PROPOSED VALUE`) tracking attribute shifts across versions.
    - **Payload JSON Inspector**: Syntax-highlighted JSON viewer with a 1-click `COPY` button.
- **Standard System Footer**: Clean copyright, terms, and privacy links.

---

## 6. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite |
| **Routing** | React Router DOM v7 |
| **Styling & Animations** | Vanilla Tailwind CSS v4 with custom monochrome design tokens, radar sweeps, shimmers, and tactile `btn-interactive` click states |
| **Mapping Engine** | MapLibre GL JS with Carto Dark matter vector basemaps |
| **Icons & Visuals** | Lucide React |
| **Data Sources (100% Free)** | Spatial Overpass Engine, Wikipedia Geosearch, US Census Bureau ACS |
| **AI Summarization** | OpenRouter (NVIDIA Nemotron / DeepSeek / Gemini models) |
| **Database & Cache** | Supabase PostgreSQL + LocalStateStore (`LocalStorage v2`) |
| **Linting & Code Quality** | Oxlint, TypeScript compiler (`tsc -b`) |

---

## 7. Security, Privacy & Data Provenance

1. **Client-Side Privacy**: No user geolocation tracking without consent; searches are strictly based on standard 5-digit US ZIP codes.
2. **Data Transparency**: Every change card explicitly labels verified place status or Wikipedia links.
3. **Disappearance Logic Disclaimers**: Disappeared map elements are labeled as *"Entity marked as closed, disused, or no longer active in local area records"* rather than making unverified legal assertions about business operations.
