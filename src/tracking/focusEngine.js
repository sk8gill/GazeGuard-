const WINDOW_SIZE = 30;
const SMOOTHING_FRAMES = 5;

export function createFocusEngine(thresholds) {
  let window = [];
  let recentFrames = [];

  function pushFrame({ headPose, eyeMetrics, faceDetected }) {
    recentFrames.push({ headPose, eyeMetrics, faceDetected });
    if (recentFrames.length > SMOOTHING_FRAMES) recentFrames.shift();

    const smoothedYaw =
      recentFrames.reduce((s, f) => s + f.headPose.yawRatio, 0) / recentFrames.length;
    const smoothedPitch =
      recentFrames.reduce((s, f) => s + f.headPose.pitchRatio, 0) / recentFrames.length;
    const smoothedEAR =
      recentFrames.reduce((s, f) => s + f.eyeMetrics.avgEAR, 0) / recentFrames.length;
    const smoothedHBias =
      recentFrames.reduce((s, f) => s + f.eyeMetrics.avgHorizontalBias, 0) / recentFrames.length;
    const smoothedVBias =
      recentFrames.reduce((s, f) => s + f.eyeMetrics.avgVerticalBias, 0) / recentFrames.length;

    let focused = false;
    if (faceDetected) {
      const yawOk = Math.abs(smoothedYaw) < thresholds.yaw;
      const pitchOk = Math.abs(smoothedPitch) < thresholds.pitch;
      const eyesOpen = smoothedEAR > thresholds.ear;
      const eyesForwardH = Math.abs(smoothedHBias - 0.5) < thresholds.horizontalBias;
      const eyesForwardV = Math.abs(smoothedVBias - 0.5) < thresholds.verticalBias;
      focused = yawOk && pitchOk && eyesOpen && eyesForwardH && eyesForwardV;
    }

    window.push(focused);
    if (window.length > WINDOW_SIZE) window.shift();

    const focusedCount = window.filter(Boolean).length;
    const isFocused = focusedCount / window.length > 0.5;
    return { isFocused, faceDetected };
  }

  return { pushFrame };
}