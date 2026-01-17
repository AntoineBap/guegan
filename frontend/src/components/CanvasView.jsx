import { OrbitControls, Stage, Environment } from "@react-three/drei";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";

const CanvasView = ({ canvasContent }) => {
  return (
      <Canvas shadows dpr={[1, 2]} camera={{ position: [4, 4, 4], fov: 50 }}>
        <color attach="background" args={["#d0d0d0"]} />
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.7} adjustCamera={false}>
            {canvasContent}
          </Stage>
          <OrbitControls
            enableZoom={true}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
          />
        </Suspense>
      </Canvas>
  );
};

export default CanvasView;
