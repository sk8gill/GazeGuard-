// tracking/eyeMetrics.js

// Approximate MediaPipe indices for EAR calc (left eye shown; mirror for right)
const LEFT_EYE = { top: 159, bottom: 145, left: 33, right: 133 };
const RIGHT_EYE = { top: 386, bottom: 374, left: 362, right: 263 };
const LEFT_IRIS = 468; // center-ish iris landmark
const RIGHT_IRIS = 473;

function eyeAspectRatio(landmarks, eye) {
  const top = landmarks[eye.top];
  const bottom = landmarks[eye.bottom];
  const left = landmarks[eye.left];
  const right = landmarks[eye.right];
  const vertical = Math.hypot(top.x - bottom.x, top.y - bottom.y);
  const horizontal = Math.hypot(left.x - right.x, left.y - right.y);
  return vertical / horizontal; // lower = more closed
}

function irisBias(landmarks, eye, irisIdx) {
  const iris = landmarks[irisIdx];
  const left = landmarks[eye.left];
  const right = landmarks[eye.right];
  const eyeWidth = right.x - left.x;
  // 0 = looking left edge, 1 = looking right edge, 0.5 = center
  return (iris.x - left.x) / eyeWidth;
}

function irisVerticalBias(landmarks, eye, irisIdx) {
  const iris = landmarks[irisIdx];
  const top = landmarks[eye.top];
  const bottom = landmarks[eye.bottom];
  const eyeHeight = bottom.y - top.y;
  // 0 = looking up, 1 = looking down, 0.5 = center
  return (iris.y - top.y) / eyeHeight;
}

export function estimateEyeMetrics(landmarks) {
  const earL = eyeAspectRatio(landmarks, LEFT_EYE);
  const earR = eyeAspectRatio(landmarks, RIGHT_EYE);
  const avgEAR = (earL + earR) / 2;

  const biasL = irisBias(landmarks, LEFT_EYE, LEFT_IRIS);
  const biasR = irisBias(landmarks, RIGHT_EYE, RIGHT_IRIS);
  const avgHorizontalBias = (biasL + biasR) / 2;

  const vBiasL = irisVerticalBias(landmarks, LEFT_EYE, LEFT_IRIS);
  const vBiasR = irisVerticalBias(landmarks, RIGHT_EYE, RIGHT_IRIS);
  const avgVerticalBias = (vBiasL + vBiasR) / 2;

  return { avgEAR, avgHorizontalBias, avgVerticalBias };
}