import Vasque3D from "../components/Vasque3D";
import CanvasView from "./CanvasView";

const Visualizer = ({ config }) => {
  return (
    <div className="preview-image">
      <div className="placeholder-art">
        <CanvasView canvasContent={<Vasque3D config={config} />} />
      </div>
    </div>
  );
};

export default Visualizer;
