import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Environment } from '@react-three/drei';
import { Geometry, Base, Subtraction } from '@react-three/csg';
import { AnimatePresence, motion } from 'framer-motion';
import '../styles/style.scss';

const Vasque3D = ({ config }) => {
  const totalW = config.width / 10;
  const totalL = config.length / 10;
  const height = config.depth / 10;
  const thickness = 0.15;
  const materialColor = config.color === 'white' ? '#ffffff' : '#111111';
  const materialProps = {
    color: materialColor,
    roughness: config.color === 'white' ? 0.2 : 0.3,
    metalness: 0.1,
  };

  const basinMargin = 0.8;
  const basinL = Math.min(5, totalL - 2); 
  const basinW = totalW - (basinMargin * 2);
  const basinH = height - 0.2;

  const edgeMargin = 1; 
  let basinX = 0;

  if (config.position === 'left') {
    basinX = (-totalL / 2) + edgeMargin + (basinL / 2);
  } else if (config.position === 'right') {
    basinX = (totalL / 2) - edgeMargin - (basinL / 2);
  }

  const floorY = (height / 2) - basinH;
  let holeXGlobal = basinX;
  if (config.tapHole === 'left') holeXGlobal = basinX - (basinL/4);
  if (config.tapHole === 'right') holeXGlobal = basinX + (basinL/4);
  const leftPlateWidth = (basinX - basinL/2) - (-totalL/2);
  const leftPlateX = (-totalL/2) + (leftPlateWidth / 2);
  const rightPlateWidth = (totalL/2) - (basinX + basinL/2);
  const rightPlateX = (totalL/2) - (rightPlateWidth / 2);

  return (
    <group>
      {leftPlateWidth > 0 && (
        <mesh position={[leftPlateX, height/2 - thickness/2, 0]}>
          <boxGeometry args={[leftPlateWidth, thickness, totalW]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      )}
      {rightPlateWidth > 0 && (
        <mesh position={[rightPlateX, height/2 - thickness/2, 0]}>
          <boxGeometry args={[rightPlateWidth, thickness, totalW]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      )}

      {/* bandes avant et arriere (qui suivent le bassin) */}
      <mesh position={[basinX, height/2 - thickness/2, totalW/2 - basinMargin/2]}>
         <boxGeometry args={[basinL, thickness, basinMargin]} />
         <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[basinX, height/2 - thickness/2, -totalW/2 + basinMargin/2]}>
         <boxGeometry args={[basinL, thickness, basinMargin]} />
         <meshStandardMaterial {...materialProps} />
      </mesh>


      {/* fond de la cuve */}
      <mesh position={[basinX, floorY + thickness/2, 0]} key={config.color}>
        <meshStandardMaterial {...materialProps} side={2} />
        <Geometry>
            <Base>
                <boxGeometry args={[basinL, thickness, basinW]} />
            </Base>
            {config.tapHole !== 'none' && (
                <Subtraction position={[holeXGlobal - basinX, 0, 0]}>
                    <cylinderGeometry args={[0.24, 0.24, thickness + 1, 48]} />
                </Subtraction>
            )}
        </Geometry>
      </mesh>

      {/* parois de la cuve */}
      <mesh position={[basinX, height/2 - basinH/2, basinW/2 - thickness/2]}>
        <boxGeometry args={[basinL, basinH, thickness]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[basinX, height/2 - basinH/2, -basinW/2 + thickness/2]}>
        <boxGeometry args={[basinL, basinH, thickness]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[basinX - basinL/2 + thickness/2, height/2 - basinH/2, 0]}>
        <boxGeometry args={[thickness, basinH, basinW - thickness*2]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[basinX + basinL/2 - thickness/2, height/2 - basinH/2, 0]}>
        <boxGeometry args={[thickness, basinH, basinW - thickness*2]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>

      {config.splashback && (
        <mesh position={[0, height/2 + (config.splashbackHeight/10)/2, -totalW/2 + thickness/2]}>
          <boxGeometry args={[totalL, config.splashbackHeight/10, thickness]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
      )}
      {config.sideRims && (
        <>
          <mesh position={[-totalL/2 + thickness/2, height/2 + (config.sideRimHeight/10)/2, 0]}>
            <boxGeometry args={[thickness, config.sideRimHeight/10, totalW]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[totalL/2 - thickness/2, height/2 + (config.sideRimHeight/10)/2, 0]}>
            <boxGeometry args={[thickness, config.sideRimHeight/10, totalW]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        </>
      )}

      {/* percage de robinnetterie ou non */}
      {config.tapHole !== 'none' && (
        <group position={[holeXGlobal, floorY + thickness + 0.005, 0]}>
          <mesh rotation={[Math.PI/2, 0, 0]}>
             <torusGeometry args={[0.25, 0.03, 16, 32]} /> 
             <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
          </mesh>
        </group>
      )}
    </group>
  );
};

// app principale
const VasqueConfigurator = () => {
  const [showModal, setShowModal] = useState(false);
  const [config, setConfig] = useState({
    color: 'white',
    position: 'center',
    length: 120, // unites en cm
    width: 50, 
    depth: 12, 
    tapHole: 'none', // choix de la position
    splashback: false, // goutte d'eau et dimension
    splashbackHeight: 5,
    sideRims: false,
    sideRimHeight: 5,
    comments: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCheckout = async () => {
    // petit feedback pour dire que ca charge
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.innerText;
    btn.innerText = "Chargement...";
    btn.disabled = true;

    try {
      const response = await fetch('http://localhost:4242/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();

      if (data.url) {
        // redirige vers la page stripe secure
        window.location.href = data.url;
      } else {
        alert("Erreur lors de la création de la commande");
        btn.innerText = originalText;
        btn.disabled = false;
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Impossible de contacter le serveur.");
      btn.innerText = originalText;
      btn.disabled = false;
    }
  };

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <div className="logo">GUEGAN CORIAN.</div>
        <nav>
          <span>Collections</span>
          <span>Sur Mesure</span>
          <span>Contact</span>
        </nav>
      </header>

      <main className="main-content">
        
        {/* bloc de configuration (options lavabo) a decomposer en components */}
        <div className="config-panel">
          <h1>Votre Vasque <span className="gold-text">Signature</span></h1>
          
          <div className="form-group">
            <label>Couleur du Corian</label>
            <div className="radio-group">
              <button 
                className={config.color === 'white' ? 'active' : ''} 
                onClick={() => setConfig({...config, color: 'white'})}>Blanc Pur</button>
              <button 
                className={config.color === 'black' ? 'active' : ''} 
                onClick={() => setConfig({...config, color: 'black'})}>Noir Intense</button>
            </div>
          </div>

          <div className="form-group">
            <label>Dimensions (cm)</label>
            <div className="inputs-row">
              <div>
                <span>Longueur</span>
                <input type="number" name="length" value={config.length} onChange={handleChange} />
              </div>
              <div>
                <span>Largeur</span>
                <input type="number" name="width" value={config.width} onChange={handleChange} />
              </div>
              <div>
                <span>Profondeur</span>
                <input type="number" name="depth" value={config.depth} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Position du bassin</label>
            <select name="position" value={config.position} onChange={handleChange}>
              <option value="center">Centré</option>
              <option value="left">Gauche</option>
              <option value="right">Droite</option>
            </select>
          </div>

          <div className="form-group">
            <label>Perçage Robinetterie</label>
            <div className="grid-options">
              {['none', 'center', 'left', 'right'].map(opt => (
                <button 
                  key={opt}
                  className={config.tapHole === opt ? 'active-small' : ''}
                  onClick={() => setConfig({...config, tapHole: opt})}
                >
                  {opt === 'none' ? 'Aucun' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" name="splashback" checked={config.splashback} onChange={handleChange} />
              Ajouter Goutte d'eau (Dosseret)
            </label>
            {config.splashback && (
               <input type="number" className="small-input" name="splashbackHeight" value={config.splashbackHeight} onChange={handleChange} placeholder="H (cm)" />
            )}
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" name="sideRims" checked={config.sideRims} onChange={handleChange} />
              Ajouter Rebords latéraux
            </label>
            {config.sideRims && (
               <input type="number" className="small-input" name="sideRimHeight" value={config.sideRimHeight} onChange={handleChange} placeholder="H (cm)" />
            )}
          </div>

          <div className="form-group">
            <label>Commentaires / Demande spéciale</label>
            <textarea name="comments" rows="3" onChange={handleChange} placeholder="Une précision pour l'atelier ?"></textarea>
          </div>

          <div className="actions">
            <button className="btn-secondary" onClick={() => setShowModal(true)}>
              Voir Rendu 3D
            </button>
            <button className="btn-primary" onClick={handleCheckout}>
              Commander • 950.00 €
            </button>
          </div>
        </div>

        {/* zone preview de la 3d */}
        <div className="preview-image">
          <div className="placeholder-art">
            <Canvas shadows dpr={[1, 2]} camera={{ position: [4, 4, 4], fov: 50 }}>
                <color attach="background" args={['#d0d0d0']} />
                
                <Suspense fallback={null}>
                  <Stage environment="city" intensity={0.7} adjustCamera={false}>
                    <Vasque3D config={config} />
                  </Stage>
                  <OrbitControls enableZoom={true} minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
                </Suspense>
            </Canvas>
          </div>
        </div>

      </main>

      {/* modale de rendu 3d */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="modal-content">
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
              <h2>Validation Technique</h2>
              <div className="canvas-container">
                <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 5, 5], fov: 45 }}>
                  <color attach="background" args={['#e0e0e0']} /> 
                  <Suspense fallback={null}>
                    <Stage environment="studio" intensity={0.5} contactShadow={false}>
                      <Vasque3D config={config} />
                    </Stage>
                    <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
                    <Environment preset="apartment" />
                  </Suspense>
                </Canvas>
              </div>
              <div className="modal-footer">
                <p>Vérifiez que les perçages et dimensions correspondent à votre besoin.</p>
                <button className="btn-primary" onClick={() => {setShowModal(false); handleCheckout();}}>
                  Valider et Payer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VasqueConfigurator;