import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CameraFeed from "../components/CameraFeed";
import FaceMeshCanvas from "../components/FaceMeshCanvas";
import Calibration from "../components/Calibration";
import DistractionOverlay from "../components/DistractionOverlay";
import { useFaceMesh } from "../tracking/useFaceMesh";
import { useStudySession } from "../hooks/useStudySession";

function formatTime(totalSec) {
  const min = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const sec = (totalSec % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

export default function SessionPage() {
  const navigate = useNavigate();
  const [videoEl, setVideoEl] = useState(null);
  const [plannedMin, setPlannedMin] = useState(25);
  const [showDots, setShowDots] = useState(true);
  const landmarks = useFaceMesh(videoEl);
  const session = useStudySession(landmarks);

  const ringClass = session.alertVisible
    ? "focus-ring is-distracted"
    : session.status === "running"
    ? "focus-ring is-focused"
    : "focus-ring";

  return (
    <div className="page">
      <CameraFeed onVideoReady={setVideoEl} />

      {session.status === "idle" && (
        <>
          <p className="eyebrow">New session</p>
          <h1 className="display">Get comfortable.</h1>
          <div className={ringClass}>
            <FaceMeshCanvas videoEl={videoEl} landmarks={landmarks} showDots={showDots} />
          </div>
          <div className="card" style={{ marginTop: 24 }}>
            <p style={{ margin: "0 0 4px" }}>
              Camera: {videoEl ? "connected" : "waiting…"}
            </p>
            <p style={{ margin: "0 0 16px", color: "var(--mist)" }}>
              Face: {landmarks ? `detected (${landmarks.length} pts)` : "not detected"}
            </p>
            <label style={{ display: "block", marginBottom: 12 }}>
              Session length (min){" "}
              <input
                type="number"
                min="1"
                max="120"
                value={plannedMin}
                onChange={(e) => setPlannedMin(Number(e.target.value))}
                style={{ width: 60 }}
              />
            </label>
            <label style={{ display: "block", marginBottom: 16, fontSize: 14, color: "var(--mist)" }}>
              <input
                type="checkbox"
                checked={showDots}
                onChange={(e) => setShowDots(e.target.checked)}
              />{" "}
              Show tracking dots
            </label>
            <button
              className="btn btn-primary"
              disabled={!videoEl}
              onClick={() => session.start(plannedMin)}
              style={{ width: "100%" }}
            >
              Begin calibration
            </button>
          </div>
        </>
      )}

      {session.status === "calibrating" && (
        <Calibration landmarks={landmarks} onDone={session.finishCalibration} />
      )}

      {(session.status === "running" || session.status === "paused") && (
        <>
          <div className={ringClass}>
            <FaceMeshCanvas videoEl={videoEl} landmarks={landmarks} showDots={showDots} />
          </div>
          <div className="timer" style={{ marginTop: 24 }}>
            {formatTime(session.elapsedSec)}
          </div>
          <p style={{ color: "var(--mist)" }}>
            of {formatTime(session.plannedDurationMin * 60)} · {session.distractionCount} distraction{session.distractionCount === 1 ? "" : "s"}
          </p>
          <button
            className="btn btn-ghost"
            onClick={session.status === "running" ? session.pause : session.resume}
          >
            {session.status === "running" ? "Pause" : "Resume"}
          </button>
        </>
      )}

      <DistractionOverlay visible={session.alertVisible} />

      {session.status === "complete" && (
        <>
          <p className="eyebrow">Session complete</p>
          <h1 className="display">Nice work.</h1>
          <div className="card">
            <p><span className="stat-number">{session.distractionCount}</span> <span className="stat-label">distractions</span></p>
            <p style={{ color: "var(--mist)" }}>{formatTime(session.elapsedSec)} studied</p>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap", justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => navigate("/metrics")}>
              View metrics
            </button>
            <button className="btn btn-ghost" onClick={session.reset}>
              Start another session
            </button>
            <button className="btn btn-ghost" onClick={() => navigate("/")}>
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}