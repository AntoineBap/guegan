import React, { useEffect, useState, useContext, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { AuthContext } from "../contexts/AuthContext";
import useToast from "../components/useToast";
import { formatPrice } from "../utils/format";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const COLUMNS = [
  { key: "nom_complet", label: "Client" },
  { key: "entreprise", label: "Entreprise" },
  { key: "telephone", label: "Téléphone" },
  { key: "siret", label: "SIRET" },
  { key: "tva", label: "N° TVA" },
  { key: "panier", label: "Panier en cours" },
  { key: "total_panier", label: "Panier HT", num: true },
];

const SortIcon = ({ dir }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" style={{ opacity: dir ? 1 : 0.35 }}>
    <path d="M5 1l3 3H2z" fill="currentColor" opacity={dir === "desc" ? 0.3 : 1} />
    <path d="M5 9l3-3H2z" fill="currentColor" opacity={dir === "asc" ? 0.3 : 1} />
  </svg>
);

const AdminUsers = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState(null);
  const [query, setQuery] = useState("");
  const [onlyWithCart, setOnlyWithCart] = useState(false);
  const [sort, setSort] = useState({ key: "nom_complet", dir: "asc" });
  const [exporting, setExporting] = useState(false);
  const [toast, toastNode] = useToast();

  useEffect(() => {
    fetch(`${API_URL}/api/admin/users-export`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then(setUsers)
      .catch(() => setUsers([]));
  }, [token]);

  const toggleSort = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  const rows = useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    const list = users.filter(
      (u) =>
        (!onlyWithCart || u.total_panier > 0) &&
        (!q ||
          [u.nom_complet, u.email, u.entreprise, u.telephone, u.siret]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))),
    );
    const factor = sort.dir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const av = a[sort.key] ?? "";
      const bv = b[sort.key] ?? "";
      if (typeof av === "number" || typeof bv === "number") return ((av || 0) - (bv || 0)) * factor;
      return String(av).localeCompare(String(bv), "fr") * factor;
    });
  }, [users, query, onlyWithCart, sort]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      // xlsx (~400 Ko) n'est chargé que lors de l'export
      const XLSX = await import("xlsx");
      const data = rows.map((u) => ({
        "Nom & Prénom": u.nom_complet,
        Email: u.email,
        Téléphone: u.telephone,
        "N° SIRET": u.siret,
        Entreprise: u.entreprise,
        "Adresse Entreprise": u.adresse,
        "N° TVA": u.tva,
        "Contenu Panier": u.panier,
        "Total Panier HT": Number((u.total_panier || 0).toFixed(2)),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [25, 30, 15, 20, 25, 40, 20, 60, 15].map((wch) => ({ wch }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Clients GUEGAN");
      XLSX.writeFile(wb, `Export_Clients_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.xlsx`);
    } catch {
      toast("Export impossible.", "error");
    }
    setExporting(false);
  };

  const withCart = users ? users.filter((u) => u.total_panier > 0) : [];

  return (
    <div className="admin-page">
      <Helmet>
        <title>Comptes clients — Administration</title>
      </Helmet>

      <div className="page-head">
        <div>
          <p className="eyebrow">Clients</p>
          <h1>Comptes clients</h1>
          <p className="sub">
            {users
              ? `${users.length} compte(s) · ${withCart.length} panier(s) en cours pour ${formatPrice(
                  withCart.reduce((s, u) => s + u.total_panier, 0),
                )} HT`
              : "Chargement…"}
          </p>
        </div>
        <div className="actions">
          <button className="btn btn-outline" onClick={handleExportExcel} disabled={!users || exporting}>
            {exporting ? "Export…" : "Exporter en Excel"}
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <label className="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="sr-only">Rechercher</span>
            <input type="text" placeholder="Nom, email, entreprise, SIRET…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", color: "var(--muted)" }}>
            <input type="checkbox" checked={onlyWithCart} onChange={(e) => setOnlyWithCart(e.target.checked)} />
            Paniers non vides uniquement
          </label>
          {users && <span className="result-count">{rows.length} résultat(s)</span>}
        </div>

        {users === null ? (
          <div className="loading-state" />
        ) : rows.length === 0 ? (
          <div className="empty-state">
            <strong>Aucun client</strong>
            {query ? "Aucun compte ne correspond à la recherche." : "Les comptes créés apparaîtront ici."}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className={c.num ? "num" : ""} aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                      <button onClick={() => toggleSort(c.key)}>
                        {c.label} <SortIcon dir={sort.key === c.key ? sort.dir : null} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="stack">
                        <strong>{u.nom_complet}</strong>
                        <small>
                          <a href={`mailto:${u.email}`}>{u.email}</a>
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="stack">
                        <span>{u.entreprise}</span>
                        <small>{u.adresse}</small>
                      </div>
                    </td>
                    <td className="nowrap">
                      {u.telephone !== "N/A" ? <a href={`tel:${u.telephone}`}>{u.telephone}</a> : "—"}
                    </td>
                    <td className="nowrap muted">{u.siret}</td>
                    <td className="nowrap muted">{u.tva}</td>
                    <td className="muted" style={{ whiteSpace: "pre-line", minWidth: 180 }}>
                      {u.panier === "Panier vide" ? "—" : u.panier}
                    </td>
                    <td className="num">{u.total_panier > 0 ? <strong>{formatPrice(u.total_panier)}</strong> : <span className="muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {toastNode}
    </div>
  );
};

export default AdminUsers;
