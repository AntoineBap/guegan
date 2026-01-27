import React, { useState, Suspense } from "react";
import "../styles/style.scss"; // Assurez-vous que c'est le bon fichier
import ConfigPanel from "../components/ConfigPanel";
import Visualizer from "../components/Visualizer";
import Modal3D from "../components/Modal3D";
import Header from "../components/Header";

const Main = () => {
  const [showModal, setShowModal] = useState(false);
  const [config, setConfig] = useState({
    color: "white",
    length: 1200,
    width: 500,
    depth: 300,
    splashback: false,
    splashbackHeight: 5,
    rims: false,
    rimHeight: 5,
    comments: "",
    vasques: [
      {
        id: 1, 
        sink: "Aucune cuve",
        position: 0,
        side: "center",
        tapHole: "none",
        tapHoleOffset: 50,  
      }
    ]
  });

  console.log(config)

  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        
        {/* BLOC 1 : CONFIG (40%) */}
        {/* ConfigPanel doit avoir className="config-panel" à sa racine */}
        <ConfigPanel
          config={config}
          setConfig={setConfig}
          setShowModal={setShowModal}
        />

        {/* BLOC 2 : VISUALIZER (40%) */}
        <div className="visualizer-container">
           <Visualizer config={config} />
        </div>

      </main>
      
      <Modal3D
        config={config}
        showModal={showModal}
        setShowModal={setShowModal}
      />
    </div>
  );
};

export default Main;