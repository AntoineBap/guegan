import React, { useState, Suspense } from 'react';

import '../styles/style.scss';
import ConfigPanel from '../components/ConfigPanel';
import Visualizer from '../components/Visualizer';
import Modal3D from '../components/Modal3D';
import Header from '../components/Header';


const Main = () => {
  const [showModal, setShowModal] = useState(false);
  const [config, setConfig] = useState({
    color: 'white',
    position: 'center', // left, right, center
    length: 120, // cm
    width: 50, 
    depth: 12, 
    sink_length: 12,
    sink_width: 12,
    tapHole: 'none', // none, left, right, bottom (center)
    splashback: false, // goutte d'eau
    splashbackHeight: 5,
    sideRims: false,
    sideRimHeight: 5,
    comments: ''
  });



  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        <ConfigPanel config={config} setConfig={setConfig} setShowModal={setShowModal}/> 
        <Visualizer config={config} />
      </main>
        <Modal3D config={config} showModal={showModal} setShowModal={setShowModal} />
    </div>
  );
};

export default Main;