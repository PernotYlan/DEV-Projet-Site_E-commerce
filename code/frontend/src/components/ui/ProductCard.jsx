import { Link } from 'react-router-dom';
import Visuel from './Visuel';

/** Formate un montant en euros. */
export function euros(montant) {
  return Number(montant).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

/** Retourne le prix mensuel minimum d'un produit (ou le plus bas disponible). */
export function prixMinimum(produit) {
  if (!produit.prix || produit.prix.length === 0) return null;
  const mensuel = produit.prix.find((p) => p.type_abonnement === 'MENSUEL');
  return mensuel ? mensuel.montant : Math.min(...produit.prix.map((p) => p.montant));
}

/**
 * Carte produit : visuel, nom, prix "à partir de", badges de disponibilité.
 * @param {{produit: object}} props
 */
export default function ProductCard({ produit }) {
  const indisponible = !produit.is_active;
  const enMaintenance = produit.en_maintenance;
  const prix = prixMinimum(produit);

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
            {euros(prix)}
            <span> /mois HT</span>
          </p>
        )}
      </div>
    </Link>
  );
}
