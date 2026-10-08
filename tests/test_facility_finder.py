# ============================================================
# HealthTriage AI - Test Suite for Nearby Healthcare Finder
# Phase 7 Verification
# ============================================================

import unittest
from services.healthcare_finder_service import (
    calculate_haversine_distance,
    estimate_transit_time_minutes,
    generate_google_maps_directions_url,
    resolve_coordinates,
    find_nearby_healthcare_facilities,
    get_nearest_emergency_trauma_facility,
    save_patient_favorite_facility,
    get_patient_favorite_facilities,
    remove_patient_favorite_facility
)
import database.database as db


class TestHealthcareFinderService(unittest.TestCase):

    def setUp(self):
        # Ensure database is initialized with seeded facilities
        db.initialize_database()

    def test_haversine_distance_calculation(self):
        """Haversine distance calculates accurate physical distance in kilometers."""
        # Distance between AIIMS Bhubaneswar (20.2312, 85.7766) and Apollo Bhubaneswar (20.3150, 85.8249)
        dist = calculate_haversine_distance(20.2312, 85.7766, 20.3150, 85.8249)
        self.assertGreater(dist, 8.0)
        self.assertLess(dist, 15.0)

        # Same point gives 0.0 distance
        self.assertEqual(calculate_haversine_distance(20.2312, 85.7766, 20.2312, 85.7766), 0.0)

    def test_transit_time_estimation(self):
        """Transit time calculates driving minutes with traffic buffer."""
        # 10 km at 30 km/h is 20 mins + 3 mins buffer = 23 mins
        eta = estimate_transit_time_minutes(10.0, speed_kmh=30.0)
        self.assertEqual(eta, 23)
        self.assertEqual(estimate_transit_time_minutes(0.0), 0)

    def test_directions_url_generation(self):
        """Universal Google Maps directions URL is correctly formed."""
        url = generate_google_maps_directions_url(20.2312, 85.7766)
        self.assertIn("destination=20.2312,85.7766", url)
        self.assertTrue(url.startswith("https://www.google.com/maps/dir/"))

    def test_resolve_coordinates_city_and_gps(self):
        """Resolves coordinates from either direct GPS or known city names."""
        # Direct GPS
        gps = resolve_coordinates(20.30, 85.85)
        self.assertEqual(gps["lat"], 20.30)
        self.assertEqual(gps["lng"], 85.85)

        # Known city
        city_coords = resolve_coordinates(city="delhi")
        self.assertAlmostEqual(city_coords["lat"], 28.6139, places=2)

        # Fallback default
        fallback = resolve_coordinates(city="unknown_place_xyz")
        self.assertIn("lat", fallback)
        self.assertIn("lng", fallback)

    def test_find_nearby_facilities_default(self):
        """Nearby search around Bhubaneswar returns verified facilities sorted by distance."""
        res = find_nearby_healthcare_facilities(
            user_lat=20.2961,
            user_lng=85.8245,
            radius_km=30.0
        )
        self.assertTrue(res["success"])
        self.assertGreater(res["total_found"], 0)
        facs = res["facilities"]
        self.assertGreater(len(facs), 0)

        # Verify sorted ascending by distance
        for i in range(len(facs) - 1):
            self.assertLessEqual(facs[i]["distance_km"], facs[i + 1]["distance_km"])

        # Check essential fields are present
        sample = facs[0]
        self.assertIn("name", sample)
        self.assertIn("phone", sample)
        self.assertIn("distance_km", sample)
        self.assertIn("estimated_transit_minutes", sample)
        self.assertIn("directions_url", sample)

    def test_find_nearby_facilities_filtering(self):
        """Filters by facility type, emergency readiness, and 24x7 status."""
        # Filter pharmacies
        res_pharmacy = find_nearby_healthcare_facilities(
            city="Bhubaneswar",
            facility_type="pharmacy",
            radius_km=50.0
        )
        self.assertTrue(res_pharmacy["success"])
        for fac in res_pharmacy["facilities"]:
            self.assertEqual(fac["facility_type"], "pharmacy")

        # Filter emergency only
        res_emerg = find_nearby_healthcare_facilities(
            city="Bhubaneswar",
            emergency_only=True,
            radius_km=50.0
        )
        self.assertTrue(res_emerg["success"])
        for fac in res_emerg["facilities"]:
            self.assertTrue(fac["has_emergency"])

    def test_find_nearby_facilities_text_search(self):
        """Search query matches facility name or address."""
        res = find_nearby_healthcare_facilities(
            city="Bhubaneswar",
            search_query="Apollo",
            radius_km=100.0
        )
        self.assertTrue(res["success"])
        self.assertGreater(res["total_found"], 0)
        for fac in res["facilities"]:
            corpus = f"{fac['name']} {fac['address']}".lower()
            self.assertIn("apollo", corpus)

    def test_get_nearest_emergency_trauma_facility(self):
        """Nearest emergency trauma center locator returns closest 24/7 hospital with contacts."""
        res = get_nearest_emergency_trauma_facility(
            user_lat=20.2961,
            user_lng=85.8245,
            city="Bhubaneswar"
        )
        self.assertTrue(res["success"])
        self.assertTrue(res["is_emergency_mode"])
        facility = res["nearest_emergency_facility"]
        self.assertIsNotNone(facility)
        self.assertTrue(facility["has_emergency"])
        self.assertTrue(facility["is_24x7"])
        self.assertGreater(len(res["emergency_contacts"]), 0)

        # Check 112 and 108 are in emergency contacts
        numbers = [c["number"] for c in res["emergency_contacts"]]
        self.assertIn("112", numbers)
        self.assertIn("108", numbers)

    def test_patient_saved_facilities_crud(self):
        """Test bookmarking, retrieving, and removing saved facilities for a user."""
        # Find a test user or create one
        user = db.get_user_by_email("test_db_diag@example.com")
        if not user:
            db.create_user("Test Diag User", "test_db_diag@example.com", "pw_hash", "USER")
            user = db.get_user_by_email("test_db_diag@example.com")
        user_id = user["id"]

        # Get first facility
        facs = db.get_all_facilities(limit=1)
        self.assertGreater(len(facs), 0)
        fac_id = facs[0]["id"]

        # 1. Save favorite
        save_res = save_patient_favorite_facility(user_id, fac_id, notes="Preferred trauma center")
        self.assertTrue(save_res["success"])

        # 2. Retrieve favorites
        list_res = get_patient_favorite_facilities(user_id)
        self.assertTrue(list_res["success"])
        self.assertGreater(list_res["total_saved"], 0)
        saved_fac = next((f for f in list_res["facilities"] if f["id"] == fac_id), None)
        self.assertIsNotNone(saved_fac)
        self.assertEqual(saved_fac["user_notes"], "Preferred trauma center")

        # 3. Remove favorite
        del_res = remove_patient_favorite_facility(user_id, fac_id)
        self.assertTrue(del_res["success"])


if __name__ == "__main__":
    unittest.main()
