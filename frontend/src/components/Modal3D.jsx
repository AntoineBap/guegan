import { AnimatePresence, motion } from 'framer-motion';
import Vasque3D from './Vasque3D';
import CanvasView from "./CanvasView";

const Modal3D = ({config, showModal, setShowModal}) => {
  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowModal(false)}>
              ×
            </button>
            <h2>Validation Technique</h2>
            <div className="canvas-container">
              <CanvasView canvasContent={<Vasque3D config={config} />}/> 
            </div>
            <div className="modal-footer">
              <p>
                Vérifiez que les perçages et dimensions correspondent à votre
                besoin.
              </p>
              
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal3D;
