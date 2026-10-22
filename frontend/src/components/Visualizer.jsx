import React from "react";
import Vasque3D from "./Vasque3D";
import { sameModel } from "./three/modelKeys";
import CanvasView from "./CanvasView";

// Ne se re-rend que si un champ utile au modèle 3D change (pas le nom de la pièce, etc.)
const Visualizer = ({ config }) => (
  <div className="preview-image" style={{ width: "100%", height: "100%" }}>
    <CanvasView planLength={Number(config.length) || 0} planWidth={Number(config.width) || 0}>
      <Vasque3D config={config} />
    </CanvasView>
  </div>
);

export default React.memo(Visualizer, sameModel);
