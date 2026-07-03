import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import AppRouter from './routes/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { stripePromise } from './lib/stripe';
import './styles/global.css';

// Arbre applicatif : routeur + contextes globaux (auth, panier)
const app = (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <AppRouter />
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

// En mode API réelle avec clé Stripe : on enveloppe dans <Elements> pour
// activer Stripe.js. En mode démo (stripePromise null), pas d'enveloppe.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {stripePromise ? <Elements stripe={stripePromise}>{app}</Elements> : app}
  </React.StrictMode>
);
