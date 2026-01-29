import React from 'react';
import Main from './pages/Main';
import { CartProvider } from './contexts/CartContext.jsx';
import './styles/style.scss'; 

function App() {
  return (
    <CartProvider>
      <div className="App">
        <Main />
      </div>
    </CartProvider>
  );
}

export default App;