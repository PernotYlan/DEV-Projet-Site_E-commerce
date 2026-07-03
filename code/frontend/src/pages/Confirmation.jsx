import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import Spinner from '../components/ui/Spinner';
import { euros } from '../components/ui/ProductCard';

/** Page de confirmation après paiement : numéro et récapitulatif. */
export default function Confirmation() {
  const { commandeId } = useParams();
  const [commande, setCommande] = useState(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    api.commande(commandeId).then(setCommande).catch(() => setErreur(true));
  }, [commandeId]);

  if (erreur) return <p className="vide">Commande introuvable.</p>;
  if (!commande) return <Spinner />;

  return (
    <div className="conteneur" style={{ maxWidth: 640 }}>
      <div className="carte-bloc" style={{ marginTop: 40, textAlign: 'center' }}>
        <span style={{ fontSize: '3rem' }}>🎉</span>
        <h1 style={{ fontSize: '1.6rem', margin: '10px 0' }}>Merci pour votre commande !</h1>
        <p>
          Commande <strong>{commande.id}</strong> confirmée.
          <br />
          Un email de confirmation vous a été envoyé.
        </p>

        <div style={{ textAlign: 'left', margin: '24px 0' }}>
          {commande.lignes.map((ligne) => (
            <div key={ligne.id} className="recap-ligne">
              <span>
                {ligne.produit_nom} × {ligne.quantite}{' '}
                <em style={{ color: 'var(--gris)' }}>({ligne.type_abonnement.toLowerCase()})</em>
              </span>
              <span>{euros(ligne.prix_total_ht)}</span>
            </div>
          ))}
          <div className="recap-ligne recap-total">
            <span>Total TTC</span>
            <span>{euros(commande.total_ttc)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/compte/commandes" className="btn">Voir mes commandes</Link>
          <Link to="/" className="btn btn-contour">Retour à l’accueil</Link>
        </div>
      </div>
    </div>
  );
}
