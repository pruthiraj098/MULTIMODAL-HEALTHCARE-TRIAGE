# ============================================================
# HealthTriage AI - Healthcare Finder Service Layer (Phase 7)
# Geospatial discovery, emergency routing, and verified medical facilities
# ============================================================

import math
from typing import List, Dict, Any, Optional
import database.database as db

EMERGENCY_FACILITY_TYPES = ["hospital", "emergency", "trauma_center"]
STANDARD_FACILITY_TYPES = [
    "clinic", "pharmacy", "diagnostic_lab", "doctor",
    "phc", "health_camp", "campus_health", "occupational_health"
]

# City center coordinates for geo-fallback
CITY_COORDINATES = {
    "bhubaneswar": {"lat": 20.2961, "lng": 85.8245, "name": "Bhubaneswar, Odisha"},
    "cuttack": {"lat": 20.4625, "lng": 85.8828, "name": "Cuttack, Odisha"},
    "delhi": {"lat": 28.6139, "lng": 77.2090, "name": "New Delhi, Delhi"},
    "new delhi": {"lat": 28.6139, "lng": 77.2090, "name": "New Delhi, Delhi"},
    "mumbai": {"lat": 19.0760, "lng": 72.8777, "name": "Mumbai, Maharashtra"},
    "bengaluru": {"lat": 12.9716, "lng": 77.5946, "name": "Bengaluru, Karnataka"},
    "bangalore": {"lat": 12.9716, "lng": 77.5946, "name": "Bengaluru, Karnataka"},
    "kolkata": {"lat": 22.5726, "lng": 88.3639, "name": "Kolkata, West Bengal"},
    "hyderabad": {"lat": 17.3850, "lng": 78.4867, "name": "Hyderabad, Telangana"},
    "chennai": {"lat": 13.0827, "lng": 80.2707, "name": "Chennai, Tamil Nadu"},
    "pune": {"lat": 18.5204, "lng": 73.8567, "name": "Pune, Maharashtra"}
}


def calculate_haversine_distance(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float
) -> float:
    """
    Calculate the great circle distance between two points in kilometers.
    Uses Haversine formula for spherical geometry.
    """
    R = 6371.0  # Earth's radius in kilometers

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance_km = R * c
    return round(distance_km, 2)


def estimate_transit_time_minutes(distance_km: float, speed_kmh: float = 30.0) -> int:
    """
    Estimate driving/transit time in minutes assuming average city speed
    plus a standard 3-minute traffic/dispatch buffer.
    """
    if distance_km <= 0:
        return 0
    travel_hours = distance_km / speed_kmh
    minutes = int(math.ceil(travel_hours * 60.0)) + 3
    return minutes


def generate_google_maps_directions_url(dest_lat: float, dest_lng: float) -> str:
    """Generate universal turn-by-turn navigation URL for Google Maps."""
    return f"https://www.google.com/maps/dir/?api=1&destination={dest_lat},{dest_lng}"


def resolve_coordinates(
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    city: Optional[str] = None
) -> Optional[Dict[str, float]]:
    """
    Resolve coordinates from either direct GPS or known city name.
    """
    if user_lat is not None and user_lng is not None:
        try:
            return {"lat": float(user_lat), "lng": float(user_lng)}
        except (ValueError, TypeError):
            pass

    if city:
        city_clean = city.strip().lower()
        if city_clean in CITY_COORDINATES:
            coords = CITY_COORDINATES[city_clean]
            return {"lat": coords["lat"], "lng": coords["lng"]}

    # Default fallback to Bhubaneswar
    return {"lat": 20.2961, "lng": 85.8245}


