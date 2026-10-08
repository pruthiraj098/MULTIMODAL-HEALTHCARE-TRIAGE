// ============================================================
// HealthTriage AI - Health Timeline Component
// Chronological timeline of patient measurements, notes, & symptoms
// ============================================================

const TYPE_CONFIG = {
  heart_rate: { label: "Heart Rate", icon: "❤️", color: "text-rose-600 bg-rose-50 border-rose-100" },
  spo2: { label: "Blood Oxygen", icon: "🫁", color: "text-sky-600 bg-sky-50 border-sky-100" },
  temperature: { label: "Temperature", icon: "🌡", color: "text-amber-600 bg-amber-50 border-amber-100" },
  blood_pressure_systolic: { label: "Systolic BP", icon: "🩸", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
  blood_pressure_diastolic: { label: "Diastolic BP", icon: "🩸", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
  respiratory_rate: { label: "Respiratory Rate", icon: "🫁", color: "text-teal-600 bg-teal-50 border-teal-100" },
  weight: { label: "Weight", icon: "⚖️", color: "text-purple-600 bg-purple-50 border-purple-100" },
};

export default function HealthTimeline({
  logs = [],
  onDeleteLog = () => {},
  loading = false,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Measurement Timeline</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-slate-100/70 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Measurement Timeline</h3>
        <p className="text-xs text-slate-500 mb-6">Historical record of all logged entries</p>
        <div className="text-center py-8 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm font-medium">No measurements in your timeline yet.</p>
          <p className="text-xs text-slate-400 mt-1">Use the Quick Intake form to log your first health reading.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Measurement Timeline</h3>
          <p className="text-xs text-slate-500">Chronological history of patient-reported entries</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
          {logs.length} entries
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {logs.map((log) => {
          const cfg = TYPE_CONFIG[log.measurement_type] || {
            label: log.measurement_type,
            icon: "🩺",
            color: "text-slate-600 bg-slate-50 border-slate-200",
          };

          return (
            <div key={log.id} className="relative group">
              {/* Timeline marker node */}
              <div className="absolute -left-6 top-3 w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center text-[10px] group-hover:border-blue-500 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-600"></div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50/40 hover:bg-white transition-all flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-base ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">{cfg.label}</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {log.value} <span className="text-xs font-normal text-slate-500">{log.unit}</span>
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{log.recorded_at}</span>
                      <span>•</span>
                      <span className="capitalize">{log.source || "manual"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {log.wellness_status && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {log.wellness_status.replace(/_/g, " ")}
                    </span>
                  )}
                  {log.symptoms && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 max-w-xs truncate" title={log.symptoms}>
                      Symptoms: {log.symptoms}
                    </span>
                  )}
                  {log.notes && (
                    <span className="text-[11px] text-slate-500 italic max-w-xs truncate" title={log.notes}>
                      "{log.notes}"
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Remove this measurement entry?")) {
                        onDeleteLog(log.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded-md transition-all text-xs"
                    title="Delete entry"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
