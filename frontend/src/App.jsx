import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider, useCart } from "./contexts/CartContext.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { SettingsProvider } from "./contexts/SettingsContext.jsx";
import "./styles/style.scss";

// Chaque page est chargée à la demande : la 3D (three.js), les PDF et l'export
// Excel ne sont plus téléchargés dès la page d'accueil.
const Home = lazy(() => import("./pages/Home"));
const Configurator = lazy(() => import("./pages/Configurator"));
const Login = lazy(() => import("./pages/Login"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const ClientOrders = lazy(() => import("./pages/ClientOrders"));
const PolitiqueConfidentialite = lazy(() => import("./pages/PolitiqueConfidentialite"));
const MyAccount = lazy(() => import("./pages/MyAccount"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Contact = lazy(() => import("./pages/Contact"));
const CGV = lazy(() => import("./pages/CGV"));
const ClientQuotes = lazy(() => import("./pages/ClientQuotes"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Cart = lazy(() => import("./components/Cart"));

const AdminLayout = lazy(() => import("./components/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminOrderDetails = lazy(() => import("./pages/AdminOrderDetails"));
const AdminQuotes = lazy(() => import("./pages/AdminQuotes"));
const AdminQuoteDetails = lazy(() => import("./pages/AdminQuoteDetails"));
const AdminVariables = lazy(() => import("./pages/AdminVariables"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));

// Remonte en haut de page à chaque changement de route
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Le panier s'ouvre depuis n'importe quelle page (le bouton du header ne marchait
// que dans le configurateur). Charger une config renvoie vers le configurateur.
const GlobalCart = () => {
  const { isCartOpen, setIsCartOpen, updateCartItem, removeFromCart } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    setIsCartOpen(false);
  }, [pathname, setIsCartOpen]);

  if (!isCartOpen) return null;

  const handleLoadConfig = (cartItem, cartIndex, isEdit = false) => {
    const onConfigurator = pathname === "/configurator";
    if (
      onConfigurator &&
      !window.confirm(
        "La configuration en cours sera remplacée. Continuer ?",
      )
    )
      return;
    // eslint-disable-next-line no-unused-vars
    const { id, unitPrice, totalPrice, quantity, ...configData } = cartItem;
    setIsCartOpen(false);
    navigate("/configurator", {
      state: { loadConfig: configData, editIndex: isEdit ? cartIndex : null },
    });
  };

  return (
    <Suspense fallback={null}>
      <Cart
        updateItem={updateCartItem}
        removeItem={removeFromCart}
        closeCart={() => setIsCartOpen(false)}
        onLoadConfig={handleLoadConfig}
      />
    </Suspense>
  );
};

const admin = (element) => <ProtectedRoute adminOnly>{element}</ProtectedRoute>;

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <BrowserRouter>
              <ScrollToTop />
              <div className="App">
                <Suspense fallback={<div className="page-loader" aria-label="Chargement" />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/configurator" element={<Configurator />} />

                    <Route path="/login" element={<Login />} />
                    <Route path="/verify/:token" element={<VerifyEmail />} />

                    <Route path="/contact" element={<Contact />} />
                    <Route path="/cgv" element={<CGV />} />
                    <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />

                    {/* --- ESPACE CLIENT --- */}
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-confirmation/:orderId" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
                    <Route path="/my-orders" element={<ProtectedRoute><ClientOrders /></ProtectedRoute>} />
                    <Route path="/my-account" element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />
                    <Route path="/my-quotes" element={<ProtectedRoute><ClientQuotes /></ProtectedRoute>} />

                    {/* --- ESPACE ADMIN --- */}
                    <Route path="/admin" element={admin(<AdminLayout />)}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="orders/:status" element={<AdminOrders />} />
                      <Route path="order/:id" element={<AdminOrderDetails />} />
                      <Route path="quotes" element={<AdminQuotes />} />
                      <Route path="quotes/:id" element={<AdminQuoteDetails />} />
                      <Route path="settings" element={<AdminVariables />} />
                      <Route path="users" element={<AdminUsers />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <GlobalCart />
              </div>
            </BrowserRouter>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
