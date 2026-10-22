import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CORNERS,
  CORNER_LABEL,
  SIDE_CORNERS,
  SIDE_LABEL,
  MIN_CORNER_RADIUS,
  getCorners,
  maxRadius,
  isSemicircle,
  semicircleRadii,
  clampCorners,
  outlinePoints,
} from "../utils/planShape";

// Disposition des cartes : comme le plan vu de dessus (arrière en haut)
const GRID = ["bl", "br", "fl", "fr"];

const PlanPreview = ({ length, width, corners, footprints, conflicts }) => {
  const pad = 14;
  const viewW = 320;
  const scale = (viewW - pad * 2) / length;
  const viewH = Math.max(80, width * scale + pad * 2);
  const pts = outlinePoints(length, width, corners, 32);
  const tx = (x) => pad + (x + length / 2) * scale;
  const tz = (z) => pad + (z + width / 2) * scale;
  const d = pts.map(([x, z], i) => `${i ? "L" : "M"}${tx(x).toFixed(1)} ${tz(z).toFixed(1)}`).join(" ") + " Z";
  const bad = new Set(conflicts.map((c) => c.index));

  return (
    <svg className="plan-preview" viewBox={`0 0 ${viewW} ${viewH}`} role="img" aria-label="Aperçu du plan vu de dessus">
      <text x={viewW / 2} y={10} textAnchor="middle" className="label">mur / arrière</text>
      <path d={d} className="outline" />
      {footprints.map((f, i) => (
        <rect
          key={i}
          x={tx(f.x - f.w / 2)}
          y={tz(f.z - f.h / 2)}
          width={f.w * scale}
          height={f.h * scale}
          rx={3}
          className={bad.has(i) ? "sink is-bad" : "sink"}
        />
      ))}
      <text x={viewW / 2} y={viewH - 2} textAnchor="middle" className="label">avant</text>
    </svg>
  );
};

