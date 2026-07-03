const WINDOW_SIZE = 30;

export function createFocusEngine(thresholds) {
  let window = [];

  function pushFrame({ headPose, eyeMetrics, faceDetected }) {
    let focused = false;
    if (faceDetected) {
      const yawOk = Math.abs(headPose.yawRatio) < thresholds.yaw;
      const pitchOk = Math.abs(headPose.pitchRatio) < thresholds.pitch;
      const eyesOpen = eyeMetrics.avgEAR > thresholds.ear;
      const eyesForward =
        Math.abs(eyeMetrics.avgHorizontalBias - 0.5) < thresholds.horizontalBias;
      focused = yawOk && pitchOk && eyesOpen && eyesForward;
    }

    window.push(focused);
    if (window.length > WINDOW_SIZE) window.shift();

    const focusedCount = window.filter(Boolean).length;
    const isFocused = focusedCount / window.length > 0.5;
    return { isFocused, faceDetected };
  }

  return { pushFrame };
}