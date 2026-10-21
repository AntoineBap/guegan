import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "../components/Header";

const NotFound = () => (
  <>
    <Helmet>
      <title>Page introuvable — Guegan Shop</title>
      <meta name="robots" content="noindex" />
    </Helmet>
    <Header />
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "96px 24px", textAlign: "center" }}>
      <p style={{ color: "var(--gold-dark)", fontWeight: 700, letterSpacing: "0.08em", fontSize: "0.8rem" }}>
        ERREUR 404
      </p>
      <h1 style={{ fontSize: "2rem", margin: "8px 0 12px" }}>Cette page n'existe pas</h1>
      <p style={{ color: "var(--muted)", marginBottom: 32 }}>
        Le lien est peut-être incorrect ou la page a été déplacée.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link to="/configurator" className="btn btn-primary">Ouvrir le configurateur</Link>
        <Link to="/" className="btn btn-outline">Retour à l'accueil</Link>
      </div>
    </main>
  </>
);

export default NotFound;
