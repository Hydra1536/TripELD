import React from "react";

const ROWS = [
  { key: "OFF_DUTY",  y: 40 },
  { key: "SLEEPER_BERTH",  y: 80 },
  { key: "DRIVING",  y: 120 },
  { key: "ON_DUTY",  y: 160 },
];

const COLORS = {
  OFF_DUTY: "#424243",
  SLEEPER_BERTH: "#10B981",
  DRIVING: "#2563EB",
  ON_DUTY: "#F59E0B",
};

const SVG_WIDTH = 720;
const SVG_HEIGHT = 180;
const SCALE = SVG_WIDTH / 24; // px per hour

function xFromHour(h) {
  return h * SCALE;
}
function widthFromDuration(d) {
  return d * SCALE;
}

const EldLog = ({ dayLog }) => {
  if (!dayLog) return null;

  // compute totals from activities for this day
  const totals = { DRIVING: 0, ON_DUTY: 0, OFF_DUTY: 0, SLEEPER_BERTH: 0 };
  dayLog.activities.forEach(a => {
    if (a && a.type && typeof a.duration === "number") {
      totals[a.type] = (totals[a.type] || 0) + a.duration;
    }
  });

  // debug: ensure day totals = 24 (rounded)
  const sumHours = totals.DRIVING + totals.ON_DUTY + totals.OFF_DUTY + totals.SLEEPER_BERTH;
  const sumRounded = Math.round(sumHours * 100) / 100;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start mb-4">
        <div className="mb-2 md:mb-0">
          <h3 className="text-lg font-bold text-foreground">Day {dayLog.day} — {dayLog.date}</h3>
          <div className="text-sm text-muted-foreground mt-1">From: <strong className="text-foreground">{dayLog.from}</strong> &nbsp; To: <strong className="text-foreground">{dayLog.to}</strong></div>
        </div>
        <div className="text-right text-sm glass-card rounded-lg p-3 w-full md:w-auto">
          <div className="mb-1">Total miles today: <strong className="text-secondary">{dayLog.total_miles_driving_today}</strong></div>
          <div className="mb-1">Total hours: <strong className="text-secondary">{dayLog.total_hours}</strong></div>
          <div style={{ color: sumRounded !== 24 ? "#ef4444" : "#10b981", fontSize: 12, fontWeight: "bold" }}>
            Day sum: {sumRounded} h {sumRounded !== 24 ? "(should be 24)" : "✓"}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          width="100%"
          height="300"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 15-minute ticks (96) */}
          <g>
            {[...Array(96)].map((_, i) => {
              const hour = i / 4;
              const x = xFromHour(hour);
              const isQuarter = i % 4 === 0;
              return (
                <line key={`tick-${i}`} x1={x} y1={28} x2={x} y2={SVG_HEIGHT - 48} stroke={isQuarter ? "#6b7280" : "#9ca3af"} strokeWidth={isQuarter ? 1.2 : 0.5} />
              );
            })}
          </g>

          {/* Hour major lines */}
          <g>
            {[...Array(25)].map((_, i) => {
              const x = xFromHour(i);
              return (<line key={`major-${i}`} x1={x} y1={24} x2={x} y2={SVG_HEIGHT - 44} stroke="#4b5563" strokeWidth={1.5} />);
            })}
          </g>

          {/* Row boxes */}
          {ROWS.map((r) => (
            <g key={r.key}>
              <rect x={0} y={r.y - 18} width={SVG_WIDTH} height={36} fill="#ffffff" stroke="#e5e7eb" strokeWidth={0.6} rx={4} />
              <text x={8} y={r.y} fontSize="12" fill="#374151" fontWeight="500">{r.label}</text>
            </g>
          ))}

          {/* Hour labels ON TOP so they are not covered */}
          <g>
            {[...Array(25)].map((_, i) => {
              const x = xFromHour(i);
              const label = String(i);
              return (
                <g key={`label-${i}`}>
                  <rect x={x - 2} y={2} width={50} height={14} fill="#f3f4f6" opacity={0.95} rx={2} />
                  <text x={x - 1} y={13} fontSize="10" fill="#111827" fontWeight="500">{label}</text>
                </g>
              );
            })}
          </g>

          {/* Activities rectangles with animation */}
          <g>
            {dayLog.activities.map((act, idx) => {
              const start = (typeof act.start === "number") ? act.start : 0;
              const end = (typeof act.end === "number") ? act.end : start + (act.duration || 0);
              const width = Math.max(0.5, widthFromDuration(end - start)); // minimal width so 0-duration still visible as marker
              const row = ROWS.find(r => r.key === act.type) || ROWS[0];
              const rectY = row.y - 10;
              const rectH = 20;
              const color = COLORS[act.type] || "#888";

              return (
                <g key={`act-${idx}`} className="animate-pulse" style={{ animationDuration: '2s', animationDelay: `${idx * 0.1}s` }}>
                  <rect
                    x={xFromHour(start)}
                    y={rectY}
                    width={width}
                    height={rectH}
                    fill={color}
                    opacity={0.95}
                    stroke="#374151"
                    strokeWidth={0.25}
                    rx={3}
                    className="hover:opacity-100 transition-opacity duration-200"
                  />
                  {width > 36 && (
                    <text x={xFromHour(start) + 6} y={rectY + 14} fontSize="10" fill="#ffffff" fontWeight="bold">
                      {act.type === "ON_DUTY" && act.reason ? act.reason : act.type}
                    </text>
                  )}
                  {/* fuel stop indicator */}
                  {act.type === "ON_DUTY" && act.reason === "Fuel stop" && (
                    <circle cx={xFromHour((act.start + act.end) / 2)} cy={rectY - 6} r={4} fill="#f97316" stroke="#374151" className="animate-bounce" />
                  )}
                </g>
              );
            })}
          </g>


        </svg>
      </div>

      <div className="flex flex-wrap gap-4 text-sm mt-4 p-3 glass-card rounded-lg">


        <div className="flex items-center gap-2">
          <span style={{ background: COLORS.OFF_DUTY, display: "inline-block", width: 14, height: 14, borderRadius: 2 }}></span>
          <span className="font-medium"> Off Duty: <strong className="text-muted-foreground">{totals.OFF_DUTY.toFixed(2)} h</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ background: COLORS.SLEEPER_BERTH, display: "inline-block", width: 14, height: 14, borderRadius: 2 }}></span>
          <span className="font-medium"> Sleeper Berth: <strong className="text-green-500">{totals.SLEEPER_BERTH.toFixed(2)} h</strong></span>
        </div>
                <div className="flex items-center gap-2">
          <span style={{ background: COLORS.DRIVING, display: "inline-block", width: 14, height: 14, borderRadius: 2 }}></span>
          <span className="font-medium"> Driving: <strong className="text-primary">{totals.DRIVING.toFixed(2)} h</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ background: COLORS.ON_DUTY, display: "inline-block", width: 14, height: 14, borderRadius: 2 }}></span>
          <span className="font-medium"> On Duty: <strong className="text-accent">{totals.ON_DUTY.toFixed(2)} h</strong></span>
        </div>
              </div>
    </div>
  );
};

export default EldLog;
