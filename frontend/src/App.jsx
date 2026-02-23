import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Imports des pages existantes
import Home from "./pages/Home";
import Configurator from "./pages/Configurator";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import AdminDashboard from "./pages/AdminDashboard";
import Checkout from "./pages/Checkout";
import AdminOrders from "./pages/AdminOrders";
import ClientOrders from "./pages/ClientOrders";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminOrderDetails from "./pages/AdminOrderDetails";
import OrderConfirmation from "./pages/OrderConfirmation";
import Contact from "./pages/Contact";
import CGV from "./pages/CGV";
import AdminUsers from "./pages/AdminUsers";
import AdminVariables from "./pages/AdminVariables";

// NOUVEAUX IMPORTS POUR LES DEVIS
import ClientQuotes from "./pages/ClientQuotes";
import AdminQuotes from "./pages/AdminQuotes";
import AdminQuoteDetails from "./pages/AdminQuoteDetails";

// Providers et Styles
import { CartProvider } from "./contexts/CartContext.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { SettingsProvider } from "./contexts/SettingsContext.jsx";
import "./styles/style.scss";

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="App">
              <Routes>
                {/* Route principale (Configurateur) */}
                <Route path="/" element={<Home />} />
                <Route path="/configurator" element={<Configurator />} />

                {/* Route de connexion / inscription */}
                <Route path="/login" element={<Login />} />
                <Route path="/verify/:token" element={<VerifyEmail />} />

                {/* Pages publiques */}
                <Route path="/contact" element={<Contact />} />
                <Route path="/cgv" element={<CGV />} />

                {/* --- ESPACE CLIENT --- */}
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
                <Route path="/my-orders" element={<ClientOrders />} />
                
                {/* NOUVELLE ROUTE CLIENT : Mes Devis */}
                <Route path="/my-quotes" element={<ClientQuotes />} />

                {/* --- ESPACE ADMIN --- */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/orders/:status"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminOrders />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/order/:id"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminOrderDetails />
                    </ProtectedRoute>
                  }
                />

                {/* NOUVELLES ROUTES ADMIN : Gestion des devis */}
                <Route
                  path="/admin/quotes"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminQuotes />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/quotes/:id"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminQuoteDetails />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminVariables />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminUsers />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </BrowserRouter>
        </CartProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;