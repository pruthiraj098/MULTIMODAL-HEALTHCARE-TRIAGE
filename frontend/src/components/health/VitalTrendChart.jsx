// ============================================================
// HealthTriage AI - Vital Trend Chart Component
// Professional SVG Trend Visualizer with reference ranges and tooltips
// ============================================================

import { useState } from "react";

export default function VitalTrendChart({
  title = "Vital Trend",
  unit = "",
  data = [],
  range = "7d",
  onRangeChange = () => {},
  normalMin = null,
  normalMax = null,
  color = "#2563eb",
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const ranges = [
    { key: "today", label: "Today" },
    { key: "7d", label: "7 Days" },
    { key: "30d", label: "30 Days" },
    { key: "3m", label: "3 Months" },
  ];

  // Parse chronological numerical data
  const points = data
    .filter((d) => d && typeof d.value === "number")
    .map((d, index) => ({
      index,
      id: d.id || index,
      value: d.value,
      recorded_at: d.recorded_at,
      notes: d.notes || "",
      symptoms: d.symptoms || "",
      wellness_status: d.wellness_status || "",
    }));

  if (points.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500">Historical trend & pattern tracking</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {ranges.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => onRangeChange(r.key)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  range === r.key
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-56 flex flex-col items-center justify-center text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          <svg className="w-10 h-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <p className="text-sm font-medium">No recorded measurements for this time interval.</p>
          <p className="text-xs text-slate-400 mt-1">Log measurements to start building your health trend.</p>
        </div>
      </div>
    );
  }

  // Calculate SVG bounds
  const values = points.map((p) => p.value);
  let minVal = Math.min(...values);
  let maxVal = Math.max(...values);

  if (normalMin !== null) minVal = Math.min(minVal, normalMin * 0.95);
  if (normalMax !== null) maxVal = Math.max(maxVal, normalMax * 1.05);

  if (minVal === maxVal) {
    minVal -= 5;
    maxVal += 5;
  }

  const paddingY = (maxVal - minVal) * 0.1 || 5;
  const domainMin = Math.floor(minVal - paddingY);
  const domainMax = Math.ceil(maxVal + paddingY);
  const domainRange = domainMax - domainMin || 1;

  const width = 640;
  const height = 240;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getX = (idx) => {
    if (points.length === 1) return padLeft + chartW / 2;
    return padLeft + (idx / (points.length - 1)) * chartW;
  };

  const getY = (val) => {
    return padTop + chartH - ((val - domainMin) / domainRange) * chartH;
  };

  // Generate SVG path line
  const pathD = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${getX(idx)} ${getY(p.value)}`)
    .join(" ");

  const areaD =
    points.length > 1
      ? `${pathD} L ${getX(points.length - 1)} ${padTop + chartH} L ${getX(0)} ${padTop + chartH} Z`
      : "";

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
              {points.length} {points.length === 1 ? "log" : "logs"}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Latest: <strong className="text-slate-800">{points[points.length - 1].value} {unit}</strong>
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {ranges.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onRangeChange(r.key)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                range === r.key
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ minHeight: "220px" }}
        >
          {/* Normal Reference Range Band */}
          {normalMin !== null && normalMax !== null && (
            <rect
              x={padLeft}
              y={getY(normalMax)}
              width={chartW}
              height={Math.max(2, getY(normalMin) - getY(normalMax))}
              fill="#10b981"
              fillOpacity={0.08}
              stroke="#10b981"
              strokeDasharray="3 3"
              strokeWidth={0.8}
            />
          )}

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const val = domainMin + pct * domainRange;
            const y = getY(val);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth={1}
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize={10}
                  fill="#94a3b8"
                  fontFamily="system-ui"
                >
                  {Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Area Gradient */}
          {areaD && (
            <path
              d={areaD}
              fill={color}
              fillOpacity={0.12}
            />
          )}

          {/* Polyline Path */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, idx) => {
            const cx = getX(idx);
            const cy = getY(p.value);
            const isHovered = hoveredPoint?.id === p.id;
            return (
              <g key={p.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? "#ffffff" : color}
                  stroke={color}
                  strokeWidth={isHovered ? 3 : 2}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}

          {/* Bottom X-axis Date Markers */}
          {points.map((p, idx) => {
            if (idx === 0 || idx === points.length - 1 || idx === Math.floor(points.length / 2)) {
              const dateStr = p.recorded_at ? p.recorded_at.split(" ")[0].slice(5) : `#${idx + 1}`;
              return (
                <text
                  key={idx}
                  x={getX(idx)}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#94a3b8"
                  fontFamily="system-ui"
                >
                  {dateStr}
                </text>
              );
            }
            return null;
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg flex items-center gap-2 pointer-events-none z-10">
            <span className="font-bold">{hoveredPoint.value} {unit}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">{hoveredPoint.recorded_at}</span>
            {hoveredPoint.notes && <span className="text-slate-300 italic">"{hoveredPoint.notes}"</span>}
          </div>
        )}
      </div>

      {normalMin !== null && normalMax !== null && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/50 inline-block"></span>
            <span>Normal Baseline: <strong>{normalMin}–{normalMax} {unit}</strong></span>
          </div>
          <span className="text-[11px] text-slate-400">Standard adult reference</span>
        </div>
      )}
    </div>
  );
}
