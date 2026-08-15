import type { Change, ChangeType, NormalizedPlace } from '../types';


export function normalizeText(str: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Calculate distance between two lat/lon points in meters using Haversine formula
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate significance score (0-100) based on category and change magnitude
 */
export function calculateSignificanceScore(place: NormalizedPlace, changeType: ChangeType): number {
  const cat = (place.category || '').toLowerCase();
  
  let baseScore = 50;
  if (cat.includes('supermarket') || cat.includes('hospital') || cat.includes('school')) {
    baseScore = 85;
  } else if (cat.includes('restaurant') || cat.includes('cafe') || cat.includes('gym') || cat.includes('hotel')) {
    baseScore = 70;
  } else if (cat.includes('bank') || cat.includes('pharmacy') || cat.includes('entertainment')) {
    baseScore = 65;
  } else if (cat.includes('shop')) {
    baseScore = 45;
  } else {
    baseScore = 35;
  }

  if (changeType === 'business_opened') {
    return Math.min(100, baseScore + 10);
  } else if (changeType === 'business_removed') {
    return Math.min(100, baseScore + 5);
  } else {
    // Modified metadata is typically lower significance
    return Math.max(10, Math.round(baseScore * 0.4));
  }
}

/**
 * Compare previous snapshot place list vs new snapshot place list
 */
export function detectPlaceChanges(
  areaId: string,
  sourceId: string,
  previousPlaces: NormalizedPlace[],
  currentPlaces: NormalizedPlace[]
): Change[] {
  const changes: Change[] = [];
  const now = new Date().toISOString();

  // Create lookup maps for previous places
  const prevByExternalId = new Map<string, NormalizedPlace>();
  previousPlaces.forEach(p => {
    if (p.external_id) prevByExternalId.set(p.external_id, p);
  });

  // Track matched previous place external IDs
  const matchedPrevIds = new Set<string>();

  // 1. Iterate through current places to find NEW and MODIFIED places
  currentPlaces.forEach((currPlace) => {
    let matchedPrev: NormalizedPlace | undefined = undefined;

    // Primary matching by exact external_id
    if (currPlace.external_id && prevByExternalId.has(currPlace.external_id)) {
      matchedPrev = prevByExternalId.get(currPlace.external_id);
    } else {
      // Secondary fuzzy matching by name + geographic proximity
      const currNormName = normalizeText(currPlace.name);
      matchedPrev = previousPlaces.find(prev => {
        if (matchedPrevIds.has(prev.external_id)) return false;
        const prevNormName = normalizeText(prev.name);
        const dist = calculateDistanceMeters(currPlace.latitude, currPlace.longitude, prev.latitude, prev.longitude);
        return (currNormName === prevNormName || currNormName.includes(prevNormName)) && dist < 100;
      });
    }

    if (!matchedPrev) {
      // NEW PLACE (business_opened)
      const sigScore = calculateSignificanceScore(currPlace, 'business_opened');
      changes.push({
        id: `change_new_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        area_id: areaId,
        change_type: 'business_opened',
        entity_type: 'place',
        entity_id: currPlace.external_id,
        title: `New place appeared: ${currPlace.name}`,
        description: `${currPlace.name} (${currPlace.category}) was added at ${currPlace.address || 'nearby location'}.`,
        old_data: null,
        new_data: { ...currPlace },
        source_id: sourceId,
        detected_at: now,
        event_date: now,
        confidence: 0.95,
        significance_score: sigScore,
        verification_status: 'detected',
        created_at: now
      });
    } else {
      // Record match
      matchedPrevIds.add(matchedPrev.external_id);

      // Check if MODIFIED (name, address, or category changed)
      const nameChanged = normalizeText(matchedPrev.name) !== normalizeText(currPlace.name);
      const addrChanged = normalizeText(matchedPrev.address) !== normalizeText(currPlace.address);
      const catChanged = matchedPrev.category !== currPlace.category;

      if (nameChanged || addrChanged || catChanged) {
        const sigScore = calculateSignificanceScore(currPlace, 'business_modified');
        let modDesc = `Updated details for ${currPlace.name}.`;
        if (nameChanged) modDesc = `Name changed from "${matchedPrev.name}" to "${currPlace.name}".`;
        else if (addrChanged) modDesc = `Address updated to ${currPlace.address}.`;
        else if (catChanged) modDesc = `Category reclassified from ${matchedPrev.category} to ${currPlace.category}.`;

        changes.push({
          id: `change_mod_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          area_id: areaId,
          change_type: 'business_modified',
          entity_type: 'place',
          entity_id: currPlace.external_id,
          title: `Place modified: ${currPlace.name}`,
          description: modDesc,
          old_data: { ...matchedPrev },
          new_data: { ...currPlace },
          source_id: sourceId,
          detected_at: now,
          event_date: now,
          confidence: 0.92,
          significance_score: sigScore,
          verification_status: 'detected',
          created_at: now
        });
      }
    }
  });

  // 2. Iterate through previous places to find REMOVED places
  previousPlaces.forEach((prevPlace) => {
    if (!matchedPrevIds.has(prevPlace.external_id)) {
      // REMOVED PLACE (business_removed)
      // IMPORTANT: Explicitly state "no longer listed in the latest OpenStreetMap snapshot"
      const sigScore = calculateSignificanceScore(prevPlace, 'business_removed');
      changes.push({
        id: `change_rem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        area_id: areaId,
        change_type: 'business_removed',
        entity_type: 'place',
        entity_id: prevPlace.external_id,
        title: `No longer listed: ${prevPlace.name}`,
        description: `${prevPlace.name} (${prevPlace.category}) is no longer listed in the latest OpenStreetMap snapshot.`,
        old_data: { ...prevPlace },
        new_data: null,
        source_id: sourceId,
        detected_at: now,
        event_date: now,
        confidence: 0.90,
        significance_score: sigScore,
        verification_status: 'detected',
        created_at: now
      });
    }
  });

  return changes;
}
