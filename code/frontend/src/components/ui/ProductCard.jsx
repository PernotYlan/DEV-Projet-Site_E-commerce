import { Link } from 'react-router-dom';
import Visuel from './Visuel';

/** Formate un montant en euros. */
export function euros(montant) {
  return Number(montant).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

/** Libellé de période affiché à côté du prix, selon le type d'abonnement. */
const PERIODES = { MENSUEL: '/mois', SEMESTRIEL: '/6 mois', ANNUEL: '/an' };

/**
 * Retourne le prix à afficher sur la carte : celui du type d'abonnement
 * préféré s'il existe (ex: filtre "Semestriel" actif), sinon le mensuel,
 * sinon le moins cher disponible.
 */
export function prixAffiche(produit, typePrefere) {
  if (!produit.prix || produit.prix.length === 0) return null;
  const trouve = (type) => produit.prix.find((p) => p.type_abonnement === type);
  return (
    (typePrefere && trouve(typePrefere))
    || trouve('MENSUEL')
    || produit.prix.reduce((min, p) => (p.montant < min.montant ? p : min))
  );
}

/**
 * Carte produit : visuel, nom, prix "à partir de", badges de disponibilité.
 * @param {{produit: object, typeAbonnement?: string}} props - typeAbonnement :
 *   type préféré pour l'affichage du prix (ex: filtre de recherche actif)
 */
export default function ProductCard({ produit, typeAbonnement }) {
  const indisponible = !produit.is_active;
  const enMaintenance = produit.en_maintenance;
  const prix = prixAffiche(produit, typeAbonnement);

  return (
    <Link to={`/produit/${produit.id}`} className={`carte-produit ${indisponible || enMaintenance ? 'indisponible' : ''}`}>
      <Visuel couleur={produit.couleur} className="carte-produit-visuel" icone="🛡️" />
      <div className="carte-produit-corps">
        <h3>{produit.nom}</h3>
        <div>
          {enMaintenance && <span className="badge badge-orange">En maintenance</span>}
          {indisponible && <span className="badge badge-rouge">Indisponible</span>}
          {!indisponible && !enMaintenance && <span className="badge badge-vert">Disponible</span>}
        </div>
        {prix !== null && (
          <p className="carte-produit-prix">
            <span>à partir de </span>
            {euros(prix.montant)}
            <span> {PERIODES[prix.type_abonnement] || '/mois'} HT</span>
          </p>
        )}
      </div>
    </Link>
  );
}
