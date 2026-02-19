import { OrbitControls, Stage, Environment } from "@react-three/drei";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import LogoBackground from "./LogoBackground"; // Assurez-vous que le chemin est bon

const CanvasView = ({ canvasContent }) => {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 10,
          pointerEvents: "none",
          background: "rgba(255, 255, 255, 0.6)",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "0.85rem",
          color: "#333",
          fontWeight: "bold"
        }}
      >
        Visuel non contractuel
      </div>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 6, 10], fov: 45 }}>
        <Suspense fallback={null}>
          <LogoBackground logoPath="/logo.png" repeatCount={5} />

          <Stage environment="city" intensity={0.8} adjustCamera={false}>
            {canvasContent}
          </Stage>
          <OrbitControls
            makeDefault
            enablePan={false}
            enableZoom={true}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default CanvasView;