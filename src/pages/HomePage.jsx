import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="page" style={{ justifyContent: "center" }}>
      <p className="eyebrow">GazeGuard</p>
      <h1 className="display">Stay on the page,<br />not just in the room.</h1>
      <p className="lede">
        A quiet focus session that watches for drift — a glance away, a slouch,
        a scroll — and gently brings you back before the minutes slip.
      </p>
      <button className="btn btn-primary" onClick={() => navigate("/session")}>
        Start a focus session
      </button>
    </div>
  );
}