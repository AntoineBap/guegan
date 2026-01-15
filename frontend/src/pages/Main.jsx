import React, { useState, Suspense } from "react";

import "../styles/style.scss";
import ConfigPanel from "../components/ConfigPanel";
import Visualizer from "../components/Visualizer";
import Modal3D from "../components/Modal3D";
import Header from "../components/Header";
import Carousel from "../components/Carousel";

const Main = () => {
  const [showModal, setShowModal] = useState(false);
  const [config, setConfig] = useState({
    color: "white",
    position: "center", // left, right, center
    length: 1200, // mm
    width: 500,
    depth: 300,
    tapHole: "none", // none, left, right, bottom (center)
    splashback: false, // goutte d'eau
    splashbackHeight: 5,
    rims: false,
    rimHeight: 5,
    comments: "",
  });

  const OPTIONS = { loop: true };
  const SLIDE_COUNT = 5;
  const SLIDES = Array.from(Array(SLIDE_COUNT).keys());

  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        <ConfigPanel
          config={config}
          setConfig={setConfig}
          setShowModal={setShowModal}
        />
        {/* <Visualizer config={config} /> */}
        {/* <Carousel slides={SLIDES} options={OPTIONS} /> */}
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
