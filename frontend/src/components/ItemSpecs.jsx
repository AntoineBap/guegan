import React from "react";
import { describeCorners } from "../utils/planShape";

const SIDE = { left: "Gauche", right: "Droite", center: "Centrée" };
const TAP = { Gauche: "Gauche", Droite: "Droite", Centre: "Centré" };

// Fiche technique d'un plan (cuves, dosserets, retombées, options),
// partagée par les pages de détail commande / devis.
const ItemSpecs = ({ item }) => {
  const sinks = (item.sinks || []).filter((s) => s && s.type && s.type !== "Aucune cuve");

  const rims = item.rims
    ? [item.rimLeft && "Gauche", item.rimBack && "Fond", item.rimRight && "Droite"].filter(Boolean)
    : [];
  const aprons = item.aprons
    ? [
        item.apronFront && "Avant",
        item.apronLeft && "Gauche",
        item.apronBack && "Fond",
        item.apronRight && "Droite",
      ].filter(Boolean)
    : [];

  return (
    <dl className="item-specs">
      <div>
        <dt>Dimensions</dt>
        <dd>
          {item.length} × {item.width} mm
        </dd>
      </div>

      {describeCorners(item).length > 0 && (
        <div>
          <dt>Angles</dt>
          <dd>
            {describeCorners(item).map((line) => (
              <span key={line}>{line}</span>
            ))}
          </dd>
        </div>
      )}

      {sinks.length === 0 && (
        <div>
          <dt>Cuve</dt>
          <dd>Aucune</dd>
        </div>
      )}

      {sinks.map((s, idx) => (
        <div key={s.id ?? idx}>
          <dt>Cuve {sinks.length > 1 ? idx + 1 : ""}</dt>
          <dd>
            <strong>{s.type.replace("Cuve ", "")}</strong>
            <span>
              Position {SIDE[s.position] || "centrée"}
              {s.position && s.position !== "center" && s.offset ? ` (${s.offset} mm)` : ""}
            </span>
            <span>
              Robinet :{" "}
              {s.hasTapHole
                ? `${TAP[s.tapHolePosition] || "Centré"}${s.tapHoleOffset ? `, décalage ${s.tapHoleOffset} mm` : ""}`
                : "non"}
            </span>
            <span>
              Égouttoir : {s.hasDrainer ? (s.drainerPosition === "left" ? "gauche" : "droite") : "non"}
            </span>
          </dd>
        </div>
      ))}

      {rims.length > 0 && (
        <div>
          <dt>Dosserets</dt>
          <dd>
            {rims.join(", ")} · H {item.rimHeigh} mm
          </dd>
        </div>
      )}

      {aprons.length > 0 && (
        <div>
          <dt>Retombées</dt>
          <dd>
            {aprons.join(", ")} · H {item.apronHeight} mm
          </dd>
        </div>
      )}

      {item.splashback && (
        <div>
          <dt>Anti-goutte</dt>
          <dd>Oui</dd>
        </div>
      )}

      {item.totalWeight ? (
        <div>
          <dt>Poids estimé</dt>
          <dd>{Number(item.totalWeight).toFixed(1)} kg</dd>
        </div>
      ) : null}
    </dl>
  );
};

export default ItemSpecs;