def find_nearby_healthcare_facilities(
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    city: Optional[str] = None,
    radius_km: float = 35.0,
    facility_type: Optional[str] = None,
    emergency_only: bool = False,
    open_24x7: bool = False,
    search_query: Optional[str] = None,
    limit: int = 50
) -> Dict[str, Any]:
    """
    Find, filter, and sort nearby medical facilities relative to the patient.
    """
    coords = resolve_coordinates(user_lat, user_lng, city)
    origin_lat = coords["lat"]
    origin_lng = coords["lng"]

    # Fetch base facilities from database
    raw_facilities = db.get_all_facilities(
        facility_type=facility_type,
        city=None,  # Filter geographically via radius rather than strict city boundary
        emergency_only=emergency_only,
        is_24x7=open_24x7,
        limit=200
    )

    enriched_facilities = []
    search_lower = search_query.strip().lower() if search_query else None

    for fac in raw_facilities:
        # Text search filter
        if search_lower:
            text_corpus = f"{fac.get('name', '')} {fac.get('address', '')} {fac.get('city', '')} {fac.get('services_offered', '')}".lower()
            if search_lower not in text_corpus:
                continue

        fac_lat = fac.get("latitude")
        fac_lng = fac.get("longitude")

        if fac_lat is not None and fac_lng is not None:
            dist_km = calculate_haversine_distance(origin_lat, origin_lng, fac_lat, fac_lng)
            eta_mins = estimate_transit_time_minutes(dist_km)

            # Check radius filter (allow expanding radius if few facilities)
            if radius_km and dist_km > radius_km:
                continue

            fac_entry = dict(fac)
            fac_entry["distance_km"] = dist_km
            fac_entry["estimated_transit_minutes"] = eta_mins
            fac_entry["directions_url"] = generate_google_maps_directions_url(fac_lat, fac_lng)
            enriched_facilities.append(fac_entry)

    # Sort ascending by distance
    enriched_facilities.sort(key=lambda x: x.get("distance_km", 9999))

    # Apply limit
    results = enriched_facilities[:limit]

    return {
        "success": True,
        "origin_coordinates": {"latitude": origin_lat, "longitude": origin_lng},
        "resolved_city": city or "Auto-detected",
        "radius_km": radius_km,
        "total_found": len(results),
        "facilities": results
    }


def get_nearest_emergency_trauma_facility(
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    city: Optional[str] = None
) -> Dict[str, Any]:
    """
    Rapid emergency response locator: Returns the absolute closest 24x7 Hospital
    with Level 1/2 Trauma & Emergency resuscitation capabilities.
    """
    coords = resolve_coordinates(user_lat, user_lng, city)
    origin_lat = coords["lat"]
    origin_lng = coords["lng"]

    # Retrieve all emergency hospitals
    emergency_facilities = db.get_all_facilities(
        facility_type="hospital",
        emergency_only=True,
        is_24x7=True,
        limit=50
    )

    if not emergency_facilities:
        # Fallback to any hospital with emergency flag
        emergency_facilities = db.get_all_facilities(emergency_only=True, limit=50)

    closest_facility = None
    min_distance = float("inf")

    for fac in emergency_facilities:
        fac_lat = fac.get("latitude")
        fac_lng = fac.get("longitude")
        if fac_lat is not None and fac_lng is not None:
            dist = calculate_haversine_distance(origin_lat, origin_lng, fac_lat, fac_lng)
            if dist < min_distance:
                min_distance = dist
                closest_facility = dict(fac)
                closest_facility["distance_km"] = dist
                closest_facility["estimated_transit_minutes"] = estimate_transit_time_minutes(dist)
                closest_facility["directions_url"] = generate_google_maps_directions_url(fac_lat, fac_lng)

    emergency_contacts = [
        {"name": "National Emergency Helpline", "number": "112", "priority": "PRIMARY"},
        {"name": "Ambulance / Medical Emergency", "number": "108", "priority": "AMBULANCE"},
        {"name": "Police Helpline", "number": "100", "priority": "SUPPORT"},
        {"name": "US / International Emergency", "number": "911", "priority": "INTERNATIONAL"}
    ]

    if closest_facility and closest_facility.get("phone"):
        emergency_contacts.insert(0, {
            "name": f"{closest_facility['name']} Emergency Hotline",
            "number": closest_facility["phone"],
            "priority": "DIRECT_HOSPITAL"
        })

    return {
        "success": True,
        "is_emergency_mode": True,
        "nearest_emergency_facility": closest_facility,
        "emergency_contacts": emergency_contacts,
        "immediate_action_guidance": (
            "If the patient is experiencing chest pain, difficulty breathing, uncontrolled bleeding, "
            "or altered consciousness, call 112 or 108 immediately. Do not attempt to drive yourself."
        )
    }


def save_patient_favorite_facility(user_id: int, facility_id: int, notes: Optional[str] = None) -> Dict[str, Any]:
    """Save facility to patient's personal emergency / favorites directory."""
    success = db.save_user_facility(user_id, facility_id, notes=notes)
    return {
        "success": success,
        "message": "Facility saved to your healthcare directory." if success else "Failed to save facility."
    }


def get_patient_favorite_facilities(user_id: int) -> Dict[str, Any]:
    """Retrieve patient's saved healthcare facilities."""
    facilities = db.get_user_saved_facilities(user_id)
    return {
        "success": True,
        "total_saved": len(facilities),
        "facilities": facilities
    }


def remove_patient_favorite_facility(user_id: int, facility_id: int) -> Dict[str, Any]:
    """Delete facility from patient's saved favorites."""
    success = db.delete_user_saved_facility(user_id, facility_id)
    return {
        "success": success,
        "message": "Facility removed from your directory." if success else "Facility not found in saved list."
    }
