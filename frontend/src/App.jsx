import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/Home';
import Configurator from './pages/Configurator';
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import AdminDashboard from "./pages/AdminDashboard";
import Checkout from "./pages/Checkout";
import AdminOrders from "./pages/AdminOrders";
import ClientOrders from "./pages/ClientOrders";
import ProtectedRoute from './components/ProtectedRoute'; 
import AdminOrderDetails from './pages/AdminOrderDetails';
import OrderConfirmation from "./pages/OrderConfirmation";
import CGV from './pages/CGV';
import AdminUsers from './pages/AdminUsers';
import AdminVariables from './pages/AdminVariables'; // Import de la nouvelle page
import { CartProvider } from "./contexts/CartContext.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { SettingsProvider } from "./contexts/SettingsContext.jsx"; // Import du provider des réglages
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
                
                {/* Dashboard Admin */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />

                <Route path="/checkout" element={<Checkout />} />
                
                <Route
                  path="/order-confirmation/:orderId"
                  element={<OrderConfirmation />}
                />

                <Route 
                  path="/admin/orders/:status" 
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminOrders />
                    </ProtectedRoute>
                  } 
                />

                <Route path="/my-orders" element={<ClientOrders />} />

                <Route
                  path="/admin/order/:id"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminOrderDetails />
                    </ProtectedRoute>
                  }
                />

                {/* Nouvelle route pour la modification des prix/variables */}
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminVariables />
                    </ProtectedRoute>
                  }
                />

                <Route path="/cgv" element={<CGV />} />
                
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