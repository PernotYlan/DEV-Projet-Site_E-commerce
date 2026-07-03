/**
 * Contexte d'authentification.
 * Fournit : user, isLoading, login(), logout(), register().
 * L'access token reste en mémoire (jamais en localStorage) ; au démarrage,
 * un POST /auth/refresh tente de restaurer la session via le cookie httpOnly.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { api, setAccessToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Au démarrage : tente de restaurer la session (cookie refresh / session démo)
  useEffect(() => {
    api
      .refresh()
      .then(({ access_token, user: utilisateur }) => {
        setAccessToken(access_token);
        if (utilisateur) {
          setUser(utilisateur);
        } else {
          return api.me().then(setUser);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  /** Connecte l'utilisateur et mémorise le token. */
  async function login(email, motDePasse, seSouvenir) {
    const { access_token, user: utilisateur } = await api.login(email, motDePasse, seSouvenir);
    setAccessToken(access_token);
    setUser(utilisateur);
    return utilisateur;
  }

  /** Déconnecte l'utilisateur (serveur + état local). */
  async function logout() {
    try {
      await api.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }

  /** Crée un compte (l'utilisateur devra confirmer son email). */
  function register(donnees) {
    return api.register(donnees);
  }

  /** Met à jour l'utilisateur en mémoire après modification du profil. */
  function rafraichirUser(utilisateur) {
    setUser(utilisateur);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, rafraichirUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook d'accès au contexte d'authentification. */
export function useAuth() {
  return useContext(AuthContext);
}
