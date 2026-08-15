-- "What Changed Around Me?" PostgreSQL & Supabase Database Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: areas
CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zip_code VARCHAR(10) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'USA',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geometry JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_areas_zip_code ON public.areas(zip_code);
CREATE INDEX IF NOT EXISTS idx_areas_coords ON public.areas(latitude, longitude);

-- Table 2: sources
CREATE TABLE IF NOT EXISTS public.sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    source_type VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert OpenStreetMap as initial source
INSERT INTO public.sources (id, name, source_type, url, description)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'OpenStreetMap',
    'osm_overpass',
    'https://www.openstreetmap.org/',
    'Community-driven map data queried via Overpass API'
) ON CONFLICT (name) DO NOTHING;

-- Table 3: places
CREATE TABLE IF NOT EXISTS public.places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
    external_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geometry JSONB DEFAULT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(source_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_places_zip ON public.places(zip_code);
CREATE INDEX IF NOT EXISTS idx_places_category ON public.places(category);
CREATE INDEX IF NOT EXISTS idx_places_external ON public.places(source_id, external_id);

-- Table 4: snapshots
CREATE TABLE IF NOT EXISTS public.snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'completed', -- completed, processing, failed
    record_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_area ON public.snapshots(area_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_captured ON public.snapshots(captured_at DESC);

-- Table 5: snapshot_places
CREATE TABLE IF NOT EXISTS public.snapshot_places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES public.snapshots(id) ON DELETE CASCADE,
    place_id UUID REFERENCES public.places(id) ON DELETE SET NULL,
    external_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snap_places_snapshot ON public.snapshot_places(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_snap_places_external ON public.snapshot_places(external_id);

-- Table 6: changes
CREATE TABLE IF NOT EXISTS public.changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
    change_type VARCHAR(50) NOT NULL, -- business_opened, business_removed, business_modified
    entity_type VARCHAR(50) NOT NULL DEFAULT 'place',
    entity_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    old_data JSONB DEFAULT NULL,
    new_data JSONB DEFAULT NULL,
    source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0.90,
    significance_score INTEGER NOT NULL DEFAULT 50, -- 0 to 100
    verification_status VARCHAR(50) NOT NULL DEFAULT 'detected', -- detected, reported, confirmed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_changes_area ON public.changes(area_id);
CREATE INDEX IF NOT EXISTS idx_changes_type ON public.changes(change_type);
CREATE INDEX IF NOT EXISTS idx_changes_detected ON public.changes(detected_at DESC);

-- Table 7: ai_summaries
CREATE TABLE IF NOT EXISTS public.ai_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    summary TEXT NOT NULL,
    highlights JSONB DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    model VARCHAR(100) NOT NULL DEFAULT 'nvidia/nemotron-3-ultra-550b-a55b:free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_summaries_area ON public.ai_summaries(area_id);

-- Table 8: data_fetch_runs
CREATE TABLE IF NOT EXISTS public.data_fetch_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
    area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'running', -- running, success, failed
    records_found INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_fetch_runs_area ON public.data_fetch_runs(area_id);
CREATE INDEX IF NOT EXISTS idx_fetch_runs_status ON public.data_fetch_runs(status);

-- Table 9: census_demographics (ZCTA Statistics)
CREATE TABLE IF NOT EXISTS public.census_demographics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zip_code VARCHAR(10) NOT NULL UNIQUE,
    zcta VARCHAR(10) NOT NULL,
    population BIGINT NOT NULL DEFAULT 0,
    households BIGINT NOT NULL DEFAULT 0,
    median_income NUMERIC NOT NULL DEFAULT 0,
    housing_units BIGINT NOT NULL DEFAULT 0,
    median_age NUMERIC DEFAULT 0,
    median_home_value NUMERIC DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'US Census Bureau ACS 5-Year (ZCTA)',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_census_zip ON public.census_demographics(zip_code);
CREATE INDEX IF NOT EXISTS idx_census_zcta ON public.census_demographics(zcta);

-- Enable Row Level Security (RLS)
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshot_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_fetch_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.census_demographics ENABLE ROW LEVEL SECURITY;

-- Allow public read-only access for MVP app
CREATE POLICY "Allow public read access to areas" ON public.areas FOR SELECT USING (true);
CREATE POLICY "Allow public read access to sources" ON public.sources FOR SELECT USING (true);
CREATE POLICY "Allow public read access to places" ON public.places FOR SELECT USING (true);
CREATE POLICY "Allow public read access to snapshots" ON public.snapshots FOR SELECT USING (true);
CREATE POLICY "Allow public read access to snapshot_places" ON public.snapshot_places FOR SELECT USING (true);
CREATE POLICY "Allow public read access to changes" ON public.changes FOR SELECT USING (true);
CREATE POLICY "Allow public read access to ai_summaries" ON public.ai_summaries FOR SELECT USING (true);
CREATE POLICY "Allow public read access to data_fetch_runs" ON public.data_fetch_runs FOR SELECT USING (true);
CREATE POLICY "Allow public read access to census_demographics" ON public.census_demographics FOR SELECT USING (true);

-- Allow write access for demo & interactive data updates
CREATE POLICY "Allow anon insert/update to areas" ON public.areas FOR ALL USING (true);
CREATE POLICY "Allow anon insert/update to snapshots" ON public.snapshots FOR ALL USING (true);
CREATE POLICY "Allow anon insert/update to snapshot_places" ON public.snapshot_places FOR ALL USING (true);
CREATE POLICY "Allow anon insert/update to places" ON public.places FOR ALL USING (true);
CREATE POLICY "Allow anon insert/update to changes" ON public.changes FOR ALL USING (true);
CREATE POLICY "Allow anon insert/update to ai_summaries" ON public.ai_summaries FOR ALL USING (true);
CREATE POLICY "Allow anon insert/update to data_fetch_runs" ON public.data_fetch_runs FOR ALL USING (true);
CREATE POLICY "Allow anon insert/update to census_demographics" ON public.census_demographics FOR ALL USING (true);

