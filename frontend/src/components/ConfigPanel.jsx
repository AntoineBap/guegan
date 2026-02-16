import React, { useEffect, useMemo, useContext, useState, useRef } from "react";
import ConfigResume from "./ConfigResume";
import { AuthContext } from "../contexts/AuthContext";
import { SettingsContext } from "../contexts/SettingsContext";
import "../styles/configurator.scss"; // ou configurator.scss selon votre structure

const ConfigPanel = ({ config, setConfig, setShowModal, onReset }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);

  const inputsRef = useRef({});
  const [alerts, setAlerts] = useState({});
  const [scrollToSinkId, setScrollToSinkId] = useState(null);

  const DRAINER_WIDTH_MM = 350;
  const MIN_GAP_BETWEEN_SINKS = 40;
  const MARGIN_PLAN_EDGE = 100;
  const SINK_DEFAULT_SIZE = 400;

  const maxPlanLength = settings.constraints.maxLength || 3600;
  const maxPlanDepth = settings.constraints.maxDepth || 700;

  const SINK_SPECS = useMemo(
    () => ({
      "Aucune cuve": { l: 0, w: 0, d: 0, price: 0 },
      "Cuve Labo 400x400x300": {
        l: 400,
        w: 400,
        d: 300,
        price: settings.sinkPrices["Cuve Labo 400x400x300"],
      },
      "Cuve Détente 400x400x200": {
        l: 400,
        w: 400,
        d: 200,
        price: settings.sinkPrices["Cuve Détente 400x400x200"],
      },
      "Cuve Cuisine 500x400x180": {
        l: 500,
        w: 400,
        d: 180,
        price: settings.sinkPrices["Cuve Cuisine 500x400x180"],
      },
      "Cuve Sanitaire 422x336x139": {
        l: 422,
        w: 336,
        d: 139,
        price: settings.sinkPrices["Cuve Sanitaire 422x336x139"],
      },
    }),
    [settings.sinkPrices],
  );

  const formatOptionPrice = (price) => {
    if (price === 0) return "";
    if (isAuthenticated) return `(+${price}€)`;
    return "(+ **€)";
  };

  // --- MODIFICATION ICI : GESTION CLAVIER (Entrée + Caractères invalides) ---
  const handleInputKeyDown = (e) => {
    // 1. Bloquer les caractères non numériques
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
    // 2. Si touche Entrée, on retire le focus (ferme le clavier mobile)
    if (e.key === "Enter") {
      e.target.blur();
    }
  };

  // --- NOUVELLE FONCTION POUR BLOQUER LE SCROLL SUR INPUT ---
  const handleWheel = (e) => {
    // Enlève le focus de l'input quand on scroll, ce qui empêche la modification de la valeur
    // et permet à la page de scroller normalement.
    e.target.blur();
  };

  const notifyCorrection = (fieldName, newValue) => {
    setAlerts((prev) => ({
      ...prev,
      [fieldName]: `Ancienne Valeur impossible, ajustée à ${newValue}`,
    }));

    setTimeout(() => {
      if (inputsRef.current[fieldName]) {
        inputsRef.current[fieldName].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  };

  const scrollToFirstError = () => {
    const firstKey = Object.keys(alerts)[0];
    if (firstKey && inputsRef.current[firstKey]) {
      inputsRef.current[firstKey].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      inputsRef.current[firstKey].focus();
    }
  };

  const clearAlert = (fieldName) => {
    if (alerts[fieldName]) {
      setAlerts((prev) => {
        const newState = { ...prev };
        delete newState[fieldName];
        return newState;
      });
    }
  };

  useEffect(() => {
    if (scrollToSinkId) {
      const refKey = `sink-section-${scrollToSinkId}`;
      if (inputsRef.current[refKey]) {
        inputsRef.current[refKey].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        setScrollToSinkId(null);
      }
    }
  }, [config.sinks, scrollToSinkId]);

  useEffect(() => {
    if (!config.aprons || !config.apronFront) {
      setConfig((prev) => ({
        ...prev,
        aprons: true,
        apronFront: true,
        apronHeight: prev.apronHeight !== undefined ? prev.apronHeight : 40,
      }));
    }
    if (config.rims && config.rimHeigh === undefined) {
      setConfig((prev) => ({ ...prev, rimHeigh: 100 }));
    }
    if (!config.sinks) {
      const firstId = Date.now();
      setConfig((prev) => ({
        ...prev,
        anchorId: firstId,
        sinks: [
          {
            id: firstId,
            type: prev.sink || "Aucune cuve",
            position: prev.position || "center",
            offset: prev.sinkOffset || 100,
            hasTapHole: prev.hasTapHole || false,
            tapHolePosition: prev.tapHole || "none",
            tapHoleOffset: prev.tapHoleOffset || 50,
            hasDrainer: prev.hasDrainer || false,
            drainerPosition: prev.drainerPosition || "right",
          },
        ],
      }));
    } else if (!config.anchorId && config.sinks.length > 0) {
      setConfig((prev) => ({ ...prev, anchorId: prev.sinks[0].id }));
    }
  }, [
    config.sinks,
    config.aprons,
    config.apronFront,
    config.rims,
    config.anchorId,
    setConfig,
  ]);

  const currentSinks = config.sinks || [];
  const hasAtLeastOneSink = currentSinks.some((s) => s.type !== "Aucune cuve");

  const layoutDimensions = useMemo(() => {
    const items = currentSinks.map((s) => ({
      ...s,
      width: SINK_SPECS[s.type]?.l || 0,
    }));
    if (items.length === 0 || items[0].type === "Aucune cuve")
      return { leftWidth: 0, rightWidth: 0, totalWidth: 0 };
    const anchorIndex = currentSinks.findIndex((s) => s.id === config.anchorId);
    const effectiveAnchorIndex = anchorIndex === -1 ? 0 : anchorIndex;
    const positions = new Array(items.length).fill(null);
    const anchorItem = items[effectiveAnchorIndex];
    let lbAnchor = -anchorItem.width / 2;
    let rbAnchor = anchorItem.width / 2;
    if (anchorItem.hasDrainer && anchorItem.drainerPosition === "left")
      lbAnchor -= DRAINER_WIDTH_MM;
    if (anchorItem.hasDrainer && anchorItem.drainerPosition === "right")
      rbAnchor += DRAINER_WIDTH_MM;
    positions[effectiveAnchorIndex] = {
      centerX: 0,
      lb: lbAnchor,
      rb: rbAnchor,
    };

    for (let i = effectiveAnchorIndex + 1; i < items.length; i++) {
      const prev =
        i === effectiveAnchorIndex + 1
          ? positions[effectiveAnchorIndex]
          : positions[i - 1];
      const prevItem = items[i - 1];
      const currItem = items[i];

      const safeOffset =
        currItem.offset !== "" &&
        currItem.offset !== null &&
        !isNaN(parseFloat(currItem.offset))
          ? parseFloat(currItem.offset)
          : MIN_GAP_BETWEEN_SINKS;
      const structuralGap = safeOffset;
      const dist = prevItem.width / 2 + structuralGap + currItem.width / 2;
      const x = prev.centerX + dist;
      let lb = x - currItem.width / 2;
      let rb = x + currItem.width / 2;
      if (currItem.hasDrainer && currItem.drainerPosition === "left")
        lb -= DRAINER_WIDTH_MM;
      if (currItem.hasDrainer && currItem.drainerPosition === "right")
        rb += DRAINER_WIDTH_MM;
      positions[i] = { centerX: x, lb, rb };
    }
    for (let i = effectiveAnchorIndex - 1; i >= 0; i--) {
      const nextPos = positions[i + 1];
      const nextItem = items[i + 1];
      const currItem = items[i];
      const safeOffset =
        currItem.offset !== "" &&
        currItem.offset !== null &&
        !isNaN(parseFloat(currItem.offset))
          ? parseFloat(currItem.offset)
          : MIN_GAP_BETWEEN_SINKS;
      const structuralGap = safeOffset;

      const dist = currItem.width / 2 + structuralGap + nextItem.width / 2;
      const x = nextPos.centerX - dist;
      let lb = x - currItem.width / 2;
      let rb = x + currItem.width / 2;
      if (currItem.hasDrainer && currItem.drainerPosition === "left")
        lb -= DRAINER_WIDTH_MM;
      if (currItem.hasDrainer && currItem.drainerPosition === "right")
        rb += DRAINER_WIDTH_MM;
      positions[i] = { centerX: x, lb, rb };
    }
    const minX = Math.min(...positions.map((p) => p.lb));
    const maxX = Math.max(...positions.map((p) => p.rb));
    return {
      leftWidth: Math.abs(minX),
      rightWidth: maxX,
      totalWidth: Math.abs(minX) + maxX,
      positionsRelative: positions,
    };
  }, [currentSinks, config.anchorId, SINK_SPECS]);

  const layout = useMemo(() => {
    const { positionsRelative } = layoutDimensions;
    if (!positionsRelative) return { items: [], groupMinX: 0, groupMaxX: 0 };
    const planHalfL = config.length / 2;
    const anchorIndex = currentSinks.findIndex((s) => s.id === config.anchorId);
    const anchorItem = currentSinks[anchorIndex !== -1 ? anchorIndex : 0];
    let anchorAbsX = 0;
    if (anchorItem && anchorItem.type !== "Aucune cuve") {
      const w = SINK_SPECS[anchorItem.type]?.l || 0;
      const safeOffset =
        anchorItem.offset !== "" &&
        anchorItem.offset !== null &&
        !isNaN(parseFloat(anchorItem.offset))
          ? parseFloat(anchorItem.offset)
          : 100;
      if (anchorItem.position === "center") anchorAbsX = 0;
      else if (anchorItem.position === "left")
        anchorAbsX = -planHalfL + safeOffset + w / 2;
      else if (anchorItem.position === "right")
        anchorAbsX = planHalfL - safeOffset + w / 2;
    }
    const items = positionsRelative.map((pos, idx) => ({
      ...currentSinks[idx],
      width: SINK_SPECS[currentSinks[idx].type]?.l || 0,
      centerX: pos.centerX + anchorAbsX,
      leftBound: pos.lb + anchorAbsX,
      rightBound: pos.rb + anchorAbsX,
    }));
    return {
      items,
      groupMinX: items.length > 0 ? items[0].leftBound : 0,
      groupMaxX: items.length > 0 ? items[items.length - 1].rightBound : 0,
    };
  }, [
    currentSinks,
    config.length,
    layoutDimensions,
    config.anchorId,
    SINK_SPECS,
  ]);

  const planHalfLength = config.length / 2;
  const absLimitLeft = -planHalfLength + MARGIN_PLAN_EDGE;
  const absLimitRight = planHalfLength - MARGIN_PLAN_EDGE;
  const spaceAvailableLeft = layout.groupMinX - absLimitLeft;
  const spaceAvailableRight = absLimitRight - layout.groupMaxX;
  const SPACE_REQ_NEW = SINK_DEFAULT_SIZE + MIN_GAP_BETWEEN_SINKS;
  const canAddSinkLeft = spaceAvailableLeft >= SPACE_REQ_NEW;
  const canAddSinkRight = spaceAvailableRight >= SPACE_REQ_NEW;

  const { minPlanLength, minPlanDepth } = useMemo(() => {
    const mechanicalMinLen = layoutDimensions.totalWidth + MARGIN_PLAN_EDGE * 2;
    const anchorIndex = currentSinks.findIndex((s) => s.id === config.anchorId);
    const anchorItem = currentSinks[anchorIndex !== -1 ? anchorIndex : 0];
    let situationalMinLen = mechanicalMinLen;
    if (anchorItem && anchorItem.type !== "Aucune cuve") {
      const safeOffset =
        anchorItem.offset !== "" &&
        anchorItem.offset !== null &&
        !isNaN(parseFloat(anchorItem.offset))
          ? parseFloat(anchorItem.offset)
          : MARGIN_PLAN_EDGE;
      if (anchorItem.position === "center") {
        const maxSideFromCenter = Math.max(
          layoutDimensions.leftWidth,
          layoutDimensions.rightWidth,
        );
        situationalMinLen = (maxSideFromCenter + MARGIN_PLAN_EDGE) * 2;
      } else if (anchorItem.position === "left") {
        situationalMinLen =
          safeOffset + layoutDimensions.rightWidth + MARGIN_PLAN_EDGE;
      } else if (anchorItem.position === "right") {
        situationalMinLen =
          safeOffset + layoutDimensions.leftWidth + MARGIN_PLAN_EDGE;
      }
    }
    const computedMinLen = Math.max(600, mechanicalMinLen, situationalMinLen);
    let maxW = 0;
    currentSinks.forEach((s) => {
      if (s.type !== "Aucune cuve") {
        const spec = SINK_SPECS[s.type];
        if (spec.w > maxW) maxW = spec.w;
      }
    });
    return {
      minPlanLength: computedMinLen,
      minPlanDepth: Math.max(400, maxW + 160),
    };
  }, [currentSinks, layoutDimensions, config.anchorId, SINK_SPECS]);

  const handleGlobalChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "rims" && checked) {
      setConfig((prev) => ({ ...prev, rims: true, rimHeigh: 100 }));
      return;
    }
    setConfig((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? value === ""
              ? ""
              : parseFloat(value)
            : value,
    }));
  };

  const handleBlur = (e) => {
    const { name, value, min, max } = e.target;
    let val = parseFloat(value);

    const minVal = min ? parseFloat(min) : 0;
    const maxVal = max ? parseFloat(max) : Infinity;

    if (isNaN(val) || value === "") {
      val = minVal;
      notifyCorrection(name, val);
    } else {
      if (val < minVal) {
        val = minVal;
        notifyCorrection(name, val);
      } else if (val > maxVal) {
        val = maxVal;
        notifyCorrection(name, val);
      }
    }

    const updatedConfig = { ...config, [name]: val };
    let finalConfig = { ...updatedConfig };
    let hasChanges = false;

    if (name === "length") {
      const anchorIndex = finalConfig.sinks.findIndex(
        (s) => s.id === finalConfig.anchorId,
      );
      if (anchorIndex !== -1) {
        const anchorSink = finalConfig.sinks[anchorIndex];
        if (
          anchorSink.type !== "Aucune cuve" &&
          (anchorSink.position === "left" || anchorSink.position === "right")
        ) {
          const sinkSpec = SINK_SPECS[anchorSink.type];
          const halfW = (sinkSpec ? sinkSpec.l : 0) / 2;
          const { leftWidth, rightWidth } = layoutDimensions;

          let maxOffset = 0;
          let minOffset = 0;

          if (anchorSink.position === "left") {
            minOffset = MARGIN_PLAN_EDGE + (leftWidth - halfW);
            maxOffset = Math.min(
              val - MARGIN_PLAN_EDGE - rightWidth - halfW,
              val / 2 - halfW,
            );
          } else {
            minOffset = MARGIN_PLAN_EDGE + (rightWidth - halfW);
            maxOffset = Math.min(
              val - MARGIN_PLAN_EDGE - leftWidth - halfW,
              val / 2 - halfW,
            );
          }

          if (maxOffset < minOffset) maxOffset = minOffset;

          const currentOffset = parseFloat(anchorSink.offset);
          const targetMax = Math.floor(maxOffset);
          const targetMin = Math.ceil(minOffset);

          if (!isNaN(currentOffset) && anchorSink.offset !== "") {
            if (currentOffset > targetMax) {
              finalConfig.sinks = finalConfig.sinks.map((s, idx) =>
                idx === anchorIndex ? { ...s, offset: targetMax } : s,
              );
              notifyCorrection(`sink-offset-${anchorSink.id}`, targetMax);
              hasChanges = true;
            } else if (currentOffset < targetMin) {
              finalConfig.sinks = finalConfig.sinks.map((s, idx) =>
                idx === anchorIndex ? { ...s, offset: targetMin } : s,
              );
              notifyCorrection(`sink-offset-${anchorSink.id}`, targetMin);
              hasChanges = true;
            }
          }
        }
      }
    }

    setConfig(finalConfig);
  };

  const updateSink = (id, field, value) => {
    setConfig((prev) => ({
      ...prev,
      sinks: prev.sinks.map((s) =>
        s.id === id ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const handlePositionChange = (sinkId, newPosition, sinkSpecWidth) => {
    const { leftWidth, rightWidth } = layoutDimensions;
    const halfW = sinkSpecWidth / 2;
    let newOffset = 100;
    if (newPosition === "left")
      newOffset = MARGIN_PLAN_EDGE + (leftWidth - halfW);
    else if (newPosition === "right")
      newOffset = MARGIN_PLAN_EDGE + (rightWidth - halfW);
    else newOffset = 100;
    if (isNaN(newOffset)) newOffset = 100;
    setConfig((prev) => ({
      ...prev,
      sinks: prev.sinks.map((s) =>
        s.id === sinkId
          ? { ...s, position: newPosition, offset: Math.ceil(newOffset) }
          : s,
      ),
    }));
  };

  const handleDrainerCheck = (id, isChecked, index) => {
    if (!isChecked) {
      updateSink(id, "hasDrainer", false);
      return;
    }
    const myPos = layout.items[index];
    if (!myPos) return;
    const obstacleL =
      index === 0
        ? absLimitLeft
        : (layout.items[index - 1]?.rightBound ?? absLimitLeft);
    const distL = myPos.leftBound - obstacleL;
    const canL = distL >= DRAINER_WIDTH_MM - 10;

    const obstacleR =
      index === currentSinks.length - 1
        ? absLimitRight
        : (layout.items[index + 1]?.leftBound ?? absLimitRight);
    const distR = obstacleR - myPos.rightBound;
    const canR = distR >= DRAINER_WIDTH_MM - 10;

    let chosenPos = "right";

    if (canL && canR) chosenPos = "left";
    else if (canL) chosenPos = "left";
    else if (canR) chosenPos = "right";
    else {
      alert(
        "Pas assez de place (350mm requis) à gauche ou à droite de cette cuve.",
      );
      return;
    }

    // Logique pour ajuster l'offset si l'égouttoir se met dans l'interstice
    setConfig((prev) => {
      const anchorIndex = prev.sinks.findIndex((s) => s.id === prev.anchorId);
      let newSinks = prev.sinks.map((s, i) => {
        if (s.id !== id) return s;
        return { ...s, hasDrainer: true, drainerPosition: chosenPos };
      });

      // Vérification si on doit augmenter l'offset
      if (index > anchorIndex) {
        // Côté Droit de l'ancre. L'interstice est à gauche de l'élément courant (offset du courant).
        if (chosenPos === "left") {
          // Egouttoir vers l'intérieur
          const currentOffset = newSinks[index].offset;
          if (currentOffset < MIN_GAP_BETWEEN_SINKS + DRAINER_WIDTH_MM) {
            newSinks[index] = {
              ...newSinks[index],
              offset: MIN_GAP_BETWEEN_SINKS + DRAINER_WIDTH_MM,
            };
          }
        }
      } else if (index < anchorIndex) {
        // Côté Gauche de l'ancre. L'interstice est à droite de l'élément courant (offset du courant).
        if (chosenPos === "right") {
          // Egouttoir vers l'intérieur
          const currentOffset = newSinks[index].offset;
          if (currentOffset < MIN_GAP_BETWEEN_SINKS + DRAINER_WIDTH_MM) {
            newSinks[index] = {
              ...newSinks[index],
              offset: MIN_GAP_BETWEEN_SINKS + DRAINER_WIDTH_MM,
            };
          }
        }
      }

      return { ...prev, sinks: newSinks };
    });
  };

  const setDrainerPositionManual = (id, pos, index) => {
    setConfig((prev) => {
      const anchorIndex = prev.sinks.findIndex((s) => s.id === prev.anchorId);
      let newSinks = prev.sinks.map((s) =>
        s.id === id ? { ...s, drainerPosition: pos } : s,
      );

      if (index > anchorIndex) {
        // Côté Droit
        if (pos === "left") {
          const currentOffset = newSinks[index].offset;
          if (currentOffset < MIN_GAP_BETWEEN_SINKS + DRAINER_WIDTH_MM) {
            newSinks[index] = {
              ...newSinks[index],
              offset: MIN_GAP_BETWEEN_SINKS + DRAINER_WIDTH_MM,
            };
          }
        }
      } else if (index < anchorIndex) {
        // Côté Gauche
        if (pos === "right") {
          const currentOffset = newSinks[index].offset;
          if (currentOffset < MIN_GAP_BETWEEN_SINKS + DRAINER_WIDTH_MM) {
            newSinks[index] = {
              ...newSinks[index],
              offset: MIN_GAP_BETWEEN_SINKS + DRAINER_WIDTH_MM,
            };
          }
        }
      }
      return { ...prev, sinks: newSinks };
    });
  };

  const handleSinkTypeSelect = (id, typeName) => {
    const specs = SINK_SPECS[typeName];

    if (id === currentSinks[0].id) {
      const requiredMinDepth = typeName === "Aucune cuve" ? 400 : specs.w + 160;

      if (config.width < requiredMinDepth) {
        notifyCorrection("width", requiredMinDepth);
        setConfig((prev) => ({ ...prev, width: requiredMinDepth }));
      }
    }

    updateSink(id, "type", typeName);
    if (typeName === "Aucune cuve") {
      setConfig((prev) => ({
        ...prev,
        sinks: prev.sinks.map((s) =>
          s.id === id
            ? { ...s, type: typeName, hasTapHole: false, hasDrainer: false }
            : s,
        ),
      }));
    }
  };

  useEffect(() => {
    let changed = false;
    let newConfig = { ...config };

    if (newConfig.length !== "" && newConfig.length < minPlanLength) {
      notifyCorrection("length", minPlanLength);
      newConfig.length = minPlanLength;
      changed = true;
    }

    if (newConfig.width !== "" && newConfig.width < minPlanDepth) {
      notifyCorrection("width", minPlanDepth);
      newConfig.width = minPlanDepth;
      changed = true;
    }

    if (changed) {
      setConfig(newConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPlanLength, minPlanDepth]);

  const addNewSink = (side) => {
    const newId = Date.now();
    const newSink = {
      id: newId,
      type: "Cuve Labo 400x400x300",
      hasTapHole: false,
      tapHolePosition: "Centre",
      tapHoleOffset: 0,
      hasDrainer: false,
      drainerPosition: "right",
      offset: MIN_GAP_BETWEEN_SINKS,
    };

    setConfig((prev) => {
      let newSinks = [...prev.sinks];
      if (side === "left") newSinks = [newSink, ...newSinks];
      else newSinks = [...newSinks, newSink];
      return { ...prev, sinks: newSinks };
    });

    setScrollToSinkId(newId);
  };

  const removeSink = (id) => {
    setConfig((prev) => {
      const newSinks = prev.sinks.filter((s) => s.id !== id);
      let newAnchorId = prev.anchorId;
      if (id === prev.anchorId) {
        if (newSinks.length > 0) {
          newAnchorId = newSinks[0].id;
          newSinks[0] = { ...newSinks[0], position: "center", offset: 100 };
        } else {
          const newId = Date.now();
          newSinks.push({
            id: newId,
            type: "Aucune cuve",
            position: "center",
            offset: 100,
          });
          newAnchorId = newId;
        }
      }
      return { ...prev, sinks: newSinks, anchorId: newAnchorId };
    });
  };
  const toggleRimSide = (side) =>
    setConfig((prev) => ({ ...prev, [side]: !prev[side] }));
  const toggleApronSide = (side) =>
    setConfig((prev) => ({ ...prev, [side]: !prev[side] }));
  const isRimDisabled = (side) => {
    if (side === "rimLeft") return config.apronLeft;
    if (side === "rimRight") return config.apronRight;
    if (side === "rimBack") return config.apronBack;
    return false;
  };
  const isApronDisabled = (side) => {
    if (side === "apronLeft") return config.rimLeft;
    if (side === "apronRight") return config.rimRight;
    if (side === "apronBack") return config.rimBack;
    return false;
  };

  const handleResetClick = () => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler la configuration ?")) {
      onReset();
    }
  };

  return (
    <div className="config-panel">
      <h1>
        Votre Plan-Vasque <span className="gold-text">Sur Mesure</span>
      </h1>

      <button
        onClick={handleResetClick}
        style={{
          display: "block",
          marginBottom: "20px",
          background: "rgba(231, 76, 60, 0.1)",
          border: "3px solid #e74c3c",
          color: "#e74c3c",
          textDecoration: "none",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: "0.9rem",
          padding: "10px 10px",
          borderRadius: "5px",
          transition: "background 0.3s ease",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(231, 76, 60, 0.25)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(231, 76, 60, 0.1)")
        }
      >
        Réinitialiser la configuration
      </button>

      <div className="form-group section-box">
        <label className="section-title">Dimensions du Plan</label>
        <div className="inputs-row">
          <div className="input-wrapper">
            <div className="limit-label">
              Min: {minPlanLength} / Max: {maxPlanLength}
            </div>
            <span>Largeur (mm)</span>
            <input
              type="number"
              name="length"
              ref={(el) => (inputsRef.current["length"] = el)}
              className={alerts["length"] ? "has-alert" : ""}
              value={config.length === "" ? "" : config.length}
              onChange={handleGlobalChange}
              onFocus={() => clearAlert("length")}
              onBlur={handleBlur}
              onKeyDown={handleInputKeyDown} // <-- ICI
              onWheel={handleWheel}
              min={minPlanLength}
              max={maxPlanLength}
              step="10"
            />
            {alerts["length"] && (
              <div className="alert-message">{alerts["length"]}</div>
            )}
          </div>
          <div className="input-wrapper">
            <div className="limit-label">
              Min: {minPlanDepth} / Max: {maxPlanDepth}
            </div>
            <span>Profondeur (mm)</span>
            <input
              type="number"
              name="width"
              ref={(el) => (inputsRef.current["width"] = el)}
              className={alerts["width"] ? "has-alert" : ""}
              value={config.width === "" ? "" : config.width}
              onChange={handleGlobalChange}
              onFocus={() => clearAlert("width")}
              onBlur={handleBlur}
              onKeyDown={handleInputKeyDown} // <-- ICI
              onWheel={handleWheel}
              min={minPlanDepth}
              max={maxPlanDepth}
              step="10"
            />
            {alerts["width"] && (
              <div className="alert-message">{alerts["width"]}</div>
            )}
          </div>
        </div>
      </div>

      {currentSinks.map((sink, index) => {
        const isAnchor = sink.id === config.anchorId;
        const isNoSink = sink.type === "Aucune cuve";
        const isMulti = currentSinks.length > 1;
        const currentPos = layout.items[index];

        const currentSinkOffset =
          sink.offset !== undefined && sink.offset !== null
            ? sink.offset
            : isAnchor
              ? 100
              : MIN_GAP_BETWEEN_SINKS;

        const sinkSpec = SINK_SPECS[sink.type] || { l: 0 };
        const sinkWidth = sinkSpec.l;
        const maxTapOffset = Math.floor(sinkWidth / 2 - 17);

        let minOffset = 0;
        let maxOffset = 0;
        let canCenter = true;
        let canAnchorLeft = true;
        let canAnchorRight = true;

        const obstacleL =
          index === 0
            ? absLimitLeft
            : (layout.items[index - 1]?.rightBound ?? absLimitLeft);
        const obstacleR =
          index === currentSinks.length - 1
            ? absLimitRight
            : (layout.items[index + 1]?.leftBound ?? absLimitRight);

        let effectiveLeftBound = currentPos ? currentPos.leftBound : 0;
        let effectiveRightBound = currentPos ? currentPos.rightBound : 0;

        if (currentPos && sink.hasDrainer) {
          if (sink.drainerPosition === "left") {
            effectiveLeftBound += DRAINER_WIDTH_MM;
          } else if (sink.drainerPosition === "right") {
            effectiveRightBound -= DRAINER_WIDTH_MM;
          }
        }

        const distL = effectiveLeftBound - obstacleL;
        const canL = distL >= DRAINER_WIDTH_MM - 10;

        const distR = obstacleR - effectiveRightBound;
        const canR = distR >= DRAINER_WIDTH_MM - 10;

        if (isAnchor) {
          const { leftWidth, rightWidth } = layoutDimensions;
          const halfL = config.length / 2;
          const maxWing = Math.max(leftWidth, rightWidth);
          canCenter = maxWing + MARGIN_PLAN_EDGE <= halfL;
          canAnchorLeft = MARGIN_PLAN_EDGE + leftWidth <= halfL;
          canAnchorRight =
            config.length - MARGIN_PLAN_EDGE - rightWidth >= halfL;
          const halfW = sinkWidth / 2;
          if (sink.position === "left") {
            minOffset = MARGIN_PLAN_EDGE + (leftWidth - halfW);
            maxOffset = Math.min(
              config.length - MARGIN_PLAN_EDGE - rightWidth - halfW,
              config.length / 2 - halfW,
            );
          } else if (sink.position === "right") {
            minOffset = MARGIN_PLAN_EDGE + (rightWidth - halfW);
            maxOffset = Math.min(
              config.length - MARGIN_PLAN_EDGE - leftWidth - halfW,
              config.length / 2 - halfW,
            );
          } else {
            maxOffset = config.length / 2 - halfW;
          }
          if (isNaN(minOffset)) minOffset = 0;
          if (isNaN(maxOffset)) maxOffset = 0;
          if (maxOffset < minOffset) maxOffset = minOffset;
        } else {
          minOffset = MIN_GAP_BETWEEN_SINKS;

          const anchorIndex = currentSinks.findIndex(
            (s) => s.id === config.anchorId,
          );
          if (index > anchorIndex) {
            const prevSink = currentSinks[index - 1];
            const me = currentSinks[index];
            if (
              (prevSink.hasDrainer && prevSink.drainerPosition === "right") ||
              (me.hasDrainer && me.drainerPosition === "left")
            ) {
              minOffset = MIN_GAP_BETWEEN_SINKS + DRAINER_WIDTH_MM;
            }
          } else if (index < anchorIndex) {
            const nextSink = currentSinks[index + 1];
            const me = currentSinks[index];
            if (
              (nextSink.hasDrainer && nextSink.drainerPosition === "left") ||
              (me.hasDrainer && me.drainerPosition === "right")
            ) {
              minOffset = MIN_GAP_BETWEEN_SINKS + DRAINER_WIDTH_MM;
            }
          }

          const globalSlackRight = absLimitRight - layout.groupMaxX;
          const globalSlackLeft = layout.groupMinX - absLimitLeft;
          if (index > anchorIndex)
            maxOffset = currentSinkOffset + globalSlackRight;
          else maxOffset = currentSinkOffset + globalSlackLeft;
          if (isNaN(maxOffset)) maxOffset = 0;
        }

        return (
          <div
            key={sink.id}
            ref={(el) => (inputsRef.current[`sink-section-${sink.id}`] = el)}
            className="form-group section-box"
            style={{
              borderLeft: isAnchor ? "4px solid #d4af37" : "4px solid #ccc",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label className="section-title">
                {isMulti ? `Cuve #${index + 1}` : "Choix de la cuve"}
                {isAnchor && isMulti && (
                  <span
                    style={{
                      fontSize: "0.7em",
                      color: "#d4af37",
                      marginLeft: "5px",
                    }}
                  >
                    (Ancre)
                  </span>
                )}
              </label>
              {isMulti && !isAnchor && (
                <button
                  onClick={() => removeSink(sink.id)}
                  style={{
                    fontSize: "0.8rem",
                    color: "red",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  Supprimer 🗑️
                </button>
              )}
            </div>
            <div className="sink-options-list">
              {Object.keys(SINK_SPECS).map((opt) => (
                <button
                  key={opt}
                  className={sink.type === opt ? "active-small" : ""}
                  onClick={() => handleSinkTypeSelect(sink.id, opt)}
                  style={
                    !isAuthenticated && sink.type !== opt
                      ? { color: "#666" }
                      : {}
                  }
                >
                  {opt === "Aucune cuve"
                    ? "Aucune"
                    : `${opt.replace("Cuve ", "")} ${formatOptionPrice(SINK_SPECS[opt].price)}`}
                </button>
              ))}
            </div>

            {!isNoSink && (
              <>
                <div
                  style={{ margin: "20px 0", borderTop: "1px solid #e0e0e0" }}
                ></div>
                {isAnchor ? (
                  <>
                    <label className="section-title">
                      Positionnement (Ancrage)
                    </label>
                    <div
                      className="inputs-row"
                      style={{ alignItems: "flex-end" }}
                    >
                      <div
                        className="drilling-options"
                        style={{ marginRight: "15px", marginBottom: "5px" }}
                      >
                        <button
                          className={
                            sink.position === "left" ? "active-small" : ""
                          }
                          onClick={() =>
                            canAnchorLeft &&
                            handlePositionChange(sink.id, "left", sinkWidth)
                          }
                          disabled={!canAnchorLeft}
                          style={
                            !canAnchorLeft
                              ? { opacity: 0.5, cursor: "not-allowed" }
                              : {}
                          }
                        >
                          Gauche
                        </button>
                        <button
                          className={
                            sink.position === "center" ? "active-small" : ""
                          }
                          onClick={() =>
                            canCenter &&
                            handlePositionChange(sink.id, "center", sinkWidth)
                          }
                          disabled={!canCenter}
                          style={
                            !canCenter
                              ? { opacity: 0.5, cursor: "not-allowed" }
                              : {}
                          }
                        >
                          Centré
                        </button>
                        <button
                          className={
                            sink.position === "right" ? "active-small" : ""
                          }
                          onClick={() =>
                            canAnchorRight &&
                            handlePositionChange(sink.id, "right", sinkWidth)
                          }
                          disabled={!canAnchorRight}
                          style={
                            !canAnchorRight
                              ? { opacity: 0.5, cursor: "not-allowed" }
                              : {}
                          }
                        >
                          Droite
                        </button>
                      </div>
                      {sink.position !== "center" && (
                        <div
                          className="input-wrapper"
                          style={{ flex: 1, marginLeft: "15px" }}
                        >
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "#666",
                              marginBottom: "4px",
                            }}
                          >
                            Décalage Bord (min: {Math.ceil(minOffset)})
                          </span>
                          <input
                            type="number"
                            ref={(el) =>
                              (inputsRef.current[`sink-offset-${sink.id}`] = el)
                            }
                            className={
                              alerts[`sink-offset-${sink.id}`]
                                ? "has-alert"
                                : ""
                            }
                            value={sink.offset === "" ? "" : sink.offset}
                            onChange={(e) => {
                              let val =
                                e.target.value === ""
                                  ? ""
                                  : parseFloat(e.target.value);
                              if (val !== "" && val > maxOffset) {
                                val = Math.floor(maxOffset);
                              }
                              updateSink(sink.id, "offset", val);
                            }}
                            onFocus={() => clearAlert(`sink-offset-${sink.id}`)}
                            onBlur={() => {
                              let val = parseFloat(sink.offset);
                              const minV = Math.ceil(minOffset);
                              const maxV = Math.floor(maxOffset);
                              const refKey = `sink-offset-${sink.id}`;

                              if (isNaN(val) || sink.offset === "") {
                                val = minV;
                                notifyCorrection(refKey, val);
                              } else if (val < minV) {
                                val = minV;
                                notifyCorrection(refKey, val);
                              } else if (val > maxV) {
                                val = maxV;
                                notifyCorrection(refKey, val);
                              }
                              updateSink(sink.id, "offset", val);
                            }}
                            onKeyDown={handleInputKeyDown} // <-- ICI
                            onWheel={handleWheel}
                            min={Math.ceil(minOffset)}
                            max={Math.floor(maxOffset)}
                            step="10"
                          />
                          {alerts[`sink-offset-${sink.id}`] && (
                            <div className="alert-message">
                              {alerts[`sink-offset-${sink.id}`]}
                            </div>
                          )}
                          <span style={{ fontSize: "0.65rem", color: "#999" }}>
                            Max: {Math.floor(maxOffset)} (Centré)
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <label className="section-title">
                      Positionnement Relatif
                    </label>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        marginTop: "10px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.9rem",
                          color: "#333",
                          marginBottom: "5px",
                        }}
                      >
                        Espace total depuis cuve précédente
                      </span>
                      <div
                        className="input-wrapper"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <input
                          type="number"
                          style={{ width: "100px" }}
                          ref={(el) =>
                            (inputsRef.current[`sink-offset-${sink.id}`] = el)
                          }
                          className={
                            alerts[`sink-offset-${sink.id}`] ? "has-alert" : ""
                          }
                          value={
                            currentSinkOffset === "" ? "" : currentSinkOffset
                          }
                          onChange={(e) => {
                            let val =
                              e.target.value === ""
                                ? ""
                                : parseFloat(e.target.value);
                            if (val !== "" && val > maxOffset) {
                              val = Math.floor(maxOffset);
                            }
                            updateSink(sink.id, "offset", val);
                          }}
                          onFocus={() => clearAlert(`sink-offset-${sink.id}`)}
                          onBlur={() => {
                            let val = parseFloat(sink.offset);
                            const refKey = `sink-offset-${sink.id}`;
                            const minV = minOffset;
                            const maxV = maxOffset;

                            if (isNaN(val) || sink.offset === "") {
                              val = minV;
                              notifyCorrection(refKey, val);
                            } else if (val < minV) {
                              val = minV;
                              notifyCorrection(refKey, val);
                            } else if (val > maxV) {
                              val = maxV;
                              notifyCorrection(refKey, val);
                            }
                            updateSink(sink.id, "offset", val);
                          }}
                          onKeyDown={handleInputKeyDown} // <-- ICI
                          onWheel={handleWheel}
                          min={minOffset}
                          max={Math.floor(maxOffset)}
                          step="10"
                        />
                        {alerts[`sink-offset-${sink.id}`] && (
                          <div className="alert-message">
                            {alerts[`sink-offset-${sink.id}`]}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          color: "#999",
                          marginTop: "4px",
                        }}
                      >
                        Max possible: {Math.floor(maxOffset)} (Bloqué par la fin
                        du plan)
                      </span>
                    </div>
                  </>
                )}

                <div
                  style={{ margin: "20px 0", borderTop: "1px solid #e0e0e0" }}
                ></div>
                <div className="checkbox-group">
                  <label style={{ marginBottom: "15px", fontWeight: "bold" }}>
                    <input
                      type="checkbox"
                      checked={sink.hasTapHole}
                      onChange={(e) =>
                        updateSink(sink.id, "hasTapHole", e.target.checked)
                      }
                    />{" "}
                    Perçage robinetterie (Ø35mm){" "}
                    {formatOptionPrice(settings.prices.tapHole)}
                  </label>
                  {sink.hasTapHole && (
                    <div style={{ marginLeft: "25px" }}>
                      <div
                        className="drilling-options"
                        style={{ marginBottom: "15px" }}
                      >
                        {["Gauche", "Centre", "Droite"].map((opt) => (
                          <button
                            key={opt}
                            className={
                              sink.tapHolePosition === opt ? "active-small" : ""
                            }
                            onClick={() =>
                              updateSink(sink.id, "tapHolePosition", opt)
                            }
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      {(sink.tapHolePosition === "Gauche" ||
                        sink.tapHolePosition === "Droite") && (
                        <div
                          className="input-wrapper"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            marginBottom: "15px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "#333",
                              marginBottom: "4px",
                            }}
                          >
                            Décalage du centre (mm)
                          </span>
                          <input
                            type="number"
                            className={`small-input ${alerts[`sink-tap-${sink.id}`] ? "has-alert" : ""}`}
                            style={{ width: "100px" }}
                            ref={(el) =>
                              (inputsRef.current[`sink-tap-${sink.id}`] = el)
                            }
                            value={
                              sink.tapHoleOffset === "" ||
                              sink.tapHoleOffset === undefined
                                ? ""
                                : sink.tapHoleOffset
                            }
                            onChange={(e) => {
                              const val =
                                e.target.value === ""
                                  ? ""
                                  : parseFloat(e.target.value);
                              updateSink(sink.id, "tapHoleOffset", val);
                            }}
                            onFocus={() => clearAlert(`sink-tap-${sink.id}`)}
                            onBlur={() => {
                              let val = parseFloat(sink.tapHoleOffset);
                              const refKey = `sink-tap-${sink.id}`;
                              if (isNaN(val)) {
                                val = 0;
                                notifyCorrection(refKey, 0);
                              } else if (val < 0) {
                                val = 0;
                                notifyCorrection(refKey, 0);
                              } else if (val > maxTapOffset) {
                                val = maxTapOffset;
                                notifyCorrection(refKey, maxTapOffset);
                              }
                              updateSink(sink.id, "tapHoleOffset", val);
                            }}
                            onKeyDown={handleInputKeyDown} // <-- ICI
                            onWheel={handleWheel}
                            min="0"
                            max={maxTapOffset}
                            step="1"
                          />
                          {alerts[`sink-tap-${sink.id}`] && (
                            <div className="alert-message">
                              {alerts[`sink-tap-${sink.id}`]}
                            </div>
                          )}
                          <span style={{ fontSize: "0.7rem", color: "#666" }}>
                            Max: {maxTapOffset}mm
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div
                  style={{ margin: "20px 0", borderTop: "1px solid #e0e0e0" }}
                ></div>
                <div className="checkbox-group">
                  <label
                    style={{
                      marginBottom: "10px",
                      fontWeight: "bold",
                      opacity: !canL && !canR && !sink.hasDrainer ? 0.5 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={sink.hasDrainer}
                      onChange={(e) =>
                        handleDrainerCheck(sink.id, e.target.checked, index)
                      }
                      disabled={!sink.hasDrainer && !canL && !canR}
                    />
                    Rainurage Égouttoir{" "}
                    {formatOptionPrice(settings.prices.drainer)}
                  </label>
                  {!canL && !canR && !sink.hasDrainer && (
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#999",
                        marginLeft: "25px",
                      }}
                    >
                      Pas assez d'espace (min 350mm) à gauche ou à droite.
                    </div>
                  )}
                  {sink.hasDrainer && (
                    <div
                      className="fade-in drilling-options"
                      style={{ marginTop: "10px", marginLeft: "25px" }}
                    >
                      <button
                        className={
                          sink.drainerPosition === "left" ? "active-small" : ""
                        }
                        onClick={() =>
                          setDrainerPositionManual(sink.id, "left", index)
                        }
                        disabled={!canL && sink.drainerPosition !== "left"}
                        style={
                          !canL && sink.drainerPosition !== "left"
                            ? { opacity: 0.5, cursor: "not-allowed" }
                            : {}
                        }
                      >
                        À Gauche
                      </button>
                      <button
                        className={
                          sink.drainerPosition === "right" ? "active-small" : ""
                        }
                        onClick={() =>
                          setDrainerPositionManual(sink.id, "right", index)
                        }
                        disabled={!canR && sink.drainerPosition !== "right"}
                        style={
                          !canR && sink.drainerPosition !== "right"
                            ? { opacity: 0.5, cursor: "not-allowed" }
                            : {}
                        }
                      >
                        À Droite
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {hasAtLeastOneSink && (
        <div
          className="form-group"
          style={{ textAlign: "center", margin: "20px 0" }}
        >
          <span
            style={{
              display: "block",
              marginBottom: "10px",
              fontWeight: "bold",
            }}
          >
            Ajouter une cuve ?
          </span>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}
          >
            <button
              className="btn-secondary"
              onClick={() => addNewSink("left")}
              disabled={!canAddSinkLeft}
              style={
                !canAddSinkLeft ? { opacity: 0.5, cursor: "not-allowed" } : {}
              }
              title={!canAddSinkLeft ? "Pas assez de place à gauche" : ""}
            >
              + Ajouter à Gauche
            </button>
            <button
              className="btn-secondary"
              onClick={() => addNewSink("right")}
              disabled={!canAddSinkRight}
              style={
                !canAddSinkRight ? { opacity: 0.5, cursor: "not-allowed" } : {}
              }
              title={!canAddSinkRight ? "Pas assez de place à droite" : ""}
            >
              + Ajouter à Droite
            </button>
          </div>
        </div>
      )}

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            name="rims"
            checked={config.rims}
            onChange={handleGlobalChange}
          />{" "}
          Ajouter dosserets
        </label>
        {config.rims && (
          <div className="rims-options-container" style={{ marginTop: "10px" }}>
            <div className="input-wrapper" style={{ marginBottom: "5px" }}>
              <span
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontSize: "0.9rem",
                }}
              >
                Hauteur (mm)
              </span>
              <input
                type="number"
                className={`small-input ${alerts["rimHeigh"] ? "has-alert" : ""}`}
                name="rimHeigh"
                ref={(el) => (inputsRef.current["rimHeigh"] = el)}
                value={config.rimHeigh === "" ? "" : config.rimHeigh}
                onChange={handleGlobalChange}
                onFocus={() => clearAlert("rimHeigh")}
                onBlur={handleBlur}
                onKeyDown={handleInputKeyDown} // <-- ICI
                onWheel={handleWheel} // BLOQUE LE SCROLL
                min="100"
                max="550"
              />
              {alerts["rimHeigh"] && (
                <div className="alert-message">{alerts["rimHeigh"]}</div>
              )}
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "#666",
                  marginLeft: "10px",
                }}
              >
                (Min 100mm - Max 550mm)
              </span>
            </div>
            <div className="drilling-options">
              <button
                className={config.rimLeft ? "active-small" : ""}
                onClick={() =>
                  !isRimDisabled("rimLeft") && toggleRimSide("rimLeft")
                }
                disabled={isRimDisabled("rimLeft")}
                style={
                  isRimDisabled("rimLeft")
                    ? { opacity: 0.5, cursor: "not-allowed" }
                    : {}
                }
              >
                Gauche
              </button>
              <button
                className={config.rimBack ? "active-small" : ""}
                onClick={() =>
                  !isRimDisabled("rimBack") && toggleRimSide("rimBack")
                }
                disabled={isRimDisabled("rimBack")}
                style={
                  isRimDisabled("rimBack")
                    ? { opacity: 0.5, cursor: "not-allowed" }
                    : {}
                }
              >
                Arrière
              </button>
              <button
                className={config.rimRight ? "active-small" : ""}
                onClick={() =>
                  !isRimDisabled("rimRight") && toggleRimSide("rimRight")
                }
                disabled={isRimDisabled("rimRight")}
                style={
                  isRimDisabled("rimRight")
                    ? { opacity: 0.5, cursor: "not-allowed" }
                    : {}
                }
              >
                Droite
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            name="aprons"
            checked={true}
            disabled
            readOnly
          />{" "}
          Retombées (Obligatoire)
        </label>
        <div className="rims-options-container" style={{ marginTop: "10px" }}>
          <div className="input-wrapper" style={{ marginBottom: "5px" }}>
            <span
              style={{
                display: "block",
                marginBottom: "5px",
                fontSize: "0.9rem",
              }}
            >
              Hauteur (mm)
            </span>
            <input
              type="number"
              className={`small-input ${alerts["apronHeight"] ? "has-alert" : ""}`}
              name="apronHeight"
              ref={(el) => (inputsRef.current["apronHeight"] = el)}
              value={
                config.apronHeight === "" || config.apronHeight === undefined
                  ? ""
                  : config.apronHeight
              }
              onChange={handleGlobalChange}
              onFocus={() => clearAlert("apronHeight")}
              onBlur={handleBlur}
              onKeyDown={handleInputKeyDown} // <-- ICI
              onWheel={handleWheel} // BLOQUE LE SCROLL
              min="40"
              max="200"
            />
            {alerts["apronHeight"] && (
              <div className="alert-message">{alerts["apronHeight"]}</div>
            )}
            <span
              style={{ fontSize: "0.7rem", color: "#666", marginLeft: "10px" }}
            >
              (Min 40mm - Max 200mm)
            </span>
          </div>
          <div className="drilling-options">
            <button
              className={config.apronFront ? "active-small" : ""}
              disabled
            >
              Avant
            </button>
            <button
              className={config.apronLeft ? "active-small" : ""}
              onClick={() =>
                !isApronDisabled("apronLeft") && toggleApronSide("apronLeft")
              }
              disabled={isApronDisabled("apronLeft")}
              style={
                isApronDisabled("apronLeft")
                  ? { opacity: 0.5, cursor: "not-allowed" }
                  : {}
              }
            >
              Gauche
            </button>
            <button
              className={config.apronBack ? "active-small" : ""}
              onClick={() =>
                !isApronDisabled("apronBack") && toggleApronSide("apronBack")
              }
              disabled={isApronDisabled("apronBack")}
              style={
                isApronDisabled("apronBack")
                  ? { opacity: 0.5, cursor: "not-allowed" }
                  : {}
              }
            >
              Arrière
            </button>
            <button
              className={config.apronRight ? "active-small" : ""}
              onClick={() =>
                !isApronDisabled("apronRight") && toggleApronSide("apronRight")
              }
              disabled={isApronDisabled("apronRight")}
              style={
                isApronDisabled("apronRight")
                  ? { opacity: 0.5, cursor: "not-allowed" }
                  : {}
              }
            >
              Droite
            </button>
          </div>
        </div>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            name="splashback"
            checked={config.splashback}
            onChange={handleGlobalChange}
          />{" "}
          Anti-Goutte d'eau
        </label>
      </div>

      <div className="actions"></div>

      <ConfigResume
        config={config}
        onReset={onReset}
        sinkSpecs={SINK_SPECS}
        settings={settings}
        blockingErrors={Object.keys(alerts).length > 0}
        onScrollToError={scrollToFirstError}
      />
    </div>
  );
};

export default ConfigPanel;
