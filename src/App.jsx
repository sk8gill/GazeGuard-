import { useState } from "react";
import CameraFeed from "./components/CameraFeed";
import Calibration from "./components/Calibration";
import DistractionOverlay from "./components/DistractionOverlay";
import InsightsDashboard from "./components/InsightsDashboard";
import { useFaceMesh } from "./tracking/useFaceMesh";
import { useStudySession } from "./hooks/useStudySession";
import FaceMeshCanvas from "./components/FaceMeshCanvas";

function formatTime(totalSec) {
  const min = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const sec = (totalSec % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function App() {
  const [videoEl, setVideoEl] = useState(null);
  const [plannedMin, setPlannedMin] = useState(25);
  const landmarks = useFaceMesh(videoEl);
  const session = useStudySession(landmarks);
  const [showDots, setShowDots] = useState(true);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>GazeGuard</h1>

      {/* Camera always runs in the background once mounted */}
      <CameraFeed onVideoReady={setVideoEl} />
      <FaceMeshCanvas videoEl={videoEl} landmarks={landmarks} showDots={showDots} />

      <label style={{ display: "block", marginTop: 8, fontSize: 14 }}>
      <input
        type="checkbox"
        checked={showDots}
        onChange={(e) => setShowDots(e.target.checked)}
      />{" "}
      Show face tracking dots
    </label>

      {/* --- idle: setup screen --- */}
      {session.status === "idle" && (
        <div>
          <p>Camera status: {videoEl ? "connected" : "waiting for camera…"}</p>
          <p>Face detected: {landmarks ? `yes (${landmarks.length} points)` : "no"}</p>

          <label>
            Session length (minutes):{" "}
            <input
              type="number"
              min="1"
              max="120"
              value={plannedMin}
              onChange={(e) => setPlannedMin(Number(e.target.value))}
              style={{ width: 60 }}
            />
          </label>
          <br />
          <button
            onClick={() => session.start(plannedMin)}
            disabled={!videoEl}
            style={{ marginTop: 12 }}
          >
            Start session
          </button>
        </div>
      )}

      {/* --- calibrating: dot screen --- */}
      {session.status === "calibrating" && (
        <Calibration landmarks={landmarks} onDone={session.finishCalibration} />
      )}

      {/* --- running / paused: live timer --- */}
      {(session.status === "running" || session.status === "paused") && (
        <div>
          <h2>{formatTime(session.elapsedSec)} / {formatTime(session.plannedDurationMin * 60)}</h2>
          <p>Status: {session.status}</p>
          <p>Distractions this session: {session.distractionCount}</p>
          <button onClick={session.status === "running" ? session.pause : session.resume}>
            {session.status === "running" ? "Pause" : "Resume"}
          </button>
        </div>
      )}

      {/* --- full-screen red alert, driven by session state --- */}
      <DistractionOverlay visible={session.alertVisible} />

      {/* --- complete: summary --- */}
      {session.status === "complete" && (
        <div>
          <h2>Session complete 🎉</h2>
          <p>Planned: {session.plannedDurationMin} min</p>
          <p>Actual: {formatTime(session.elapsedSec)}</p>
          <p>Distractions: {session.distractionCount}</p>
          {session.distractionEvents.length > 0 && (
            <details>
              <summary>Distraction log</summary>
              <ul>
                {session.distractionEvents.map((e, i) => (
                  <li key={i}>{e.durationSec}s at {new Date(e.startTime).toLocaleTimeString()}</li>
                ))}
              </ul>
            </details>
          )}
          <button onClick={session.reset} style={{ marginTop: 12 }}>
            Start another session
          </button>
        </div>
      )}

      {/* --- insights: always visible below, remounts on status change to refresh data --- */}
      <hr style={{ margin: "32px 0" }} />
      <InsightsDashboard key={session.status} />
    </div>
  );
}

export default App;