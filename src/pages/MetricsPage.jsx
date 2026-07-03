import { useNavigate } from "react-router-dom";
import InsightsDashboard from "../components/InsightsDashboard";

export default function MetricsPage() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <p className="eyebrow">Your progress</p>
      <h1 className="display">Metrics</h1>
      <div style={{ width: "100%", maxWidth: 700 }}>
        <InsightsDashboard />
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
        <button className="btn btn-primary" onClick={() => navigate("/session")}>
          New session
        </button>
        <button className="btn btn-ghost" onClick={() => navigate("/")}>
          Home
        </button>
      </div>
    </div>
  );
}