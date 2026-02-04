import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Main from './pages/Main';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail'; // <--- Import de la nouvelle page de validation
import { CartProvider } from './contexts/CartContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import './styles/style.scss'; 

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
                
                {/* Route de validation d'email (le token est dynamique) */}
                <Route path="/verify-email/:token" element={<VerifyEmail />} />
              </Routes>
            </div>
          </BrowserRouter>
        </CartProvider>
    </AuthProvider>
  );
}

export default App;