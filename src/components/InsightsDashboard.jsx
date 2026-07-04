import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { getAllSessions } from "../db/sessionRepo";

function computeTrend(sessions) {
  const recent = sessions.slice(-5);
  const prior = sessions.slice(-10, -5);
  const avg = (arr) =>
    arr.reduce((s, x) => s + x.focusPercentage, 0) / (arr.length || 1);
  const recentAvg = avg(recent);
  const priorAvg = avg(prior);
  const deltaPct = priorAvg ? ((recentAvg - priorAvg) / priorAvg) * 100 : 0;
  return { recentAvg, priorAvg, deltaPct };
}

// Builds a label per session: date-only, unless another session shares
// that same day, in which case time is appended to disambiguate.
function buildLabels(sessions) {
  const dayCounts = {};
  sessions.forEach((s) => {
    const day = new Date(s.startTime).toLocaleDateString();
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  return sessions.map((s) => {
    const dateObj = new Date(s.startTime);
    const day = dateObj.toLocaleDateString();
    const sameDayCount = dayCounts[day];
    const label =
      sameDayCount > 1
        ? `${day}, ${dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : day;
    return { ...s, label };
  });
}

export default function InsightsDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllSessions()
      .then(setSessions)
      .catch((err) => console.error("Failed to load sessions:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading insights…</p>;
  if (sessions.length === 0) return <p>No sessions yet — complete one to see insights.</p>;

  const labeledSessions = buildLabels(sessions);

  // "id" is the unique, guaranteed-distinct axis key (fixes the
  // duplicate-category tooltip bug). "label" is what's actually shown.
  const chartData = labeledSessions.map((s) => ({
    id: s.id,
    label: s.label,
    focusPercentage: Math.round(s.avgFocusPercentage),
    distractionCount: s.distractionCount,
  }));

  // Quick lookup so tickFormatter/labelFormatter can turn an id back into
  // its display label without re-scanning the array each render.
  const labelById = Object.fromEntries(chartData.map((d) => [d.id, d.label]));
  const formatTick = (id) => labelById[id] ?? "";

  const trendInput = sessions.map((s) => ({
    focusPercentage: s.avgFocusPercentage,
  }));
  const { recentAvg, deltaPct } = computeTrend(trendInput);
  const direction = deltaPct >= 0 ? "up" : "down";

  return (
    <div style={{ marginTop: 32 }}>
      <h2>Insights</h2>

      {sessions.length >= 2 && (
  sessions.length > 5 ? (
    <p>
      Your average focus over your last {Math.min(5, sessions.length)}{" "}
      sessions is <strong>{recentAvg.toFixed(1)}%</strong>, {direction}{" "}
      {Math.abs(deltaPct).toFixed(1)}% compared to your previous{" "}
      {Math.min(5, Math.max(0, sessions.length - 5))}.
    </p>
  ) : (
    <p>
      Your average focus so far is <strong>{recentAvg.toFixed(1)}%</strong>{" "}
      across {sessions.length} session{sessions.length === 1 ? "" : "s"}.
      Complete a few more to start seeing trend comparisons.
    </p>
  )
)}

      <h3>Focus % over time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="id" tickFormatter={formatTick} />
          <YAxis domain={[0, 100]} />
          <Tooltip labelFormatter={formatTick} />
          <Line type="monotone" dataKey="focusPercentage" stroke="#4da6ff" />
        </LineChart>
      </ResponsiveContainer>

      <h3>Distractions per session</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="id" tickFormatter={formatTick} />
          <YAxis allowDecimals={false} />
          <Tooltip labelFormatter={formatTick} />
          <Bar dataKey="distractionCount" fill="#c81e1e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}