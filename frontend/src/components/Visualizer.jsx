import Vasque3D from "../components/Vasque3D";
import CanvasView from "./CanvasView";

const Visualizer = ({ config }) => {
  return (
    <div className="preview-image" style={{ width: "100%", height: "100%" }}>
      <div
        className="placeholder-art"
        style={{ width: "100%", height: "100%" }}
      >
        <CanvasView canvasContent={<Vasque3D config={config} />} />
      </div>
    </div>
  );
};

export default Visualizer;
