export interface NormalizedPlace {
  external_id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
  version?: number;
  user?: string;
  status?: 'active' | 'disused' | 'closed';
  metadata: Record<string, any>;
}

export type DateFilter = 'all' | '30d' | '6m' | '1y' | '5y' | '10y';

export interface Area {
  id: string;
  zip_code: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  geometry?: any;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  name: string;
  source_type: string;
  url: string;
  description: string;
  created_at: string;
}

export type ChangeType = 'business_opened' | 'business_removed' | 'business_modified' | 'business_filing';
export type VerificationStatus = 'detected' | 'reported' | 'confirmed';

export interface Place {
  id: string;
  source_id: string;
  external_id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  geometry?: any;
  metadata?: Record<string, any>;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface Snapshot {
  id: string;
  area_id: string;
  source_id: string;
  captured_at: string;
  status: 'completed' | 'processing' | 'failed';
  record_count: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface SnapshotPlace {
  id: string;
  snapshot_id: string;
  place_id?: string;
  external_id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Change {
  id: string;
  area_id: string;
  change_type: ChangeType;
  entity_type: string;
  entity_id: string;
  title: string;
  description: string;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  source_id: string;
  detected_at: string;
  event_date: string;
  confidence: number; // 0.0 - 1.0
  significance_score: number; // 0 - 100
  verification_status: VerificationStatus;
  created_at: string;
  is_demo?: boolean;
}

export interface AIHighlight {
  title: string;
  description: string;
  importance: number;
  change_ids: string[];
}

export interface AISummary {
  id?: string;
  area_id: string;
  period_start: string;
  period_end: string;
  headline?: string;
  summary: string;
  highlights: AIHighlight[];
  generated_at: string;
  model: string;
  created_at?: string;
  is_demo?: boolean;
}

export interface DataFetchRun {
  id: string;
  source_id: string;
  area_id: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'success' | 'failed';
  records_found: number;
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface GeoLocation {
  zip: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface DemographicHistory {
  population: number;
  households: number;
  median_income: number;
  housing_units: number;
  median_home_value: number;
  median_rent: number;
  poverty_rate: number;
  median_age: number;
  bachelors_or_higher_pct: number;
}

export interface CensusDemographics {
  zip: string;
  zcta: string;
  population: number;
  households: number;
  median_income: number;
  housing_units: number;
  median_home_value: number;
  median_rent: number;
  poverty_rate: number;
  median_age: number;
  bachelors_or_higher_pct: number;
  history_1y?: DemographicHistory;
  history_5y?: DemographicHistory;
  history_10y?: DemographicHistory;
  updated_at?: string;
  source?: string;
}

export interface SafetyIncident {
  id: string;
  category: string;
  description: string;
  occurred_at: string;
  address: string;
  latitude: number;
  longitude: number;
  severity: number;
  source_url?: string;
}

export interface SafetyTrendPoint {
  year: number;
  state_rate: number;
  national_rate: number;
}

export interface SafetyData {
  incidents: SafetyIncident[];
  incident_source: string | null;
  incident_coverage: string;
  violent_crime: SafetyTrendPoint[];
  property_crime: SafetyTrendPoint[];
  latest_year: number | null;
  state_vs_national_pct: number | null;
  year_over_year_pct: number | null;
  source: string;
  methodology: string;
}

export interface NearbySchool {
  nces_id: string;
  name: string;
  district: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  level: string;
  grades: string;
  enrollment: number | null;
  teachers_fte: number | null;
  student_teacher_ratio: number | null;
  free_reduced_lunch_pct: number | null;
  charter: boolean;
  latitude: number;
  longitude: number;
  distance_km: number;
  resource_index: number;
}

export interface EducationData {
  schools: NearbySchool[];
  access_index: number;
  school_count: number;
  average_student_teacher_ratio: number | null;
  source: string;
  school_year: string;
  methodology: string;
}

export interface StreetViewCapture {
  id: string;
  image_url: string;
  captured_at: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  distance_m: number | null;
  sequence_id: string | null;
  source_url: string;
}

export interface StreetViewData {
  before: StreetViewCapture | null;
  after: StreetViewCapture | null;
  captures_found: number;
  source: string;
  coverage: string;
  methodology: string;
}
