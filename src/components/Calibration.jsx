import { useEffect, useRef, useState } from "react";
import { estimateHeadPose } from "../tracking/headPose";
import { estimateEyeMetrics } from "../tracking/eyeMetrics";

const CALIBRATION_MS = 5000;

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function buildThresholdsFromBaseline(baseline) {
  return {
    yaw: Math.abs(baseline.yawRatio) + 0.2,
    pitch: Math.abs(baseline.pitchRatio) + 0.2,
    ear: 0.18,
    horizontalBias: 0.18,
    verticalBias: 0.15, // phone-in-lap glances are usually a bigger vertical swing
  };
}

export default function Calibration({ landmarks, onDone }) {
  const [secondsLeft, setSecondsLeft] = useState(CALIBRATION_MS / 1000);
  const samples = useRef([]);
  const startedAt = useRef(null);

  useEffect(() => {
    startedAt.current = Date.now();

    const tick = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      const remaining = Math.max(0, Math.ceil((CALIBRATION_MS - elapsed) / 1000));
      setSecondsLeft(remaining);
    }, 200);

    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!landmarks || !startedAt.current) return;
    const elapsed = Date.now() - startedAt.current;
    if (elapsed >= CALIBRATION_MS) return;

    const headPose = estimateHeadPose(landmarks);
    const eyeMetrics = estimateEyeMetrics(landmarks);
    samples.current.push({ headPose, eyeMetrics });
  }, [landmarks]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const collected = samples.current;

      if (collected.length === 0) {
        onDone({ yaw: 0.25, pitch: 0.25, ear: 0.18, horizontalBias: 0.18, verticalBias: 0.15 });
        return;
      }

      const baseline = {
        yawRatio: median(collected.map((s) => s.headPose.yawRatio)),
        pitchRatio: median(collected.map((s) => s.headPose.pitchRatio)),
        avgHorizontalBias: median(collected.map((s) => s.eyeMetrics.avgHorizontalBias)),
      };

      onDone(buildThresholdsFromBaseline(baseline));
    }, CALIBRATION_MS);

    return () => clearTimeout(timeout);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#111",
        color: "white",
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#4da6ff",
        }}
      />
      <p style={{ marginTop: 24 }}>
        Look at the dot… calibrating ({secondsLeft}s)
      </p>
    </div>
  );
}