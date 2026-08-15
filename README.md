# ⚡ What Changed Around Me?

> **A high-contrast, real-time neighborhood intelligence dashboard that automatically tracks localized commercial, structural, and place changes alongside official US Census Bureau demographic metrics across historical time horizons.**

---

## 🌟 Overview

**What Changed Around Me?** is an interactive web platform designed to provide instant visibility into neighborhood evolution. By combining open geographic snapshot data from **OpenStreetMap (Overpass API)** with server-side demographic integration from the **US Census Bureau (ACS 5-Year Dataset)**, the application delivers actionable intelligence on neighborhood growth, commercial turnover, and demographic trends.

All data is presented through a **pure high-contrast monochrome design system** built for maximum clarity, focus, and modern aesthetic elegance.

---

## ✨ Key Features

- 📍 **Automated Location & Boundary Resolution**: Enter any US ZIP code (e.g., `77005`, `10001`, `90210`, `33139`) for automatic geocoding and map positioning.
- 🏛️ **US Census Bureau ZCTA Demographics**: Secure server-side demographic statistics fetching for Zip Code Tabulation Areas (ZCTA):
  - **Population & Households**
  - **Median Household Income**
  - **Total Housing Units & Occupancy Rate**
  - **Median Age & Median Home Value**
  - **Average Household Density**
- 📈 **Historical Baseline Comparisons (`30D`, `6M`, `1Y`, `5Y`, `10Y`)**:
  - Differentiate current statistics against 1-Year, 5-Year, and 10-Year historical baselines.
  - Automatic percentage change indicators (`▲ +19.8% vs 5Y ago`, `▲ +56.3% vs 10Y ago`).
- 🤖 **Executive AI Summaries**: LLM-generated neighborhood change summaries highlighting key events, new business openings, unlisted businesses, and significance points.
- 🗺️ **Interactive Spatial Map & Timeline**:
  - Built with **MapLibre GL** using vector dark mode tiles.
  - Marker indicators for **New Places (+)**, **Unlisted Places (-)**, and **Modified Places (Δ)**.
  - Integrated search, category filtering, and chronological audit log timeline.
- 🛡️ **Secure Server-Side Edge Functions**:
  - Powered by **Supabase Edge Functions** (Deno environment) to protect API keys server-side.
  - Automatic client-side caching with local storage for instant page reloads.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript + Vite 8 |
| **Styling & UI** | Tailwind CSS v4 + Vanilla CSS Design System + Lucide Icons |
| **Mapping Engine** | MapLibre GL |
| **Backend & Database** | Supabase (PostgreSQL + Row Level Security) |
| **Serverless Functions** | Supabase Edge Functions (Deno) |
| **External APIs** | US Census Bureau ACS 5-Year API, OpenStreetMap (Overpass & Nominatim) |
| **Linting & Tooling** | Oxlint, TypeScript compiler (`tsc`) |

---

## 📁 Project Architecture

```
what-changed/
├── src/
│   ├── components/
│   │   ├── CensusDemographicsCard.tsx # High-contrast ZCTA Census statistics component
│   │   ├── MapComponent.tsx            # MapLibre GL interactive map visualizer
│   │   ├── Navbar.tsx                  # Application top navigation bar
│   │   └── PipelineAdmin.tsx           # Background data pipeline monitor
│   ├── pages/
│   │   └── AreaDashboard.tsx           # Main neighborhood tracking dashboard
│   ├── services/
│   │   ├── aiSummary.ts                # AI summary generation & processing
│   │   ├── censusService.ts            # Census edge function client & fallback caching
│   │   ├── changeDetection.ts          # Spatial diffing & node matching logic
│   │   ├── demoData.ts                 # Realistic baseline demo datasets (77005, 10001, etc.)
│   │   ├── geocoding.ts                # Nominatim ZIP resolution service
│   │   └── supabaseClient.ts           # Supabase client & local storage fallback DB
│   ├── types/
│   │   └── index.ts                    # TypeScript interfaces & demographic models
│   ├── index.css                       # Monochrome design system CSS variables
│   └── main.tsx                        # React application entry point
├── supabase/
│   ├── functions/
│   │   └── census-demographics/        # Server-side Supabase Edge Function (Deno)
│   │       ├── index.ts                # Census API query handler
│   │       └── .env                    # Secret configuration (CENSUS_API_KEY)
│   └── schema.sql                      # PostgreSQL database schema & RLS policies
├── .env.example                        # Environment variables template
├── package.json                        # NPM package dependencies
└── vite.config.ts                      # Vite build configuration
```

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm** or **yarn** / **pnpm**
- **US Census Bureau API Key**: Free key from [api.census.gov/data/key_signup.html](https://api.census.gov/data/key_signup.html)

---

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/nilaymallikk/what-changed.git
   cd what-changed
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your configuration:
   ```env
   CENSUS_API_KEY=your_census_api_key_here
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

---

## ⚡ Supabase Edge Function Deployment

To deploy the `census-demographics` edge function to your Supabase project:

1. **Install Supabase CLI & Log in**:
   ```bash
   npx supabase login
   ```

2. **Link your project**:
   ```bash
   npx supabase link --project-ref your-project-ref
   ```

3. **Set Server-Side Secrets**:
   ```bash
   npx supabase secrets set CENSUS_API_KEY=your_census_api_key_here
   ```

4. **Deploy the Edge Function**:
   ```bash
   npx supabase functions deploy census-demographics
   ```

---

## 🗄️ Database Schema (`schema.sql`)

The application includes PostgreSQL tables configured with **Row Level Security (RLS)**:

- `areas`: Managed geographic regions tracked by ZIP code and lat/long centroid.
- `census_demographics`: Cached ZCTA statistics from US Census ACS 5-Year API.
- `places`: Unique physical entities with coordinates and tags.
- `snapshots`: Historical point-in-time OpenStreetMap entity snapshots.
- `snapshot_places`: Junction table for snapshot node attributes.
- `changes`: Calculated spatial diffs (`business_opened`, `business_removed`, `business_modified`).
- `ai_summaries`: Generated executive summaries with significance scoring.
- `data_fetch_runs`: Audit trail for Overpass and Census API pipeline executions.

---

## 🧪 Verification & Demo Testing

Test pre-configured ZIP code dashboards with demographic data and change events:

| ZIP Code | Location | Description |
| :--- | :--- | :--- |
| `77005` | Houston, TX (Rice Village) | Full demo dataset with commercial openings & high-income ZCTA stats |
| `10001` | New York, NY (Chelsea/Midtown) | High-density urban commercial center |
| `90210` | Beverly Hills, CA | Luxury retail & residential baseline |
| `33139` | Miami Beach, FL | Dynamic hospitality & tourism node |

Direct Navigation URL format: `http://localhost:5173/area/<zip_code>`

---

## 📜 Scripts Reference

- `npm run dev`: Launch Vite hot-reloading dev server
- `npm run build`: Compile TypeScript (`tsc -b`) and build production bundle
- `npm run lint`: Execute Oxlint linter
- `npm run preview`: Preview production build locally

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
