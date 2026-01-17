// D:\TripCop\frontend\src\components\EldLog.jsx
import React from "react";

const ROWS = [
  { key: "OFF_DUTY", label: "Off Duty", y: 40 },
  { key: "SLEEPER_BERTH", label: "Sleeper Berth", y: 80 },
  { key: "DRIVING", label: "Driving", y: 120 },
  { key: "ON_DUTY", label: "On Duty (Not Driving)", y: 160 },
];

const COLORS = {
  OFF_DUTY: "#424243",
  SLEEPER_BERTH: "#10B981",
  DRIVING: "#2563EB",
  ON_DUTY: "#F59E0B",
};

const SVG_WIDTH = 960;
const SVG_HEIGHT = 220;
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
    <div className="border rounded p-4 mb-6 bg-white shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold">Day {dayLog.day} — {dayLog.date}</h3>
          <div className="text-sm text-gray-600">From: <strong>{dayLog.from}</strong> &nbsp; To: <strong>{dayLog.to}</strong></div>
        </div>
        <div className="text-right text-sm">
          <div>Total miles today: <strong>{dayLog.total_miles_driving_today}</strong></div>
          <div>Total hours: <strong>{dayLog.total_hours}</strong></div>
          <div style={{ color: sumRounded !== 24 ? "red" : "inherit", fontSize: 12 }}>
            Day sum: {sumRounded} h {sumRounded !== 24 ? "(should be 24)" : ""}
          </div>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} preserveAspectRatio="xMidYMid meet">
        {/* 15-minute ticks (96) */}
        <g>
          {[...Array(96)].map((_, i) => {
            const hour = i / 4;
            const x = xFromHour(hour);
            const isQuarter = i % 4 === 0;
            return (
              <line key={`tick-${i}`} x1={x} y1={28} x2={x} y2={SVG_HEIGHT - 48} stroke={isQuarter ? "#cbd5e1" : "#eef2f7"} strokeWidth={isQuarter ? 0.9 : 0.35} />
            );
          })}
        </g>

        {/* Hour major lines */}
        <g>
          {[...Array(25)].map((_, i) => {
            const x = xFromHour(i);
            return (<line key={`major-${i}`} x1={x} y1={24} x2={x} y2={SVG_HEIGHT - 44} stroke="#d1d5db" strokeWidth={1} />);
          })}
        </g>

        {/* Row boxes */}
        {ROWS.map((r) => (
          <g key={r.key}>
            <rect x={0} y={r.y - 18} width={SVG_WIDTH} height={36} fill="#ffffff" stroke="#ccc" strokeWidth={0.6} />
            <text x={8} y={r.y} fontSize="12" fill="#111">{r.label}</text>
          </g>
        ))}

        {/* Hour labels ON TOP so they are not covered */}
        <g>
          {[...Array(25)].map((_, i) => {
            const x = xFromHour(i);
            const label = i === 0 ? "Midnight" : (i === 12 ? "Noon" : String(i));
            return (
              <g key={`label-${i}`}>
                <rect x={x - 2} y={2} width={50} height={14} fill="#f8d1d1" opacity={0.95} />
                <text x={x -1} y={13} fontSize="10" fill="#111">{label}</text>
              </g>
            );
          })}
        </g>

        {/* Activities rectangles */}
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
              <g key={`act-${idx}`}>
                <rect
                  x={xFromHour(start)}
                  y={rectY}
                  width={width}
                  height={rectH}
                  fill={color}
                  opacity={0.95}
                  stroke="#222"
                  strokeWidth={0.25}
                  rx={2}
                />
                {width > 36 && (
                  <text x={xFromHour(start) + 6} y={rectY + 14} fontSize="10" fill="#fff">
                    {act.type === "ON_DUTY" && act.reason ? act.reason : act.type}
                  </text>
                )}
                {/* fuel stop indicator */}
                {act.type === "ON_DUTY" && act.reason === "Fuel stop" && (
                  <circle cx={xFromHour((act.start + act.end) / 2)} cy={rectY - 6} r={4} fill="#f97316" stroke="#333" />
                )}
              </g>
            );
          })}
        </g>

        {/* Remarks box */}
        <g>
          <rect x={0} y={SVG_HEIGHT - 36} width={SVG_WIDTH} height={36} fill="#fff" stroke="#111" strokeWidth={0.6} />
          <text x={8} y={SVG_HEIGHT - 16} fontSize="12" fill="#111">REMARKS: </text>
        </g>
      </svg>

      <div className="flex gap-6 text-sm mt-2">
        <div><span style={{ background: COLORS.DRIVING, display: "inline-block", width: 12, height: 12 }}></span> Driving: {totals.DRIVING.toFixed(2)} h</div>
        <div><span style={{ background: COLORS.ON_DUTY, display: "inline-block", width: 12, height: 12 }}></span> On Duty: {totals.ON_DUTY.toFixed(2)} h</div>
        <div><span style={{ background: COLORS.SLEEPER_BERTH, display: "inline-block", width: 12, height: 12 }}></span> Sleeper Berth: {totals.SLEEPER_BERTH.toFixed(2)} h</div>
        <div><span style={{ background: COLORS.OFF_DUTY, display: "inline-block", width: 12, height: 12 }}></span> Off Duty: {totals.OFF_DUTY.toFixed(2)} h</div>
      </div>
    </div>
  );
};

export default EldLog;
