import React, { useState, useEffect } from "react";
import {
  MapPin,
  Search,
  Navigation,
  Phone,
  ExternalLink,
  Star,
  AlertTriangle,
  Building2,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
  Compass,
  ArrowLeft,
  BookmarkCheck,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { API_URL } from "../../config";
import EmptyState from "../common/EmptyState";

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

  const facilityTypeChips = [
    { key: "all", label: "All Facilities" },
    { key: "hospital", label: "Hospitals" },
    { key: "phc", label: "PHCs" },
    { key: "clinic", label: "Clinics" },
    { key: "emergency", label: "Emergency Care" },
    { key: "pharmacy", label: "Pharmacies (24/7)" },
    { key: "diagnostic_lab", label: "Diagnostic Labs" },
    { key: "health_camp", label: "Health Camps" },
    { key: "campus_health", label: "Campus Health" },
    { key: "occupational_health", label: "Occupational Health" },
  ];

  return (
    <div className={`w-full max-w-7xl mx-auto ${embedded ? "p-0" : "p-4 sm:p-6"} space-y-6`}>
      {/* HEADER BANNER - CLEAN PROFESSIONAL HEALTHCARE PALETTE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                <Compass className="w-3.5 h-3.5 text-sky-600" /> Verified Geolocation
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                24/7 Emergency Dispatch
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Find Healthcare Near You
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Locate verified hospitals, emergency trauma centers, 24x7 pharmacies, and diagnostic laboratories
              with calculated transit distances and direct emergency routing.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {goTo && (
              <button
                onClick={() => goTo("dashboard")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Dashboard
              </button>
            )}
          </div>
        </div>

        {/* RAPID EMERGENCY HOTLINES ROW */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-rose-700 font-bold">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Immediate Emergency Helplines:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="tel:112"
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Phone className="w-3.5 h-3.5" /> National Helpline: 112
            </a>
            <a
              href="tel:108"
              className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Phone className="w-3.5 h-3.5" /> Ambulance: 108
            </a>
            <a
              href="tel:911"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition border border-slate-200"
            >
              US Emergency: 911
            </a>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("finder")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === "finder"
              ? "bg-sky-600 text-white shadow-sm font-bold"
              : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Facility Directory ({facilities.length})
        </button>

        <button
          onClick={() => setActiveTab("emergency")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === "emergency"
              ? "bg-rose-600 text-white shadow-sm font-bold"
              : "bg-white text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          Emergency Trauma Locator
        </button>

        <button
          onClick={() => setActiveTab("saved")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
            activeTab === "saved"
              ? "bg-sky-600 text-white shadow-sm font-bold"
              : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80"
          }`}
        >
          <Star className="w-4 h-4" />
          Saved Facilities ({savedFacilities.length})
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <BookmarkCheck className="w-4 h-4 text-emerald-600" />
          {actionMessage}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 1: FACILITY DIRECTORY & RADIUS FINDER */}
      {/* ============================================================ */}
      {activeTab === "finder" && (
        <div className="space-y-6">
          {/* LOCATION & SEARCH CARD */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* CITY DROPDOWN */}
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  City / Region Center
                </label>
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      setUserLocation(null);
                      setLocationStatus("");
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                  >
                    {citiesList.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SEARCH INPUT */}
              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Search Facility Name, Specialty, or Street
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchFacilities()}
                      placeholder="e.g. AIIMS, Apollo, ICU, Blood Bank..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
                    />
                  </div>
                  <button
                    onClick={fetchFacilities}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shrink-0"
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
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  {locatingUser ? "Locating..." : userLocation ? "GPS Active" : "Use My Current GPS"}
                </button>
                {locationStatus && (
                  <span className="text-[11px] text-slate-500 mt-1 truncate block text-center">
                    {locationStatus}
                  </span>
                )}
              </div>
            </div>

            {/* FILTERS ROW */}
            <div className="pt-4 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
              {/* FACILITY TYPE PILLS */}
              <div className="flex flex-wrap gap-1.5">
                {facilityTypeChips.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFacilityType(t.key)}
                    className={`px-3 py-1.5 rounded-lg border transition font-medium ${
                      facilityType === t.key
                        ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TOGGLES & RADIUS */}
              <div className="flex items-center gap-4 flex-wrap shrink-0">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={emergencyOnly}
                    onChange={(e) => setEmergencyOnly(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-rose-700 font-semibold">Trauma Only</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={open24x7}
                    onChange={(e) => setOpen24x7(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>Open 24/7 Only</span>
                </label>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Radius:</span>
                  <select
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold"
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
            <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center text-slate-500 text-sm">
              <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Calculating distances and locating nearest healthcare facilities...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              {error}
            </div>
          ) : facilities.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No facilities found matching your criteria"
              description="Try broadening the search radius, switching the city center, or resetting your filter toggles."
              primaryAction={{
                label: "Reset All Filters",
                onClick: () => {
                  setFacilityType("all");
                  setEmergencyOnly(false);
                  setOpen24x7(false);
                  setRadiusKm(50);
                  setSearchQuery("");
                },
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {facilities.map((fac) => (
                <div
                  key={fac.id}
                  className="bg-white border border-slate-200/80 hover:border-sky-300 hover:shadow-md rounded-2xl p-5 transition flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* TOP BADGES */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                              fac.facility_type === "hospital"
                                ? "bg-sky-50 text-sky-700 border border-sky-200"
                                : fac.facility_type === "pharmacy"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {fac.facility_type.replace("_", " ")}
                          </span>

                          {fac.is_24x7 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                              <Clock className="w-3 h-3" /> Open 24/7
                            </span>
                          )}

                          {fac.has_emergency && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <ShieldAlert className="w-3 h-3 text-rose-600" /> Emergency Ready
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition">
                          {fac.name}
                        </h3>
                      </div>

                      {/* DISTANCE BADGE */}
                      <div className="text-right shrink-0 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <span className="text-base font-extrabold text-sky-700 block">
                          {fac.distance_km} km
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          ~{fac.estimated_transit_minutes} mins
                        </span>
                      </div>
                    </div>

                    {/* ADDRESS & SERVICES */}
                    <p className="text-xs text-slate-600 leading-relaxed flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        {fac.address}, {fac.city}, {fac.state} {fac.pincode}
                      </span>
                    </p>

                    {fac.services_offered && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-800 font-semibold block mb-0.5">Services:</span>
                        {fac.services_offered}
                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <a
                        href={`tel:${fac.phone}`}
                        className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call {fac.phone}
                      </a>

                      <a
                        href={
                          fac.directions_url ||
                          `https://maps.google.com/?q=${encodeURIComponent(
                            fac.name + " " + fac.city
                          )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center gap-1.5"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Directions
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveFacility(fac.id)}
                      title="Save to favorites"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-600 border border-slate-200 transition"
                    >
                      <Star className="w-4 h-4" />
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
          <div className="bg-rose-50/70 border-2 border-rose-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-sm">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-extrabold text-rose-950">
                    Immediate Emergency & Trauma Center Dispatch
                  </h2>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white uppercase tracking-wider">
                    High Priority
                  </span>
                </div>

                <p className="text-xs text-rose-800 leading-relaxed font-medium max-w-3xl">
                  If the patient is experiencing chest pain, difficulty breathing, sudden stroke symptoms,
                  or severe trauma, do not delay. The closest verified 24/7 Level-1/2 Trauma Emergency Hospital
                  is calculated below.
                </p>

                {nearestEmergency ? (
                  <div className="bg-white border border-rose-200 rounded-2xl p-5 space-y-3 mt-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                          Closest 24/7 Emergency Center
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                          {nearestEmergency.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {nearestEmergency.address}, {nearestEmergency.city}
                        </p>
                      </div>

                      <div className="text-left sm:text-right bg-rose-50 px-3.5 py-2 rounded-xl border border-rose-100">
                        <span className="text-xl font-black text-rose-700 block">
                          {nearestEmergency.distance_km} km away
                        </span>
                        <span className="text-xs text-rose-600 font-semibold">
                          Estimated transit: ~{nearestEmergency.estimated_transit_minutes} mins
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-semibold text-rose-700">Capabilities: </span>
                      {nearestEmergency.services_offered}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <a
                        href={`tel:${nearestEmergency.phone}`}
                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-sm flex items-center gap-2 transition"
                      >
                        <Phone className="w-4 h-4" /> Call Emergency Hotline ({nearestEmergency.phone})
                      </a>

                      <a
                        href={nearestEmergency.directions_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-sm flex items-center gap-2 transition"
                      >
                        <Navigation className="w-4 h-4" /> Start Navigation Now
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-rose-600 text-xs font-medium">
                    Calculating nearest emergency facility...
                  </div>
                )}

                {/* HELPLINE NUMBERS */}
                <div className="pt-4 border-t border-rose-200">
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2">
                    Verified Emergency Numbers
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {emergencyContacts.map((contact, i) => (
                      <a
                        key={i}
                        href={`tel:${contact.number}`}
                        className="bg-white hover:bg-rose-50 p-3 rounded-xl border border-rose-200 text-center transition block shadow-xs"
                      >
                        <span className="text-sm font-black text-rose-700 block">
                          {contact.number}
                        </span>
                        <span className="text-[10px] text-slate-600 truncate block">
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
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Saved Medical Facilities</h2>
              <p className="text-xs text-slate-500">
                Personalized quick-access directory of your preferred hospitals and pharmacies.
              </p>
            </div>
          </div>

          {loadingSaved ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Loading saved facilities...
            </div>
          ) : savedFacilities.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No saved facilities yet"
              description="Click the star icon on any facility card in the directory to save it here for rapid 1-tap access."
              primaryAction={{
                label: "Browse Facilities",
                onClick: () => setActiveTab("finder"),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedFacilities.map((fac) => (
                <div
                  key={fac.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-sky-50 text-sky-700 border border-sky-200">
                        {fac.facility_type}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{fac.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {fac.address}, {fac.city}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemoveSaved(fac.id)}
                      className="text-xs text-rose-600 hover:text-rose-700 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 font-semibold transition"
                    >
                      Remove
                    </button>
                  </div>

                  {fac.user_notes && (
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      Note: {fac.user_notes}
                    </p>
                  )}

                  <div className="pt-2 flex gap-2">
                    <a
                      href={`tel:${fac.phone}`}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call {fac.phone}
                    </a>
                    <a
                      href={
                        fac.google_maps_url ||
                        `https://maps.google.com/?q=${encodeURIComponent(fac.name)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Directions
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
