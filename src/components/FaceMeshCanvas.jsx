import { useEffect, useRef } from "react";

export default function FaceMeshCanvas({ videoEl, landmarks, width = 480, height = 360, showDots = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !videoEl) return;
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(videoEl, -width, 0, width, height);
    ctx.restore();

    if (landmarks && showDots) {
      ctx.fillStyle = "#4da6ff";
      landmarks.forEach((pt) => {
        const x = width - pt.x * width;
        const y = pt.y * height;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }, [landmarks, videoEl, width, height, showDots]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ borderRadius: 8, background: "#000" }}
    />
  );
}