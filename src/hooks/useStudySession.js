import { useCallback, useEffect, useRef, useState } from "react";
import { createFocusEngine } from "../tracking/focusEngine";
import { estimateHeadPose } from "../tracking/headPose";
import { estimateEyeMetrics } from "../tracking/eyeMetrics";

const GRACE_PERIOD_MS = 4000;

const initialState = {
  status: "idle", // idle | calibrating | running | paused | complete
  plannedDurationMin: 25,
  startTime: null,
  elapsedSec: 0,
  distractionCount: 0,
  distractionEvents: [], // { startTime, endTime, durationSec }
  alertVisible: false,
};

export function useStudySession(landmarks) {
  const [state, setState] = useState(initialState);
  const thresholdsRef = useRef(null);
  const focusEngineRef = useRef(null);
  const graceTimerRef = useRef(null);
  const activeDistractionRef = useRef(null); // in-progress distraction event
  const tickIntervalRef = useRef(null);

  // --- lifecycle actions ---

  const start = useCallback((plannedDurationMin = 25) => {
    setState((s) => ({
      ...s,
      status: "calibrating",
      plannedDurationMin,
    }));
  }, []);

  const finishCalibration = useCallback((thresholds) => {
    thresholdsRef.current = thresholds;
    focusEngineRef.current = createFocusEngine();
    setState((s) => ({
      ...s,
      status: "running",
      startTime: Date.now(),
      elapsedSec: 0,
      distractionCount: 0,
      distractionEvents: [],
      alertVisible: false,
    }));
  }, []);

  const pause = useCallback(() => {
    setState((s) => (s.status === "running" ? { ...s, status: "paused" } : s));
  }, []);

  const resume = useCallback(() => {
    setState((s) => (s.status === "paused" ? { ...s, status: "running" } : s));
  }, []);

  const reset = useCallback(() => {
    clearInterval(tickIntervalRef.current);
    clearTimeout(graceTimerRef.current);
    activeDistractionRef.current = null;
    focusEngineRef.current = null;
    thresholdsRef.current = null;
    setState(initialState);
  }, []);

  // --- elapsed timer ---

  useEffect(() => {
    if (state.status !== "running") return;

    tickIntervalRef.current = setInterval(() => {
      setState((s) => {
        const nextElapsed = s.elapsedSec + 1;
        if (nextElapsed >= s.plannedDurationMin * 60) {
          clearInterval(tickIntervalRef.current);
          return { ...s, elapsedSec: nextElapsed, status: "complete" };
        }
        return { ...s, elapsedSec: nextElapsed };
      });
    }, 1000);

    return () => clearInterval(tickIntervalRef.current);
  }, [state.status]);

  // --- per-frame focus check ---

  useEffect(() => {
    if (state.status !== "running") return;
    if (!focusEngineRef.current || !thresholdsRef.current) return;

    const faceDetected = !!landmarks;
    let headPose = { yawRatio: 0, pitchRatio: 0 };
    let eyeMetrics = { avgEAR: 1, avgHorizontalBias: 0.5 };

    if (faceDetected) {
      headPose = estimateHeadPose(landmarks);
      eyeMetrics = estimateEyeMetrics(landmarks);
    }

    // normalize against calibrated thresholds
    const t = thresholdsRef.current;
    const normalized = {
      headPose: {
        yawRatio: faceDetected ? headPose.yawRatio / (t.yaw || 0.25) * 0.25 : 0,
        pitchRatio: faceDetected ? headPose.pitchRatio / (t.pitch || 0.25) * 0.25 : 0,
      },
      eyeMetrics,
      faceDetected,
    };

    const { isFocused } = focusEngineRef.current.pushFrame(normalized);

    if (!isFocused && !activeDistractionRef.current && !graceTimerRef.current) {
      // start grace period
      graceTimerRef.current = setTimeout(() => {
        const nowIso = Date.now();
        activeDistractionRef.current = { startTime: nowIso };
        graceTimerRef.current = null;
        setState((s) => ({
          ...s,
          alertVisible: true,
          distractionCount: s.distractionCount + 1,
        }));
      }, GRACE_PERIOD_MS);
    }

    if (isFocused) {
      // cancel a pending grace timer if focus returned before it fired
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
      // close out an active distraction event
      if (activeDistractionRef.current) {
        const endTime = Date.now();
        const { startTime } = activeDistractionRef.current;
        const durationSec = Math.round((endTime - startTime) / 1000);
        activeDistractionRef.current = null;
        setState((s) => ({
          ...s,
          alertVisible: false,
          distractionEvents: [...s.distractionEvents, { startTime, endTime, durationSec }],
        }));
      }
    }
  }, [landmarks, state.status]);

  return {
    ...state,
    start,
    finishCalibration,
    pause,
    resume,
    reset,
  };
}