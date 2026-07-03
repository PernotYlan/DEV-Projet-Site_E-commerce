import { useEffect, useState } from 'react';
import { api } from '../../api';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

/** Libellés lisibles pour les clés de contenu connues. */
const LIBELLES = {
  texte_sous_carrousel: 'Texte sous le carrousel',
  titre_top_produits: 'Titre de la section « Top produits »',
};

/** Édition du contenu modifiable de la page d'accueil. */
export default function AdminAccueil() {
  const [contenu, setContenu] = useState(null);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.admin.accueil().then(setContenu).catch(() => setErreur('Erreur de chargement.'));
  }, []);

  /** Enregistre une clé de contenu. */
  async function enregistrer(cle, valeur) {
    try {
      await api.admin.modifierAccueil(cle, valeur);
      setMessage('Contenu mis à jour.');
      setTimeout(() => setMessage(''), 2500);
    } catch (err) {
      setErreur(err.response?.data?.error || 'Erreur.');
    }
  }

  if (!contenu) return <Spinner />;

  return (
    <>
      <h1>Contenu de la page d’accueil</h1>
      {message && <p className="message-succes">{message}</p>}
      {erreur && <p className="message-erreur">{erreur}</p>}

      {contenu.map((item) => (
        <div key={item.cle} className="carte-bloc">
          <div className="champ">
            <label>{LIBELLES[item.cle] || item.cle}</label>
            <textarea
              rows="2"
              value={item.valeur}
              onChange={(e) => setContenu(contenu.map((c) => c.cle === item.cle ? { ...c, valeur: e.target.value } : c))}
            />
          </div>
          <Button petit variante="rose" onClick={() => enregistrer(item.cle, item.valeur)}>Enregistrer</Button>
        </div>
      ))}
    </>
  );
}
