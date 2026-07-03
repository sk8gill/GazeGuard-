// tracking/focusEngine.js
const WINDOW_SIZE = 15; // ~1 sec at 15fps
const THRESHOLDS = {
  yaw: 0.25,
  pitch: 0.25,
  ear: 0.18,
  horizontalBias: 0.18, // distance from 0.5 center
};

export function createFocusEngine() {
  let window = [];

  function pushFrame({ headPose, eyeMetrics, faceDetected }) {
    let focused = false;
    if (faceDetected) {
      const yawOk = Math.abs(headPose.yawRatio) < THRESHOLDS.yaw;
      const pitchOk = Math.abs(headPose.pitchRatio) < THRESHOLDS.pitch;
      const eyesOpen = eyeMetrics.avgEAR > THRESHOLDS.ear;
      const eyesForward =
        Math.abs(eyeMetrics.avgHorizontalBias - 0.5) < THRESHOLDS.horizontalBias;
      focused = yawOk && pitchOk && eyesOpen && eyesForward;
    }

    window.push(focused);
    if (window.length > WINDOW_SIZE) window.shift();

    const focusedCount = window.filter(Boolean).length;
    const isFocused = focusedCount / window.length > 0.5; // majority vote
    return { isFocused, faceDetected };
  }

  return { pushFrame };
}