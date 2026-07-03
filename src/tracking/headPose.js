// tracking/headPose.js
export function estimateHeadPose(landmarks) {
  const nose = landmarks[1];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const forehead = landmarks[10];
  const chin = landmarks[152];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  const distToLeft = Math.hypot(nose.x - leftCheek.x, nose.y - leftCheek.y);
  const distToRight = Math.hypot(nose.x - rightCheek.x, nose.y - rightCheek.y);
  const yawRatio = (distToLeft - distToRight) / (distToLeft + distToRight); // -1..1

  const distToForehead = Math.hypot(nose.x - forehead.x, nose.y - forehead.y);
  const distToChin = Math.hypot(nose.x - chin.x, nose.y - chin.y);
  const pitchRatio = (distToForehead - distToChin) / (distToForehead + distToChin);

  const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

  return { yawRatio, pitchRatio, roll };
}