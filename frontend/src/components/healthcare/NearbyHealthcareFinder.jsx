import React, { useState, useEffect } from "react";
import { API_URL } from "../../config";

export default function NearbyHealthcareFinder({ goTo, embedded = false }) {
  const [activeTab, setActiveTab] = useState("finder"); // "finder" | "emergency" | "saved"
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Location state
  const [selectedCity, setSelectedCity] = useState("bhubaneswar");
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [locatingUser, setLocatingUser] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");

  // Filters
  const [facilityType, setFacilityType] = useState("all"); // "all" | "hospital" | "pharmacy" | "diagnostic_lab"
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [open24x7, setOpen24x7] = useState(false);
  const [radiusKm, setRadiusKm] = useState(35);
  const [searchQuery, setSearchQuery] = useState("");

  // Emergency Mode state
  const [nearestEmergency, setNearestEmergency] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [loadingEmergency, setLoadingEmergency] = useState(false);

  // Saved facilities state
  const [savedFacilities, setSavedFacilities] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const token = localStorage.getItem("healthtriage_token");

  const citiesList = [
    { key: "bhubaneswar", name: "Bhubaneswar, Odisha" },
    { key: "cuttack", name: "Cuttack, Odisha" },
    { key: "delhi", name: "New Delhi / NCR" },
    { key: "mumbai", name: "Mumbai, Maharashtra" },
    { key: "bengaluru", name: "Bengaluru, Karnataka" },
    { key: "kolkata", name: "Kolkata, West Bengal" },
    { key: "hyderabad", name: "Hyderabad, Telangana" },
    { key: "chennai", name: "Chennai, Tamil Nadu" },
    { key: "pune", name: "Pune, Maharashtra" },
  ];

  // Request browser GPS position
  const requestGPSLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser.");
      return;
    }
    setLocatingUser(true);
    setLocationStatus("Detecting your location via GPS...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationStatus("GPS Location Locked");
        setLocatingUser(false);
      },
      (err) => {
        console.warn("Geolocation access denied or timed out:", err.message);
        setLocationStatus("GPS unavailable; using selected city center.");
        setLocatingUser(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Fetch facilities
  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (userLocation) {
        params.append("lat", userLocation.lat);
        params.append("lng", userLocation.lng);
      } else {
        params.append("city", selectedCity);
      }

      params.append("radius_km", radiusKm);
      if (facilityType !== "all") {
        params.append("facility_type", facilityType);
      }
      if (emergencyOnly) {
        params.append("emergency_only", "true");
      }
      if (open24x7) {
        params.append("open_24x7", "true");
      }
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const res = await fetch(`${API_URL}/api/facilities/nearby?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Unable to fetch nearby healthcare facilities.");
      }

      const data = await res.json();
      setFacilities(data.facilities || []);
    } catch (err) {
      setError(err.message || "Error loading facilities.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch nearest emergency trauma facility
  const fetchNearestEmergency = async () => {
    try {
      setLoadingEmergency(true);
      const payload = {
        city: selectedCity,
      };
      if (userLocation) {
        payload.latitude = userLocation.lat;
        payload.longitude = userLocation.lng;
      }

      const res = await fetch(`${API_URL}/api/facilities/emergency-nearest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setNearestEmergency(data.nearest_emergency_facility);
        setEmergencyContacts(data.emergency_contacts || []);
      }
    } catch (err) {
      console.error("Failed to load emergency facility:", err);
    } finally {
      setLoadingEmergency(false);
    }
  };

  // Fetch saved facilities
  const fetchSavedFacilities = async () => {
    if (!token) return;
    try {
      setLoadingSaved(true);
      const res = await fetch(`${API_URL}/api/facilities/saved/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedFacilities(data.facilities || []);
      }
    } catch (err) {
      console.error("Failed to load saved facilities:", err);
    } finally {
      setLoadingSaved(false);
    }
  };

  // Save / Bookmark facility
  const handleSaveFacility = async (facId) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/facilities/saved`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          facility_id: facId,
          notes: "Saved from nearby search",
        }),
      });
      if (res.ok) {
        setActionMessage("Facility saved to your favorites!");
        fetchSavedFacilities();
        setTimeout(() => setActionMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error saving facility:", err);
    }
  };

  // Remove saved facility
  const handleRemoveSaved = async (facId) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/facilities/saved/${facId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setActionMessage("Facility removed from saved list.");
        fetchSavedFacilities();
        setTimeout(() => setActionMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error removing facility:", err);
    }
  };

  useEffect(() => {
    fetchFacilities();
    fetchNearestEmergency();
  }, [userLocation, selectedCity, facilityType, emergencyOnly, open24x7, radiusKm]);

  useEffect(() => {
    if (activeTab === "saved") {
      fetchSavedFacilities();
    }
  }, [activeTab]);

  return (
    <div className={`w-full max-w-6xl mx-auto ${embedded ? "p-0" : "p-4 sm:p-6"} space-y-6 text-slate-100`}>
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Phase 7 - Healthcare Finder
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                24/7 Emergency Ready
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span className="text-blue-400">Nearby Healthcare</span> & Trauma Finder
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Locate verified hospitals, emergency trauma centers, 24x7 pharmacies, and diagnostic labs
              with accurate driving distances, contact numbers, and 1-tap navigation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {goTo && (
              <button
                onClick={() => goTo("dashboard")}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </div>

        {/* RAPID EMERGENCY HOTLINES ROW */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-rose-300 font-bold">
            <span className="animate-ping inline-flex h-2 w-2 rounded-full bg-rose-400 opacity-75"></span>
            <span>Immediate Emergency Dispatch:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="tel:112"
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center gap-1.5 shadow"
            >
              📞 National Helpline: 112
            </a>
            <a
              href="tel:108"
              className="px-3 py-1 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold transition flex items-center gap-1.5 shadow"
            >
              🚑 Ambulance: 108
            </a>
            <a
              href="tel:911"
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition border border-slate-700"
            >
              US Emergency: 911
            </a>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("finder")}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === "finder"
              ? "bg-blue-500 text-slate-950 shadow-lg shadow-blue-500/20 font-bold"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Facility Directory ({facilities.length})
        </button>

        <button
          onClick={() => setActiveTab("emergency")}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === "emergency"
              ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 font-bold"
              : "bg-slate-900/60 text-rose-400 hover:text-rose-300 hover:bg-slate-800"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
          Emergency Trauma Locator
        </button>

        <button
          onClick={() => setActiveTab("saved")}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === "saved"
              ? "bg-blue-500 text-slate-950 shadow-lg shadow-blue-500/20 font-bold"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Saved Facilities ({savedFacilities.length})
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          {actionMessage}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 1: FACILITY DIRECTORY & RADIUS FINDER */}
      {/* ============================================================ */}
      {activeTab === "finder" && (
        <div className="space-y-6">
          {/* LOCATION & SEARCH BAR CARD */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* CITY DROPDOWN */}
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  City / Region Center
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setUserLocation(null);
                    setLocationStatus("");
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {citiesList.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SEARCH INPUT */}
              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Search Facility Name, Specialty, or Street
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchFacilities()}
                    placeholder="e.g. AIIMS, Apollo, ICU, Blood Bank..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={fetchFacilities}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shrink-0"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* GPS DETECT BUTTON */}
              <div className="md:col-span-3 flex flex-col justify-end">
                <button
                  type="button"
                  onClick={requestGPSLocation}
                  disabled={locatingUser}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                    userLocation
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {locatingUser ? "Locating..." : userLocation ? "GPS Active" : "Use My Current GPS"}
                </button>
                {locationStatus && (
                  <span className="text-[10px] text-slate-400 mt-1 truncate block text-center">
                    {locationStatus}
                  </span>
                )}
              </div>
            </div>

            {/* FILTERS ROW */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* FACILITY TYPE PILLS */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "all", label: "All Facilities" },
                  { key: "hospital", label: "Hospitals" },
                  { key: "phc", label: "Primary Health Centres (PHC)" },
                  { key: "clinic", label: "Clinics" },
                  { key: "emergency", label: "Emergency Care" },
                  { key: "pharmacy", label: "Pharmacies (24/7)" },
                  { key: "diagnostic_lab", label: "Diagnostic Centres" },
                  { key: "health_camp", label: "Health Camps" },
                  { key: "campus_health", label: "Campus Health Centres" },
                  { key: "occupational_health", label: "Occupational Health Units" },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFacilityType(t.key)}
                    className={`px-3 py-1.5 rounded-lg border transition font-medium ${
                      facilityType === t.key
                        ? "bg-blue-600 text-white border-blue-500 shadow"
                        : "bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TOGGLES & RADIUS */}
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emergencyOnly}
                    onChange={(e) => setEmergencyOnly(e.target.checked)}
                    className="rounded accent-rose-500"
                  />
                  <span className="text-rose-300 font-semibold">Emergency Trauma Only</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={open24x7}
                    onChange={(e) => setOpen24x7(e.target.checked)}
                    className="rounded accent-blue-500"
                  />
                  <span className="text-slate-300">Open 24/7 Only</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Radius:</span>
                  <select
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    <option value={10}>10 km</option>
                    <option value={25}>25 km</option>
                    <option value={35}>35 km</option>
                    <option value={50}>50 km</option>
                    <option value={100}>100 km</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* FACILITY LIST GRID */}
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Calculating distances and finding nearest healthcare facilities...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          ) : facilities.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm space-y-2">
              <p className="font-semibold text-white">No facilities found matching your criteria.</p>
              <p className="text-xs">Try increasing the radius or clearing filters.</p>
              <button
                onClick={() => {
                  setFacilityType("all");
                  setEmergencyOnly(false);
                  setOpen24x7(false);
                  setRadiusKm(50);
                  setSearchQuery("");
                }}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {facilities.map((fac) => (
                <div
                  key={fac.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group relative"
                >
                  <div className="space-y-3">
                    {/* TOP BADGES */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                            fac.facility_type === "hospital"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : fac.facility_type === "pharmacy"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          }`}>
                            {fac.facility_type.replace("_", " ")}
                          </span>

                          {fac.is_24x7 && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                              Open 24/7
                            </span>
                          )}

                          {fac.has_emergency && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                              Emergency Ready
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition">
                          {fac.name}
                        </h3>
                      </div>

                      {/* DISTANCE BADGE */}
                      <div className="text-right shrink-0">
                        <span className="text-base font-extrabold text-blue-400 block">
                          {fac.distance_km} km
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          ~{fac.estimated_transit_minutes} mins drive
                        </span>
                      </div>
                    </div>

                    {/* ADDRESS & SERVICES */}
                    <p className="text-xs text-slate-300 leading-relaxed">
                      📍 {fac.address}, {fac.city}, {fac.state} {fac.pincode}
                    </p>

                    {fac.services_offered && (
                      <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-300 font-semibold block mb-0.5">Services:</span>
                        {fac.services_offered}
                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <a
                        href={`tel:${fac.phone}`}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition"
                      >
                        📞 Call {fac.phone}
                      </a>

                      <a
                        href={fac.directions_url || `https://maps.google.com/?q=${encodeURIComponent(fac.name + " " + fac.city)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center gap-1.5"
                      >
                        🗺️ Directions
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveFacility(fac.id)}
                      title="Save to favorites"
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-700 transition"
                    >
                      ⭐
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: NEAREST EMERGENCY TRAUMA LOCATOR */}
      {/* ============================================================ */}
      {activeTab === "emergency" && (
        <div className="space-y-6">
          <div className="bg-rose-950/40 border-2 border-rose-500/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-2xl shrink-0 animate-bounce">
                🚨
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-extrabold text-rose-200">
                    Immediate Emergency & Trauma Center Dispatch
                  </h2>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white uppercase tracking-wider">
                    High Priority
                  </span>
                </div>

                <p className="text-xs text-rose-100/90 leading-relaxed font-medium max-w-3xl">
                  If the patient is experiencing chest pain, difficulty breathing, sudden stroke symptoms,
                  or severe trauma, do not delay. The closest verified 24/7 Level-1/2 Trauma Emergency Hospital
                  is calculated below.
                </p>

                {nearestEmergency ? (
                  <div className="bg-slate-950/80 border border-rose-500/30 rounded-2xl p-5 space-y-3 mt-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                          Closest 24/7 Emergency Center
                        </span>
                        <h3 className="text-lg font-bold text-white">
                          {nearestEmergency.name}
                        </h3>
                        <p className="text-xs text-slate-300">
                          📍 {nearestEmergency.address}, {nearestEmergency.city}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xl font-black text-rose-400 block">
                          {nearestEmergency.distance_km} km away
                        </span>
                        <span className="text-xs text-slate-400">
                          Estimated transit: ~{nearestEmergency.estimated_transit_minutes} minutes
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 bg-rose-950/20 p-2.5 rounded-xl border border-rose-500/20">
                      <span className="font-semibold text-rose-300">Capabilities: </span>
                      {nearestEmergency.services_offered}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <a
                        href={`tel:${nearestEmergency.phone}`}
                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition"
                      >
                        📞 Call Emergency Hotline ({nearestEmergency.phone})
                      </a>

                      <a
                        href={nearestEmergency.directions_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition"
                      >
                        🗺️ Start Navigation Now
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Calculating nearest emergency facility...
                  </div>
                )}

                {/* HELPLINE NUMBERS */}
                <div className="pt-4 border-t border-rose-500/20">
                  <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-2">
                    Verified Emergency Numbers
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {emergencyContacts.map((contact, i) => (
                      <a
                        key={i}
                        href={`tel:${contact.number}`}
                        className="bg-slate-900/80 hover:bg-rose-900/40 p-3 rounded-xl border border-rose-500/30 text-center transition block"
                      >
                        <span className="text-sm font-black text-rose-400 block">
                          {contact.number}
                        </span>
                        <span className="text-[10px] text-slate-300 truncate block">
                          {contact.name}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: SAVED EMERGENCY FACILITIES */}
      {/* ============================================================ */}
      {activeTab === "saved" && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Your Saved Medical Facilities</h2>
              <p className="text-xs text-slate-400">
                Personalized quick-access directory of your preferred hospitals and pharmacies.
              </p>
            </div>
          </div>

          {loadingSaved ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Loading saved facilities...
            </div>
          ) : savedFacilities.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm space-y-2">
              <p className="font-semibold text-white">No saved facilities yet.</p>
              <p className="text-xs">Click the star (⭐) icon on any facility card to save it here for instant access.</p>
              <button
                onClick={() => setActiveTab("finder")}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition"
              >
                Browse Facilities
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedFacilities.map((fac) => (
                <div
                  key={fac.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {fac.facility_type}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">{fac.name}</h3>
                      <p className="text-xs text-slate-300">📍 {fac.address}, {fac.city}</p>
                    </div>

                    <button
                      onClick={() => handleRemoveSaved(fac.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20"
                    >
                      Remove
                    </button>
                  </div>

                  {fac.user_notes && (
                    <p className="text-xs text-slate-400 italic bg-slate-950/60 p-2 rounded-lg">
                      Note: {fac.user_notes}
                    </p>
                  )}

                  <div className="pt-2 flex gap-2">
                    <a
                      href={`tel:${fac.phone}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                    >
                      📞 Call {fac.phone}
                    </a>
                    <a
                      href={fac.google_maps_url || `https://maps.google.com/?q=${encodeURIComponent(fac.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700"
                    >
                      🗺️ Directions
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
