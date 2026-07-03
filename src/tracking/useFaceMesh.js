// tracking/useFaceMesh.js
import { useEffect, useRef, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

export function useFaceMesh(videoEl) {
  const [landmarks, setLandmarks] = useState(null);
  const faceMeshRef = useRef(null);

  useEffect(() => {
    if (!videoEl) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true, // needed for iris landmarks (468-477)
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    faceMesh.onResults((results) => {
      if (results.multiFaceLandmarks?.length) {
        setLandmarks(results.multiFaceLandmarks[0]);
      } else {
        setLandmarks(null); // no face detected this frame
      }
    });

    faceMeshRef.current = faceMesh;

    const camera = new Camera(videoEl, {
      onFrame: async () => {
        await faceMesh.send({ image: videoEl });
      },
      width: 640,
      height: 480,
    });
    camera.start();

    return () => {
      camera.stop();
      faceMesh.close();
    };
  }, [videoEl]);

  return landmarks; // array of 478 {x, y, z} normalized points, or null
}