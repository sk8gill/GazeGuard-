// components/CameraFeed.jsx
import { useEffect, useRef } from "react";

export default function CameraFeed({ onVideoReady }) {
  const videoRef = useRef(null);

  useEffect(() => {
    let stream;
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        onVideoReady?.(videoRef.current);
      } catch (err) {
        console.error("Camera access failed:", err);
      }
    }
    start();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [onVideoReady]);

  return <video ref={videoRef} style={{ display: "none" }} playsInline muted />;
}