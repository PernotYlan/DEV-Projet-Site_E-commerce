/**
 * Instance Axios pour la vraie API (mode VITE_MOCK=0).
 * - Ajoute l'access token sur chaque requête.
 * - Sur 401, tente un refresh puis rejoue la requête une fois.
 */
import axios from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // nécessaire pour le cookie refresh httpOnly
});

// Access token gardé uniquement en mémoire (jamais en localStorage)
let accessToken = null;

/** Définit l'access token utilisé par l'intercepteur (appelé par AuthContext). */
export function setAccessToken(token) {
  accessToken = token;
}

http.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

http.interceptors.response.use(
  (reponse) => reponse,
  async (erreur) => {
    const requete = erreur.config;
    // Sur 401 (token expiré), on tente UN refresh puis on rejoue la requête
    if (erreur.response?.status === 401 && !requete._retry && !requete.url.includes('/auth/')) {
      requete._retry = true;
      try {
        const { data } = await http.post('/auth/refresh');
        setAccessToken(data.data.access_token);
        return http(requete);
      } catch {
        setAccessToken(null);
      }
    }
    return Promise.reject(erreur);
  }
);

export default http;
