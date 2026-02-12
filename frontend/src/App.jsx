import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from "./pages/Main";
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
import { CartProvider } from "./contexts/CartContext.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import "./styles/style.scss";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="App">
            <Routes>
              {/* Route principale (Configurateur) */}
              <Route path="/" element={<Main />} />

              {/* Route de connexion / inscription */}
              <Route path="/login" element={<Login />} />

              <Route path="/verify/:token" element={<VerifyEmail />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route
                path="/order-confirmation/:orderId"
                element={<OrderConfirmation />}
              />
              <Route path="/admin/orders/:status" element={<AdminOrders />} />
              <Route path="/my-orders" element={<ClientOrders />} />
              <Route
                path="/admin/order/:id"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminOrderDetails />
                  </ProtectedRoute>
                }
              />
              <Route path="/cgv" element={<CGV />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Routes>
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
