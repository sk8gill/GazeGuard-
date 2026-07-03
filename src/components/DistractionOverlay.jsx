export default function DistractionOverlay({ visible }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(200, 30, 30, 0.95)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        textAlign: "center",
      }}
    >
      <h1>LOCK IN.</h1>
      <p>Your focus alert count this session will increase.</p>
    </div>
  );
}