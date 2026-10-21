import React, { useContext, useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { SettingsContext } from "../contexts/SettingsContext";
import { AuthContext } from "../contexts/AuthContext";
import useToast from "../components/useToast";
import { formatPrice } from "../utils/format";

const clone = (o) => JSON.parse(JSON.stringify(o));

// Même formule que le configurateur et le serveur : A × ln(h − B) − C (€/ml)
const pricePerMeter = (f, h) => (h > f.b ? Math.max(0, f.a * Math.log(h - f.b) - f.c) : 0);

const Field = ({ label, hint, unit, value, original, onChange, step = 1 }) => (
  <div className={`field-row ${Number(value) !== Number(original) ? "is-changed" : ""}`}>
    <label>
      {label}
      {hint && <small>{hint}</small>}
    </label>
    <div className="input-unit">
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        onWheel={(e) => e.target.blur()}
      />
      {unit && <span>{unit}</span>}
    </div>
  </div>
);

const FormulaBlock = ({ title, type, local, original, update }) => {
  const f = local.linearFormula[type];
  const heights = type === "rims" ? [100, 200, 350, 550] : [60, 100, 150, 200];
  return (
    <div>
      <h3 style={{ fontSize: "0.95rem", margin: "0 0 4px" }}>{title}</h3>
      {["a", "b", "c"].map((k) => (
        <Field
          key={k}
          label={{ a: "Coefficient A", b: "Seuil B", c: "Ajustement C" }[k]}
          hint={{ a: "multiplicateur", b: "hauteur minimale facturée (mm)", c: "valeur soustraite" }[k]}
          step="0.1"
          value={f[k]}
          original={original.linearFormula[type][k]}
          onChange={(v) => update(["linearFormula", type, k], v)}
        />
      ))}
      <table className="formula-preview">
        <thead>
          <tr>
            <th>Hauteur</th>
            {heights.map((h) => (
              <th key={h}>{h} mm</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Prix / mètre</td>
            {heights.map((h) => (
              <td key={h}>{formatPrice(pricePerMeter(f, h))}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const AdminVariables = () => {
  const { settings, setSettings, saveSettings } = useContext(SettingsContext);
  const { token } = useContext(AuthContext);
  const [local, setLocal] = useState(null);
  const [original, setOriginal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, toastNode] = useToast();

  useEffect(() => {
    if (settings) {
      setLocal(clone(settings));
      setOriginal(clone(settings));
    }
  }, [settings]);

  const dirty = useMemo(() => local && original && JSON.stringify(local) !== JSON.stringify(original), [local, original]);

  // Prévient avant de quitter la page avec des changements non enregistrés
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const update = (path, value) =>
    setLocal((prev) => {
      const next = clone(prev);
      let o = next;
      path.slice(0, -1).forEach((k) => {
        o[k] = o[k] || {};
        o = o[k];
      });
      o[path[path.length - 1]] = value;
      return next;
    });

  const invalid = useMemo(() => {
    if (!local) return false;
    const nums = [
      ...Object.values(local.sinkPrices),
      ...Object.values(local.prices),
      local.constraints.maxLength,
      local.constraints.maxDepth,
      ...["rims", "aprons"].flatMap((t) => Object.values(local.linearFormula[t])),
    ];
    return nums.some((n) => n === "" || !Number.isFinite(Number(n)) || Number(n) < 0);
  }, [local]);

  const handleSave = async () => {
    if (invalid) return toast("Certaines valeurs sont vides ou négatives.", "error");
    if (!window.confirm("Appliquer ces tarifs sur le site ? Les nouveaux prix s'appliquent immédiatement aux commandes.")) return;
    setSaving(true);
    const ok = await saveSettings(local, token);
    setSaving(false);
    if (ok) {
      setSettings(clone(local));
      setOriginal(clone(local));
      toast("Tarifs enregistrés.");
    } else {
      toast("Erreur lors de l'enregistrement.", "error");
    }
  };

  if (!local) return <div className="loading-state" />;

  return (
    <div className="admin-page">
      <Helmet>
        <title>Tarifs & paramètres — Administration</title>
      </Helmet>

      <div className="page-head">
        <div>
          <p className="eyebrow">Boutique</p>
          <h1>Tarifs & paramètres</h1>
          <p className="sub">Prix HT utilisés par le configurateur et recalculés par le serveur à chaque commande.</p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Cuves</h2>
            <span className="hint">prix unitaire HT</span>
          </div>
          <div className="panel-body">
            {Object.entries(local.sinkPrices).map(([name, price]) => (
              <Field
                key={name}
                label={name.replace("Cuve ", "")}
                unit="€"
                value={price}
                original={original.sinkPrices[name]}
                onChange={(v) => update(["sinkPrices", name], v)}
              />
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Options</h2>
            <span className="hint">HT</span>
          </div>
          <div className="panel-body">
            <Field label="Perçage robinetterie" hint="par cuve" unit="€" value={local.prices.tapHole} original={original.prices.tapHole} onChange={(v) => update(["prices", "tapHole"], v)} />
            <Field label="Rainurage égouttoir" hint="par cuve" unit="€" value={local.prices.drainer} original={original.prices.drainer} onChange={(v) => update(["prices", "drainer"], v)} />
            <Field label="Anti-goutte" hint="au mètre linéaire" unit="€/m" value={local.prices.waterDrip} original={original.prices.waterDrip} onChange={(v) => update(["prices", "waterDrip"], v)} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Contraintes & délais</h2>
          </div>
          <div className="panel-body">
            <Field label="Largeur maximale" unit="mm" value={local.constraints.maxLength} original={original.constraints.maxLength} onChange={(v) => update(["constraints", "maxLength"], v)} />
            <Field label="Profondeur maximale" unit="mm" value={local.constraints.maxDepth} original={original.constraints.maxDepth} onChange={(v) => update(["constraints", "maxDepth"], v)} />
            <Field
              label="Délai de fabrication"
              hint="affiché au client"
              unit="jours"
              value={local.constraints.leadTime ?? 15}
              original={original.constraints.leadTime ?? 15}
              onChange={(v) => update(["constraints", "leadTime"], v)}
            />
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panel-head">
          <h2>Dosserets et retombées</h2>
          <span className="hint">prix au mètre selon la hauteur</span>
        </div>
        <div className="panel-body">
          <p className="formula-note">
            Prix par mètre linéaire = <code>A × ln(hauteur − B) − C</code>. Le tableau sous chaque bloc montre l'effet des valeurs saisies avant enregistrement.
          </p>
          <div className="settings-grid">
            <FormulaBlock title="Dosserets" type="rims" local={local} original={original} update={update} />
            <FormulaBlock title="Retombées" type="aprons" local={local} original={original} update={update} />
          </div>
        </div>
      </section>

      {dirty && (
        <div className="save-bar">
          <span>Modifications non enregistrées</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setLocal(clone(original))} disabled={saving}>
              Annuler
            </button>
            <button className="btn btn-gold btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
      {toastNode}
    </div>
  );
};

export default AdminVariables;
