/**
 * Contexte du panier — vit uniquement côté front (localStorage).
 * Un item : { produit_id, nom, couleur, prix_id, type_abonnement, prix_unitaire_ht, quantite }.
 * Fournit : items, addItem(), removeItem(), updateItem(), clearCart(), totaux.
 */
import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const CLE_STORAGE = 'cyna_panier';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CLE_STORAGE)) || [];
    } catch {
      return [];
    }
  });

  // Persistance automatique dans localStorage
  useEffect(() => {
    localStorage.setItem(CLE_STORAGE, JSON.stringify(items));
  }, [items]);

  /** Ajoute un item ; si le même produit/prix existe déjà, incrémente la quantité. */
  function addItem(item) {
    setItems((courant) => {
      const existant = courant.find((i) => i.prix_id === item.prix_id);
      if (existant) {
        return courant.map((i) =>
          i.prix_id === item.prix_id ? { ...i, quantite: i.quantite + item.quantite } : i
        );
      }
      return [...courant, item];
    });
  }

  /** Retire un item du panier. */
  function removeItem(prixId) {
    setItems((courant) => courant.filter((i) => i.prix_id !== prixId));
  }

  /** Met à jour un item (quantité ou type d'abonnement/prix). */
  function updateItem(prixId, modifications) {
    setItems((courant) => courant.map((i) => (i.prix_id === prixId ? { ...i, ...modifications } : i)));
  }

  /** Vide le panier (après une commande). */
  function clearCart() {
    setItems([]);
  }

  const totalHt = items.reduce((somme, i) => somme + i.prix_unitaire_ht * i.quantite, 0);
  const tva = totalHt * 0.2;
  const totalTtc = totalHt + tva;
  const nbArticles = items.reduce((somme, i) => somme + i.quantite, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateItem, clearCart, totalHt, tva, totalTtc, nbArticles }}
    >
      {children}
    </CartContext.Provider>
  );
}

/** Hook d'accès au panier. */
export function useCart() {
  return useContext(CartContext);
}