const CornerEditor = ({ config, setConfig, footprints = [], conflicts = [] }) => {
  const length = Number(config.length) || 0;
  const width = Number(config.width) || 0;
  const corners = useMemo(() => getCorners(config), [config]);
  const [drafts, setDrafts] = useState({});
  const [notice, setNotice] = useState(null);

  const apply = (next) => setConfig((prev) => ({ ...prev, corners: next }));

  // Changement de dimensions : un demi-cercle reste un demi-cercle, le reste est ramené dans les limites
  const prevDims = useRef({ length, width });
  useEffect(() => {
    const { length: pl, width: pw } = prevDims.current;
    prevDims.current = { length, width };
    if (!length || !width || (pl === length && pw === width)) return;
    if (!CORNERS.some((k) => corners[k])) return;

    let next = { ...corners };
    for (const side of Object.keys(SIDE_CORNERS)) {
      if (pl && pw && isSemicircle(side, corners, pl, pw)) {
        const half = (side === "front" || side === "back" ? length : width) / 2;
        for (const k of SIDE_CORNERS[side]) next[k] = half;
      }
    }
    next = clampCorners(next, length, width);
    if (CORNERS.some((k) => next[k] !== corners[k])) {
      apply(next);
      setNotice("Les arrondis ont été adaptés aux nouvelles dimensions.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, width]);

  const setRadius = (k, value) => {
    const max = maxRadius(k, corners, length, width);
    let r = Math.round(Number(value) || 0);
    let msg = null;
    if (r > 0 && r < MIN_CORNER_RADIUS) {
      r = MIN_CORNER_RADIUS;
      msg = `Rayon minimum : ${MIN_CORNER_RADIUS} mm.`;
    }
    if (r > max) {
      r = max;
      msg = `Rayon maximum pour cet angle : ${max} mm (limité par la taille du plan et les angles voisins).`;
    }
    if (r > 0 && max < MIN_CORNER_RADIUS) {
      r = 0;
      msg = "Pas assez de place pour arrondir cet angle.";
    }
    setNotice(msg);
    setDrafts((d) => ({ ...d, [k]: undefined }));
    apply({ ...corners, [k]: r });
  };

  // Mise à jour en direct pendant la saisie ou le glissement du curseur :
  // appliquée dès que la valeur est un rayon valide, normalisée à la sortie du champ.
  const liveRadius = (k, raw) => {
    setDrafts((d) => ({ ...d, [k]: raw }));
    const n = Math.round(Number(raw));
    if (!Number.isFinite(n) || n < MIN_CORNER_RADIUS) return; // saisie en cours (ex. « 1 » pour 150)
    const max = maxRadius(k, corners, length, width);
    setNotice(n > max ? `Rayon maximum pour cet angle : ${max} mm (limité par la taille du plan et les angles voisins).` : null);
    const r = Math.min(n, max);
    if (r !== corners[k]) apply({ ...corners, [k]: r });
  };

  const toggleCorner = (k) => {
    if (corners[k]) return setRadius(k, 0);
    const max = maxRadius(k, corners, length, width);
    // Valeur de départ : 100 mm, ou le maximum possible si l'angle est plus contraint
    setRadius(k, Math.min(100, max));
  };

  const toggleSemicircle = (side) => {
    if (isSemicircle(side, corners, length, width)) {
      const next = { ...corners };
      for (const k of SIDE_CORNERS[side]) next[k] = 0;
      setNotice(null);
      return apply(next);
    }
    const next = semicircleRadii(side, corners, length, width);
    if (next) {
      setNotice(null);
      apply(next);
    }
  };

  const sides = ["left", "right", "front", "back"];
  const anyRounded = CORNERS.some((k) => corners[k]);

  return (
    <div className="corner-editor">
      <PlanPreview length={length || 1} width={width || 1} corners={corners} footprints={footprints} conflicts={conflicts} />

      <div className="semicircle-row">
        <span>Côté en demi-cercle</span>
        <div>
          {sides.map((side) => {
            const active = isSemicircle(side, corners, length, width);
            const possible = active || !!semicircleRadii(side, corners, length, width);
            return (
              <button
                key={side}
                type="button"
                className={active ? "active-small" : ""}
                disabled={!possible}
                onClick={() => toggleSemicircle(side)}
                title={
                  possible
                    ? `Les deux angles ${SIDE_LABEL[side].toLowerCase()}s se rejoignent en un demi-cercle de rayon ${
                        (side === "front" || side === "back" ? length : width) / 2
                      } mm`
                    : "Le plan n'est pas assez grand dans l'autre sens pour ce demi-cercle"
                }
              >
                {SIDE_LABEL[side]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="corner-grid">
        {GRID.map((k) => {
          const r = corners[k];
          const max = maxRadius(k, corners, length, width);
          const canRound = max >= MIN_CORNER_RADIUS;
          const draft = drafts[k];
          return (
            <div key={k} className={`corner-card ${r ? "is-on" : ""}`}>
              <div className="corner-head">
                <span className="corner-name">{CORNER_LABEL[k]}</span>
              </div>
              <div className="drilling-options">
                <button type="button" className={!r ? "active-small" : ""} onClick={() => r && toggleCorner(k)}>
                  Vif
                </button>
                <button
                  type="button"
                  className={r ? "active-small" : ""}
                  disabled={!canRound && !r}
                  onClick={() => !r && toggleCorner(k)}
                  title={!canRound ? "Pas assez de place pour arrondir cet angle" : ""}
                >
                  Arrondi
                </button>
              </div>
              {r > 0 && (
                <div className="radius-row">
                  <label>
                    <span>Rayon</span>
                    <div className="radius-input">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={MIN_CORNER_RADIUS}
                        max={max}
                        step="5"
                        value={draft ?? r}
                        onChange={(e) => liveRadius(k, e.target.value)}
                        onBlur={(e) => setRadius(k, e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
                        onWheel={(e) => e.target.blur()}
                      />
                      <em>mm</em>
                    </div>
                  </label>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={r === max} onClick={() => setRadius(k, max)}>
                    Max ({max})
                  </button>
                  {max > MIN_CORNER_RADIUS && (
                    <input
                      type="range"
                      className="radius-slider"
                      min={MIN_CORNER_RADIUS}
                      max={max}
                      step="5"
                      value={Math.min(r, max)}
                      onChange={(e) => {
                        setDrafts((d) => ({ ...d, [k]: undefined }));
                        liveRadius(k, e.target.value);
                      }}
                      onPointerUp={() => setDrafts((d) => ({ ...d, [k]: undefined }))}
                      aria-label={`Rayon ${CORNER_LABEL[k].toLowerCase()}`}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {notice && <div className="alert-message corner-notice">{notice}</div>}
      {conflicts.length > 0 && (
        <div className="alert-message corner-alert">
          Une cuve déborde sur l'arrondi {[...new Set(conflicts.map((c) => CORNER_LABEL[c.corner].toLowerCase()))].join(" et ")} : réduisez le rayon ou déplacez la cuve.
        </div>
      )}
      {anyRounded && (
        <p className="corner-hint">
          Chaque arrondi est un quart de cercle parfait. Retombées, dosserets et anti-goutte suivent la courbe.
        </p>
      )}
    </div>
  );
};

export default CornerEditor;
